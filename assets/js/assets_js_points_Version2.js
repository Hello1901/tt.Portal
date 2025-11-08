class PointSystem {
    constructor() {
        this.currentStudent = null;
        this.points = [];
        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        document.querySelector('#awardPointsBtn')?.addEventListener('click', () => {
            this.showPointsModal('award');
        });

        document.querySelector('#deductPointsBtn')?.addEventListener('click', () => {
            this.showPointsModal('deduct');
        });

        document.querySelector('#studentSelect')?.addEventListener('change', (e) => {
            this.currentStudent = e.target.value;
            this.refreshPointsHistory();
        });
    }

    async showPointsModal(type) {
        if (!this.currentStudent) {
            Toast.show('Please select a student first', 'warning');
            return;
        }

        const modal = new Modal({
            title: `${type === 'award' ? 'Award' : 'Deduct'} Points`,
            content: `
                <form id="pointsForm">
                    <div class="form-group">
                        <label class="form-label">Amount</label>
                        <input type="number" id="pointAmount" class="form-control" 
                               min="1" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reason</label>
                        <textarea id="pointReason" class="form-control" rows="3" required>
                        </textarea>
                    </div>
                    ${type === 'award' ? `
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select id="pointCategory" class="form-control" required>
                                <option value="participation">Class Participation</option>
                                <option value="behavior">Good Behavior</option>
                                <option value="achievement">Academic Achievement</option>
                                <option value="leadership">Leadership</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    ` : `
                        <div class="form-group">
                            <label class="form-label">Violation Type</label>
                            <select id="violationType" class="form-control" required>
                                <option value="disruption">Class Disruption</option>
                                <option value="tardiness">Tardiness</option>
                                <option value="incomplete">Incomplete Work</option>
                                <option value="behavior">Behavioral Issue</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    `}
                </form>
            `,
            onSubmit: () => this.savePoints(type)
        });
        modal.show();
    }

    async savePoints(type) {
        const amount = parseInt(document.querySelector('#pointAmount').value);
        const reason = document.querySelector('#pointReason').value;
        const category = document.querySelector(
            type === 'award' ? '#pointCategory' : '#violationType'
        ).value;

        try {
            const { data, error } = await supabase
                .from('points')
                .insert([{
                    student_id: this.currentStudent,
                    amount: type === 'award' ? amount : -amount,
                    reason: reason,
                    category: category
                }]);

            if (error) throw error;

            Toast.show(`Points ${type === 'award' ? 'awarded' : 'deducted'} successfully!`, 'success');
            this.refreshPointsHistory();
            return true;
        } catch (error) {
            console.error('Error saving points:', error);
            Toast.show(`Failed to ${type} points`, 'error');
            return false;
        }
    }

    async refreshPointsHistory() {
        try {
            const { data, error } = await supabase
                .from('points')
                .select('*')
                .eq('student_id', this.currentStudent)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.points = data;
            this.updatePointsDisplay();
            this.updatePointsStats();
        } catch (error) {
            console.error('Error fetching points:', error);
        }
    }

    updatePointsDisplay() {
        const container = document.querySelector('#pointsHistory');
        if (!container) return;

        container.innerHTML = this.points.map(point => `
            <div class="points-card ${point.amount > 0 ? 'awarded' : 'deducted'}">
                <div class="points-amount">
                    ${point.amount > 0 ? '+' : ''}${point.amount}
                </div>
                <div class="points-details">
                    <div class="points-reason">${point.reason}</div>
                    <div class="points-meta">
                        <span class="points-category">
                            ${point.category.charAt(0).toUpperCase() + point.category.slice(1)}
                        </span>
                        <span class="points-date">
                            ${new Date(point.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updatePointsStats() {
        const totalPoints = this.points.reduce((sum, point) => sum + point.amount, 0);
        const awarded = this.points.filter(p => p.amount > 0)
                           .reduce((sum, p) => sum + p.amount, 0);
        const deducted = this.points.filter(p => p.amount < 0)
                            .reduce((sum, p) => sum + p.amount, 0);

        const statsContainer = document.querySelector('#pointsStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stats-card">
                <h3>Total Points</h3>
                <div class="stats-value">${totalPoints}</div>
            </div>
            <div class="stats-card">
                <h3>Points Awarded</h3>
                <div class="stats-value positive">+${awarded}</div>
            </div>
            <div class="stats-card">
                <h3>Points Deducted</h3>
                <div class="stats-value negative">${deducted}</div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pointSystem = new PointSystem();
});