# 🧬 CureGenix: AI Drug Discovery Assistant

> **MCP-Powered Structure-Driven Intelligent Drug Discovery with LLM Reasoning**

An advanced, agentic AI system that ingests physical `.pdb` (Protein Data Bank) files and runs a **6-agent hybrid pipeline** powered by the **Model Context Protocol (MCP)** and **LLM-based reasoning (Groq/Llama 3.3 70B)**. It automates identifying binding sites on target structures, verifies UniProt/AlphaFold data, searches the web for known cure molecules, generates novel molecular drugs, screens them via simulated ADMET algorithms, and produces final ranked recommendations with **AI-generated scientific justifications**.

**Track:** MCP-Based Systems — Engineering Intelligent Systems

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Hybrid AI Design](#-hybrid-ai-design)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [MCP Servers — Complete Guide](#-mcp-servers--complete-guide)
- [Agents — Complete Guide](#-agents--complete-guide)
- [LLM Integration](#-llm-integration)
- [API Endpoints](#-api-endpoints)
- [Setup & Installation Guide](#-setup--installation-guide)
- [How the Pipeline Works](#-how-the-pipeline-works)
- [Future Scope](#-future-scope)

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                        │
│  Upload .pdb + Visualization + AI Analysis Display               │
└──────────────────────┬───────────────────────────────────────────┘
                       │ POST /api/discover
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (main.py)                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                NODE.JS PARSER (parse-pdb)                        │
│  Converts .pdb → structured protein JSON (COMPND/TITLE priority) │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR (orchestrator.py)                 │
│  - Initializes Memory MCP                                        │
│  - Controls execution flow                                       │
│  - Does NOT call LLM directly                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │      Memory MCP      │
              │ (Shared Context Bus) │
              └─────────┬────────────┘
                        │
 ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
 ▼          ▼          ▼          ▼          ▼          ▼
🎯 Target  🔬 Research 🧬 Molecule 🔍 Screening ⚠️ Risk   ✔️ Decision
 Agent      Agent       Agent      Agent      Agent      Agent
 (Determ.)  (LLM ✨)   (Web+MCP)  (Determ.)  (Determ.)  (LLM ✨)
   │          │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼          ▼
 Web MCP   Web MCP    Web MCP   Compute   Compute    Compute
 (UniProt)  + Groq    + Molecule  MCP       MCP       MCP + Groq
            LLM        MCP       (Scoring) (Risk)    LLM
```

### Core Design Principle

**Agents NEVER access data directly.** Every interaction — fetching UniProt data, scraping AlphaFold links, computing scores, storing context — goes through an MCP server tool call. LLM reasoning is used **only** for interpretation and explanation, never for database lookups or scoring.

---

## 🧠 Hybrid AI Design

CureGenix uses a **hybrid architecture** that combines deterministic accuracy with LLM-powered reasoning:

| Component | Type | Rationale |
|-----------|------|-----------|
| **Target Agent** | Deterministic | UniProt identification must be exact |
| **Research Agent** | **LLM-Powered** ✨ | Interprets biological function, explains druggability |
| **Molecule Agent** | Deterministic + Web | Web search for known drugs via Wikipedia/PubChem |
| **Screening Agent** | Deterministic | ADMET scoring requires numeric precision |
| **Risk Agent** | Deterministic | Toxicity assessment must be reliable |
| **Decision Agent** | **LLM-Powered** ✨ | Generates scientific justification for rankings |

> **"We use LLMs in the Research and Decision agents to interpret biological data and provide explainable reasoning, while keeping critical steps like target identification and scoring deterministic for accuracy."**

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Framework** | Python 3.12 + FastAPI | REST API server with async support |
| **LLM Engine** | Groq API (Llama 3.3 70B) | Real-time AI reasoning via OpenAI-compatible API |
| **Parsing Engine** | Node.js | Sub-engine for rapid `.pdb` atomic teardowns |
| **Web Search** | Wikipedia API + PubChem REST | Live internet drug discovery |
| **Protein DB** | UniProt REST + AlphaFold EBI | Real-time protein identification and 3D models |
| **Graphics Engine** | Three.js / GSAP | Background WebGL matrix elements |
| **Frontend** | Vanilla HTML5 + CSS3 + JavaScript | Dynamic, component-based SPA |
| **Design System** | Custom CSS Variables | Clinical Biotech Theme (Blues & Teals), glassmorphism |
| **Data Storage** | Native Python Dictionaries | In-Memory runtime via MemoryMCP |
| **Architecture** | MCP (Model Context Protocol) | Standardized agent-to-tool proxy |

---

## 📁 Project Structure

```text
ai-drug-discovery/
│
├── .env                              # API keys (gitignored)
├── .env.example                      # Template for API keys (safe for GitHub)
├── .gitignore                        # Excludes .env, __pycache__, etc.
├── requirements.txt                  # Python dependencies
├── README.md                         # This file
│
├── backend/                          # Python backend
│   ├── main.py                       # FastAPI entry point + endpoints
│   ├── orchestrator.py               # Pipeline controller (NO LLM calls)
│   │
│   ├── mcp/                          # MCP Server Layer (CORE)
│   │   ├── base_mcp.py              # Base MCP server abstractions
│   │   ├── web_mcp.py               # UniProt, AlphaFold, Wikipedia, PubChem
│   │   ├── memory_mcp.py            # Shared isolated pipeline state
│   │   ├── filesystem_mcp.py        # Local JSON cache reader
│   │   ├── compute_mcp.py           # Potency proxy and ADMET engines
│   │   └── molecule_mcp.py          # Analog generations
│   │
│   ├── agents/                       # Agent Layer (Hybrid AI)
│   │   ├── base_agent.py            # Universal logic + stat reporting
│   │   ├── target_agent.py          # Deterministic: UniProt resolution
│   │   ├── research_agent.py        # LLM-Powered: biological reasoning
│   │   ├── molecule_agent.py        # Web-powered: known drug search
│   │   ├── screening_agent.py       # Deterministic: ADMET scoring
│   │   ├── risk_agent.py            # Deterministic: toxicity flags
│   │   └── decision_agent.py        # LLM-Powered: scientific justification
│   │
│   └── services/
│       ├── pdb_parser.py            # Node.js spawn proxy map
│       └── llm_service.py           # Centralized LLM service (Groq/Llama)
│
├── frontend/                         # GUI Web Client
│   ├── index.html                    # SPA Main DOM Entry
│   ├── style.css                     # Clinical matrix CSS
│   ├── background-theme.css          # Three.js structural grid bounds
│   ├── app.js                        # Controller Event Loop
│   ├── animations/                   # WebGL logic blocks
│   └── components/                   # Native JS DOM creators
│
├── parse-pdb/                        # Node.js external heavy lifter
│   └── cli.js                        # PDB to JSON parser entry point
│
└── data/                             # (Deprecated) Legacy JSON fixtures
```

---

## 🔌 MCP Servers — Complete Guide

### 1. WebMCP (`web_mcp.py`)

Provides tools for:
- **UniProt Search**: Real REST API call to identify proteins by name
- **AlphaFold Verification**: Validates 3D model availability at EBI
- **Binder Search**: Scrapes Wikipedia for known inhibitors/antagonists
- **Drug Search**: Live Wikipedia → PubChem pipeline for known cure molecules with SMILES resolution
- **Literature Search**: PubMed-style biomedical paper retrieval

### 2. MemoryMCP (`memory_mcp.py`)

The most heavily trafficked server. Maintains the exact dictionary state context passing from agent to agent, exposing `store` and `retrieve` tools. Ensures proper agent chaining without direct coupling.

### 3. FilesystemMCP (`filesystem_mcp.py`)

Provides fallback cache writing mechanisms and local knowledge base access.

### 4. ComputeMCP (`compute_mcp.py`)

Validates specific molecular constraints. Evaluates chemical candidates algorithmically against ADMET baselines including drug-likeness, BBB permeability, toxicity prediction, and composite scoring.

### 5. MoleculeMCP (`molecule_mcp.py`)

The chemistry engine executing physical SMILES creation, producing specific variations (`analogs`) of core baseline compounds given specific tuning variables like metabolic stability, selectivity, and BBB penetration.

---

## 🤖 Agents — Complete Guide

All 6 agents inherit from `BaseAgent`, enforcing strict MCP protocol usage.

### Deterministic Agents

1. **🎯 Target Agent**: Investigates the physical boundaries loaded from `parse-pdb` Node service. Resolves UniProt IDs via live REST API calls. Stores protein identity in MemoryMCP.

2. **🧬 Molecule Agent**: Searches the internet for known cure molecules via WebMCP (Wikipedia → PubChem SMILES resolution). Also generates novel analogs via MoleculeMCP. Combines web-discovered and generated candidates.

3. **🔍 Screening Agent**: Simulates binding affinities (Potency), drug-likeness (Lipinski), and BBB permeability of all candidates via ComputeMCP algorithm checks.

4. **⚠️ Risk Agent**: Assesses human safety factors (Hepatotoxicity, QT prolongation risks). Flags dangerous structural alerts via ComputeMCP toxicity prediction.

### LLM-Powered Agents

5. **🔬 Research Agent** ✨: After gathering deterministic data from WebMCP (AlphaFold verification, binder search), calls the **Groq LLM (Llama 3.3 70B)** to:
   - Explain the biological function of the identified protein
   - Assess target druggability based on structural features
   - Interpret known binder data with scientific reasoning
   - Output is displayed as "AI-Powered Research Analysis" on the frontend

6. **✔️ Decision Agent** ✨: Takes deterministic composite scores and risk flags, then calls the **Groq LLM** to generate per-candidate scientific justifications explaining:
   - Why each candidate is promising or concerning
   - Key strengths from its screening profile
   - Specific risks or uncertainties to highlight

---

## 🧪 LLM Integration

### Service Architecture

```
┌─────────────────────────────────────┐
│       llm_service.py                │
│  ┌───────────────────────────────┐  │
│  │  call_llm(prompt, temp, max)  │  │
│  └──────────┬────────────────────┘  │
│             │                       │
│     ┌───────▼───────┐               │
│     │  Cache Check  │               │
│     └───────┬───────┘               │
│             │                       │
│     ┌───────▼───────┐               │
│     │  Groq API     │──── Retry x2  │
│     │  (Llama 3.3)  │     + Backoff │
│     └───────┬───────┘               │
│             │ (if fails)            │
│     ┌───────▼───────┐               │
│     │   Template    │               │
│     │   Fallback    │               │
│     └───────────────┘               │
└─────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Groq over OpenAI** | Fastest inference speed, generous rate limits |
| **Llama 3.3 70B** | Strong biomedical reasoning capability |
| **Prompt caching** | Avoids redundant API calls for same protein |
| **Template fallback** | Demo never crashes even without API key |
| **Centralized service** | Single module, easily swappable backend |

### Environment Setup

```bash
# Copy the template and add your API key
cp .env.example .env

# Edit .env:
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Get a free Groq API key at [console.groq.com](https://console.groq.com/).

---

## 🚀 Setup & Installation Guide

### Prerequisites

- **Python 3.10+** (tested with 3.12)
- **Node.js** (required for `parse-pdb` structural engine)
- **Groq API Key** (free at [console.groq.com](https://console.groq.com/))

### Startup Protocol

```bash
# Clone the repository
git clone <repository-url>
cd ai-drug-discovery

# Set up environment variables
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY

# Install Python requirements
pip install -r requirements.txt

# Start Server Pipeline
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Then navigate to **<http://localhost:8000>**. Upload a raw `.pdb` file matching an active target protein, and watch the AI pipeline commence.

---

## 🚀 Deployment Guide

CureGenix is deployment-ready for various platforms. The application requires both Python (for FastAPI backend) and Node.js (for PDB parsing).

### Environment Variables

Before deploying, ensure you have:
- `GROQ_API_KEY`: Your Groq API key (get free at [console.groq.com](https://console.groq.com/))
- `GROQ_MODEL`: Set to `llama-3.3-70b-versatile`

### Free Deployment Options

#### 1. **Render** (Recommended - Free tier available)
1. Connect your GitHub repository
2. Create a new **Web Service**
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard
6. Deploy!

#### 2. **Railway**
1. Connect your GitHub repository
2. Railway auto-detects Python projects
3. Add environment variables
4. Deploy automatically

#### 3. **Fly.io** (Docker-based)
1. Install Fly CLI
2. Run `fly launch` in project directory
3. Use the provided Dockerfile
4. Set secrets: `fly secrets set GROQ_API_KEY=your_key`
5. Deploy with `fly deploy`

#### 4. **Container Platforms** (Docker)
Use the included `Dockerfile` for any container platform:
```bash
docker build -t curegenix .
docker run -p 8000:8000 -e GROQ_API_KEY=your_key curegenix
```

#### 5. **Local Development**
```bash
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Notes
- The app serves the frontend statically from the backend
- PDB parsing requires Node.js, included in Dockerfile
- Free tiers have usage limits - monitor API calls
- For production, consider adding rate limiting and authentication

---

## ⚡ How the Pipeline Works

```
1. Upload .pdb file
   │
2. Node.js parser extracts protein name (COMPND/TITLE priority), 
   sequence, binding sites, CA coordinates
   │
3. Target Agent → UniProt REST API → resolves protein identity
   │
4. Research Agent → AlphaFold verify + Wikipedia binder search
   │                → Groq LLM generates biological analysis ✨
   │
5. Molecule Agent → WebMCP searches internet for known drugs
   │                → Wikipedia → PubChem SMILES resolution
   │                → MoleculeMCP generates novel analogs
   │
6. Screening Agent → ComputeMCP scores all candidates
   │                  (drug-likeness, BBB, potency, toxicity)
   │
7. Risk Agent → ComputeMCP predicts structural toxicity alerts
   │
8. Decision Agent → Deterministic ranking + risk adjustment
                   → Groq LLM generates scientific justification ✨
                   → Final ranked recommendations to frontend
```

---

## 🔮 Future Scope

- **Real docking engine** (AutoDock Vina integration) for true binding affinity computation
- **ChEMBL/DrugBank API** integration for comprehensive known drug lookup
- **Multi-model LLM support** (GPT-4, Claude, local models via Ollama)
- **3D protein visualization** with interactive binding site highlighting
- **Batch processing** for multi-target drug discovery campaigns
- **Export pipeline** to PDF/CSV for lab reporting

---

## 📜 License

MIT License — Built for the MCP Engineering Track hackathon.
