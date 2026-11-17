import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { ProductsPage } from './pages/public/ProductsPage';
import { ProductDetailPage } from './pages/public/ProductDetailPage';
import { ResearchPage } from './pages/public/ResearchPage';
import { QualityPage } from './pages/public/QualityPage';
import { NewsPage } from './pages/public/NewsPage';
import { NewsDetailPage } from './pages/public/NewsDetailPage';
import { ContactPage } from './pages/public/ContactPage';
import { PolicyPage } from './pages/public/PolicyPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminPagesPage } from './pages/admin/AdminPagesPage';
import { AdminNewsPage } from './pages/admin/AdminNewsPage';
import { AdminMediaPage } from './pages/admin/AdminMediaPage';
import { AdminEnquiriesPage } from './pages/admin/AdminEnquiriesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
        Access Restricted: This maintenance module requires Super Admin privileges.
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Corporate Website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/quality" element={<QualityPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PolicyPage slug="privacy-policy" />} />
            <Route path="/terms-and-conditions" element={<PolicyPage slug="terms-and-conditions" />} />
          </Route>

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Maintenance Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route
              path="categories"
              element={
                <SuperAdminRoute>
                  <AdminCategoriesPage />
                </SuperAdminRoute>
              }
            />
            <Route path="pages" element={<AdminPagesPage />} />
            <Route path="news" element={<AdminNewsPage />} />
            <Route path="media" element={<AdminMediaPage />} />
            <Route path="enquiries" element={<AdminEnquiriesPage />} />
            <Route
              path="users"
              element={
                <SuperAdminRoute>
                  <AdminUsersPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <SuperAdminRoute>
                  <AdminAuditLogsPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="settings"
              element={
                <SuperAdminRoute>
                  <AdminSettingsPage />
                </SuperAdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
