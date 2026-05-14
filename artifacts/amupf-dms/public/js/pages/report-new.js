import { api } from '../api.js';
import { toast } from '../utils.js';

export async function render(container, { user }) {
  let departments = [];
  try { departments = await api.departments(); } catch {}

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1>Submit Incident Report</h1>
        <p>Report a campus incident to the Peace Forum</p>
      </div>
      <button class="btn btn-outline" onclick="navigate('/reports')">Back to Reports</button>
    </div>

    <div class="card" style="max-width:720px">
      <div class="card-header">
        <div class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Incident Details
        </div>
      </div>
      <div class="card-body">
        <form id="report-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="rn-title" placeholder="Brief description of the incident" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Incident Type *</label>
              <select class="form-select" id="rn-type" required>
                <option value="">Select type</option>
                <option value="physical_conflict">Physical Conflict</option>
                <option value="verbal_abuse">Verbal Abuse</option>
                <option value="theft">Theft</option>
                <option value="harassment">Harassment</option>
                <option value="vandalism">Vandalism</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority *</label>
              <select class="form-select" id="rn-priority" required>
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" class="form-input" id="rn-location" placeholder="Building, room, or area" />
            </div>
            <div class="form-group">
              <label class="form-label">Department</label>
              <select class="form-select" id="rn-dept">
                <option value="">Select (optional)</option>
                ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Incident Date & Time</label>
            <input type="datetime-local" class="form-input" id="rn-date" />
          </div>
          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea class="form-textarea" id="rn-desc" rows="5" placeholder="Describe what happened in detail, including who was involved and what you witnessed..." required style="min-height:120px"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Witnesses (optional)</label>
            <input type="text" class="form-input" id="rn-witnesses" placeholder="Names of witnesses, if any" />
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:500">
              <input type="checkbox" id="rn-anonymous" style="width:16px;height:16px;accent-color:var(--primary)" />
              Submit anonymously
            </label>
            <div class="form-hint">Your identity will not be visible to case handlers</div>
          </div>

          <div class="form-error hidden" id="rn-error"></div>
          <div style="display:flex;gap:12px;margin-top:8px">
            <button type="submit" class="btn btn-primary" id="rn-btn">Submit Report</button>
            <button type="button" class="btn btn-outline" onclick="navigate('/reports')">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('rn-btn');
    const errEl = document.getElementById('rn-error');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    errEl.classList.add('hidden');

    const deptVal = document.getElementById('rn-dept').value;
    const dateVal = document.getElementById('rn-date').value;
    const data = {
      title: document.getElementById('rn-title').value.trim(),
      incident_type: document.getElementById('rn-type').value,
      priority: document.getElementById('rn-priority').value,
      description: document.getElementById('rn-desc').value.trim(),
      location: document.getElementById('rn-location').value.trim() || null,
      is_anonymous: document.getElementById('rn-anonymous').checked,
      witnesses: document.getElementById('rn-witnesses').value.trim() || null,
    };
    if (deptVal) data.department_id = parseInt(deptVal);
    if (dateVal) data.incident_date = dateVal;

    try {
      const rep = await api.createReport(data);
      toast('Report submitted successfully', 'success');
      navigate(`/reports/${rep.id}`);
    } catch (err) {
      errEl.textContent = err.message || 'Failed to submit report';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Submit Report';
    }
  });
}
