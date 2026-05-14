import { api } from '../api.js';
import { toast, formatDate, roleBadge } from '../utils.js';

export async function render(container, { user }) {
  let profile = user;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Settings</h1><p>Manage your account and preferences</p></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:900px">
      <!-- Profile Card -->
      <div class="card">
        <div class="card-header"><div class="card-title">Profile Information</div></div>
        <div class="card-body">
          <div style="text-align:center;margin-bottom:20px">
            <div class="avatar avatar-lg" style="width:64px;height:64px;font-size:1.4rem;margin:0 auto 12px;background:var(--primary-bg);color:var(--primary)">
              ${(profile?.full_name||'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
            </div>
            <div style="font-weight:700">${profile?.full_name || '—'}</div>
            <div style="font-size:.82rem;color:var(--text-muted);margin-top:2px">${profile?.email || '—'}</div>
            <div style="margin-top:8px">${roleBadge(profile?.role)}</div>
          </div>
          <div class="divider"></div>
          <div class="info-row"><span class="info-label">Student ID</span><span class="info-value">${profile?.student_id || '—'}</span></div>
          <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${profile?.phone || '—'}</span></div>
          <div class="info-row"><span class="info-label">Department</span><span class="info-value">${profile?.department_name || '—'}</span></div>
          <div class="info-row"><span class="info-label">Member Since</span><span class="info-value">${formatDate(profile?.created_at)}</span></div>
          <div class="info-row"><span class="info-label">Account Status</span><span class="info-value">
            <span class="badge ${profile?.is_approved ? 'badge-resolved' : 'badge-pending'}">${profile?.is_approved ? 'Approved' : 'Pending'}</span>
          </span></div>
        </div>
      </div>

      <!-- Change Password -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card">
          <div class="card-header"><div class="card-title">Change Password</div></div>
          <div class="card-body">
            <form id="pwd-form">
              <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" class="form-input" id="pwd-current" placeholder="••••••••" required />
              </div>
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" class="form-input" id="pwd-new" placeholder="Min. 8 characters" required minlength="8" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-input" id="pwd-confirm" placeholder="Repeat new password" required />
              </div>
              <div class="form-error hidden" id="pwd-error"></div>
              <button type="submit" class="btn btn-primary" id="pwd-btn">Update Password</button>
            </form>
          </div>
        </div>

        <!-- Update Profile -->
        <div class="card">
          <div class="card-header"><div class="card-title">Update Profile</div></div>
          <div class="card-body">
            <form id="profile-form">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="p-name" value="${profile?.full_name || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" class="form-input" id="p-phone" value="${profile?.phone || ''}" />
              </div>
              <div class="form-error hidden" id="p-error"></div>
              <button type="submit" class="btn btn-primary" id="p-btn">Save Changes</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone (admin only) -->
    ${['president','executive'].includes(user?.role) ? `
    <div class="card" style="margin-top:20px;max-width:900px;border-color:#FECACA">
      <div class="card-header" style="background:#FEF2F2;border-radius:12px 12px 0 0">
        <div class="card-title" style="color:#DC2626">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Admin Zone
        </div>
      </div>
      <div class="card-body">
        <p style="font-size:.87rem;color:var(--text-muted);margin-bottom:16px">Advanced options for administrators. Actions here are irreversible.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="navigate('/kyc-queue')">KYC Queue</button>
          <button class="btn btn-outline btn-sm" onclick="navigate('/analytics')">View Analytics</button>
          ${user?.role === 'president' ? `<button class="btn btn-outline btn-sm" onclick="navigate('/delegations')">Delegations</button>` : ''}
        </div>
      </div>
    </div>` : ''}
  `;

  document.getElementById('pwd-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('pwd-btn');
    const errEl = document.getElementById('pwd-error');
    const newPwd = document.getElementById('pwd-new').value;
    const confirm = document.getElementById('pwd-confirm').value;
    errEl.classList.add('hidden');

    if (newPwd !== confirm) {
      errEl.textContent = 'Passwords do not match';
      errEl.classList.remove('hidden');
      return;
    }
    btn.disabled = true;
    try {
      await api.patch('/auth/change-password', {
        current_password: document.getElementById('pwd-current').value,
        new_password: newPwd,
      });
      toast('Password updated successfully', 'success');
      document.getElementById('pwd-form').reset();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
    btn.disabled = false;
  });

  document.getElementById('profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('p-btn');
    const errEl = document.getElementById('p-error');
    btn.disabled = true; errEl.classList.add('hidden');
    try {
      await api.updateUser(user.user_id, {
        full_name: document.getElementById('p-name').value.trim(),
        phone: document.getElementById('p-phone').value.trim(),
      });
      toast('Profile updated', 'success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
    btn.disabled = false;
  });
}
