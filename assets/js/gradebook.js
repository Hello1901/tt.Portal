class GradeBook {
    constructor() {
        this.currentClass = null;
        this.students = [];
        this.grades = [];
        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        document.querySelector('#addGradeBtn').addEventListener('click', () => {
            this.showAddGradeModal();
        });

        document.querySelector('#viewReportsBtn').addEventListener('click', () => {
            this.generateReports();
        });

        document.querySelector('#analyticsBtn').addEventListener('click', () => {
            this.showAnalytics();
        });
    }

    async showAddGradeModal() {
        const modal = new Modal({
            title: 'Add New Grade',
            content: `
                <form id="gradeForm">
                    <div class="form-group">
                        <label class="form-label">Student</label>
                        <select id="studentSelect" class="form-control" required>
                            ${await this.getStudentOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Grade Type</label>
                        <select id="gradeType" class="form-control" required>
                            <option value="test">Test</option>
                            <option value="homework">Homework</option>
                            <option value="project">Project</option>
                            <option value="participation">Participation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Grade Value (0-100)</label>
                        <input type="number" id="gradeValue" class="form-control" 
                               min="0" max="100" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Weight</label>
                        <input type="number" id="gradeWeight" class="form-control" 
                               min="0.1" max="2.0" step="0.1" value="1.0" required>
                    </div>
                </form>
            `,
            onSubmit: () => this.saveGrade()
        });
        modal.show();
    }

    async saveGrade() {
        const formData = {
            student_id: document.querySelector('#studentSelect').value,
            grade_type: document.querySelector('#gradeType').value,
            grade_value: parseFloat(document.querySelector('#gradeValue').value),
            weight: parseFloat(document.querySelector('#gradeWeight').value),
            class_id: this.currentClass
        };

        try {
            const { data, error } = await supabase
                .from('grades')
                .insert([formData]);

            if (error) throw error;

            Toast.show('Grade saved successfully!', 'success');
            this.refreshGrades();
            return true;
        } catch (error) {
            console.error('Error saving grade:', error);
            Toast.show('Failed to save grade', 'error');
            return false;
        }
    }

    async refreshGrades() {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select(`
                    *,
                    students (
                        first_name,
                        last_name
                    )
                `)
                .eq('class_id', this.currentClass)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.grades = data;
            this.updateGradesDisplay();
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    }

    async getStudentOptions() {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, first_name, last_name')
                .eq('class_id', this.currentClass);

            if (error) throw error;

            return data.map(student => 
                `<option value="${student.id}">
                    ${student.first_name} ${student.last_name}
                </option>`
            ).join('');
        } catch (error) {
            console.error('Error fetching students:', error);
            return '';
        }
    }

    updateGradesDisplay() {
        const container = document.querySelector('#recentGrades');
        container.innerHTML = this.grades.map(grade => `
            <div class="grade-item">
                <div class="student-name">
                    ${grade.students.first_name} ${grade.students.last_name}
                </div>
                <div class="grade-details">
                    <span class="grade-type">${grade.grade_type}</span>
                    <span class="grade-value">${grade.grade_value}%</span>
                    <span class="grade-weight">×${grade.weight}</span>
                </div>
            </div>
        `).join('');
    }

    async generateReports() {
        // Reports generation logic
    }

    async showAnalytics() {
        // Analytics display logic
    }
}

// Initialize GradeBook when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gradeBook = new GradeBook();
});