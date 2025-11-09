class CalendarManager {
    constructor() {
        this.events = [];
        this.currentDate = new Date();
        this.initializeCalendar();
    }

    initializeCalendar() {
        const container = document.querySelector('#calendarContainer');
        if (!container) return;

        this.fetchEvents().then(() => {
            this.renderCalendar(container);
        });
    }

    async fetchEvents() {
        try {
            // Fetch homework deadlines
            const { data: homework } = await supabase
                .from('homework')
                .select('*')
                .gte('due_date', this.getMonthStart())
                .lte('due_date', this.getMonthEnd());

            // Fetch attendance records
            const { data: attendance } = await supabase
                .from('attendance')
                .select('*')
                .gte('date', this.getMonthStart())
                .lte('date', this.getMonthEnd());

            this.events = [
                ...homework.map(hw => ({
                    date: new Date(hw.due_date),
                    type: 'homework',
                    title: hw.title
                })),
                ...attendance.map(att => ({
                    date: new Date(att.date),
                    type: 'attendance',
                    title: 'Attendance Taken'
                }))
            ];
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        }
    }

    renderCalendar(container) {
        const monthDays = this.getDaysInMonth();
        const firstDay = new Date(this.currentDate.getFullYear(), 
                                this.currentDate.getMonth(), 1).getDay();

        container.innerHTML = `
            <div class="calendar-header">
                <button class="prev-month">&lt;</button>
                <h2>${this.currentDate.toLocaleString('default', { 
                    month: 'long', 
                    year: 'numeric' 
                })}</h2>
                <button class="next-month">&gt;</button>
            </div>
            <div class="calendar-grid">
                ${this.renderDayHeaders()}
                ${this.renderDays(monthDays, firstDay)}
            </div>
        `;

        this.addCalendarEventListeners(container);
    }

    renderDayHeaders() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map(day => `
            <div class="calendar-header-cell">${day}</div>
        `).join('');
    }

    renderDays(monthDays, firstDay) {
        let days = '';
        for (let i = 0; i < firstDay; i++) {
            days += '<div class="calendar-cell empty"></div>';
        }

        for (let day = 1; day <= monthDays; day++) {
            const date = new Date(this.currentDate.getFullYear(), 
                                this.currentDate.getMonth(), day);
            const dayEvents = this.getEventsForDay(date);
            
            days += `
                <div class="calendar-cell ${dayEvents.length ? 'has-events' : ''}">
                    <span class="date">${day}</span>
                    ${this.renderEventDots(dayEvents)}
                </div>
            `;
        }

        return days;
    }

    renderEventDots(events) {
        return events.length ? `
            <div class="event-dots">
                ${events.map(event => `
                    <span class="event-dot ${event.type}" 
                          title="${event.title}"></span>
                `).join('')}
            </div>
        ` : '';
    }

    addCalendarEventListeners(container) {
        container.querySelector('.prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.initializeCalendar();
        });

        container.querySelector('.next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.initializeCalendar();
        });

        container.querySelectorAll('.calendar-cell.has-events').forEach(cell => {
            cell.addEventListener('click', () => {
                const day = parseInt(cell.querySelector('.date').textContent);
                const date = new Date(this.currentDate.getFullYear(), 
                                    this.currentDate.getMonth(), day);
                this.showEventsModal(date);
            });
        });
    }

    showEventsModal(date) {
        const events = this.getEventsForDay(date);
        const modal = new Modal({
            title: `Events for ${date.toLocaleDateString()}`,
            content: `
                <div class="events-list">
                    ${events.map(event => `
                        <div class="event-item ${event.type}">
                            <span class="event-type">${event.type}</span>
                            <span class="event-title">${event.title}</span>
                        </div>
                    `).join('')}
                </div>
            `
        });
        modal.show();
    }

    getEventsForDay(date) {
        return this.events.filter(event => 
            event.date.toDateString() === date.toDateString()
        );
    }

    getDaysInMonth() {
        return new Date(this.currentDate.getFullYear(), 
                       this.currentDate.getMonth() + 1, 0).getDate();
    }

    getMonthStart() {
        return new Date(this.currentDate.getFullYear(), 
                       this.currentDate.getMonth(), 1);
    }

    getMonthEnd() {
        return new Date(this.currentDate.getFullYear(), 
                       this.currentDate.getMonth() + 1, 0);
    }
}