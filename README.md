# NIT Club Compass

## Quick Start

### 1. Backend
```powershell
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # Mac / Linux
pip install -r requirements.txt
python seed_data.py
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend (new terminal)
```powershell
cd frontend
python -m http.server 3000
```

Open **http://localhost:3000**

---

## Features
- Club Discovery and Comparisons
- Events & Forum
- Staff & Owner Admin Portals
- one to one chat
- role based reddit themed interaction

---

## Accounts

| Role       | Credentials / How to sign up |
|------------|----------------|
| Student    | Any @nitkkr.ac.in email + sign up directly |
| Club Admin | Created via Admin Portal by Owner/Faculty |
| Faculty    | Created via Admin Portal by Owner |
| Owner (Admin) | Email `OWNER_EMAIL`- — password `ADMIN_PASSWORD` |
