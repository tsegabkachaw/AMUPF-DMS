import { api } from '../api.js';

export async function render(container) {
  let user = null;
  const token = localStorage.getItem('amupf_token');

  if (token) {
    try { user = await api.me(); } catch {}
  }

  container.innerHTML = `
    <div class="pending-page">
      <div class="pending-card">
        <div class="pending-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <h2>Registration Submitted</h2>
        <p style="margin-bottom:16px">Thank you${user ? ', <strong>' + user.full_name + '</strong>' : ''}! Your registration is under review.</p>
        <p>Your KYC documents have been received. A Peace Forum executive or the president will review your application and notify you once approved.</p>

        ${user?.rejection_reason ? `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px;margin-top:20px;text-align:left">
            <strong style="color:#DC2626;font-size:.85rem">Application Rejected</strong>
            <p style="font-size:.85rem;color:#7F1D1D;margin-top:4px">${user.rejection_reason}</p>
            <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="navigate('/register')">Re-apply</button>
          </div>
        ` : `
          <div style="background:var(--primary-bg);border-radius:8px;padding:14px;margin-top:20px">
            <p style="font-size:.82rem;color:var(--primary)">Status: <strong>Pending Review</strong></p>
          </div>
        `}

        <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-outline" onclick="navigate('/')">Return to Home</button>
          <button class="btn btn-ghost" onclick="handleLogout()">Sign Out</button>
        </div>
      </div>
    </div>
  `;
}

window.handleLogout = function() {
  localStorage.removeItem('amupf_token');
  navigate('/login');
};
