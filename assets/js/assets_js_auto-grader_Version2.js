class AutoGrader {
    constructor() {
        this.quizzes = [];
        this.currentQuiz = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.querySelector('#createQuizBtn')?.addEventListener('click', () => {
            this.showCreateQuizModal();
        });
    }

    showCreateQuizModal() {
        const modal = new Modal({
            title: 'Create Quiz',
            content: `
                <form id="quizForm">
                    <div class="form-group">
                        <label class="form-label">Quiz Title</label>
                        <input type="text" id="quizTitle" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Time Limit (minutes)</label>
                        <input type="number" id="timeLimit" class="form-control" 
                               min="1" value="30" required>
                    </div>
                    <div id="questionsList">
                        <!-- Questions will be added here -->
                    </div>
                    <button type="button" class="button" onclick="autoGrader.addQuestion()">
                        Add Question
                    </button>
                </form>
            `,
            onSubmit: () => this.saveQuiz()
        });
        modal.show();
        this.addQuestion(); // Add first question by default
    }

    addQuestion() {
        const questionsList = document.querySelector('#questionsList');
        const questionNumber = questionsList.children.length + 1;
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <h4>Question ${questionNumber}</h4>
            <div class="form-group">
                <label class="form-label">Question Text</label>
                <textarea class="form-control" required></textarea>
            </div>
            <div class="options-list">
                <div class="option-item">
                    <input type="radio" name="correct_${questionNumber}" value="0" required>
                    <input type="text" class="form-control" placeholder="Option 1" required>
                </div>
                <div class="option-item">
                    <input type="radio" name="correct_${questionNumber}" value="1" required>
                    <input type="text" class="form-control" placeholder="Option 2" required>
                </div>
                <div class="option-item">
                    <input type="radio" name="correct_${questionNumber}" value="2" required>
                    <input type="text" class="form-control" placeholder="Option 3" required>
                </div>
                <div class="option-item">
                    <input type="radio" name="correct_${questionNumber}" value="3" required>
                    <input type="text" class="form-control" placeholder="Option 4" required>
                </div>
            </div>
            <button type="button" class="remove-question" onclick="autoGrader.removeQuestion(this)">
                Remove Question
            </button>
        `;
        
        questionsList.appendChild(questionDiv);
    }

    removeQuestion(button) {
        const questionDiv = button.parentElement;
        questionDiv.remove();
        this.renumberQuestions();
    }

    renumberQuestions() {
        const questions = document.querySelectorAll('.question-item');
        questions.forEach((question, index) => {
            question.querySelector('h4').textContent = `Question ${index + 1}`;
            const radios = question.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                radio.name = `correct_${index + 1}`;
            });
        });
    }

    async saveQuiz() {
        const formData = {
            title: document.querySelector('#quizTitle').value,
            time_limit: parseInt(document.querySelector('#timeLimit').value),
            questions: []
        };

        const questions = document.querySelectorAll('.question-item');
        questions.forEach(question => {
            const questionText = question.querySelector('textarea').value;
            const options = Array.from(question.querySelectorAll('.option-item input[type="text"]'))
                .map(input => input.value);
            const correctAnswer = parseInt(
                question.querySelector('input[type="radio"]:checked').value
            );

            formData.questions.push({
                question: questionText,
                options: options,
                correct_answer: correctAnswer
            });
        });

        try {
            const { data, error } = await supabase
                .from('quizzes')
                .insert([{
                    title: formData.title,
                    time_limit: formData.time_limit,
                    questions: formData.questions,
                    created_by: (await supabase.auth.getUser()).data.user.id
                }]);

            if (error) throw error;

            Toast.show('Quiz created successfully!', 'success');
            this.refreshQuizzes();
            return true;
        } catch (error) {
            console.error('Error saving quiz:', error);
            Toast.show('Failed to create quiz', 'error');
            return false;
        }
    }

    async startQuiz(quizId) {
        try {
            const { data: quiz, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', quizId)
                .single();

            if (error) throw error;

            this.currentQuiz = quiz;
            this.showQuizInterface();
        } catch (error) {
            console.error('Error starting quiz:', error);
            Toast.show('Failed to start quiz', 'error');
        }
    }

    showQuizInterface() {
        const container = document.querySelector('#quizContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="quiz-header">
                <h2>${this.currentQuiz.title}</h2>
                <div class="timer" id="quizTimer">
                    ${this.currentQuiz.time_limit}:00
                </div>
            </div>
            <form id="quizAnswers">
                ${this.currentQuiz.questions.map((question, index) => `
                    <div class="question-block">
                        <h3>Question ${index + 1}</h3>
                        <p>${question.question}</p>
                        <div class="options">
                            ${question.options.map((option, optIndex) => `
                                <label class="option">
                                    <input type="radio" name="q${index}" value="${optIndex}" required>
                                    ${option}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                <button type="submit" class="button">Submit Quiz</button>
            </form>
        `;

        this.startTimer(this.currentQuiz.time_limit * 60);
        document.querySelector('#quizAnswers').addEventListener('submit', (e) => {
            e.preventDefault();
            this.gradeQuiz();
        });
    }

    startTimer(duration) {
        const timerDisplay = document.querySelector('#quizTimer');
        let timer = duration;
        const countdown = setInterval(() => {
            const minutes = parseInt(timer / 60, 10);
            const seconds = parseInt(timer % 60, 10);

            timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (--timer < 0) {
                clearInterval(countdown);
                this.gradeQuiz();
            }
        }, 1000);
    }

    async gradeQuiz() {
        const answers = Array.from(document.querySelectorAll('#quizAnswers input:checked'))
            .map(input => parseInt(input.value));

        const totalQuestions = this.currentQuiz.questions.length;
        let correctAnswers = 0;

        answers.forEach((answer, index) => {
            if (answer === this.currentQuiz.questions[index].correct_answer) {
                correctAnswers++;
            }
        });

        const score = (correctAnswers / totalQuestions) * 100;

        try {
            const { error } = await supabase
                .from('quiz_results')
                .insert([{
                    quiz_id: this.currentQuiz.id,
                    student_id: (await supabase.auth.getUser()).data.user.id,
                    score: score,
                    answers: answers
                }]);

            if (error) throw error;

            this.showQuizResults(score, correctAnswers, totalQuestions);
        } catch (error) {
            console.error('Error saving quiz results:', error);
            Toast.show('Failed to save quiz results', 'error');
        }
    }

    showQuizResults(score, correct, total) {
        const container = document.querySelector('#quizContainer');
        container.innerHTML = `
            <div class="quiz-results">
                <h2>Quiz Results</h2>
                <div class="score-display">
                    <div class="score">${score.toFixed(1)}%</div>
                    <div class="details">
                        Correct Answers: ${correct} / ${total}
                    </div>
                </div>
                <button class="button" onclick="autoGrader.reviewQuiz()">
                    Review Answers
                </button>
            </div>
        `;
    }

    reviewQuiz() {
        // Implement quiz review functionality
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.autoGrader = new AutoGrader();
});