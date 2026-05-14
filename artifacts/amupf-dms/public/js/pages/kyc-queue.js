import { api } from '../api.js';
import { formatDate, emptyState, toast, confirm } from '../utils.js';

export async function render(container, { user }) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>KYC Approval Queue</h1>
        <p>Review and approve student registrations</p>
      </div>
    </div>

    <div class="tabs" id="kyc-tabs">
      <div class="tab active" data-tab="pending">Pending</div>
      <div class="tab" data-tab="approved">Approved</div>
      <div class="tab" data-tab="rejected">Rejected</div>
    </div>

    <div id="kyc-content"><div class="spinner-wrap"><div class="spinner"></div></div></div>
  `;

  let activeTab = 'pending';

  async function load() {
    const content = document.getElementById('kyc-content');
    content.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

    try {
      let users;
      if (activeTab === 'pending') {
        users = await api.kycQueue();
      } else {
        users = await api.users({ is_approved: activeTab === 'approved' ? 'true' : 'false' });
      }

      if (!users.length) {
        content.innerHTML = emptyState(activeTab === 'pending' ? 'No pending KYC reviews' : `No ${activeTab} users`);
        return;
      }

      content.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px;margin-top:4px">
          ${users.map(u => `
            <div class="card">
              <div class="card-header" style="flex-wrap:wrap;gap:12px">
                <div style="display:flex;align-items:center;gap:14px;flex:1">
                  <div class="avatar avatar-lg">${(u.full_name||'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
                  <div>
                    <div style="font-weight:700;font-size:.97rem">${u.full_name}</div>
                    <div style="font-size:.82rem;color:var(--text-muted)">${u.email}</div>
                    <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">
                      Student ID: <strong>${u.student_id || '—'}</strong> &bull; 
                      Dept: <strong>${u.department_name || '—'}</strong> &bull;
                      Phone: <strong>${u.phone || '—'}</strong> &bull;
                      Applied: ${formatDate(u.created_at)}
                    </div>
                  </div>
                </div>
                ${activeTab === 'pending' ? `
                <div style="display:flex;gap:8px">
                  <button class="btn btn-success btn-sm" onclick="approveUser('${u.user_id}', '${u.full_name}')">
                    ✓ Approve
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="rejectUser('${u.user_id}', '${u.full_name}')">
                    ✕ Reject
                  </button>
                </div>` : `
                <span class="badge ${activeTab==='approved'?'badge-resolved':'badge-rejected'}">${activeTab}</span>
                `}
              </div>
              <!-- ID Documents -->
              ${(u.id_front_url || u.id_back_url) ? `
              <div style="padding:12px 20px 16px;border-top:1px solid var(--border-light)">
                <div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:10px">ID Documents</div>
                <div style="display:flex;gap:16px;flex-wrap:wrap">
                  ${u.id_front_url ? `<div>
                    <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">Front</div>
                    <a href="${u.id_front_url}" target="_blank" class="btn btn-outline btn-sm">View Front ID</a>
                  </div>` : ''}
                  ${u.id_back_url ? `<div>
                    <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:4px">Back</div>
                    <a href="${u.id_back_url}" target="_blank" class="btn btn-outline btn-sm">View Back ID</a>
                  </div>` : ''}
                </div>
              </div>` : ''}
              ${u.rejection_reason ? `<div style="padding:10px 20px;background:#FEF2F2;border-top:1px solid #FECACA">
                <span style="font-size:.82rem;color:#DC2626"><strong>Rejection reason:</strong> ${u.rejection_reason}</span>
              </div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><p style="color:#EF4444">${err.message}</p></div>`;
    }
  }

  document.getElementById('kyc-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab'); if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    load();
  });

  window.approveUser = (id, name) => {
    confirm('Approve Registration', `Approve ${name}'s registration and grant them access to the portal?`, async () => {
      try {
        await api.approveKyc(id);
        toast(`${name} approved successfully`, 'success');
        load();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  window.rejectUser = (id, name) => {
    const reason = prompt(`Rejection reason for ${name} (required):`);
    if (!reason) return;
    confirm('Reject Registration', `Reject ${name}'s application with reason: "${reason}"?`, async () => {
      try {
        await api.rejectKyc(id, reason);
        toast(`${name} rejected`, 'info');
        load();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  load();
}
