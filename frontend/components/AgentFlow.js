// AgentFlow component — animated agent pipeline visualization
const AgentFlow = {
    agents: [
        { name: 'Target Agent', icon: '🎯', key: 'Target Agent' },
        { name: 'Research Agent', icon: '🔬', key: 'Research Agent' },
        { name: 'Molecule Agent', icon: '🧬', key: 'Molecule Agent' },
        { name: 'Screening Agent', icon: '🔍', key: 'Screening Agent' },
        { name: 'Risk Agent', icon: '⚠️', key: 'Risk Agent' },
        { name: 'Decision Agent', icon: '✔️', key: 'Decision Agent' },
    ],

    render(container) {
        container.innerHTML = '';
        this.agents.forEach((agent, i) => {
            // Node
            const node = document.createElement('div');
            node.className = 'pipeline-node pending';
            node.id = `pipeline-node-${i}`;
            node.innerHTML = `
                <div class="pipeline-node-circle">${agent.icon}</div>
                <div class="pipeline-node-label">${agent.name}</div>
                <div class="pipeline-node-time" id="pipeline-time-${i}"></div>
            `;
            container.appendChild(node);

            // Connector (except after last)
            if (i < this.agents.length - 1) {
                const conn = document.createElement('div');
                conn.className = 'pipeline-connector';
                conn.id = `pipeline-conn-${i}`;
                container.appendChild(conn);
            }
        });
    },

    async animateSteps(steps) {
        for (let i = 0; i < steps.length && i < this.agents.length; i++) {
            const node = document.getElementById(`pipeline-node-${i}`);
            const timeEl = document.getElementById(`pipeline-time-${i}`);
            const conn = document.getElementById(`pipeline-conn-${i}`);

            // Set running
            node.className = 'pipeline-node running';
            await this._delay(400);

            // Set completed
            const step = steps[i];
            if (step.status === 'completed') {
                node.className = 'pipeline-node completed';
                timeEl.textContent = `${step.duration_ms}ms`;
            } else {
                node.className = 'pipeline-node error';
                timeEl.textContent = 'error';
            }

            if (conn) conn.className = 'pipeline-connector active';
            await this._delay(200);
        }
    },

    showImmediately(steps) {
        steps.forEach((step, i) => {
            if (i >= this.agents.length) return;
            const node = document.getElementById(`pipeline-node-${i}`);
            const timeEl = document.getElementById(`pipeline-time-${i}`);
            const conn = document.getElementById(`pipeline-conn-${i}`);
            if (!node) return;

            node.className = `pipeline-node ${step.status === 'completed' ? 'completed' : 'error'}`;
            timeEl.textContent = `${step.duration_ms}ms`;
            if (conn) conn.className = 'pipeline-connector active';
        });
    },

    _delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
};
