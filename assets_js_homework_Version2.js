class HomeworkManager {
    constructor() {
        this.currentClass = null;
        this.homework = [];
        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        document.querySelector('#addHomeworkBtn')?.addEventListener('click', () => {
            this.showAddHomeworkModal();
        });
    }

    async showAddHomeworkModal() {
        const modal = new Modal({
            title: 'Assign New Homework',
            content: `
                <form id="homeworkForm">
                    <div class="form-group">
                        <label class="form-label">Title</label>
                        <input type="text" id="homeworkTitle" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea id="homeworkDesc" class="form-control" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Due Date</label>
                        <input type="datetime-local" id="dueDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Points</label>
                        <input type="number" id="points" class="form-control" min="0" required>
                    </div>
                </form>
            `,
            onSubmit: () => this.saveHomework()
        });
        modal.show();
    }

    async saveHomework() {
        const formData = {
            class_id: this.currentClass,
            title: document.querySelector('#homeworkTitle').value,
            description: document.querySelector('#homeworkDesc').value,
            due_date: document.querySelector('#dueDate').value,
            points: parseInt(document.querySelector('#points').value)
        };

        try {
            const { data, error } = await supabase
                .from('homework')
                .insert([formData]);

            if (error) throw error;

            Toast.show('Homework assigned successfully!', 'success');
            this.refreshHomeworkList();
            return true;
        } catch (error) {
            console.error('Error saving homework:', error);
            Toast.show('Failed to assign homework', 'error');
            return false;
        }
    }

    async refreshHomeworkList() {
        try {
            const { data, error } = await supabase
                .from('homework')
                .select('*')
                .eq('class_id', this.currentClass)
                .order('due_date', { ascending: true });

            if (error) throw error;

            this.homework = data;
            this.updateHomeworkDisplay();
        } catch (error) {
            console.error('Error fetching homework:', error);
        }
    }

    updateHomeworkDisplay() {
        const container = document.querySelector('#homeworkList');
        if (!container) return;

        container.innerHTML = this.homework.map(hw => `
            <div class="homework-card">
                <h3>${hw.title}</h3>
                <p>${hw.description}</p>
                <div class="homework-meta">
                    <span>Due: ${new Date(hw.due_date).toLocaleString()}</span>
                    <span>Points: ${hw.points}</span>
                </div>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.homeworkManager = new HomeworkManager();
});