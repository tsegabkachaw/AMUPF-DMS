import { api } from '../api.js';
import { formatDate, emptyState, toast, confirm } from '../utils.js';

export async function render(container, { user }) {
  const canPost = ['president', 'executive'].includes(user?.role);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Announcements</h1><p>Official communications from the Peace Forum</p></div>
      ${canPost ? `<button class="btn btn-primary" id="post-ann-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Post Announcement
      </button>` : ''}
    </div>

    <!-- Post form -->
    ${canPost ? `
    <div id="ann-form-wrap" class="hidden" style="margin-bottom:24px">
      <div class="card" style="max-width:700px">
        <div class="card-header">
          <div class="card-title">New Announcement</div>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('ann-form-wrap').classList.add('hidden')">✕</button>
        </div>
        <div class="card-body">
          <form id="ann-form">
            <div class="form-group"><label class="form-label">Title *</label><input type="text" class="form-input" id="a-title" required /></div>
            <div class="form-group"><label class="form-label">Content *</label><textarea class="form-textarea" id="a-content" rows="5" required style="min-height:120px"></textarea></div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Type</label>
                <select class="form-select" id="a-type">
                  <option value="public">Public</option>
                  <option value="members_only">Members Only</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Expires At (optional)</label>
                <input type="date" class="form-input" id="a-expires" />
              </div>
            </div>
            <div class="form-error hidden" id="a-error"></div>
            <div style="display:flex;gap:10px">
              <button type="submit" class="btn btn-primary" id="a-submit">Post</button>
              <button type="button" class="btn btn-outline" onclick="document.getElementById('ann-form-wrap').classList.add('hidden')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>` : ''}

    <div id="ann-list"><div class="spinner-wrap"><div class="spinner"></div></div></div>
  `;

  async function load() {
    const list = document.getElementById('ann-list');
    list.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    try {
      const items = await api.announcements();
      if (!items.length) { list.innerHTML = emptyState('No announcements yet'); return; }
      list.innerHTML = items.map(a => `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                <h3 style="font-size:.97rem;font-weight:700">${a.title}</h3>
                <span class="badge ${a.announcement_type==='urgent'?'badge-urgent':'badge-public'}">${a.announcement_type?.replace('_',' ')}</span>
              </div>
              <div style="font-size:.78rem;color:var(--text-muted)">
                Posted by ${a.author_name || 'AMUPF'} &bull; ${formatDate(a.created_at)}
                ${a.expires_at ? ` &bull; Expires ${formatDate(a.expires_at)}` : ''}
              </div>
            </div>
            ${canPost ? `<button class="btn btn-danger btn-sm" onclick="deleteAnn('${a.id}')">Delete</button>` : ''}
          </div>
          <div class="card-body" style="padding-top:12px">
            <p style="font-size:.9rem;color:var(--text);line-height:1.7;white-space:pre-wrap">${a.content}</p>
          </div>
        </div>
      `).join('');
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><p style="color:#EF4444">${err.message}</p></div>`;
    }
  }

  document.getElementById('post-ann-btn')?.addEventListener('click', () => {
    document.getElementById('ann-form-wrap').classList.toggle('hidden');
  });

  document.getElementById('ann-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('a-submit');
    const errEl = document.getElementById('a-error');
    btn.disabled = true; errEl.classList.add('hidden');
    try {
      const exp = document.getElementById('a-expires').value;
      await api.createAnnouncement({
        title: document.getElementById('a-title').value.trim(),
        content: document.getElementById('a-content').value.trim(),
        announcement_type: document.getElementById('a-type').value,
        expires_at: exp || null,
      });
      toast('Announcement posted', 'success');
      document.getElementById('ann-form-wrap').classList.add('hidden');
      document.getElementById('ann-form').reset();
      load();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.remove('hidden');
    }
    btn.disabled = false;
  });

  window.deleteAnn = id => {
    confirm('Delete Announcement', 'Remove this announcement permanently?', async () => {
      try { await api.deleteAnnouncement(id); toast('Deleted', 'success'); load(); }
      catch (err) { toast(err.message, 'error'); }
    });
  };

  load();
}
