class ParentPortal {
    constructor() {
        this.children = [];
        this.currentChild = null;
        this.initializeParentView();
    }

    async initializeParentView() {
        await this.loadChildren();
        this.setupChildSelector();
        this.setupViewToggles();
    }

    async loadChildren() {
        try {
            const { data: user } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('parent_student_relations')
                .select(`
                    *,
                    students (*)
                `)
                .eq('parent_id', user.id);

            if (error) throw error;

            this.children = data.map(relation => relation.students);
            if (this.children.length > 0) {
                this.currentChild = this.children[0].id;
                this.loadChildData();
            }
        } catch (error) {
            console.error('Error loading children:', error);
        }
    }

    setupChildSelector() {
        const selector = document.querySelector('#childSelector');
        if (!selector) return;

        selector.innerHTML = `
            ${this.children.map(child => `
                <option value="${child.id}">
                    ${child.first_name} ${child.last_name}
                </option>
            `).join('')}
        `;

        selector.addEventListener('change', (e) => {
            this.currentChild = e.target.value;
            this.loadChildData();
        });
    }

    setupViewToggles() {
        const toggles = document.querySelectorAll('.view-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    }

    async loadChildData() {
        await Promise.all([
            this.loadGrades(),
            this.loadAttendance(),
            this.loadBehavior(),
            this.loadHomework()
        ]);
    }

    async loadGrades() {
        try {
            const { data, error } = await supabase
                .from('grades')
                .select('*')
                .eq('student_id', this.currentChild)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const container = document.querySelector('#gradesView');
            if (!container) return;

            container.innerHTML = `
                <div class="grades-summary">
                    <h3>Recent Grades</h3>
                    ${data.map(grade => `
                        <div class="grade-item">
                            <span class="grade-value">${grade.grade_value}%</span>
                            <span class="grade-type">${grade.grade_type}</span>
                            <span class="grade-date">
                                ${new Date(grade.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error loading grades:', error);
        }
    }

    async loadAttendance() {
        // Similar to loadGrades but for attendance
    }

    async loadBehavior() {
        // Similar to loadGrades but for behavior
    }

    async loadHomework() {
        // Similar to loadGrades but for homework
    }

    switchView(view) {
        document.querySelectorAll('.view-content').forEach(content => {
            content.style.display = 'none';
        });
        document.querySelector(`#${view}View`).style.display = 'block';

        document.querySelectorAll('.view-toggle').forEach(toggle => {
            toggle.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
    }
}