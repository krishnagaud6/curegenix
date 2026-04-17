/**
 * Component map (concept → implementation):
 * Header      → #header-root  + components/header.html
 * Sidebar     → #sidebar-root + components/sidebar.html
 * Modal       → #modal-root   + components/modal.html
 * HeroSection → pages/index.html (hero + DNA SVG + blobs)
 * UploadBox   → #drop-zone on home page
 * AgentPipeline → pages/pipeline.html (SVG + .agent-card grid)
 * ProteinViewer → #protein-canvas + js/protein-viewer.js
 * DrugResultCard → rendered in app.js (results page #drug-grid)
 * StatsCard   → analysis page .stat-list / .stat-row
 */
export const SLOTS = {
  HEADER: "header-root",
  SIDEBAR: "sidebar-root",
  MODAL: "modal-root",
  // Backward-compatible aliases
  header: "header-root",
  sidebar: "sidebar-root",
  modal: "modal-root",
  MCP_TOOLS_BUTTON: "btn-mcp-tools",
  MODAL_OVERLAY: "modal-overlay",
  MODAL_CLOSE: "modal-close",
  MODAL_TITLE: "modal-title",
  MODAL_BODY: "modal-body",
  PROTEIN_VIEWER_PANEL: "protein-viewer-panel",
  PROTEIN_CANVAS: "protein-canvas",
  PROTEIN_VIEWER_META: "protein-viewer-meta",
  MOLECULE_VIEWER_PANEL: "molecule-viewer-panel",
  MOLECULE_VIEWER: "molecule-viewer",
  MOLECULE_VIEWER_META: "molecule-viewer-meta",
};
