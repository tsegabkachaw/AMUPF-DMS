export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };
  el.innerHTML = (icons[type] || '') + `<span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function statusBadge(status) {
  const s = (status || '').replace(/_/g, '-');
  const label = (status || '').replace(/_/g, ' ');
  return `<span class="badge badge-${s}">${label}</span>`;
}

export function priorityBadge(priority) {
  return `<span class="badge badge-${priority}">${priority}</span>`;
}

export function roleBadge(role) {
  const map = { president: 'primary', executive: 'in_progress', member: 'resolved', student: 'gray', higher_official: 'escalated' };
  const cls = map[role] || 'gray';
  return `<span class="badge badge-${cls}">${(role || '').replace(/_/g, ' ')}</span>`;
}

export function positionBadge(pos) {
  return `<span class="badge badge-primary">${(pos || '').replace(/_/g, ' ')}</span>`;
}

export function avatar(name, size = '') {
  const initials = (name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `<div class="avatar ${size}">${initials}</div>`;
}

export function spinner() {
  return `<div class="spinner-wrap"><div class="spinner"></div></div>`;
}

export function emptyState(msg = 'No data found', sub = '', icon = '') {
  return `<div class="empty-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <h3>${msg}</h3>${sub ? `<p>${sub}</p>` : ''}
  </div>`;
}

export function confirm(title, body, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = `<p>${body}</p>`;
  document.getElementById('modal-overlay').classList.remove('hidden');
  const btn = document.getElementById('modal-confirm-btn');
  btn.onclick = () => { closeModal(); onConfirm(); };
}

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.add('hidden');
};

export function el(tag, attrs = {}, children = '') {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v);
  });
  if (typeof children === 'string') e.innerHTML = children;
  else if (Array.isArray(children)) children.forEach(c => e.appendChild(c));
  return e;
}
