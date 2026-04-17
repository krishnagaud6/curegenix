# CureGenix: Detailed Project Documentation

CureGenix is an advanced AI-powered drug discovery system utilizing the **Model Context Protocol (MCP)**. It orchestrates a series of autonomous AI agents working sequentially to analyze protein structures (PDBs), identify binding pockets, research prior literature, synthesize novel candidate drugs, and rank them based on viability and toxicity risks.

## 1. The Workflow

The end-to-end pipeline operates in a fully enclosed, automated loop whenever a user submits a PDB file.

1. **Input & Parsing:** The user uploads a `.pdb` file via the frontend. The backend intercepts this with a FastAPI endpoint, saving it to a temporary directory. Node.js processes the physical coordinate data into a structured JSON dictionary outlining molecular chains and binding sites.
2. **Context Seeding:** The `Orchestrator` resets the global `MemoryMCPServer` and injects the JSON structure detailing the protein map.
3. **Agent Delegation:** The 6 AI Agents run sequentially. They take turns reading from the shared memory bank, performing their specific isolated domain task via MCP function calling, and writing their conclusions back to the shared memory bank.
4. **Conclusion:** Once the `DecisionAgent` aggregates the final risk/reward metrics, the pipeline packages the massive web of memory key/values into a clean JSON response.
5. **Render:** The single-page vanilla JavaScript frontend parses the JSON response, dynamically assembling results grids, agent metric timelines, and confidence scores across the viewport.

---

## 2. System Design and Architecture

CureGenix embraces a highly decoupled **Single-Page Application (SPA)** and **Micro-Tool** architecture. 

* **Frontend:** A lightweight vanilla HTML/JS/CSS client focusing entirely on user-experience and display. It shifts all computational overhead to the backend server. Recently upgraded, it incorporates WebGL / Three.js driven dynamic background components while retaining a pristine, clinical Single-Page routing system.
* **Backend Runtime:** A high-throughput RESTful `FastAPI` application. It mounts the frontend securely while providing API routes to trigger the heavy-computation ML/AI elements.
* **MCP Topology:** The intelligence is governed by **Agents** acting as consumers and **Servers** acting as providers. Agents possess generic logic loops but employ rigid logic via accessing highly restricted, context-specific tools hosted by standalone MCP Servers.

---

## 3. Agents and MCP Servers

### The Agents
Agents represent the "thinking" modules of the pipeline.
1. **TargetAgent:** Scans the raw PDB JSON output and extracts human-readable insights on the physical bounds of the protein structure, verifying sequence links and binding pockets.
2. **ResearchAgent:** Takes the target identify and consults the web (Wikipedia, Uniprot, AlphaFold) to gather known facts on prior cures, genetic functions, and 3D folding models.
3. **MoleculeAgent:** Analyzes the physical pockets mapped by TargetAgent alongside the genetic function mapped by ResearchAgent to generate novel SME (Small Molecule Entity) candidate SMILES strings.
4. **ScreeningAgent:** Executes computational proxy scoring, simulating docking mechanics to determine sheer binding affinity (potency proxies) for each candidate.
5. **RiskAgent:** Evaluates ADMET (Absorption, Distribution, Metabolism, Excretion, and Toxicity) variables to flag high-risk molecular designs.
6. **DecisionAgent:** The final aggregator. It looks at binding strength versus clinical risk and ranks all candidate drugs into tiers (Approved, Investigational, Repurposed, Novel), finalizing the payload.

### The MCP Servers
Servers provide the deterministic "tools" the Agents invoke.
* **Memory MCP:** The state manager. It exposes `store` and `retrieve` commands so all agents can share complex dictionary states without communicating directly.
* **Web MCP:** Enables real-time internet scraping. Updated with advanced `verify_alphafold` validation tooling and expanded Wikipedia extraction parameters to bypass summary truncation.
* **Molecule MCP:** The chemistry engine. Responsible for processing SMILES formats, generating structural analogs, and computing baseline molecular mass/compositions.
* **Compute MCP:** A mathematical abstraction server for simulating deterministic docking affinity and structural rigidity limits.
* **FileSystem MCP:** Grants read/write access so agents can interact securely with local cache records or experimental archives.

---

## 4. Models and Services

The `backend/services` folder acts as the integration bridge to off-server algorithms.

* **pdb_parser.py:** A bridging service that receives the uploaded raw PDB text format. It spawns an asynchronous subprocess interacting with an external Node.js/JavaScript command-line extraction mechanism. It catches the standardized JSON stdout out of the subprocess, maps errors, and shuttles the data cleanly into Python dictionaries for the Orchestrator.

---

## 5. Main.py & Orchestrator.py

* **`main.py`:** The gateway. It defines the Uvicorn-hosted FastAPI server. At initialization, it mounts a CORS middleware, binds `/static` securely to the root `frontend/` directory, and serves `index.html` at the `GET /` endpoint. It exposes `POST /api/discover` which handles form-data `.pdb` streams, writes them down locally, waits on `pdb_parser`, and invokes the orchestrator.
* **`orchestrator.py`:** The brain-stem. Loaded as a singleton in `main.py`, it instantiates the 5 MCP servers and 6 Agents on startup to prevent boot lag on every request. During `run_pipeline`, it explicitly controls the flow of execution, ensuring TargetAgent finishes before ResearchAgent boots, preventing data race conditions in the Memory MCP. It calculates tool usage statistics dynamically.

---

## 6. Frontend Configuration

Following the most recent architectural revision, the frontend operates completely in-browser without a compiler (No Vue/Next.js).

* **HTML Structure (`index.html`):** A strict single-page application entry point. It defines the DOM structure for empty result panels which initially load styled with CSS `display: none;`. It also hosts the canvas tags used for the Three.js 3D rendering.
* **Interface Controllers (`app.js` & `api.js`):** The DOM commanders. `app.js` adds event listeners to the drop-zones and dynamically toggles the visibility of the "Agent Pipeline", "Protein Info", and "Recommendations" HTML blocks when `api.js` resolves the REST calls to the backend.
* **Dynamic Components (`components/`):** Contains modular JavaScript injection classes (`InputBox.js`, `AgentFlow.js`, `ResultCard.js`) that physically build HTML strings and append them to the DOM when fed data from the backend's JSON response payload.
* **Theme & Appearance (`style.css`):** The visual master-file. Using custom CSS variables, it dictates a clinical **Biotech Blue/Teal** visual language (`#0ea5e9`, `#2563eb`, `#14b8a6`). It defines the glassmorphic shadows and imports `/background-theme.css`, which holds the keyframes and geometric layers for the `particle-layer` and grid WebGL background effects.
* **Background Modules (`animations/` & `js/`):** Houses the `three.js` instance, injecting and controlling the math for the 3D rotating background graphics while ensuring it operates purely beneath the interactive z-index bounds.
