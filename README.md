# 🛡️ DoorGuard NYC

> **Who's at your door? And are they who they say they are?**

A voice + vision AI agent that talks to visitors on your behalf, checks NYC Open Data in real time to verify if they're legit, knows your tenant rights, and alerts you with the verdict before you open the door.

🏆 **NYC Build With AI Hackathon 2026** — GDG NYC @ NYU Tandon

## 🎯 Problem

NYC tenants open their doors to strangers claiming to be inspectors, utility workers, or landlord reps — with **no way to verify** if the visit is real, legal, or safe.

## 💡 Solution

DoorGuard is a **real-time AI agent** that:
- 👁️ **SEES** the visitor (camera/vision via Gemini Vision)
- 🎙️ **TALKS** to them (voice via Gemini 2.0 Flash Live)
- 🔍 **VERIFIES** their claims against 5 NYC Open Datasets in real time
- 📱 **ALERTS** the tenant with a verdict: ✅ VERIFIED / ⚠️ UNVERIFIED / 🚫 BLOCKED

## 🏗️ Architecture

```
Visitor → Door Camera + Mic → DoorGuard Agent (Google ADK)
                                    ↓
                    Gemini Voice ← → Gemini Vision
                                    ↓
                        NYC Open Data (5 datasets)
                                    ↓
                    Verdict → Alert → Tenant
```

## 📊 NYC Open Datasets Used

| Dataset | ID | Purpose |
|---------|-----|---------|
| HPD Housing Violations | `wvxf-dwi5` | Verify HPD inspector claims |
| HPD Complaints | `uwyv-629c` | Check if complaints were filed |
| DOB Complaints | `eabe-havv` | Verify DOB inspection claims |
| DOB Permits | `ic3t-wcy2` | Verify construction crew claims |
| HPD Registrations | `feu5-w2e2` | Verify management company claims |

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Vite |
| Backend | Python FastAPI |
| Voice Agent | Google GenAI SDK + Gemini 2.0 Flash Live |
| Vision | Gemini Vision |
| Agent Framework | Google ADK (Agent Development Kit) |
| Data Source | NYC Open Data (Socrata API) |
| Deployment | Google Cloud Run |

## 🚀 Quick Start

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Environment Variables
Copy `.env.example` to `.env` and fill in your API keys:
```bash
GOOGLE_API_KEY=your_key_here
GOOGLE_CLOUD_PROJECT=your_project_id
```

## 🏆 Hackathon Category

**Live Agent** — Real-time voice + vision interaction with interruption handling

## 👥 Team

- **Forrest Pan** — [GitHub](https://github.com/panforrest) | [LinkedIn](https://www.linkedin.com/in/forrest-pan-153733232/)

## 📜 License

MIT
