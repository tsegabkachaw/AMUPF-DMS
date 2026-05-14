import { api } from '../api.js';
import { toast } from '../utils.js';

export function render(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h2 class="auth-title">Sign in to AMUPF</h2>
        <p class="auth-subtitle">Enter your credentials to access the portal</p>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="login-email" placeholder="student@amu.edu.et" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="login-password" placeholder="••••••••" required autocomplete="current-password" />
            <div class="form-error hidden" id="login-error"></div>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-btn">Sign in</button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a onclick="navigate('/register')" class="link">Register here</a>
        </div>
        <div class="auth-footer" style="margin-top:8px">
          <a onclick="navigate('/')" class="link" style="font-weight:400;color:var(--text-muted)">Return to Home</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errEl.classList.add('hidden');

    try {
      const data = await api.login(email, password);
      localStorage.setItem('amupf_token', data.access_token);
      // Force user reload
      window.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message || 'Invalid email or password';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });
}
