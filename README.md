# Cookie Cutter Dashboard

- **Backend:** FastAPI endpoints (`/posts`,`/anomalies`, `/summary`)
- **Frontend:** Vite + React + Tailwind dashboard (Overview, Anomalies, Summary)

---

## Quick start

### Prereqs
- **Python** 3.11+
- **Node** 18+

### Backend
From the root directory do:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
We run the backend from the root of the project (because of conflicts with tests):
```bash
uvicorn backend.api_handle:app --host 0.0.0.0 --port 8000 --reload
```


### Frontend
In the frontend run:
```bash
npm install
```
For running the frontend:
```bash
npm run dev -- --port 3000
```
