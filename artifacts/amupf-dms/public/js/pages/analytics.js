import { api } from '../api.js';

export async function render(container, { user }) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left"><h1>Analytics</h1><p>System-wide performance metrics</p></div>
    </div>
    <div id="analytics-content"><div class="spinner-wrap"><div class="spinner"></div></div></div>
  `;

  let stats = {}, summary = {}, dept = [];
  try { stats = await api.dashboardStats(); } catch {}
  try { summary = await api.reportsSummary(); } catch {}
  try { dept = await api.deptPerformance(); } catch {}

  const content = document.getElementById('analytics-content');

  const statusData = {
    labels: Object.keys(summary.by_status || {}),
    datasets: [{
      data: Object.values(summary.by_status || {}),
      backgroundColor: ['#F59E0B','#3B82F6','#F97316','#10B981','#EF4444','#8B5CF6','#6B7280'],
    }]
  };

  const typeData = {
    labels: Object.keys(summary.by_type || {}).map(k => k.replace(/_/g,' ')),
    datasets: [{
      label: 'Reports by Type',
      data: Object.values(summary.by_type || {}),
      backgroundColor: '#023D8F',
      borderRadius: 6,
    }]
  };

  const deptLabels = dept.map(d => d.department_name);
  const deptData = {
    labels: deptLabels,
    datasets: [
      { label: 'Total Reports', data: dept.map(d => d.total_reports), backgroundColor: '#EBF2FF', borderColor: '#023D8F', borderWidth: 1.5, borderRadius: 4 },
      { label: 'Resolved', data: dept.map(d => d.resolved_reports), backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1.5, borderRadius: 4 },
    ]
  };

  const priorityData = {
    labels: Object.keys(summary.by_priority || {}).map(k => k.charAt(0).toUpperCase()+k.slice(1)),
    datasets: [{
      data: Object.values(summary.by_priority || {}),
      backgroundColor: ['#6B7280','#3B82F6','#F97316','#EF4444'],
    }]
  };

  content.innerHTML = `
    <!-- Summary Cards -->
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="stat-label">Total Reports</div>
        <div class="stat-value">${stats.total_reports ?? 0}</div>
        <div class="stat-sub">${stats.pending_reports ?? 0} pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Resolution Rate</div>
        <div class="stat-value">${stats.resolution_rate ?? 0}%</div>
        <div class="stat-sub">${stats.resolved_reports ?? 0} resolved</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Members</div>
        <div class="stat-value">${stats.active_members ?? 0}</div>
        <div class="stat-sub">of ${stats.total_members ?? 0} total</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending KYC</div>
        <div class="stat-value">${stats.pending_kyc ?? 0}</div>
        <div class="stat-sub">awaiting review</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Reports by Status</div>
        <div class="chart-container"><canvas id="chart-status"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Reports by Priority</div>
        <div class="chart-container"><canvas id="chart-priority"></canvas></div>
      </div>
      <div class="chart-card" style="grid-column:span 2">
        <div class="chart-title">Reports by Type</div>
        <div class="chart-container" style="height:260px"><canvas id="chart-type"></canvas></div>
      </div>
      ${deptLabels.length ? `
      <div class="chart-card" style="grid-column:span 2">
        <div class="chart-title">Department Performance</div>
        <div class="chart-container" style="height:280px"><canvas id="chart-dept"></canvas></div>
      </div>` : ''}
    </div>
  `;

  // Render charts
  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } } } };

  if (statusData.labels.length) {
    new Chart(document.getElementById('chart-status'), { type: 'doughnut', data: statusData, options: { ...chartOpts, cutout: '60%' } });
  }
  if (priorityData.labels.length) {
    new Chart(document.getElementById('chart-priority'), { type: 'doughnut', data: priorityData, options: { ...chartOpts, cutout: '60%' } });
  }
  if (typeData.labels.length) {
    new Chart(document.getElementById('chart-type'), { type: 'bar', data: typeData, options: { ...chartOpts, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  }
  if (deptLabels.length && document.getElementById('chart-dept')) {
    new Chart(document.getElementById('chart-dept'), { type: 'bar', data: deptData, options: { ...chartOpts, scales: { y: { beginAtZero: true } } } });
  }
}
