import { api } from './api.js';
import { toast, avatar } from './utils.js';

// ── State ──────────────────────────────────────────────────────────
let currentUser = null;
let currentPath = '';

// ── Public pages (no sidebar) ──────────────────────────────────────
const PUBLIC_ROUTES = ['/', '/login', '/register', '/pending-approval'];

// ── Route table ───────────────────────────────────────────────────
const ROUTES = {
  '/':                  () => import('./pages/home.js'),
  '/login':             () => import('./pages/login.js'),
  '/register':          () => import('./pages/register.js'),
  '/pending-approval':  () => import('./pages/pending-approval.js'),
  '/dashboard':         () => import('./pages/dashboard.js'),
  '/reports':           () => import('./pages/reports.js'),
  '/reports/new':       () => import('./pages/report-new.js'),
  '/members':           () => import('./pages/members.js'),
  '/tasks':             () => import('./pages/tasks.js'),
  '/announcements':     () => import('./pages/announcements.js'),
  '/events':            () => import('./pages/events.js'),
  '/kyc-queue':         () => import('./pages/kyc-queue.js'),
  '/analytics':         () => import('./pages/analytics.js'),
  '/notifications':     () => import('./pages/notifications.js'),
  '/delegations':       () => import('./pages/delegations.js'),
  '/settings':          () => import('./pages/settings.js'),
};

// Dynamic routes (e.g. /reports/:id)
function matchRoute(path) {
  if (ROUTES[path]) return { loader: ROUTES[path], params: {} };
  if (path.match(/^\/reports\/[^/]+$/)) {
    const id = path.split('/')[2];
    return { loader: () => import('./pages/report-detail.js'), params: { id } };
  }
  return null;
}

// ── Navigation ─────────────────────────────────────────────────────
window.navigate = function(path, replace = false) {
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  render(path);
};

window.addEventListener('popstate', () => render(location.pathname));

// ── Sidebar nav config ─────────────────────────────────────────────
function getNavItems(role) {
  const all = [
    { path: '/dashboard',     label: 'Dashboard',     icon: grid_icon(),     roles: ['student','member','executive','president','higher_official'] },
    { path: '/reports',       label: 'Reports',       icon: file_icon(),     roles: ['student','member','executive','president','higher_official'] },
    { path: '/reports/new',   label: 'Submit Report', icon: plus_icon(),     roles: ['student','member'] },
    { path: '/members',       label: 'Members',       icon: users_icon(),    roles: ['member','executive','president','higher_official'] },
    { path: '/tasks',         label: 'Tasks',         icon: check_icon(),    roles: ['member','executive','president'] },
    { path: '/announcements', label: 'Announcements', icon: bell_icon(),     roles: ['student','member','executive','president','higher_official'] },
    { path: '/events',        label: 'Events',        icon: cal_icon(),      roles: ['student','member','executive','president','higher_official'] },
    { path: '/kyc-queue',     label: 'KYC Queue',     icon: shield_icon(),   roles: ['executive','president'] },
    { path: '/delegations',   label: 'Delegations',   icon: share_icon(),    roles: ['president'] },
    { path: '/analytics',     label: 'Analytics',     icon: chart_icon(),    roles: ['executive','president','higher_official'] },
    { path: '/notifications', label: 'Notifications', icon: notif_icon(),    roles: ['student','member','executive','president','higher_official'] },
    { path: '/settings',      label: 'Settings',      icon: settings_icon(), roles: ['student','member','executive','president','higher_official'] },
  ];
  return all.filter(item => item.roles.includes(role));
}

// ── Sidebar render ─────────────────────────────────────────────────
function renderSidebar() {
  if (!currentUser) return;
  const nav = document.getElementById('sidebar-nav');
  const items = getNavItems(currentUser.role);
  nav.innerHTML = items.map(item => `
    <div class="nav-item ${currentPath === item.path ? 'active' : ''}" onclick="navigate('${item.path}')">
      ${item.icon}
      <span>${item.label}</span>
    </div>
  `).join('');

  const userEl = document.getElementById('sidebar-user');
  const initials = (currentUser.full_name || 'U').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  userEl.innerHTML = `
    <div class="avatar">${initials}</div>
    <div class="sidebar-user-info">
      <div class="sidebar-user-name">${currentUser.full_name || 'User'}</div>
      <div class="sidebar-user-role">${(currentUser.role||'').replace(/_/g,' ')}</div>
    </div>
  `;

  // Topbar user
  document.getElementById('topbar-avatar').textContent = initials;
  document.getElementById('topbar-name').textContent = currentUser.full_name || 'User';
}

// ── Notification badge ─────────────────────────────────────────────
async function updateNotifBadge() {
  try {
    const notifs = await api.notifications();
    const unread = notifs.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-badge');
    if (unread > 0) { badge.textContent = unread; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  } catch {}
}

// ── Main render ────────────────────────────────────────────────────
async function render(path) {
  currentPath = path;
  const isPublic = PUBLIC_ROUTES.includes(path);
  const token = localStorage.getItem('amupf_token');

  // Auth guard
  if (!isPublic && !token) { navigate('/login', true); return; }

  // Load user if authenticated and not loaded
  if (token && !currentUser) {
    try {
      currentUser = await api.me();
    } catch {
      localStorage.removeItem('amupf_token');
      navigate('/login', true);
      return;
    }
  }

  // Shell switching
  const publicShell = document.getElementById('public-shell');
  const appShell = document.getElementById('app-shell');

  if (isPublic) {
    publicShell.classList.remove('hidden');
    appShell.classList.add('hidden');
  } else {
    publicShell.classList.add('hidden');
    appShell.classList.remove('hidden');
    renderSidebar();
    updateNotifBadge();
  }

  // Find and load page module
  const match = matchRoute(path);
  if (!match) {
    const container = isPublic
      ? document.getElementById('public-content')
      : document.getElementById('app-content');
    container.innerHTML = `<div class="empty-state" style="padding:80px"><h3>404 — Page not found</h3><p><span class="link" onclick="navigate('/dashboard')">Go to dashboard</span></p></div>`;
    return;
  }

  const container = isPublic
    ? document.getElementById('public-content')
    : document.getElementById('app-content');

  // Loading state
  container.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  try {
    const mod = await match.loader();
    await mod.render(container, { user: currentUser, params: match.params });

    // Update topbar title
    if (!isPublic) {
      const titles = {
        '/dashboard': 'Dashboard', '/reports': 'Incident Reports', '/reports/new': 'Submit Report',
        '/members': 'Members', '/tasks': 'Tasks', '/announcements': 'Announcements',
        '/events': 'Events', '/kyc-queue': 'KYC Approval Queue', '/analytics': 'Analytics',
        '/notifications': 'Notifications', '/delegations': 'Delegations', '/settings': 'Settings',
      };
      const title = titles[path] || 'AMUPF DMS';
      document.getElementById('topbar-title').textContent = title;
      document.title = `${title} — AMUPF DMS`;
    }
  } catch (err) {
    console.error('Page load error:', err);
    container.innerHTML = `<div class="empty-state" style="padding:60px"><h3>Failed to load page</h3><p>${err.message}</p></div>`;
  }
}

// ── Logout ─────────────────────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', async () => {
  try { await api.logout(); } catch {}
  currentUser = null;
  localStorage.removeItem('amupf_token');
  navigate('/login');
});

// ── Sidebar toggle (mobile) ────────────────────────────────────────
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Close sidebar on nav click (mobile)
document.getElementById('sidebar-nav').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
});

// ── Bootstrap ─────────────────────────────────────────────────────
render(location.pathname || '/');

// ── SVG icons ─────────────────────────────────────────────────────
function grid_icon()     { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`; }
function file_icon()     { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`; }
function users_icon()    { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`; }
function check_icon()    { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`; }
function bell_icon()     { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`; }
function cal_icon()      { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`; }
function shield_icon()   { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`; }
function share_icon()    { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`; }
function chart_icon()    { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`; }
function notif_icon()    { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`; }
function settings_icon() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`; }
function plus_icon()     { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`; }
