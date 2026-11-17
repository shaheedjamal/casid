import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import type { CmsPage, Product } from '../../types';

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const [contactPage, setContactPage] = useState<CmsPage | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [productId, setProductId] = useState(searchParams.get('product') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [referenceCode, setReferenceCode] = useState('');

  useEffect(() => {
    api.get('/pages/contact').then((res) => setContactPage(res.data.page)).catch(() => {});
    api.get('/products').then((res) => setProducts(res.data.products || [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (subject.trim().length < 3) {
      setError('Please enter an enquiry subject.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please enter a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/enquiries', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        subject: subject.trim(),
        product_id: productId ? Number(productId) : null,
        message: message.trim(),
      });
      setReferenceCode(res.data.reference_code);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSubject('');
      setMessage('');
      setProductId('');
    } catch (err) {
      setError(extractApiError(err, 'Unable to submit your enquiry. Please check all fields.'));
    } finally {
      setSubmitting(false);
    }
  }

  const info = contactPage?.content || {};

  return (
    <div className="bg-white">
      <section className="bg-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-800">Corporate &amp; Medical Affairs</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {contactPage?.title || 'Contact Casid Pharma'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            {contactPage?.subtitle ||
              'Reach our corporate office, product enquiry desk, quality assurance team, or medical affairs specialists.'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 space-y-5">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {info.companyName || 'Casid Pharma Corporate Headquarters'}
              </h2>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-blue-800 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p>{info.addressLine1 || 'Plot 42, Life Sciences & Pharmaceutical Park'}</p>
                  <p>{info.addressLine2 || 'Industrial Innovation Corridor, Sector IV'}</p>
                  <p className="font-medium text-slate-900">{info.cityCountry || 'Chennai 600113, India'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <Mail className="w-4 h-4 text-blue-800 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-500">General Enquiries: </span>
                    <span className="font-medium text-slate-900">{info.email || 'enquiries@casidpharma.com'}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Quality Assurance: </span>
                    <span className="font-medium text-slate-900">
                      {info.medicalAffairsEmail || 'quality@casidpharma.com'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-blue-800 mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-mono text-slate-900">{info.phone || '+91 (044) 2498-7410'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {info.officeHours || 'Monday – Friday · 09:00 to 18:00 IST'}
                  </p>
                </div>
              </div>

              {info.directionsNote && (
                <p className="text-xs text-slate-600 pt-3 border-t border-slate-200 leading-relaxed">
                  {info.directionsNote}
                </p>
              )}
            </div>
          </div>

          {/* Enquiry Form Column */}
          <div className="lg:col-span-7">
            <div className="border border-slate-200 rounded-lg p-6 sm:p-8 bg-white">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-1">Submit an Enquiry</h2>
              <p className="text-sm text-slate-600 mb-6">
                All submissions are logged in our corporate database and assigned a tracking reference code.
              </p>

              {referenceCode ? (
                <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-6 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    <span>Enquiry Submitted Successfully</span>
                  </div>
                  <p className="text-sm text-emerald-900">
                    Thank you for contacting Casid Pharma. Your reference code is{' '}
                    <span className="font-mono font-semibold">{referenceCode}</span>. Our team will review your message
                    and respond via email.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReferenceCode('')}
                    className="px-4 py-2 text-xs font-medium text-emerald-900 bg-white border border-emerald-300 rounded-md hover:bg-emerald-100"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {error && (
                    <div role="alert" className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enq-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        id="enq-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                        placeholder="Dr. Priya Nair"
                      />
                    </div>
                    <div>
                      <label htmlFor="enq-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        id="enq-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                        placeholder="name@hospital.org"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enq-phone" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        id="enq-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                        placeholder="+91 98400 00000"
                      />
                    </div>
                    <div>
                      <label htmlFor="enq-company" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Organization / Hospital
                      </label>
                      <input
                        id="enq-company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                        placeholder="Institution or Company Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enq-product" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Related Product (Optional)
                      </label>
                      <select
                        id="enq-product"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        <option value="">General Corporate / Non-Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="enq-subject" className="block text-xs font-medium text-slate-700 mb-1.5">
                        Subject *
                      </label>
                      <input
                        id="enq-subject"
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                        placeholder="Formulary specification request"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="enq-message" className="block text-xs font-medium text-slate-700 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      id="enq-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                      placeholder="Please include details of your enquiry, requested dosage strengths, or institutional needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 rounded-md transition-colors"
                  >
                    {submitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
