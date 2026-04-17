// ResultCard component — renders drug recommendation cards
const ResultCard = {
    renderSummary(container, data) {
        const proteinName = data?.protein?.name || data.protein_name || 'N/A';
        container.innerHTML = `
            <p class="summary-text">${data.summary || ''}</p>
            <div class="summary-meta">
                <div class="summary-meta-item">
                    <span class="meta-dot" style="background:var(--accent-green)"></span>
                    Protein: ${proteinName}
                </div>
                <div class="summary-meta-item">
                    <span class="meta-dot" style="background:var(--accent-cyan)"></span>
                    Candidates: ${data.decisions ? data.decisions.length : 0}
                </div>
                <div class="summary-meta-item">
                    <span class="meta-dot" style="background:var(--accent-purple)"></span>
                    Pipeline: ${data.pipeline_duration_ms || 0}ms
                </div>
                <div class="summary-meta-item">
                    <span class="meta-dot" style="background:var(--accent-amber)"></span>
                    Agents: ${data.steps ? data.steps.length : 0}
                </div>
            </div>
        `;
    },

    renderHighlights(container, highlights) {
        if (!highlights) return;
        container.innerHTML = `
            <div class="highlight-card best-known" style="animation-delay:0.1s">
                <div class="highlight-label">🏅 Best Known Drug</div>
                <div class="highlight-value">${highlights.best_known_drug || 'N/A'}</div>
            </div>
            <div class="highlight-card best-repurposed" style="animation-delay:0.2s">
                <div class="highlight-label">🔄 Best Repurposed</div>
                <div class="highlight-value">${highlights.best_repurposed || 'N/A'}</div>
            </div>
            <div class="highlight-card best-novel" style="animation-delay:0.3s">
                <div class="highlight-label">🧪 Best Novel Candidate</div>
                <div class="highlight-value">${highlights.best_novel_candidate || 'N/A'}</div>
            </div>
        `;
    },

    renderResults(container, recommendations) {
        container.innerHTML = '';
        if (!recommendations || !recommendations.length) {
            container.innerHTML = '<p style="color:var(--text-muted);">No recommendations generated.</p>';
            return;
        }

        recommendations.forEach((rec, i) => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.animationDelay = `${i * 0.08}s`;

            const catClass = `badge-${rec.category}`;
            const riskClass = `risk-${rec.risk_level}`;
            const scoreColor = rec.adjusted_score >= 0.7 ? 'var(--accent-green)' :
                               rec.adjusted_score >= 0.5 ? 'var(--accent-cyan)' :
                               rec.adjusted_score >= 0.3 ? 'var(--accent-amber)' : 'var(--accent-red)';

            const details = rec.screening_details || {};
            const flags = rec.risk_flags || [];

            card.innerHTML = `
                <div class="result-card-header" onclick="ResultCard.toggleCard(this)">
                    <div class="result-rank ${i === 0 ? 'rank-1' : ''}">#${rec.rank}</div>
                    <div class="result-info">
                        <div class="result-name">${rec.drug_name}</div>
                        <div class="result-meta">
                            <span class="badge ${catClass}">${rec.category}</span>
                            <span class="risk-badge ${riskClass}">${rec.risk_level} risk</span>
                            <span style="font-size:0.7rem;color:var(--text-muted);">confidence: ${rec.confidence}</span>
                        </div>
                    </div>
                    <div class="result-score">
                        <span class="score-value" style="color:${scoreColor}">${rec.adjusted_score.toFixed(3)}</span>
                        <span class="score-label">Score</span>
                    </div>
                    <span class="result-expand-icon">▾</span>
                </div>
                <div class="result-card-body">
                    <div class="result-details">
                        <div class="score-bars">
                            ${this._scoreBar('Drug-likeness', details.drug_likeness)}
                            ${this._scoreBar('BBB Permeability', details.bbb_permeability)}
                            ${this._scoreBar('Potency Proxy', details.potency_proxy)}
                            ${this._scoreBar('Toxicity Freedom', 1 - (details.toxicity_penalty || 0))}
                        </div>
                        ${flags.length ? `
                        <div class="risk-flags-section">
                            <div class="risk-flags-title">Risk Flags</div>
                            ${flags.map(f => `<span class="risk-flag-tag">${f}</span>`).join('')}
                        </div>` : ''}
                        <div class="reasoning-text">${rec.reasoning || 'No reasoning available.'}</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    _scoreBar(label, value) {
        const pct = Math.round((value || 0) * 100);
        const cls = pct >= 70 ? 'good' : pct >= 40 ? 'ok' : 'bad';
        return `
            <div class="score-bar-item">
                <label>${label}: ${pct}%</label>
                <div class="score-bar-track">
                    <div class="score-bar-fill ${cls}" style="width:${pct}%"></div>
                </div>
            </div>
        `;
    },

    toggleCard(headerEl) {
        const card = headerEl.parentElement;
        card.classList.toggle('expanded');
    },

    renderMCPStats(container, statsGrid, mcpStats) {
        if (!mcpStats) return;
        container.style.display = 'block';
        statsGrid.innerHTML = '';
        for (const [serverName, stats] of Object.entries(mcpStats)) {
            const item = document.createElement('div');
            item.className = 'stat-item';
            const toolNames = Object.keys(stats.tools || {});
            const totalCalls = stats.total_calls || 0;
            item.innerHTML = `
                <div class="stat-name">${serverName}</div>
                <div class="stat-value">${totalCalls}</div>
                <div class="stat-detail">${toolNames.length} tools available</div>
            `;
            statsGrid.appendChild(item);
        }
    }
};
