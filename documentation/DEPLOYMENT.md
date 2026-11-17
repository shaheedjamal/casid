# Deployment & Maintenance Guide — Casid Pharma Website Maintenance System

## 1. Environment Configuration
1. Copy `.env.example` to `.env`:
   - Windows CMD: `copy .env.example .env`
   - PowerShell: `Copy-Item .env.example .env`
2. Set `JWT_SECRET` to a cryptographically random 64+ character hex string.
3. Verify `INITIAL_ADMIN_EMAIL="shaheed@gmail.com"`. Do NOT store plaintext passwords in `.env` in production; use the interactive `/admin/login` first-time setup UI or `npm run setup:admin` CLI tool.

## 2. Database Setup & Migrations
The system uses **SQLite (`better-sqlite3`)** by default for zero-configuration local and Windows development, with WAL journaling and strict foreign key constraints enabled.
- Run migrations manually: `npm run db:migrate`
- Run seed data manually: `npm run db:seed`
- Note: Starting the server (`npm run dev` or `npm start`) automatically verifies migrations and seeds initial corporate pages, categories, and products idempotently.

## 3. Windows-Compatible Build & Startup
```cmd
npm install
npm run build
npm start
```
The Express server listens on port `3000` (or `process.env.PORT`), serving the compiled React SPA from `dist/` and mounting all `/api/*` and `/uploads/*` routes.

## 4. HTTPS & Reverse Proxy Configuration (Production)
In production, terminate TLS/HTTPS behind Nginx, Caddy, or a managed load balancer:
- Forward `X-Forwarded-For` and `X-Forwarded-Proto` headers (`app.set('trust proxy', 1)` is already configured).
- Ensure `NODE_ENV=production` is set so session cookies enforce the `Secure` attribute over HTTPS.

## 5. Backup & Restoration Procedures
- **UI Backup**: Sign in as Super Admin → **Backup & Settings** → **Download Full Backup (.json)**.
- **UI Restore**: Upload a verified `.json` snapshot under **Restore from Backup**. Restoration runs inside an atomic SQLite transaction.
- **File Backup**: Periodically back up `database/casid_pharma.db` and `backend/uploads/`.

## 6. Error Logging & Maintenance
- All security events (logins, failed logins, user role changes, backup exports/restores) and content CRUD actions are logged in the `audit_logs` table, viewable under **Admin → Audit Logs**.
- Review `enquiries` regularly and apply retention cleanup per `enquiry_retention_days` in **Backup & Settings**.
