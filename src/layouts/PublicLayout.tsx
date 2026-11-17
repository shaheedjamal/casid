import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { CasidLogo } from '../components/CasidLogo';

const NAV_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'R&D', to: '/research' },
  { label: 'Quality', to: '/quality' },
  { label: 'News', to: '/news' },
];

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-md"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CasidLogo />
          </Link>

          {/* Zone 2: 5 Clean Single-Line Nav Links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                    isActive
                      ? 'text-blue-800 border-blue-700'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/contact"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Contact Us
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
          >
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-md text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 mt-2 text-center rounded-md text-sm font-medium text-white bg-blue-800 hover:bg-blue-900"
            >
              Contact Us
            </Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Corporate Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
            <div className="md:col-span-5 space-y-3">
              <CasidLogo inverted />
              <p className="text-sm text-slate-400 leading-relaxed max-w-md pt-1">
                Casid Pharma develops quality-assured oral solid and sterile parenteral formulations supported by
                validated analytical methods and documented batch traceability.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Corporate</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-white transition-colors">
                    Product Catalogue
                  </Link>
                </li>
                <li>
                  <Link to="/research" className="hover:text-white transition-colors">
                    Research &amp; Development
                  </Link>
                </li>
                <li>
                  <Link to="/quality" className="hover:text-white transition-colors">
                    Quality &amp; Compliance
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="hover:text-white transition-colors">
                    News &amp; Updates
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Governance &amp; Contact</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Submit Product or Corporate Enquiry
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li className="pt-2">
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center text-xs font-medium text-blue-300 hover:text-white transition-colors"
                  >
                    Admin Maintenance Portal →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Casid Pharma. All rights reserved.</p>
            <p>Information provided is for corporate and healthcare-partner reference.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
