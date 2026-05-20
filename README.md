# Cyphex

Cyphex is a premium, full-stack, AI-powered Data Privacy Compliance Checker and operations console. It helps secure datasets and applications by identifying and automatically remediating data privacy risks in real-time.

- **React + Tailwind CSS** frontend with a beautiful, high-fidelity dark console interface.
- **Node.js + Express** backend serving APIs and real-time Socket.IO alerts.
- **Single-Unit Deployment**: The backend Express server natively builds and serves the frontend as static files under one port.
- **MongoDB Persistence** for log analysis, custom rules, reports, and persistent auditing.
- **Python FastAPI AI service** for robust PII detection and automated rule validation.
- **Auto-Remediation** including data masking, access blocking, and payload encryption.

---

## Folder Structure

```text
CYPHEX/
├── apps/
│   ├── ai-service/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── models.py
│   │   │   ├── rules.py
│   │   │   ├── sample_data.py
│   │   │   └── services.py
│   │   └── requirements.txt
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── app.js
│   │   │   ├── plainServer.js
│   │   │   └── server.js
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── hooks/
│       │   ├── layouts/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   └── index.css
│       ├── package.json
│       └── tailwind.config.js
├── data/
│   ├── mongo/
│   └── seed/
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

---

## Setup & Running

### 1. Clone And Prepare Environment

Create your local configuration file from the template:

```bash
cp .env.example .env
```

Make sure the `.env` variables align with your local database and desired settings.

### 2. Start MongoDB

Cyphex requires a running MongoDB database. Ensure your instance is active at:
```text
mongodb://127.0.0.1:27017/intrusionx
```

### 3. Run the AI Service

The AI detection microservice runs on FastAPI.

```bash
cd apps/ai-service
python3 -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Running the Application

Cyphex has been architected to run as a single, combined unit or in watch mode for development:

#### **Single Unit Mode (Recommended)**
Builds the React frontend and boots up the backend Express server which serves both the API endpoints and frontend assets on a single port (**5055**):

```bash
# Run from repository root
npm run dev
```
Open [http://127.0.0.1:5055](http://127.0.0.1:5055) in your web browser.

#### **Development Watch Mode**
Runs both the backend Node.js server and Vite dev server concurrently with hot reloading:

```bash
# Run from repository root
npm run dev:watch
```
- Frontend: [http://127.0.0.1:5180](http://127.0.0.1:5180)
- Backend: [http://127.0.0.1:5055](http://127.0.0.1:5055)

---

## Demo Access

The backend automatically seeds a default administrator on startup if no users exist:

- **Email**: `admin@intrusionx.io`
- **Password**: `Admin@123`

---

## Key Features

- **PII Detection**: Regex and NLP-based pattern matching (Email, Phone, Aadhaar, Credit Card, etc.).
- **Compliance Policy Engine**: Configurable rules such as geographic residency checks (e.g. Aadhaar processed only in India region) and ownership restrictions.
- **Real-time Alerting**: Live console notifications driven by Socket.IO.
- **Remediation Actions**: Real-time content masking, routing blocks, and encryption.
- **Export & Audit**: Immutable audit logging and compliance reporting with PDF downloads.
- **Interactive Console**: Built-in rules control panel and user feedback loops.
