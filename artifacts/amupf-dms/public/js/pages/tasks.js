import { api } from '../api.js';
import { statusBadge, priorityBadge, formatDate, emptyState, toast, confirm } from '../utils.js';

export async function render(container, { user }) {
  let users = [];
  try { users = await api.users({ limit: 100 }); } catch {}

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Tasks</h1><p>Assign and track Peace Forum tasks</p></div>
      ${['president','executive'].includes(user?.role) ? `<button class="btn btn-primary" id="add-task-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Task
      </button>` : ''}
    </div>

    <div class="tabs" id="task-tabs">
      <div class="tab active" data-tab="">All Tasks</div>
      <div class="tab" data-tab="pending">Pending</div>
      <div class="tab" data-tab="in_progress">In Progress</div>
      <div class="tab" data-tab="completed">Completed</div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="filters-bar" style="margin:0">
          <input type="text" class="form-input search-input" id="t-search" placeholder="Search tasks..." style="max-width:260px" />
          <select class="form-select filter-select" id="t-priority">
            <option value="">All Priority</option>
            <option>low</option><option>medium</option><option>high</option><option>urgent</option>
          </select>
        </div>
        <button class="btn btn-outline btn-sm" id="t-filter-btn">Filter</button>
      </div>
      <div id="tasks-content"><div class="spinner-wrap"><div class="spinner"></div></div></div>
    </div>

    <!-- Task Form -->
    <div id="task-form-wrap" class="hidden" style="margin-top:24px">
      <div class="card" style="max-width:600px">
        <div class="card-header">
          <div class="card-title">New Task</div>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('task-form-wrap').classList.add('hidden')">✕</button>
        </div>
        <div class="card-body">
          <form id="task-form">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input type="text" class="form-input" id="t-title" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="t-desc" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-select" id="t-pri">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Due Date</label>
                <input type="date" class="form-input" id="t-due" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Assign To</label>
              <select class="form-select" id="t-assign">
                <option value="">Unassigned</option>
                ${users.map(u => `<option value="${u.user_id}">${u.full_name}</option>`).join('')}
              </select>
            </div>
            <div class="form-error hidden" id="t-error"></div>
            <div style="display:flex;gap:10px;margin-top:8px">
              <button type="submit" class="btn btn-primary" id="t-submit">Create Task</button>
              <button type="button" class="btn btn-outline" onclick="document.getElementById('task-form-wrap').classList.add('hidden')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  let activeStatus = '';

  async function load() {
    const content = document.getElementById('tasks-content');
    content.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    const params = {};
    const search = document.getElementById('t-search')?.value.trim();
    const priority = document.getElementById('t-priority')?.value;
    if (search) params.search = search;
    if (priority) params.priority = priority;
    if (activeStatus) params.status = activeStatus;

    try {
      const tasks = await api.tasks(params);
      if (!tasks.length) { content.innerHTML = emptyState('No tasks found'); return; }
      content.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Due Date</th>${['president','executive'].includes(user?.role)?'<th></th>':''}</tr></thead>
            <tbody>
              ${tasks.map(t => `
                <tr>
                  <td>
                    <div style="font-weight:600;font-size:.88rem">${t.title}</div>
                    ${t.description ? `<div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">${t.description.substring(0,60)}${t.description.length>60?'…':''}</div>` : ''}
                  </td>
                  <td>${priorityBadge(t.priority)}</td>
                  <td>${statusBadge(t.status)}</td>
                  <td style="font-size:.84rem">${t.assigned_to_name || 'Unassigned'}</td>
                  <td style="font-size:.82rem;color:var(--text-muted)">${formatDate(t.due_date)}</td>
                  ${['president','executive'].includes(user?.role) ? `<td>
                    <div class="table-actions">
                      <select class="form-select" style="padding:4px 8px;font-size:.78rem;width:120px" onchange="updateTaskStatus('${t.id}', this.value)">
                        <option value="pending" ${t.status==='pending'?'selected':''}>Pending</option>
                        <option value="in_progress" ${t.status==='in_progress'?'selected':''}>In Progress</option>
                        <option value="completed" ${t.status==='completed'?'selected':''}>Completed</option>
                        <option value="cancelled" ${t.status==='cancelled'?'selected':''}>Cancelled</option>
                      </select>
                      <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}')">✕</button>
                    </div>
                  </td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="empty-state" style="padding:32px"><p style="color:#EF4444">${err.message}</p></div>`;
    }
  }

  document.getElementById('task-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab'); if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeStatus = tab.dataset.tab;
    load();
  });

  document.getElementById('t-filter-btn').onclick = load;
  document.getElementById('t-search').addEventListener('keydown', e => { if (e.key==='Enter') load(); });

  document.getElementById('add-task-btn')?.addEventListener('click', () => {
    document.getElementById('task-form-wrap').classList.toggle('hidden');
  });

  document.getElementById('task-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('t-submit');
    const errEl = document.getElementById('t-error');
    btn.disabled = true; errEl.classList.add('hidden');
    try {
      const assignVal = document.getElementById('t-assign').value;
      await api.createTask({
        title: document.getElementById('t-title').value.trim(),
        description: document.getElementById('t-desc').value.trim() || null,
        priority: document.getElementById('t-pri').value,
        due_date: document.getElementById('t-due').value || null,
        assigned_to: assignVal || null,
      });
      toast('Task created', 'success');
      document.getElementById('task-form-wrap').classList.add('hidden');
      load();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.remove('hidden');
    }
    btn.disabled = false;
  });

  window.updateTaskStatus = async (id, status) => {
    try { await api.updateTask(id, { status }); toast('Task updated', 'success'); load(); }
    catch (err) { toast(err.message, 'error'); }
  };

  window.deleteTask = id => {
    confirm('Delete Task', 'Remove this task permanently?', async () => {
      try { await api.deleteTask(id); toast('Task deleted', 'success'); load(); }
      catch (err) { toast(err.message, 'error'); }
    });
  };

  load();
}
