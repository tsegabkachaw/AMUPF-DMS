import { api } from '../api.js';
import { statusBadge, priorityBadge, formatDate, timeAgo, emptyState, spinner } from '../utils.js';

export async function render(container, { user }) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Incident Reports</h1>
        <p>View and manage campus incident reports</p>
      </div>
      ${['student','member'].includes(user?.role) ? `<button class="btn btn-primary" onclick="navigate('/reports/new')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Report
      </button>` : ''}
    </div>

    <div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:12px">
        <div class="filters-bar" style="margin:0;flex:1">
          <input type="text" class="form-input search-input" id="r-search" placeholder="Search reports..." style="max-width:260px" />
          <select class="form-select filter-select" id="r-status">
            <option value="">All Status</option>
            <option>pending</option><option>in_progress</option><option>on_hold</option>
            <option>resolved</option><option>rejected</option><option>escalated</option>
          </select>
          <select class="form-select filter-select" id="r-priority">
            <option value="">All Priority</option>
            <option>low</option><option>medium</option><option>high</option><option>urgent</option>
          </select>
          <select class="form-select filter-select" id="r-type">
            <option value="">All Types</option>
            <option value="physical_conflict">Physical Conflict</option>
            <option value="verbal_abuse">Verbal Abuse</option>
            <option value="theft">Theft</option>
            <option value="harassment">Harassment</option>
            <option value="vandalism">Vandalism</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button class="btn btn-outline btn-sm" id="r-filter-btn">Filter</button>
      </div>
      <div id="reports-table-wrap">
        <div class="spinner-wrap"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  await loadReports(user);

  document.getElementById('r-filter-btn').onclick = () => loadReports(user);
  document.getElementById('r-search').addEventListener('keydown', e => { if (e.key === 'Enter') loadReports(user); });
}

async function loadReports(user) {
  const wrap = document.getElementById('reports-table-wrap');
  wrap.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  const params = {};
  const search = document.getElementById('r-search')?.value.trim();
  const status = document.getElementById('r-status')?.value;
  const priority = document.getElementById('r-priority')?.value;
  const type = document.getElementById('r-type')?.value;

  if (search) params.search = search;
  if (status) params.status = status;
  if (priority) params.priority = priority;
  if (type) params.incident_type = type;

  try {
    const reports = await api.reports(params);
    if (!reports.length) { wrap.innerHTML = emptyState('No reports found', 'Try adjusting filters'); return; }

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td>
                  <div style="font-weight:600;font-size:.88rem">${r.title}</div>
                  <div style="font-size:.76rem;color:var(--text-muted)">${r.location || ''}</div>
                </td>
                <td><span class="badge badge-gray">${(r.incident_type||'').replace(/_/g,' ')}</span></td>
                <td>${priorityBadge(r.priority)}</td>
                <td>${statusBadge(r.status)}</td>
                <td style="font-size:.84rem">${r.reporter_name || (r.is_anonymous ? 'Anonymous' : '—')}</td>
                <td style="font-size:.82rem;color:var(--text-muted)">${timeAgo(r.created_at)}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="navigate('/reports/${r.id}')">View</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state" style="padding:32px"><p style="color:#EF4444">${err.message}</p></div>`;
  }
}
