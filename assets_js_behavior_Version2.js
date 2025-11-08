class BehaviorTracker {
    constructor() {
        this.currentStudent = null;
        this.incidents = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.querySelector('#addIncidentBtn')?.addEventListener('click', () => {
            this.showIncidentModal();
        });
    }

    async showIncidentModal() {
        const modal = new Modal({
            title: 'Record Behavior Incident',
            content: `
                <form id="incidentForm">
                    <div class="form-group">
                        <label class="form-label">Incident Type</label>
                        <select id="incidentType" class="form-control" required>
                            <option value="disruption">Class Disruption</option>
                            <option value="bullying">Bullying</option>
                            <option value="cheating">Cheating</option>
                            <option value="positive">Positive Behavior</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea id="incidentDesc" class="form-control" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Action Taken</label>
                        <select id="actionTaken" class="form-control" required>
                            <option value="warning">Verbal Warning</option>
                            <option value="detention">Detention</option>
                            <option value="parent">Parent Contact</option>
                            <option value="office">Office Referral</option>
                            <option value="praise">Positive Recognition</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Points Impact</label>
                        <input type="number" id="pointsImpact" class="form-control" 
                               value="0" required>
                    </div>
                </form>
            `,
            onSubmit: () => this.saveIncident()
        });
        modal.show();
    }

    async saveIncident() {
        const formData = {
            student_id: this.currentStudent,
            type: document.querySelector('#incidentType').value,
            description: document.querySelector('#incidentDesc').value,
            action_taken: document.querySelector('#actionTaken').value,
            points_impact: parseInt(document.querySelector('#pointsImpact').value)
        };

        try {
            const { data, error } = await supabase
                .from('behavior_incidents')
                .insert([formData]);

            if (error) throw error;

            // If points impact, add to points system
            if (formData.points_impact !== 0) {
                await this.updatePoints(formData.points_impact, 
                                     `Behavior: ${formData.type}`);
            }

            Toast.show('Incident recorded successfully!', 'success');
            this.refreshIncidents();
            return true;
        } catch (error) {
            console.error('Error saving incident:', error);
            Toast.show('Failed to record incident', 'error');
            return false;
        }
    }

    async refreshIncidents() {
        try {
            const { data, error } = await supabase
                .from('behavior_incidents')
                .select('*')
                .eq('student_id', this.currentStudent)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.incidents = data;
            this.updateIncidentsDisplay();
        } catch (error) {
            console.error('Error fetching incidents:', error);
        }
    }

    updateIncidentsDisplay() {
        const container = document.querySelector('#behaviorHistory');
        if (!container) return;

        container.innerHTML = this.incidents.map(incident => `
            <div class="incident-card ${incident.type}">
                <div class="incident-header">
                    <span class="incident-type">
                        ${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                    </span>
                    <span class="incident-date">
                        ${new Date(incident.created_at).toLocaleString()}
                    </span>
                </div>
                <div class="incident-body">
                    <p>${incident.description}</p>
                    <div class="incident-meta">
                        <span>Action: ${incident.action_taken}</span>
                        <span class="points-impact ${incident.points_impact > 0 ? 'positive' : 'negative'}">
                            Points: ${incident.points_impact > 0 ? '+' : ''}${incident.points_impact}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async updatePoints(amount, reason) {
        try {
            const { error } = await supabase
                .from('points')
                .insert([{
                    student_id: this.currentStudent,
                    amount: amount,
                    reason: reason
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating points:', error);
        }
    }
}