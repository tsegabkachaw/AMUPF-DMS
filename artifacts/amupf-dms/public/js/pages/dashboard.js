import { api } from '../api.js';
import { formatDate, statusBadge, timeAgo } from '../utils.js';

export async function render(container, { user }) {
  container.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  let stats = {}, reports = [], tasks = [], announcements = [];
  try { stats = await api.dashboardStats(); } catch {}
  try { reports = (await api.reports({ limit: 5 })).slice(0, 5); } catch {}
  try { tasks = (await api.tasks({ limit: 5 })).slice(0, 5); } catch {}
  try { announcements = (await api.announcements({ limit: 3 })).slice(0, 3); } catch {}

  const role = user?.role || 'student';

  const statCards = buildStatCards(stats, role);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Welcome back, ${user?.full_name?.split(' ')[0] || 'User'}</h1>
        <p>${getRoleGreeting(role)}</p>
      </div>
      ${role === 'student' || role === 'member' ? `<button class="btn btn-primary" onclick="navigate('/reports/new')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Submit Report
      </button>` : ''}
    </div>

    <div class="stats-grid">${statCards}</div>

    <div style="display:grid;grid-template-columns:${role==='student'?'1fr':'2fr 1fr'};gap:20px;flex-wrap:wrap">
      <!-- Recent Reports -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Recent Reports
          </div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('/reports')">View all</button>
        </div>
        <div class="table-wrap">
          ${reports.length > 0 ? `
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${reports.map(r => `
                <tr onclick="navigate('/reports/${r.id}')" style="cursor:pointer">
                  <td><strong style="font-size:.85rem">${r.title}</strong></td>
                  <td><span class="badge badge-gray">${r.incident_type?.replace(/_/g,' ')}</span></td>
                  <td>${statusBadge(r.status)}</td>
                  <td style="color:var(--text-muted);font-size:.82rem">${timeAgo(r.created_at)}</td>
                </tr>`).join('')}
            </tbody>
          </table>` : `<div class="empty-state" style="padding:32px">
            <p>No reports yet. <span class="link" onclick="navigate('/reports/new')">Submit one</span></p>
          </div>`}
        </div>
      </div>

      ${role !== 'student' ? `
      <!-- Tasks & Announcements column -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card">
          <div class="card-header">
            <div class="card-title">My Tasks</div>
            <button class="btn btn-ghost btn-sm" onclick="navigate('/tasks')">All</button>
          </div>
          <div style="padding:0 20px">
            ${tasks.length > 0 ? tasks.map(t => `
              <div class="info-row">
                <div>
                  <div style="font-size:.86rem;font-weight:600">${t.title}</div>
                  <div style="font-size:.76rem;color:var(--text-muted)">${t.due_date ? 'Due ' + formatDate(t.due_date) : 'No due date'}</div>
                </div>
                ${statusBadge(t.status)}
              </div>`).join('') : `<p style="padding:16px 0;color:var(--text-muted);font-size:.87rem">No active tasks</p>`}
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Announcements</div>
            <button class="btn btn-ghost btn-sm" onclick="navigate('/announcements')">All</button>
          </div>
          <div style="padding:0 20px">
            ${announcements.length > 0 ? announcements.map(a => `
              <div class="info-row" style="flex-direction:column;align-items:start;gap:2px">
                <div style="font-size:.87rem;font-weight:600">${a.title}</div>
                <div style="font-size:.78rem;color:var(--text-muted)">${timeAgo(a.created_at)}</div>
              </div>`).join('') : `<p style="padding:16px 0;color:var(--text-muted);font-size:.87rem">No announcements</p>`}
          </div>
        </div>
      </div>` : ''}
    </div>
  `;
}

function buildStatCards(s, role) {
  const all = [
    { label: 'Total Reports', value: s.total_reports ?? 0, sub: `${s.pending_reports ?? 0} pending`, color: '#EBF2FF', icon: fileIcon() },
    { label: 'Resolved', value: s.resolved_reports ?? 0, sub: `${s.resolution_rate ?? 0}% rate`, color: '#ECFDF5', icon: checkIcon() },
    { label: 'Members', value: s.total_members ?? 0, sub: `${s.active_members ?? 0} active`, color: '#F0FDF4', icon: usersIcon(), roles: ['executive','president','higher_official'] },
    { label: 'Pending KYC', value: s.pending_kyc ?? 0, sub: 'awaiting review', color: '#FFFBEB', icon: shieldIcon(), roles: ['executive','president'] },
    { label: 'Active Tasks', value: s.total_tasks ?? 0, sub: 'in progress', color: '#EFF6FF', icon: taskIcon(), roles: ['member','executive','president'] },
    { label: 'Upcoming Events', value: s.upcoming_events ?? 0, sub: 'scheduled', color: '#F5F3FF', icon: calIcon() },
  ];
  return all
    .filter(c => !c.roles || c.roles.includes(role))
    .map(c => `
      <div class="stat-card">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <div class="stat-label">${c.label}</div>
            <div class="stat-value">${c.value}</div>
            <div class="stat-sub">${c.sub}</div>
          </div>
          <div style="padding:10px;background:${c.color};border-radius:10px;color:var(--primary)">${c.icon}</div>
        </div>
      </div>`).join('');
}

function getRoleGreeting(role) {
  const m = { student: 'Report incidents and track your submissions', member: 'Manage tasks and monitor reports', executive: 'Oversee operations and review KYC approvals', president: 'Full system management and oversight', higher_official: 'University-level analytics and reporting' };
  return m[role] || 'Welcome to AMUPF DMS';
}

function fileIcon()  { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`; }
function checkIcon() { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`; }
function usersIcon() { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`; }
function shieldIcon(){ return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`; }
function taskIcon()  { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`; }
function calIcon()   { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`; }
