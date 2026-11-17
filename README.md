# Casid Pharma Website Maintenance System

A full-stack, database-driven pharmaceutical corporate website and secure role-based Admin Maintenance Dashboard built with React, TypeScript, Tailwind CSS, Express.js, and SQLite.

## Features
- **Public Corporate Website**: Home, About Us, Product Catalogue (with live search & category filters), Product Detail pages, Research & Development, Quality & Compliance, News & Updates, Contact Us (database-persisted enquiries), Privacy Policy, and Terms & Conditions.
- **Secure Admin Maintenance Portal (`/admin/login`)**:
  - Idempotent one-time Super Admin provisioning for `shaheed@gmail.com` (no hardcoded password).
  - JWT + HttpOnly cookie authentication with `bcryptjs` password hashing and RBAC (`super_admin` and `editor`).
  - Operations Dashboard with live KPI metrics, content publishing status, notifications, and recent activity.
  - Full CRUD for Products, Categories (with safe deletion & product reassignment), CMS Pages (with JSON section editor & live Preview), News & Announcements, Media Library (Multer upload, replace, safe delete), Enquiries, Users & Roles, Security Audit Logs, and Atomic JSON Backup/Restore.

## Windows Command Prompt & PowerShell Quick Start

1. **Install dependencies:**
   ```powershell
   npm install
   ```
2. **Create environment file (optional for local dev):**
   ```powershell
   Copy-Item .env.example .env
   ```
3. **Run database migrations and seed data (also runs automatically on server start):**
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```
4. **Start the full-stack application (Frontend + Backend on port 3000):**
   ```powershell
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
5. **Provision Initial Super Admin (`shaheed@gmail.com`):**
   - Navigate to `http://localhost:3000/admin/login` and complete the one-time activation form, **or** run:
     ```powershell
     npm run setup:admin
     ```
6. **Run Automated Integration Tests:**
   ```powershell
   npm test
   ```
7. **Production Build & Start:**
   ```powershell
   npm run build
   npm start
   ```

## Project Structure
- `server.ts` — Express + Vite unified server entry point (port 3000)
- `backend/` — Controllers, routes, middleware (JWT/RBAC/Multer), services, config, uploads
- `database/` — SQL migrations (`001_initial_schema.sql`), migration runner, and seed data
- `src/` — React frontend (layouts, public pages, admin portal pages, Axios API client, auth hook)
- `tests/` — Automated end-to-end API, RBAC, CRUD, and backup test suite
- `documentation/` — `DEPLOYMENT.md` and `TESTING.md`
