import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

// Isolate test database before importing app modules
const TEST_DB_PATH = path.resolve(process.cwd(), 'tests', 'test_casid_pharma.db');
if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
process.env.SQLITE_DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = 'test';

import { createApp } from '../server';
import { closeDb } from '../backend/config/db';

async function runTests() {
  const app = await createApp({ attachFrontend: false });
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}/api`;

  async function req(
    method: string,
    endpoint: string,
    body?: unknown,
    token?: string
  ): Promise<{ status: number; data: any }> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  let passed = 0;
  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed += 1;
    } catch (err) {
      console.error(`FAIL: ${name}`);
      throw err;
    }
  }

  try {
    let superToken = '';
    let editorToken = '';
    let createdProductId = 0;
    let emptyCatId = 0;
    let newsId = 0;
    let mediaId = 0;
    let enquiryId = 0;

    await test('1. Database connectivity & health check', async () => {
      const res = await req('GET', '/health');
      assert.equal(res.status, 200);
      assert.equal(res.data.database, 'connected');
    });

    await test('2. Public website endpoints return seeded published data', async () => {
      const [prod, cat, page, news] = await Promise.all([
        req('GET', '/products'),
        req('GET', '/categories'),
        req('GET', '/pages/home'),
        req('GET', '/news'),
      ]);
      assert.equal(prod.status, 200);
      assert.ok(prod.data.products.length >= 4);
      assert.equal(cat.status, 200);
      assert.ok(cat.data.categories.length >= 4);
      assert.equal(page.status, 200);
      assert.equal(page.data.page.slug, 'home');
      assert.equal(news.status, 200);
      assert.ok(news.data.news.length >= 2);
    });

    await test('3. Protected admin routes reject unauthenticated access (401)', async () => {
      const res = await req('GET', '/admin/dashboard');
      assert.equal(res.status, 401);
    });

    await test('4. Initial Super Admin provisioning rejects non-designated email & provisions shaheed@gmail.com idempotently', async () => {
      const statusBefore = await req('GET', '/auth/setup-status');
      assert.equal(statusBefore.data.needsInitialSetup, true);
      assert.equal(statusBefore.data.designatedEmail, 'shaheed@gmail.com');

      const rejected = await req('POST', '/auth/setup-initial-admin', {
        name: 'Rogue User',
        email: 'rogue@example.com',
        password: 'StrongPassword#2026',
      });
      assert.equal(rejected.status, 403);

      const created = await req('POST', '/auth/setup-initial-admin', {
        name: 'Shaheed Super Admin',
        email: 'shaheed@gmail.com',
        password: 'CasidAdmin#2026',
      });
      assert.equal(created.status, 201);
      assert.equal(created.data.user.role, 'super_admin');
      assert.ok(created.data.token);

      // Idempotent lock check: second attempt must fail with 409
      const secondAttempt = await req('POST', '/auth/setup-initial-admin', {
        name: 'Duplicate',
        email: 'shaheed@gmail.com',
        password: 'CasidAdmin#2026',
      });
      assert.equal(secondAttempt.status, 409);
    });

    await test('5. Invalid login rejected & valid Super Admin login succeeds', async () => {
      const bad = await req('POST', '/auth/login', {
        email: 'shaheed@gmail.com',
        password: 'WrongPassword1!',
      });
      assert.equal(bad.status, 401);

      const good = await req('POST', '/auth/login', {
        email: 'shaheed@gmail.com',
        password: 'CasidAdmin#2026',
      });
      assert.equal(good.status, 200);
      superToken = good.data.token;

      const me = await req('GET', '/auth/me', undefined, superToken);
      assert.equal(me.status, 200);
      assert.equal(me.data.user.email, 'shaheed@gmail.com');
    });

    await test('6. Role-Based Access Control (RBAC): Editor restricted from Super Admin endpoints', async () => {
      const createEditor = await req(
        'POST',
        '/admin/users',
        {
          name: 'Content Editor',
          email: 'editor@casidpharma.com',
          password: 'EditorPass#2026',
          role: 'editor',
        },
        superToken
      );
      assert.equal(createEditor.status, 201);

      const edLogin = await req('POST', '/auth/login', {
        email: 'editor@casidpharma.com',
        password: 'EditorPass#2026',
      });
      assert.equal(edLogin.status, 200);
      editorToken = edLogin.data.token;

      const forbiddenUsers = await req('GET', '/admin/users', undefined, editorToken);
      assert.equal(forbiddenUsers.status, 403);

      const forbiddenAudit = await req('GET', '/admin/audit-logs', undefined, editorToken);
      assert.equal(forbiddenAudit.status, 403);
    });

    await test('7. Product CRUD & Editor approval workflow', async () => {
      const cats = await req('GET', '/categories');
      const catId = cats.data.categories[0].id;

      // Editor creates product -> automatically stays draft/pending_review, never published
      const createRes = await req(
        'POST',
        '/products',
        {
          name: 'Test Formulation 100',
          sku: 'CP-TST-901',
          category_id: catId,
          dosage_form: 'Tablet',
          strength: '100 mg',
          short_description: 'Automated test formulation',
          status: 'published',
        },
        editorToken
      );
      assert.equal(createRes.status, 201);
      assert.equal(createRes.data.product.status, 'pending_review');
      createdProductId = createRes.data.product.id;

      // Super Admin approves & publishes
      const pubRes = await req('PUT', `/products/${createdProductId}`, { status: 'published' }, superToken);
      assert.equal(pubRes.status, 200);
      assert.equal(pubRes.data.product.status, 'published');

      // Editor cannot delete product
      const edDelete = await req('DELETE', `/products/${createdProductId}`, undefined, editorToken);
      assert.equal(edDelete.status, 403);

      // Super Admin deletes product
      const saDelete = await req('DELETE', `/products/${createdProductId}`, undefined, superToken);
      assert.equal(saDelete.status, 200);
    });

    await test('8. Category management & safe deletion protection', async () => {
      const cats = await req('GET', '/categories');
      const referencedCatId = cats.data.categories[0].id;

      // Referenced category cannot be deleted without reassignment
      const blocked = await req('DELETE', `/categories/${referencedCatId}`, undefined, superToken);
      assert.equal(blocked.status, 409);

      // Empty category can be created and deleted cleanly
      const createCat = await req(
        'POST',
        '/categories',
        { name: 'Ophthalmic Care', description: 'Sterile eye drops' },
        superToken
      );
      assert.equal(createCat.status, 201);
      emptyCatId = createCat.data.category.id;

      const delCat = await req('DELETE', `/categories/${emptyCatId}`, undefined, superToken);
      assert.equal(delCat.status, 200);
    });

    await test('9. News creation & publishing', async () => {
      const created = await req(
        'POST',
        '/news',
        {
          title: 'Automated QC System Integration Update',
          summary: 'Verification test news summary.',
          content: 'Full verification test news article body.',
          status: 'published',
        },
        superToken
      );
      assert.equal(created.status, 201);
      newsId = created.data.article.id;

      const del = await req('DELETE', `/news/${newsId}`, undefined, superToken);
      assert.equal(del.status, 200);
    });

    await test('10. Media upload validation & safe cleanup', async () => {
      // Valid 1x1 PNG upload
      const pngBytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64'
      );
      const validForm = new FormData();
      validForm.append('file', new Blob([pngBytes], { type: 'image/png' }), 'test-pixel.png');
      validForm.append('alt_text', 'Test Pixel');

      const uploadRes = await req('POST', '/media/upload', validForm, superToken);
      assert.equal(uploadRes.status, 201);
      mediaId = uploadRes.data.media.id;

      // Invalid text file upload rejected
      const badForm = new FormData();
      badForm.append('file', new Blob(['hello'], { type: 'text/plain' }), 'bad.txt');
      const badRes = await req('POST', '/media/upload', badForm, superToken);
      assert.equal(badRes.status, 400);

      // Delete uploaded test media
      const delMedia = await req('DELETE', `/media/${mediaId}`, undefined, superToken);
      assert.equal(delMedia.status, 200);
    });

    await test('11. Public contact form submission & Admin enquiry management', async () => {
      const sub = await req('POST', '/enquiries', {
        name: 'Dr. Kavitha Rao',
        email: 'k.rao@hospital.org',
        phone: '+91 98401 22334',
        company: 'City Medical Center',
        subject: 'Product Dossier Request',
        message: 'Please send analytical stability specifications for Casidil-AM 5/50.',
      });
      assert.equal(sub.status, 201);
      assert.ok(sub.data.reference_code.startsWith('ENQ-'));
      enquiryId = sub.data.enquiry_id;

      const upd = await req(
        'PUT',
        `/enquiries/${enquiryId}`,
        { status: 'responded', admin_notes: 'Dossier sent via QA channel.' },
        superToken
      );
      assert.equal(upd.status, 200);
      assert.equal(upd.data.enquiry.status, 'responded');
    });

    await test('12. Backup export, restore, audit log, and logout', async () => {
      const exp = await req('GET', '/admin/backup/export', undefined, superToken);
      assert.equal(exp.status, 200);
      assert.equal(exp.data.schemaVersion, '1.0');

      const rst = await req('POST', '/admin/backup/restore', exp.data, superToken);
      assert.equal(rst.status, 200);

      const logs = await req('GET', '/admin/audit-logs', undefined, superToken);
      assert.equal(logs.status, 200);
      assert.ok(logs.data.logs.some((l: any) => l.action === 'BACKUP_RESTORED'));

      const out = await req('POST', '/auth/logout', undefined, superToken);
      assert.equal(out.status, 200);
    });

    console.log(`\nAll ${passed} integration tests passed.`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
    if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
