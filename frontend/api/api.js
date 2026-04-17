// API client for the Drug Discovery backend
const API = {
    BASE_URL: window.location.origin,

    async discover(file) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${this.BASE_URL}/api/discover`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
            throw new Error(err.detail || `API error: ${res.status}`);
        }
        return res.json();
    },

    async getMCPTools() {
        const res = await fetch(`${this.BASE_URL}/api/mcp-tools`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
    }
};
