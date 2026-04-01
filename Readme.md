# HMS (Hospital Management System)

Secure backend scaffold to manage:
- Patient records
- Doctor appointments
- Billing (invoices + payments)
- Pharmacy inventory (medications, lots, transactions, dispensing)

## Tech
- Django + Django REST Framework
- JWT authentication (`djangorestframework-simplejwt`)
- API schema + Swagger UI (`drf-spectacular`)
- Field-level encryption for sensitive text (Fernet via `cryptography`)
- Request audit logging

## Quick start (Windows / PowerShell)

Prereqs:
- Python (already used by backend)
- Node.js LTS (required for frontend; provides `node` and `npm`)

Create a virtualenv and install dependencies:

```bash
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

Environment variables:
- Copy `.env` (already included for local dev) and update values for your environment.
- **Important**: set a strong `FIELD_ENCRYPTION_KEY` for any real usage.

Run migrations and create an admin user:

```bash
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py createsuperuser
```

Start the server:

```bash
.\.venv\Scripts\python manage.py runserver
```

## Frontend (React)

Install dependencies:

```bash
cd frontend
npm install
```

Run dev server:

```bash
npm run dev
```

Open:
- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

### Frontend login / user creation
- Login uses JWT: `POST /api/auth/token/` then `GET /api/me/`
- **Dev-only demo user creation**: `POST /api/auth/register/` works only when `DJANGO_DEBUG=1`
- Admin user management: `GET/POST /api/users/` (admin role only)

## API
- **Swagger UI**: `http://127.0.0.1:8000/api/docs/`
- **OpenAPI schema**: `http://127.0.0.1:8000/api/schema/`

### Auth (JWT)
- Get token: `POST /api/auth/token/`
- Refresh token: `POST /api/auth/token/refresh/`

Send access token as:
`Authorization: Bearer <access_token>`

## Roles & access control
Users have a `role` (`accounts.User.role`):
- `ADMIN`
- `DOCTOR`
- `RECEPTION`
- `BILLING`
- `PHARMACY`

Endpoints enforce role checks (plus superuser override).

## Sensitive data handling
- **Field-level encryption**: `EncryptedTextField` stores ciphertext in the database for selected fields (e.g., patient address, emergency contact, appointment notes).
- **Key management**: encryption uses `FIELD_ENCRYPTION_KEY` from environment. Rotate carefully (rotation support can be added).
- **Audit trail**: `auditlog.AuditEvent` records request metadata. Expand to log domain-level events (patient viewed/updated, invoice issued, inventory dispensed) as you finalize workflows.

## Recommended production hardening (next steps)
- Use PostgreSQL (instead of SQLite) + enable DB encryption at rest (disk/volume)
- Configure `SECURE_HSTS_SECONDS` and proper `DJANGO_ALLOWED_HOSTS`
- Put Django behind a reverse proxy (TLS termination)
- Add rate limiting/throttling and stronger audit events per action
- Add backups + restore drills; test encryption key rotation procedure

