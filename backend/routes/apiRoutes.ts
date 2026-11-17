import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import * as adminController from '../controllers/adminController';
import * as authController from '../controllers/authController';
import * as categoryController from '../controllers/categoryController';
import * as enquiryController from '../controllers/enquiryController';
import * as mediaController from '../controllers/mediaController';
import * as newsController from '../controllers/newsController';
import * as pageController from '../controllers/pageController';
import * as productController from '../controllers/productController';
import { attachOptionalUser, requireAuth, requireRole } from '../middleware/authMiddleware';
import { uploadImage } from '../middleware/uploadMiddleware';
import { getDb } from '../config/db';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const enquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many enquiry submissions from this IP. Please try again shortly.' },
});

// Health Check
router.get('/health', (_req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Authentication & Initial Setup
router.get('/auth/setup-status', authController.getSetupStatus);
router.post('/auth/setup-initial-admin', authLimiter, authController.setupInitialAdmin);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/logout', attachOptionalUser, authController.logout);
router.get('/auth/me', requireAuth, authController.getMe);

// Products
router.get('/products', attachOptionalUser, productController.listProducts);
router.get('/products/:id', attachOptionalUser, productController.getProduct);
router.post('/products', requireAuth, requireRole('super_admin', 'editor'), productController.createProduct);
router.put('/products/:id', requireAuth, requireRole('super_admin', 'editor'), productController.updateProduct);
router.delete('/products/:id', requireAuth, requireRole('super_admin'), productController.deleteProduct);

// Categories
router.get('/categories', attachOptionalUser, categoryController.listCategories);
router.post('/categories', requireAuth, requireRole('super_admin'), categoryController.createCategory);
router.put('/categories/:id', requireAuth, requireRole('super_admin'), categoryController.updateCategory);
router.delete('/categories/:id', requireAuth, requireRole('super_admin'), categoryController.deleteCategory);

// CMS Pages
router.get('/pages', attachOptionalUser, pageController.listPages);
router.get('/pages/:slug', attachOptionalUser, pageController.getPageBySlug);
router.post('/pages', requireAuth, requireRole('super_admin', 'editor'), pageController.createPage);
router.put('/pages/:id', requireAuth, requireRole('super_admin', 'editor'), pageController.updatePage);

// News & Announcements
router.get('/news', attachOptionalUser, newsController.listNews);
router.get('/news/:id', attachOptionalUser, newsController.getNewsItem);
router.post('/news', requireAuth, requireRole('super_admin', 'editor'), newsController.createNews);
router.put('/news/:id', requireAuth, requireRole('super_admin', 'editor'), newsController.updateNews);
router.delete('/news/:id', requireAuth, requireRole('super_admin'), newsController.deleteNews);

// Media Library
router.get('/media', requireAuth, requireRole('super_admin', 'editor'), mediaController.listMedia);
router.post(
  '/media/upload',
  requireAuth,
  requireRole('super_admin', 'editor'),
  uploadImage.single('file'),
  mediaController.uploadMedia
);
router.put(
  '/media/:id/replace',
  requireAuth,
  requireRole('super_admin', 'editor'),
  uploadImage.single('file'),
  mediaController.replaceMedia
);
router.delete('/media/:id', requireAuth, requireRole('super_admin', 'editor'), mediaController.deleteMedia);

// Enquiries
router.post('/enquiries', enquiryLimiter, enquiryController.submitEnquiry);
router.get('/enquiries', requireAuth, requireRole('super_admin', 'editor'), enquiryController.listEnquiries);
router.put('/enquiries/:id', requireAuth, requireRole('super_admin'), enquiryController.updateEnquiry);
router.delete('/enquiries/:id', requireAuth, requireRole('super_admin'), enquiryController.deleteEnquiry);

// Admin Dashboard, Users, Audit Logs, Settings & Backups
router.get('/admin/dashboard', requireAuth, requireRole('super_admin', 'editor'), adminController.getDashboardStats);
router.get('/admin/users', requireAuth, requireRole('super_admin'), adminController.listUsers);
router.post('/admin/users', requireAuth, requireRole('super_admin'), adminController.createUser);
router.put('/admin/users/:id', requireAuth, requireRole('super_admin'), adminController.updateUser);
router.get('/admin/audit-logs', requireAuth, requireRole('super_admin'), adminController.listAuditLogs);
router.get('/admin/settings', requireAuth, requireRole('super_admin'), adminController.getSettings);
router.put('/admin/settings', requireAuth, requireRole('super_admin'), adminController.updateSettings);
router.get('/admin/backup/export', requireAuth, requireRole('super_admin'), adminController.exportBackup);
router.post('/admin/backup/restore', requireAuth, requireRole('super_admin'), adminController.restoreBackup);

// Multer & API Error Handler
router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Unexpected server error.' });
});

export default router;
