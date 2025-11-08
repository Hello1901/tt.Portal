class ProgressTracker {
    constructor() {
        this.charts = {};
        this.initializeCharts();
    }

    async initializeCharts() {
        await this.loadChartLibrary();
        this.createGradeChart();
        this.createAttendanceChart();
        this.createBehaviorChart();
    }

    async loadChartLibrary() {
        // Load Chart.js if not already loaded
        if (!window.Chart) {
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }
    }

    async createGradeChart() {
        const ctx = document.getElementById('gradeChart')?.getContext('2d');
        if (!ctx) return;

        const { data } = await supabase
            .from('grades')
            .select('*')
            .eq('student_id', this.currentStudent)
            .order('created_at', { ascending: true });

        this.charts.grades = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(grade => new Date(grade.created_at).toLocaleDateString()),
                datasets: [{
                    label: 'Grade Progress',
                    data: data.map(grade => grade.grade_value),
                    borderColor: '#658C58',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    async createAttendanceChart() {
        const ctx = document.getElementById('attendanceChart')?.getContext('2d');
        if (!ctx) return;

        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', this.currentStudent);

        const stats = {
            present: data.filter(a => a.status === 'present').length,
            absent: data.filter(a => a.status === 'absent').length,
            late: data.filter(a => a.status === 'late').length
        };

        this.charts.attendance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                    data: [stats.present, stats.absent, stats.late],
                    backgroundColor: ['#658C58', '#FF6B6B', '#FFD93D']
                }]
            }
        });
    }

    async createBehaviorChart() {
        const ctx = document.getElementById('behaviorChart')?.getContext('2d');
        if (!ctx) return;

        const { data } = await supabase
            .from('points')
            .select('*')
            .eq('student_id', this.currentStudent)
            .order('created_at', { ascending: true });

        this.charts.behavior = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(point => new Date(point.created_at).toLocaleDateString()),
                datasets: [{
                    label: 'Behavior Points',
                    data: data.map(point => point.amount),
                    backgroundColor: data.map(point => 
                        point.amount > 0 ? '#658C58' : '#FF6B6B'
                    )
                }]
            }
        });
    }

    updateCharts() {
        Object.values(this.charts).forEach(chart => chart.update());
    }
}