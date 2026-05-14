import { api } from '../api.js';
import { statusBadge, priorityBadge, formatDate, formatDateTime, toast, confirm } from '../utils.js';

export async function render(container, { user, params }) {
  container.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  let report;
  try {
    report = await api.report(params.id);
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="padding:60px"><h3>Report not found</h3><p>${err.message}</p><button class="btn btn-outline btn-sm" onclick="navigate('/reports')" style="margin-top:16px">Back</button></div>`;
    return;
  }

  const canManage = ['executive', 'president', 'higher_official'].includes(user?.role);
  const isReporter = report.reporter_id === user?.user_id;

  function renderPage() {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1 style="font-size:1.2rem">${report.title}</h1>
          <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
            ${statusBadge(report.status)}
            ${priorityBadge(report.priority)}
            <span class="badge badge-gray">${(report.incident_type||'').replace(/_/g,' ')}</span>
            ${report.is_anonymous ? '<span class="badge badge-gray">anonymous</span>' : ''}
          </div>
        </div>
        <button class="btn btn-outline" onclick="navigate('/reports')">Back</button>
      </div>

      <div class="detail-grid">
        <!-- Main info -->
        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-header"><div class="card-title">Incident Details</div></div>
            <div class="card-body">
              <div class="detail-field">
                <div class="detail-field-label">Description</div>
                <div class="detail-field-value" style="line-height:1.7">${report.description || '—'}</div>
              </div>
              <div class="form-row" style="margin-top:16px">
                <div class="detail-field">
                  <div class="detail-field-label">Location</div>
                  <div class="detail-field-value">${report.location || '—'}</div>
                </div>
                <div class="detail-field">
                  <div class="detail-field-label">Incident Date</div>
                  <div class="detail-field-value">${formatDateTime(report.incident_date)}</div>
                </div>
              </div>
              ${report.witnesses ? `<div class="detail-field" style="margin-top:16px">
                <div class="detail-field-label">Witnesses</div>
                <div class="detail-field-value">${report.witnesses}</div>
              </div>` : ''}
            </div>
          </div>

          ${canManage ? `
          <!-- Status Update -->
          <div class="card">
            <div class="card-header"><div class="card-title">Update Status</div></div>
            <div class="card-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="new-status">
                    <option value="pending" ${report.status==='pending'?'selected':''}>Pending</option>
                    <option value="in_progress" ${report.status==='in_progress'?'selected':''}>In Progress</option>
                    <option value="on_hold" ${report.status==='on_hold'?'selected':''}>On Hold</option>
                    <option value="resolved" ${report.status==='resolved'?'selected':''}>Resolved</option>
                    <option value="rejected" ${report.status==='rejected'?'selected':''}>Rejected</option>
                    <option value="escalated" ${report.status==='escalated'?'selected':''}>Escalated</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select class="form-select" id="new-priority">
                    <option value="low" ${report.priority==='low'?'selected':''}>Low</option>
                    <option value="medium" ${report.priority==='medium'?'selected':''}>Medium</option>
                    <option value="high" ${report.priority==='high'?'selected':''}>High</option>
                    <option value="urgent" ${report.priority==='urgent'?'selected':''}>Urgent</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Internal Notes</label>
                <textarea class="form-textarea" id="new-notes" rows="3" placeholder="Case handling notes...">${report.resolution_notes || ''}</textarea>
              </div>
              <button class="btn btn-primary" id="update-status-btn">Update Status</button>
            </div>
          </div>` : ''}

          ${isReporter ? `
          <!-- Feedback -->
          <div class="card">
            <div class="card-header"><div class="card-title">Submit Feedback</div></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Satisfaction Rating</label>
                <select class="form-select" id="feedback-rating">
                  <option value="1">1 — Very Unsatisfied</option>
                  <option value="2">2 — Unsatisfied</option>
                  <option value="3" selected>3 — Neutral</option>
                  <option value="4">4 — Satisfied</option>
                  <option value="5">5 — Very Satisfied</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Comment</label>
                <textarea class="form-textarea" id="feedback-comment" rows="3" placeholder="How was the handling of your report?"></textarea>
              </div>
              <button class="btn btn-primary btn-sm" id="feedback-btn">Submit Feedback</button>
            </div>
          </div>` : ''}
        </div>

        <!-- Sidebar info -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-header"><div class="card-title">Report Info</div></div>
            <div style="padding:4px 20px 16px">
              <div class="info-row"><span class="info-label">Reporter</span><span class="info-value">${report.is_anonymous ? 'Anonymous' : (report.reporter_name || '—')}</span></div>
              <div class="info-row"><span class="info-label">Assigned To</span><span class="info-value">${report.assigned_to_name || 'Unassigned'}</span></div>
              <div class="info-row"><span class="info-label">Department</span><span class="info-value">${report.department_name || '—'}</span></div>
              <div class="info-row"><span class="info-label">Submitted</span><span class="info-value">${formatDate(report.created_at)}</span></div>
              <div class="info-row"><span class="info-label">Last Updated</span><span class="info-value">${formatDate(report.updated_at)}</span></div>
            </div>
          </div>

          ${report.resolution_notes ? `<div class="card">
            <div class="card-header"><div class="card-title">Resolution Notes</div></div>
            <div class="card-body">
              <p style="font-size:.87rem;color:var(--text-muted);line-height:1.6">${report.resolution_notes}</p>
            </div>
          </div>` : ''}

          ${report.feedback_rating ? `<div class="card">
            <div class="card-header"><div class="card-title">Feedback Received</div></div>
            <div class="card-body">
              <div class="info-row"><span class="info-label">Rating</span><span class="info-value">⭐ ${report.feedback_rating}/5</span></div>
              ${report.feedback_comment ? `<p style="margin-top:8px;font-size:.87rem;color:var(--text-muted)">${report.feedback_comment}</p>` : ''}
            </div>
          </div>` : ''}
        </div>
      </div>
    `;

    // Bind events
    if (canManage) {
      document.getElementById('update-status-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('update-status-btn');
        btn.disabled = true;
        try {
          report = await api.updateReportStatus(report.id, {
            status: document.getElementById('new-status').value,
            priority: document.getElementById('new-priority').value,
            resolution_notes: document.getElementById('new-notes').value.trim() || null,
          });
          toast('Report updated', 'success');
          renderPage();
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
        }
      });
    }

    if (isReporter) {
      document.getElementById('feedback-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('feedback-btn');
        btn.disabled = true;
        try {
          await api.submitFeedback(report.id, {
            rating: parseInt(document.getElementById('feedback-rating').value),
            comment: document.getElementById('feedback-comment').value.trim(),
          });
          toast('Feedback submitted', 'success');
          report = await api.report(params.id);
          renderPage();
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
        }
      });
    }
  }

  renderPage();
}
