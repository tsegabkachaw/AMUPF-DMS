import { api } from '../api.js';
import { formatDate, formatDateTime, emptyState, toast, confirm } from '../utils.js';

export async function render(container, { user }) {
  if (user?.role !== 'president') {
    container.innerHTML = `<div class="empty-state" style="padding:80px"><h3>Access Denied</h3><p>Only the President can manage delegations.</p></div>`;
    return;
  }

  let users = [];
  try { users = (await api.users({ is_approved: 'true' })).filter(u => ['member','executive'].includes(u.role)); } catch {}

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Delegations</h1>
        <p>Delegate presidential authority temporarily</p>
      </div>
      <button class="btn btn-primary" id="add-deleg-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Delegation
      </button>
    </div>

    <!-- Form -->
    <div id="deleg-form-wrap" class="hidden" style="margin-bottom:24px">
      <div class="card" style="max-width:600px">
        <div class="card-header">
          <div class="card-title">Delegate Authority</div>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('deleg-form-wrap').classList.add('hidden')">✕</button>
        </div>
        <div class="card-body">
          <form id="deleg-form">
            <div class="form-group">
              <label class="form-label">Delegate To *</label>
              <select class="form-select" id="d-to" required>
                <option value="">Select member</option>
                ${users.map(u => `<option value="${u.user_id}">${u.full_name} (${u.role})</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Start Date *</label><input type="datetime-local" class="form-input" id="d-start" required /></div>
              <div class="form-group"><label class="form-label">End Date *</label><input type="datetime-local" class="form-input" id="d-end" required /></div>
            </div>
            <div class="form-group"><label class="form-label">Reason / Notes</label><textarea class="form-textarea" id="d-reason" rows="3" placeholder="Reason for delegation..."></textarea></div>
            <div class="form-error hidden" id="d-error"></div>
            <div style="display:flex;gap:10px;margin-top:8px">
              <button type="submit" class="btn btn-primary" id="d-submit">Delegate</button>
              <button type="button" class="btn btn-outline" onclick="document.getElementById('deleg-form-wrap').classList.add('hidden')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="card">
      <div id="deleg-list"><div class="spinner-wrap"><div class="spinner"></div></div></div>
    </div>
  `;

  async function load() {
    const list = document.getElementById('deleg-list');
    list.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    try {
      const delegs = await api.delegations();
      if (!delegs.length) { list.innerHTML = emptyState('No delegations yet'); return; }
      list.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Delegated To</th><th>Period</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${delegs.map(d => {
                const now = new Date();
                const start = new Date(d.start_date);
                const end = new Date(d.end_date);
                const isActive = !d.is_revoked && start <= now && end >= now;
                return `
                  <tr>
                    <td style="font-weight:600">${d.delegate_name || '—'}</td>
                    <td style="font-size:.83rem;color:var(--text-muted)">${formatDate(d.start_date)} — ${formatDate(d.end_date)}</td>
                    <td style="font-size:.83rem;max-width:200px">${d.notes || '—'}</td>
                    <td>
                      ${d.is_revoked ? '<span class="badge badge-rejected">revoked</span>' : isActive ? '<span class="badge badge-resolved">active</span>' : '<span class="badge badge-gray">scheduled</span>'}
                    </td>
                    <td>
                      ${!d.is_revoked ? `<button class="btn btn-danger btn-sm" onclick="revokeDeleg('${d.id}')">Revoke</button>` : ''}
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><p style="color:#EF4444">${err.message}</p></div>`;
    }
  }

  document.getElementById('add-deleg-btn').addEventListener('click', () => {
    document.getElementById('deleg-form-wrap').classList.toggle('hidden');
    const now = new Date();
    document.getElementById('d-start').value = now.toISOString().slice(0,16);
  });

  document.getElementById('deleg-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('d-submit');
    const errEl = document.getElementById('d-error');
    btn.disabled = true; errEl.classList.add('hidden');
    try {
      await api.createDelegation({
        delegate_to: document.getElementById('d-to').value,
        start_date: document.getElementById('d-start').value,
        end_date: document.getElementById('d-end').value,
        notes: document.getElementById('d-reason').value.trim() || null,
      });
      toast('Delegation created', 'success');
      document.getElementById('deleg-form-wrap').classList.add('hidden');
      document.getElementById('deleg-form').reset();
      load();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.remove('hidden');
    }
    btn.disabled = false;
  });

  window.revokeDeleg = id => {
    confirm('Revoke Delegation', 'Are you sure you want to revoke this delegation? The delegate will immediately lose access.', async () => {
      try { await api.revokeDelegation(id); toast('Delegation revoked', 'success'); load(); }
      catch (err) { toast(err.message, 'error'); }
    });
  };

  load();
}
