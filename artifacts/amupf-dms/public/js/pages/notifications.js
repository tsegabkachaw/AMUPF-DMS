import { api } from '../api.js';
import { timeAgo, emptyState, toast } from '../utils.js';

export async function render(container, { user }) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Notifications</h1><p>Your activity feed</p></div>
      <button class="btn btn-outline" id="mark-all-btn">Mark all as read</button>
    </div>
    <div class="card">
      <div id="notif-list"><div class="spinner-wrap"><div class="spinner"></div></div></div>
    </div>
  `;

  async function load() {
    const list = document.getElementById('notif-list');
    list.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    try {
      const notifs = await api.notifications();
      if (!notifs.length) { list.innerHTML = emptyState('No notifications yet', 'You are all caught up!'); return; }
      list.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="readNotif('${n.id}', this)">
          <div class="notif-dot ${n.is_read ? 'hidden' : ''}"></div>
          <div class="notif-content-text">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message || ''}</div>
            <div class="notif-time">${timeAgo(n.created_at)}</div>
          </div>
          ${n.link ? `<button class="btn btn-ghost btn-sm" onclick="navigate('${n.link}');event.stopPropagation()">View</button>` : ''}
        </div>
      `).join('');
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><p style="color:#EF4444">${err.message}</p></div>`;
    }
  }

  document.getElementById('mark-all-btn').addEventListener('click', async () => {
    try {
      await api.markAllRead();
      toast('All marked as read', 'success');
      load();
      // Update badge
      const badge = document.getElementById('notif-badge');
      if (badge) { badge.textContent = '0'; badge.classList.add('hidden'); }
    } catch (err) { toast(err.message, 'error'); }
  });

  window.readNotif = async (id, el) => {
    if (!el.classList.contains('unread')) return;
    try {
      await api.markRead(id);
      el.classList.remove('unread');
      el.querySelector('.notif-dot')?.classList.add('hidden');
    } catch {}
  };

  load();
}
