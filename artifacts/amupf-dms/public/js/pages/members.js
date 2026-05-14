import { api } from '../api.js';
import { statusBadge, roleBadge, positionBadge, formatDate, timeAgo, emptyState, toast, confirm } from '../utils.js';

export async function render(container, { user }) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Members</h1>
        <p>Peace Forum membership registry</p>
      </div>
      ${['president', 'executive'].includes(user?.role) ? `<button class="btn btn-primary" id="add-member-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Member
      </button>` : ''}
    </div>

    <!-- Tabs -->
    <div class="tabs" id="member-tabs">
      <div class="tab active" data-tab="all">All Members</div>
      <div class="tab" data-tab="active">Active</div>
      <div class="tab" data-tab="inactive">Inactive</div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="filters-bar" style="margin:0;flex:1">
          <input type="text" class="form-input search-input" id="m-search" placeholder="Search members..." style="max-width:260px" />
          <select class="form-select filter-select" id="m-position">
            <option value="">All Positions</option>
            <option value="member">Member</option>
            <option value="secretary">Secretary</option>
            <option value="treasurer">Treasurer</option>
            <option value="vice_president">Vice President</option>
            <option value="department_rep">Dept. Rep</option>
          </select>
        </div>
        <button class="btn btn-outline btn-sm" id="m-filter-btn">Filter</button>
      </div>
      <div id="members-content"><div class="spinner-wrap"><div class="spinner"></div></div></div>
    </div>

    <!-- Add Member Modal Form -->
    <div id="member-form-wrap" class="hidden" style="margin-top:24px">
      <div class="card" style="max-width:600px">
        <div class="card-header">
          <div class="card-title">Add New Member</div>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('member-form-wrap').classList.add('hidden')">✕</button>
        </div>
        <div class="card-body">
          <form id="member-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Select User *</label>
                <input type="text" class="form-input" id="m-user-id" placeholder="User UUID" required />
                <div class="form-hint">Enter the user's UUID from the KYC queue</div>
              </div>
              <div class="form-group">
                <label class="form-label">Position *</label>
                <select class="form-select" id="m-pos" required>
                  <option value="member">Member</option>
                  <option value="secretary">Secretary</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="vice_president">Vice President</option>
                  <option value="department_rep">Dept. Rep</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Join Date *</label>
                <input type="date" class="form-input" id="m-join-date" required />
              </div>
              <div class="form-group">
                <label class="form-label">Expiry Date</label>
                <input type="date" class="form-input" id="m-expiry" />
              </div>
            </div>
            <div class="form-error hidden" id="m-error"></div>
            <div style="display:flex;gap:10px;margin-top:8px">
              <button type="submit" class="btn btn-primary" id="m-submit">Add Member</button>
              <button type="button" class="btn btn-outline" onclick="document.getElementById('member-form-wrap').classList.add('hidden')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  let activeTab = 'all';

  async function load() {
    const content = document.getElementById('members-content');
    content.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    const params = {};
    const search = document.getElementById('m-search')?.value.trim();
    const pos = document.getElementById('m-position')?.value;
    if (search) params.search = search;
    if (pos) params.position = pos;
    if (activeTab !== 'all') params.status = activeTab;

    try {
      const members = await api.members(params);
      if (!members.length) { content.innerHTML = emptyState('No members found'); return; }
      content.innerHTML = `
        <div class="members-grid" style="padding:20px">
          ${members.map(m => `
            <div class="member-card">
              <div class="member-card-header">
                <div class="avatar avatar-lg">${(m.user_full_name||'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
                <div class="member-card-info">
                  <h4>${m.user_full_name || '—'}</h4>
                  <p>${m.user_email || '—'}</p>
                </div>
              </div>
              <div class="member-card-meta">
                ${positionBadge(m.position)}
                <span class="badge ${m.status==='active'?'badge-resolved':'badge-cancelled'}">${m.status}</span>
              </div>
              <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:10px">
                Member since ${formatDate(m.join_date)}
                ${m.expiry_date ? ' · Expires ' + formatDate(m.expiry_date) : ''}
              </div>
              ${m.membership_id_link ? `<div style="font-size:.75rem;margin-bottom:10px;word-break:break-all;color:var(--primary)">${m.membership_id_link.substring(0,40)}...</div>` : ''}
              ${['president','executive'].includes(user?.role) ? `
              <div class="member-card-actions">
                <button class="btn btn-ghost btn-sm" onclick="toggleMemberStatus('${m.id}','${m.status}')">
                  ${m.status==='active'?'Deactivate':'Activate'}
                </button>
                <button class="btn btn-ghost btn-sm" onclick="regenLink('${m.id}')">Regen Link</button>
                <button class="btn btn-danger btn-sm" onclick="deleteMember('${m.id}')">Remove</button>
              </div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="empty-state" style="padding:32px"><p style="color:#EF4444">${err.message}</p></div>`;
    }
  }

  // Tab switching
  document.getElementById('member-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    load();
  });

  document.getElementById('m-filter-btn').onclick = load;
  document.getElementById('m-search').addEventListener('keydown', e => { if (e.key === 'Enter') load(); });

  // Add member toggle
  document.getElementById('add-member-btn')?.addEventListener('click', () => {
    document.getElementById('member-form-wrap').classList.toggle('hidden');
    document.getElementById('m-join-date').value = new Date().toISOString().split('T')[0];
  });

  // Add member form submit
  document.getElementById('member-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('m-submit');
    const errEl = document.getElementById('m-error');
    btn.disabled = true;
    errEl.classList.add('hidden');
    try {
      await api.createMember({
        user_id: document.getElementById('m-user-id').value.trim(),
        position: document.getElementById('m-pos').value,
        join_date: document.getElementById('m-join-date').value,
        expiry_date: document.getElementById('m-expiry').value || null,
      });
      toast('Member added', 'success');
      document.getElementById('member-form-wrap').classList.add('hidden');
      load();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false;
    }
    btn.disabled = false;
  });

  window.toggleMemberStatus = async (id, currentStatus) => {
    try {
      await api.updateMember(id, { status: currentStatus === 'active' ? 'inactive' : 'active' });
      toast('Member updated', 'success');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  window.regenLink = async (id) => {
    try {
      await api.regenerateLink(id);
      toast('Membership link regenerated', 'success');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  window.deleteMember = (id) => {
    confirm('Remove Member', 'Are you sure you want to remove this member? This cannot be undone.', async () => {
      try {
        await api.deleteMember(id);
        toast('Member removed', 'success');
        load();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  load();
}
