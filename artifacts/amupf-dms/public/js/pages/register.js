import { api } from '../api.js';
import { toast } from '../utils.js';

export async function render(container) {
  let departments = [];
  try { departments = await api.departments(); } catch {}

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card auth-card-wide">
        <div class="auth-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h2 class="auth-title">Student Registration</h2>
        <p class="auth-subtitle">Create an account to join the Arbaminch University Peace Forum</p>

        <form id="reg-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" class="form-input" id="r-name" placeholder="John Doe" required />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-input" id="r-email" placeholder="student@amu.edu.et" required autocomplete="email" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" class="form-input" id="r-password" placeholder="Min. 8 characters" required minlength="8" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label class="form-label">Student ID *</label>
              <input type="text" class="form-input" id="r-studentid" placeholder="AMU/1234/15" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="tel" class="form-input" id="r-phone" placeholder="+251912345678" required />
            </div>
            <div class="form-group">
              <label class="form-label">Department *</label>
              <select class="form-select" id="r-dept" required>
                <option value="">Select department</option>
                ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">ID Card Front (URL) *</label>
              <input type="url" class="form-input" id="r-front" placeholder="https://example.com/id-front.jpg" required />
              <div class="form-hint">Paste a link to an image of the front of your student ID</div>
            </div>
            <div class="form-group">
              <label class="form-label">ID Card Back (URL) *</label>
              <input type="url" class="form-input" id="r-back" placeholder="https://example.com/id-back.jpg" required />
              <div class="form-hint">Paste a link to an image of the back of your student ID</div>
            </div>
          </div>
          <div class="form-error hidden" id="reg-error"></div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="reg-btn" style="margin-top:8px">Complete Registration</button>
        </form>

        <div class="auth-footer">
          Already have an account? <a onclick="navigate('/login')" class="link">Sign in here</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('reg-btn');
    const errEl = document.getElementById('reg-error');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    errEl.classList.add('hidden');

    const data = {
      full_name: document.getElementById('r-name').value.trim(),
      email: document.getElementById('r-email').value.trim(),
      password: document.getElementById('r-password').value,
      student_id: document.getElementById('r-studentid').value.trim(),
      phone: document.getElementById('r-phone').value.trim(),
      department_id: parseInt(document.getElementById('r-dept').value),
      id_front_url: document.getElementById('r-front').value.trim(),
      id_back_url: document.getElementById('r-back').value.trim(),
    };

    try {
      const res = await api.register(data);
      localStorage.setItem('amupf_token', res.access_token);
      navigate('/pending-approval');
    } catch (err) {
      errEl.textContent = err.message || 'Registration failed. Please check your inputs.';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Complete Registration';
    }
  });
}
