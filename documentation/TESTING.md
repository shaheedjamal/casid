# Testing Documentation — Casid Pharma Website Maintenance System

## Automated Test Suite
Run the full automated backend API, RBAC, CRUD, file-upload, enquiry, and backup/restore suite using:
```bash
npm test
```

## Coverage Matrix
1. **Database Connectivity & Health**: `GET /api/health` verifies SQLite connection and schema migrations.
2. **Public Data Integrity**: Verifies `/api/products`, `/api/categories`, `/api/pages/home`, and `/api/news` return only published database records.
3. **Unauthenticated Route Protection**: Verifies `/api/admin/dashboard` returns `401` without a valid JWT.
4. **Idempotent Initial Super Admin Provisioning**:
   - Rejects non-designated emails (`403 Forbidden`).
   - Provisions `shaheed@gmail.com` with `super_admin` role (`201 Created`).
   - Locks subsequent setup attempts (`409 Conflict`).
5. **Authentication Validation**: Rejects invalid credentials (`401`) and verifies `/api/auth/me` on valid login.
6. **Role-Based Access Control (RBAC)**:
   - Verifies `editor` cannot access `/api/admin/users` or `/api/admin/audit-logs` (`403`).
   - Verifies `editor` product submissions default to `pending_review` and `editor` cannot delete products (`403`).
7. **Product & Category CRUD + Safe Deletion**:
   - Tests create, update, publish, delete.
   - Verifies `DELETE /api/categories/:id` blocks deletion (`409`) when referenced by products.
8. **News Management**: Tests creating, publishing, and deleting articles.
9. **Media Upload Validation**: Tests valid PNG upload and confirms rejection (`400`) of non-image `.txt` files.
10. **Contact Enquiry & Status Workflow**: Tests public `POST /api/enquiries` reference generation and admin `PUT /api/enquiries/:id` status transitions.
11. **Backup Export, Restore & Audit Logging**: Verifies full JSON snapshot export, atomic restoration, and audit log entry creation.
