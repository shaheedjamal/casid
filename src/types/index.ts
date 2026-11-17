export type UserRole = 'super_admin' | 'editor';
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived';
export type EnquiryStatus = 'pending' | 'reviewed' | 'responded' | 'closed';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  last_login_at?: string | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  status: 'active' | 'inactive';
  product_count?: number;
  total_product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  dosage_form: string;
  strength: string;
  therapeutic_area: string;
  short_description: string;
  description: string;
  composition: string;
  packaging_info: string;
  storage_conditions: string;
  image_url: string;
  is_featured: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  hero_image_url: string;
  content: Record<string, any>;
  meta_description: string;
  status: ContentStatus;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  category_label: string;
  summary: string;
  content: string;
  image_url: string;
  published_at: string;
  status: ContentStatus;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  url: string;
  alt_text: string;
  uploaded_by_name?: string;
  reference_count?: number;
  created_at: string;
}

export interface Enquiry {
  id: number;
  reference_code: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  product_id?: number | null;
  product_name?: string | null;
  message: string;
  status: EnquiryStatus;
  admin_notes: string;
  reviewed_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface DashboardData {
  stats: {
    totalProducts: number;
    publishedProducts: number;
    totalCategories: number;
    totalPages: number;
    publishedPages: number;
    totalNews: number;
    publishedNews: number;
    totalEnquiries: number;
    pendingEnquiries: number;
    totalUsers: number;
    totalMedia: number;
    pendingApprovals: number;
  };
  recentLogs: AuditLog[];
  recentEnquiries: Enquiry[];
  contentStatus: {
    products: Array<{ status: string; count: number }>;
    pages: Array<{ status: string; count: number }>;
    news: Array<{ status: string; count: number }>;
  };
}
