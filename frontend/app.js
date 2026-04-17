// Main App controller
const DEFAULT_SLOTS = {
    MCP_TOOLS_BUTTON: 'btn-mcp-tools',
    MODAL_OVERLAY: 'modal-overlay',
    MODAL_CLOSE: 'modal-close',
    MODAL_TITLE: 'modal-title',
    MODAL_BODY: 'modal-body',
    PROTEIN_VIEWER_PANEL: 'protein-viewer-panel',
    PROTEIN_CANVAS: 'protein-canvas',
    PROTEIN_VIEWER_META: 'protein-viewer-meta',
    MOLECULE_VIEWER_PANEL: 'molecule-viewer-panel',
    MOLECULE_VIEWER: 'molecule-viewer',
    MOLECULE_VIEWER_META: 'molecule-viewer-meta',
};

const App = {
    layoutSlots: DEFAULT_SLOTS,
    proteinViewerDispose: null,
    proteinViewerInitPromise: null,
    moleculeViewerDispose: null,
    moleculeViewerInitPromise: null,
    resultsProteinViewerDispose: null,

    init() {
        InputBox.init();
        import('/static/js/layout-ids.js')
            .then((module) => {
                this.layoutSlots = { ...DEFAULT_SLOTS, ...(module?.SLOTS || {}) };
            })
            .catch(() => {
                this.layoutSlots = DEFAULT_SLOTS;
            })
            .finally(() => this.bindNavButtons());
    },

    bindNavButtons() {
        this._el('MCP_TOOLS_BUTTON')?.addEventListener('click', () => this.showMCPTools());
        this._el('MODAL_CLOSE')?.addEventListener('click', () => this.closeModal());
        this._el('MODAL_OVERLAY')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
        document.getElementById('new-analysis-btn')?.addEventListener('click', () => this.resetToLanding());
        document.getElementById('nav-agent-logs')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('pipeline-section').style.display = 'block';
            document.getElementById('results-section').style.display = 'none';
        });
        document.getElementById('nav-history')?.addEventListener('click', (e) => {
            e.preventDefault();
            alert('History feature coming soon!');
        });
        document.getElementById('bottom-logs')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('pipeline-section').style.display = 'block';
            document.getElementById('results-section').style.display = 'none';
        });
        document.getElementById('bottom-history')?.addEventListener('click', (e) => {
            e.preventDefault();
            alert('History feature coming soon!');
        });
    },

 async runDiscovery(file) {
    // 1. Get sections
    const hero = document.getElementById("hero-section");
    const pipeline = document.getElementById("pipeline-section");
    const results = document.getElementById("results-section");

    // 2. Show pipeline screen
    hero.style.display = "none";
    pipeline.style.display = "block";
    results.style.display = "none";

    try {
        // 3. Prepare file for backend
        const formData = new FormData();
        formData.append("file", file);

        // 4. Call backend API
        const res = await fetch("/api/discover", {
            method: "POST",
            body: formData
        });

        // 5. Check if API failed
        if (!res.ok) {
            throw new Error("API failed");
        }

        // 6. Convert response to JSON
        const data = await res.json();

        console.log("BACKEND RESPONSE:", data);

        // 7. Render UI with real data
        this.renderProteinInfo(data);
        this.renderResults(data);
        this.setupResultsProteinViewer(data);

        // 8. Switch to results screen
        pipeline.style.display = "none";
        results.style.display = "block";

    } catch (err) {
        console.error("ERROR:", err);

        alert("Something went wrong. Check backend.");

        // 9. Go back to landing if error
        pipeline.style.display = "none";
        hero.style.display = "block";
    }
},

    resetToLanding() {
        document.getElementById('hero-section').style.display = 'block';
        document.getElementById('pipeline-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        if (this.resultsProteinViewerDispose) {
            this.resultsProteinViewerDispose();
            this.resultsProteinViewerDispose = null;
        }
        InputBox.clearFile();
    },

    renderProteinInfo(data) {
        const section = document.getElementById('protein-info-section');
        const card = document.getElementById('protein-info-card');
        if (!data.protein_info) return;

        const info = data.protein_info;
        const protein = this.resolveProtein(data);
        section.style.display = 'block';

        card.innerHTML = `
            <div class="protein-info-grid">
                <div class="protein-info-item">
                    <span class="protein-info-label">Uploaded Protein (Target)</span>
                    <span class="protein-info-value">${protein.name || 'Unknown'}</span>
                </div>
                <div class="protein-info-item">
                    <span class="protein-info-label">PDB ID</span>
                    <span class="protein-info-value protein-id">${protein.pdb_id || 'N/A'}</span>
                </div>
                <div class="protein-info-item">
                    <span class="protein-info-label">Sequence Length</span>
                    <span class="protein-info-value">${info.sequence_length || 0} residues</span>
                </div>
                <div class="protein-info-item">
                    <span class="protein-info-label">Chains</span>
                    <span class="protein-info-value">${(info.chains || []).join(', ') || 'N/A'}</span>
                </div>
                <!-- New UniProt & AlphaFold Data -->
                ${data.uniprot_id ? `
                <div class="protein-info-item">
                    <span class="protein-info-label">UniProt ID</span>
                    <span class="protein-info-value"><a href="https://www.uniprot.org/uniprotkb/${data.uniprot_id}" target="_blank" style="color:var(--accent-cyan)">${data.uniprot_id}</a></span>
                </div>
                <div class="protein-info-item">
                    <span class="protein-info-label">AlphaFold Model</span>
                    <span class="protein-info-value"><a href="${data.alphafold_url}" target="_blank" style="color:var(--accent-cyan)">View 3D Prediction</a></span>
                </div>
                ` : ''}
                <div class="protein-info-item">
                    <span class="protein-info-label">Binding Sites</span>
                    <span class="protein-info-value">${info.binding_sites_count || 0} detected</span>
                </div>
                <!-- Binder Search Data -->
                ${data.binder_search && data.binder_search.found ? `
                <div class="protein-info-item protein-info-wide" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <span class="protein-info-label" style="color: var(--accent-purple);">Known Binder Search (Wiki)</span>
                    <span class="protein-info-value" style="font-size: 0.9rem; margin-top:0.4rem; line-height: 1.5; color: var(--text-secondary);">${data.binder_search.summary}</span>
                </div>
                ` : ''}
                ${data.llm_analysis ? `
                <div class="protein-info-item protein-info-wide llm-analysis-section" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <span class="protein-info-label llm-analysis-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
                            <path d="M16 14v1a4 4 0 0 1-8 0v-1"/>
                            <line x1="12" y1="18" x2="12" y2="22"/>
                            <line x1="8" y1="22" x2="16" y2="22"/>
                        </svg>
                        AI-Powered Research Analysis (Groq / Llama 3.3 70B)
                    </span>
                    <div class="llm-analysis-content">${data.llm_analysis.replace(/##\s*(.*)/g, '<h4 class="llm-heading">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}
                ${info.binding_sites && info.binding_sites.length > 0 ? `
                <div class="protein-info-item protein-info-wide">
                    <span class="protein-info-label">Binding Site Details</span>
                    <div class="binding-sites-list">
                        ${info.binding_sites.map(site => `
                            <span class="binding-site-tag">
                                <strong>${site.ligand || 'UNK'}</strong> · Chain ${site.chain || '?'} · ${(site.residues || []).length} residues
                            </span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        this.setupProteinViewer(data, info);
    },

    renderResults(data) {
        const resultsSection = document.getElementById('results-section');
        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');

        // Summary
        ResultCard.renderSummary(document.getElementById('summary-card'), data);

        // Highlights
        if (data.highlights) {
            ResultCard.renderHighlights(document.getElementById('highlights'), data.highlights);
        }

        // Recommendations
        if (data.decisions) {
            ResultCard.renderResults(document.getElementById('results-grid'), data.decisions);
        } else if (data.recommendations) {
            ResultCard.renderResults(document.getElementById('results-grid'), data.recommendations);
        }

        // MCP Stats
        ResultCard.renderMCPStats(
            document.getElementById('mcp-stats'),
            document.getElementById('stats-grid'),
            data.mcp_stats || {}
        );
        this.setupMoleculeViewer(data);

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    async showMCPTools() {
        try {
            const data = await API.getMCPTools();
            const body = this._el('MODAL_BODY');
            const title = this._el('MODAL_TITLE');
            if (!body || !title) return;
            title.textContent = `MCP Tools (${data.total_tools} total)`;

            let html = '<ul class="tool-list">';
            for (const [server, tools] of Object.entries(data.mcp_servers)) {
                tools.forEach(tool => {
                    html += `
                        <li class="tool-item">
                            <span class="tool-name">${tool.name}</span>
                            <span class="tool-server">${server}</span>
                            <div class="tool-desc">${tool.description}</div>
                        </li>
                    `;
                });
            }
            html += '</ul>';
            body.innerHTML = html;
            this.openModal();
        } catch (err) {
            alert('Failed to load MCP tools. Is the backend running?');
        }
    },

    setupProteinViewer(data, proteinInfo) {
        const panel = this._el('PROTEIN_VIEWER_PANEL');
        const canvas = this._el('PROTEIN_CANVAS');
        const meta = this._el('PROTEIN_VIEWER_META');
        if (!panel || !canvas) return;
        const protein = this.resolveProtein(data);

        panel.style.display = 'block';
        if (meta) {
            const seqLength = proteinInfo?.sequence_length || 0;
            const proteinName = protein?.name || 'Unknown Protein';
            const proteinId = protein?.pdb_id || 'N/A';
            meta.textContent = `${proteinName} · ${proteinId} · ${seqLength} residues`;
        }

        if (this.proteinViewerDispose) {
            this.proteinViewerDispose();
            this.proteinViewerDispose = null;
        }

        this.proteinViewerInitPromise = import('/static/js/protein-viewer.js')
            .then(({ initProteinViewer }) => {
                this.proteinViewerDispose = initProteinViewer(canvas, {
                    sequenceLength: proteinInfo?.sequence_length || 72,
                    proteinName: protein?.name || '',
                    proteinId: protein?.pdb_id || '',
                });
            })
            .catch((err) => {
                console.warn('Protein viewer unavailable in current environment:', err?.message || err);
            });
    },

    setupMoleculeViewer(data) {
        const panel = this._el('MOLECULE_VIEWER_PANEL');
        const container = this._el('MOLECULE_VIEWER');
        const meta = this._el('MOLECULE_VIEWER_META');
        if (!panel || !container) return;

        const topCandidate = data?.top_candidate
            || (Array.isArray(data?.decisions) && data.decisions.length ? data.decisions[0] : null);

        if (!topCandidate) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        const score = typeof topCandidate.adjusted_score === 'number'
            ? topCandidate.adjusted_score.toFixed(3)
            : 'N/A';
        if (meta) {
            meta.textContent = `${topCandidate.drug_name || 'Candidate'} · ${topCandidate.category || 'unknown'} · score ${score}`;
        }

        if (this.moleculeViewerDispose) {
            this.moleculeViewerDispose();
            this.moleculeViewerDispose = null;
        }

        this.moleculeViewerInitPromise = import('/static/js/molecule-viewer.js')
            .then(({ initMoleculeViewer }) => {
                this.moleculeViewerDispose = initMoleculeViewer(container, {
                    drugName: topCandidate.drug_name || 'Candidate',
                    smiles: topCandidate.smiles || '',
                });
            })
            .catch((err) => {
                container.innerHTML = `
                    <div class="molecule-fallback">
                        <strong>${topCandidate.drug_name || 'Candidate'}</strong><br>
                        <span>SMILES: ${topCandidate.smiles || 'Not available'}</span>
                    </div>
                `;
                console.warn('Molecule viewer unavailable in current environment:', err?.message || err);
            });
    },

    setupResultsProteinViewer(data) {
        const canvas = document.getElementById('results-protein-canvas');
        if (!canvas) return;
        const proteinInfo = data.protein_info;
        const protein = this.resolveProtein(data);

        if (this.resultsProteinViewerDispose) {
            this.resultsProteinViewerDispose();
            this.resultsProteinViewerDispose = null;
        }

        import('/static/js/protein-viewer.js')
            .then(({ initProteinViewer }) => {
                this.resultsProteinViewerDispose = initProteinViewer(canvas, {
                    sequenceLength: proteinInfo?.sequence_length || 72,
                    proteinName: protein?.name || '',
                    proteinId: protein?.pdb_id || '',
                });
            })
            .catch((err) => {
                console.warn('Protein viewer unavailable:', err);
            });
    },

    resolveProtein(data) {
        return {
            name: data?.protein?.name || data?.protein_name || 'Unknown',
            pdb_id: data?.protein?.pdb_id || data?.protein_id || '',
            source: data?.protein?.source || 'uploaded',
        };
    },

    _el(slotKey) {
        return document.getElementById(this.layoutSlots[slotKey]);
    },

    openModal() {
        const overlay = this._el('MODAL_OVERLAY');
        if (overlay) overlay.style.display = 'flex';
    },
    closeModal() {
        const overlay = this._el('MODAL_OVERLAY');
        if (overlay) overlay.style.display = 'none';
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
