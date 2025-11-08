class AttendanceTracker {
    constructor() {
        this.currentClass = null;
        this.students = [];
        this.attendance = {};
        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        document.querySelector('#takeAttendanceBtn')?.addEventListener('click', () => {
            this.showAttendanceModal();
        });

        document.querySelector('#viewReportBtn')?.addEventListener('click', () => {
            this.showAttendanceReport();
        });
    }

    async showAttendanceModal() {
        const students = await this.getClassStudents();
        
        const modal = new Modal({
            title: 'Take Attendance',
            content: `
                <form id="attendanceForm">
                    <div class="form-group">
                        <label class="form-label">Date</label>
                        <input type="date" id="attendanceDate" class="form-control" 
                               value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="attendance-list">
                        ${students.map(student => `
                            <div class="attendance-item">
                                <div class="student-info">
                                    ${student.first_name} ${student.last_name}
                                </div>
                                <div class="attendance-options">
                                    <label class="radio-label">
                                        <input type="radio" name="attendance_${student.id}" 
                                               value="present" checked>
                                        Present
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="attendance_${student.id}" 
                                               value="absent">
                                        Absent
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="attendance_${student.id}" 
                                               value="late">
                                        Late
                                    </label>
                                    <input type="number" id="late_${student.id}" 
                                           class="form-control late-input" 
                                           placeholder="Minutes late" min="1"
                                           style="display: none;">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </form>
            `,
            onSubmit: () => this.saveAttendance()
        });
        modal.show();

        // Handle late input visibility
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const studentId = e.target.name.split('_')[1];
                const lateInput = document.querySelector(`#late_${studentId}`);
                lateInput.style.display = e.target.value === 'late' ? 'block' : 'none';
            });
        });
    }

    async saveAttendance() {
        const date = document.querySelector('#attendanceDate').value;
        const attendanceRecords = [];

        this.students.forEach(student => {
            const status = document.querySelector(
                `input[name="attendance_${student.id}"]:checked`
            ).value;
            
            const record = {
                student_id: student.id,
                class_id: this.currentClass,
                date: date,
                status: status,
                late_minutes: status === 'late' ? 
                    parseInt(document.querySelector(`#late_${student.id}`).value) : 0
            };
            
            attendanceRecords.push(record);
        });

        try {
            const { error } = await supabase
                .from('attendance')
                .insert(attendanceRecords);

            if (error) throw error;

            Toast.show('Attendance recorded successfully!', 'success');
            this.refreshAttendanceDisplay();
            return true;
        } catch (error) {
            console.error('Error saving attendance:', error);
            Toast.show('Failed to save attendance', 'error');
            return false;
        }
    }

    async getClassStudents() {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('class_id', this.currentClass);

            if (error) throw error;
            this.students = data;
            return data;
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    }

    async refreshAttendanceDisplay() {
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select(`
                    *,
                    students (
                        first_name,
                        last_name
                    )
                `)
                .eq('class_id', this.currentClass)
                .eq('date', new Date().toISOString().split('T')[0]);

            if (error) throw error;

            const container = document.querySelector('#todayAttendance');
            if (!container) return;

            container.innerHTML = data.map(record => `
                <div class="attendance-card ${record.status}">
                    <div class="student-name">
                        ${record.students.first_name} ${record.students.last_name}
                    </div>
                    <div class="status">
                        ${record.status === 'late' ? 
                          `Late (${record.late_minutes} minutes)` : 
                          record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error refreshing attendance:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.attendanceTracker = new AttendanceTracker();
});