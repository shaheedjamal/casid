import React, { useEffect, useState } from 'react';
import { Plus, UserCheck, X } from 'lucide-react';
import { api, extractApiError } from '../../services/api';
import { StatusText } from '../../components/StatusText';
import type { User, UserRole } from '../../types';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load administrators.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await api.post('/admin/users', { name: name.trim(), email: email.trim(), password, role });
      setNotice(`Created ${role === 'super_admin' ? 'Super Admin' : 'Editor'} account for ${email}.`);
      setModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      await loadUsers();
    } catch (err) {
      setError(extractApiError(err, 'Failed to create user.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: User) {
    setError('');
    setNotice('');
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/users/${u.id}`, { status: nextStatus });
      setNotice(`Updated ${u.email} to ${nextStatus}.`);
      await loadUsers();
    } catch (err) {
      setError(extractApiError(err, 'Unable to update user status.'));
    }
  }

  async function changeRole(u: User, nextRole: UserRole) {
    setError('');
    setNotice('');
    try {
      await api.put(`/admin/users/${u.id}`, { role: nextRole });
      setNotice(`Updated role for ${u.email} to ${nextRole}.`);
      await loadUsers();
    } catch (err) {
      setError(extractApiError(err, 'Unable to update user role.'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">User &amp; Role Management</h1>
          <p className="text-sm text-slate-600">
            Manage Super Admin and Content Editor accounts with strict role-based access control.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Administrator</span>
        </button>
      </div>

      {error && <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-md">{error}</div>}
      {notice && (
        <div className="p-3.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">{notice}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-5 py-3">Administrator</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Login</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as UserRole)}
                      aria-label={`Role for ${u.email}`}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusText status={u.status} />
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                    {u.last_login_at
                      ? new Date(u.last_login_at + (u.last_login_at.endsWith('Z') ? '' : 'Z')).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u)}
                      className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-800" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-slate-900">Create Admin Account</h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Strong Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, upper, lower, number, symbol"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md"
                >
                  <option value="editor">Editor (Manage Content &amp; Submit for Approval)</option>
                  <option value="super_admin">Super Admin (Full System Authority)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-md"
                >
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
