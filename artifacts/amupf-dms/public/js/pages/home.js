import { api } from '../api.js';
import { formatDate } from '../utils.js';

export async function render(container) {
  let stats = { total_members: 0, resolved_cases: 0, active_members: 0, departments: 0 };
  let announcements = [];
  try { stats = await api.publicStats(); } catch {}
  try { const all = await api.announcements({ type: 'public' }); announcements = all.slice(0, 4); } catch {}

  container.innerHTML = `
    <div>
      <!-- Navbar -->
      <nav class="landing-nav">
        <div class="landing-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          AMUPF
        </div>
        <div class="landing-nav-actions">
          <button class="btn btn-outline" onclick="navigate('/login')">Log in</button>
          <button class="btn btn-primary" onclick="navigate('/register')">Register</button>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-badge">Official University Peace Portal</div>
        <h1>Arbaminch University<br>Peace Forum</h1>
        <div class="hero-sub">PEACE &bull; UNITY &bull; PROGRESS</div>
        <p class="hero-desc">A professional campus safety and incident management platform dedicated to maintaining a secure and harmonious environment for all students and staff.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" onclick="navigate('/register')">Join as Student</button>
          <button class="btn btn-outline btn-lg" onclick="navigate('/login')">Access Portal</button>
        </div>
      </section>

      <!-- Stats -->
      <section class="stats-section">
        <div class="stats-row">
          <div class="stat-item">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <div class="stat-n">${stats.total_members || 0}</div>
            <div class="stat-l">Total Members</div>
          </div>
          <div class="stat-item">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#10B981"><polyline points="20 6 9 17 4 12"/></svg>
            <div class="stat-n">${stats.resolved_cases || 0}</div>
            <div class="stat-l">Resolved Cases</div>
          </div>
          <div class="stat-item">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div class="stat-n">${stats.active_members || 0}</div>
            <div class="stat-l">Active Peacekeepers</div>
          </div>
        </div>
      </section>

      <!-- Content -->
      <div class="content-section">
        <!-- Announcements -->
        <div>
          <div class="section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#023D8F" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Latest Announcements
          </div>
          ${announcements.length > 0
            ? announcements.map(a => `
              <div class="announce-card">
                <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
                  <strong style="font-size:.9rem">${a.title}</strong>
                  <span class="badge badge-public">public</span>
                </div>
                <p style="font-size:.83rem;color:var(--text-muted);margin-top:6px;line-clamp:2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${a.content}</p>
                <div class="announce-date">${formatDate(a.created_at)}</div>
              </div>`).join('')
            : `<div class="announce-card text-muted" style="text-align:center;padding:32px">No public announcements at this time.</div>`
          }
        </div>

        <!-- Emergency Contacts -->
        <div>
          <div class="section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.82-.82a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Emergency Contacts
          </div>
          <div class="emergency-card">
            <div class="emergency-item">
              <div class="label">Campus Security Main</div>
              <a href="tel:+251123456789">+251 12 345 6789 &rarr;</a>
            </div>
            <div class="emergency-item">
              <div class="label">Student Clinic</div>
              <a href="tel:+251123456790">+251 12 345 6790 &rarr;</a>
            </div>
            <div class="emergency-item">
              <div class="label">AMUPF President Office</div>
              <a href="tel:+251123456791">+251 12 345 6791 &rarr;</a>
            </div>
            <div class="emergency-item">
              <div class="label">University Registrar</div>
              <a href="tel:+251123456792">+251 12 345 6792 &rarr;</a>
            </div>
          </div>

          <!-- About -->
          <div style="margin-top:28px">
            <div class="section-title">About AMUPF</div>
            <p style="font-size:.88rem;color:var(--text-muted);line-height:1.7">
              The Arbaminch University Peace Forum (AMUPF) is the official student-led peace and safety organization of Arbaminch University. We work to prevent and resolve conflicts, promote mutual respect, and build a culture of peace across all university departments.
            </p>
          </div>
        </div>
      </div>

      <footer class="landing-footer">
        <strong>AMUPF</strong> &mdash; Arbaminch University Peace Forum &copy; ${new Date().getFullYear()}. All rights reserved.
      </footer>
    </div>
  `;
}
