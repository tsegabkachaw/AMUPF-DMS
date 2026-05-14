import { api } from '../api.js';
import { formatDateTime, formatDate, emptyState, toast } from '../utils.js';

export async function render(container, { user }) {
  const canCreate = ['president', 'executive'].includes(user?.role);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Events</h1><p>Peace Forum events and activities</p></div>
      ${canCreate ? `<button class="btn btn-primary" id="create-event-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Create Event
      </button>` : ''}
    </div>

    ${canCreate ? `
    <div id="event-form-wrap" class="hidden" style="margin-bottom:24px">
      <div class="card" style="max-width:700px">
        <div class="card-header">
          <div class="card-title">Create New Event</div>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('event-form-wrap').classList.add('hidden')">✕</button>
        </div>
        <div class="card-body">
          <form id="event-form">
            <div class="form-group"><label class="form-label">Title *</label><input type="text" class="form-input" id="ev-title" required /></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="ev-desc" rows="3"></textarea></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Start Date/Time *</label><input type="datetime-local" class="form-input" id="ev-start" required /></div>
              <div class="form-group"><label class="form-label">End Date/Time *</label><input type="datetime-local" class="form-input" id="ev-end" required /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Location</label><input type="text" class="form-input" id="ev-location" placeholder="Room/Building" /></div>
              <div class="form-group"><label class="form-label">Capacity</label><input type="number" class="form-input" id="ev-capacity" placeholder="Max attendees (0 = unlimited)" min="0" /></div>
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:500">
                <input type="checkbox" id="ev-mandatory" style="width:16px;height:16px;accent-color:var(--primary)" />
                Mark as mandatory for members
              </label>
            </div>
            <div class="form-error hidden" id="ev-error"></div>
            <div style="display:flex;gap:10px">
              <button type="submit" class="btn btn-primary" id="ev-submit">Create Event</button>
              <button type="button" class="btn btn-outline" onclick="document.getElementById('event-form-wrap').classList.add('hidden')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>` : ''}

    <div id="events-list"><div class="spinner-wrap"><div class="spinner"></div></div></div>
  `;

  async function load() {
    const list = document.getElementById('events-list');
    list.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
    try {
      const events = await api.events();
      if (!events.length) { list.innerHTML = emptyState('No events scheduled'); return; }

      const now = new Date();
      const upcoming = events.filter(e => new Date(e.start_date) >= now);
      const past = events.filter(e => new Date(e.start_date) < now);

      function renderEvent(ev) {
        const isUpcoming = new Date(ev.start_date) >= now;
        return `
          <div class="card" style="margin-bottom:16px">
            <div class="card-header">
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                  <h3 style="font-size:.97rem;font-weight:700">${ev.title}</h3>
                  ${ev.is_mandatory ? '<span class="badge badge-urgent">mandatory</span>' : ''}
                  ${isUpcoming ? '<span class="badge badge-resolved">upcoming</span>' : '<span class="badge badge-gray">past</span>'}
                </div>
                <div style="font-size:.78rem;color:var(--text-muted)">
                  📅 ${formatDateTime(ev.start_date)} — ${formatDateTime(ev.end_date)}
                  ${ev.location ? ` &bull; 📍 ${ev.location}` : ''}
                  ${ev.capacity ? ` &bull; 👥 Max ${ev.capacity}` : ''}
                </div>
              </div>
              ${isUpcoming ? `<button class="btn btn-primary btn-sm" onclick="registerEvent('${ev.id}', this)">Register</button>` : ''}
            </div>
            ${ev.description ? `<div class="card-body" style="padding-top:8px"><p style="font-size:.88rem;color:var(--text-muted);line-height:1.6">${ev.description}</p></div>` : ''}
          </div>`;
      }

      list.innerHTML = `
        ${upcoming.length ? `<div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:12px">Upcoming</div>
          ${upcoming.map(renderEvent).join('')}` : ''}
        ${past.length ? `<div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin:20px 0 12px">Past Events</div>
          ${past.map(renderEvent).join('')}` : ''}
      `;
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><p style="color:#EF4444">${err.message}</p></div>`;
    }
  }

  document.getElementById('create-event-btn')?.addEventListener('click', () => {
    document.getElementById('event-form-wrap').classList.toggle('hidden');
  });

  document.getElementById('event-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('ev-submit');
    const errEl = document.getElementById('ev-error');
    btn.disabled = true; errEl.classList.add('hidden');
    const cap = document.getElementById('ev-capacity').value;
    try {
      await api.createEvent({
        title: document.getElementById('ev-title').value.trim(),
        description: document.getElementById('ev-desc').value.trim() || null,
        start_date: document.getElementById('ev-start').value,
        end_date: document.getElementById('ev-end').value,
        location: document.getElementById('ev-location').value.trim() || null,
        capacity: cap ? parseInt(cap) : null,
        is_mandatory: document.getElementById('ev-mandatory').checked,
      });
      toast('Event created', 'success');
      document.getElementById('event-form-wrap').classList.add('hidden');
      document.getElementById('event-form').reset();
      load();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.remove('hidden');
    }
    btn.disabled = false;
  });

  window.registerEvent = async (id, btn) => {
    btn.disabled = true;
    try {
      await api.registerEvent(id);
      toast('Registered for event!', 'success');
      btn.textContent = 'Registered ✓';
      btn.classList.replace('btn-primary', 'btn-success');
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  };

  load();
}
