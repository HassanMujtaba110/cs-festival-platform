/**
 * ============================================================================
 * ORGANIZER ADMIN PORTAL - CS FESTIVAL 2026
 * ============================================================================
 * Handles event manager authentication, participant check-in, real-time
 * metrics aggregation, search/filtering, and roster CSV export.
 */

import { Api } from './api.js';

export const AdminPortal = {
  currentPasskey: null,
  cachedData: null,

  init() {
    this.bindEvents();
    // Check existing session
    const savedKey = sessionStorage.getItem('csf2026_admin_key');
    if (savedKey) {
      this.currentPasskey = savedKey;
    }
  },

  bindEvents() {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    const searchInput = document.getElementById('adminTableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterRegistrationsTable(e.target.value));
    }

    const filterEvent = document.getElementById('adminFilterEvent');
    if (filterEvent) {
      filterEvent.addEventListener('change', () => this.applyFilters());
    }

    const filterStatus = document.getElementById('adminFilterStatus');
    if (filterStatus) {
      filterStatus.addEventListener('change', () => this.applyFilters());
    }

    const exportCsvBtn = document.getElementById('adminExportCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportToCsv());
    }

    const refreshBtn = document.getElementById('adminRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadDashboardData());
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const passkeyInput = document.getElementById('adminPasskeyInput');
    const feedbackEl = document.getElementById('adminLoginFeedback');
    const submitBtn = document.getElementById('adminLoginSubmitBtn');

    const passkey = passkeyInput.value.trim();
    if (!passkey) {
      feedbackEl.textContent = 'Please enter the organizer passkey.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';
    feedbackEl.textContent = '';

    const res = await Api.adminLogin(passkey);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Access Portal';

    if (res.ok) {
      this.currentPasskey = passkey;
      sessionStorage.setItem('csf2026_admin_key', passkey);
      passkeyInput.value = '';
      this.showDashboardView();
      await this.loadDashboardData();
    } else {
      feedbackEl.textContent = res.error?.message || 'Incorrect passkey. Please try again.';
      passkeyInput.focus();
    }
  },

  handleLogout() {
    this.currentPasskey = null;
    this.cachedData = null;
    sessionStorage.removeItem('csf2026_admin_key');
    this.showLoginView();
  },

  showLoginView() {
    document.getElementById('adminLoginView').style.display = 'block';
    document.getElementById('adminDashboardView').style.display = 'none';
  },

  showDashboardView() {
    document.getElementById('adminLoginView').style.display = 'none';
    document.getElementById('adminDashboardView').style.display = 'block';
  },

  async openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    modal.classList.add('is-open');

    if (this.currentPasskey) {
      this.showDashboardView();
      await this.loadDashboardData();
    } else {
      this.showLoginView();
      setTimeout(() => {
        document.getElementById('adminPasskeyInput')?.focus();
      }, 100);
    }
  },

  closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('is-open');
  },

  async loadDashboardData() {
    if (!this.currentPasskey) return;

    const tableBody = document.getElementById('adminTableBody');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Loading real-time registrations...</td></tr>`;
    }

    const res = await Api.adminGetData(this.currentPasskey);
    if (!res.ok) {
      alert('Session expired or unauthorized. Please re-enter passkey.');
      this.handleLogout();
      return;
    }

    this.cachedData = res.data;
    this.renderMetrics(res.data.metrics);
    this.populateEventFilterDropdown(res.data.registrations);
    this.renderRegistrationsTable(res.data.registrations);
  },

  renderMetrics(metrics) {
    document.getElementById('metricTotalRegs').textContent = metrics.totalRegistrations || 0;
    document.getElementById('metricCheckedIn').textContent = metrics.checkedIn || 0;
    document.getElementById('metricTeams').textContent = metrics.totalTeam || 0;
    document.getElementById('metricIndividual').textContent = metrics.totalIndividual || 0;

    // Render Event Breakdown bars
    const breakdownContainer = document.getElementById('adminEventBreakdown');
    if (breakdownContainer && metrics.eventBreakdown) {
      const items = Object.entries(metrics.eventBreakdown);
      if (items.length === 0) {
        breakdownContainer.innerHTML = '<p class="text-muted text-xs">No registrations yet.</p>';
      } else {
        breakdownContainer.innerHTML = items.map(([name, count]) => `
          <div class="breakdown-row">
            <span class="breakdown-name">${name}</span>
            <span class="breakdown-count mono">${count}</span>
          </div>
        `).join('');
      }
    }
  },

  populateEventFilterDropdown(registrations) {
    const select = document.getElementById('adminFilterEvent');
    if (!select) return;

    const uniqueEvents = new Set();
    registrations.forEach(r => {
      if (r.eventName) uniqueEvents.add(r.eventName);
    });

    select.innerHTML = '<option value="">All Events</option>' +
      Array.from(uniqueEvents).map(name => `<option value="${name}">${name}</option>`).join('');
  },

  renderRegistrationsTable(registrations) {
    const tableBody = document.getElementById('adminTableBody');
    const countEl = document.getElementById('adminTableCount');
    if (!tableBody) return;

    if (countEl) {
      countEl.textContent = `${registrations.length} record(s)`;
    }

    if (!registrations || registrations.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-6">No matching registrations found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = registrations.map(r => {
      const statusClass = `badge status-${(r.status || 'confirmed').toLowerCase()}`;
      const isCheckedIn = (r.status === 'CHECKED_IN');
      const teamDisplay = r.registrationType === 'TEAM' 
        ? `<strong>${r.teamName || 'Team'}</strong> <span class="text-muted text-xs">(${1 + (r.members ? r.members.length : 0)} members)</span>`
        : '<span class="text-muted">Solo</span>';

      return `
        <tr>
          <td><span class="mono font-semibold">${r.registrationId}</span></td>
          <td>
            <div class="font-medium text-primary">${r.leaderName}</div>
            <div class="text-muted text-xs">${r.email} • ${r.phone}</div>
          </td>
          <td><span class="mono text-xs">${r.rollNumber}</span></td>
          <td>${r.eventName}</td>
          <td>${teamDisplay}</td>
          <td><span class="mono-xs">${r.classGrade} (${r.section})</span></td>
          <td><span class="${statusClass}">${r.status}</span></td>
          <td>
            <div class="action-buttons-cell">
              ${!isCheckedIn ? `
                <button class="btn btn-xs btn-success checkin-btn" data-id="${r.registrationId}" title="Mark participant checked in at venue">Check In</button>
              ` : `
                <button class="btn btn-xs btn-secondary uncheck-btn" data-id="${r.registrationId}" title="Revert to Confirmed">Revert</button>
              `}
              <button class="btn btn-xs btn-danger cancel-btn" data-id="${r.registrationId}" title="Cancel registration">×</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row button events
    tableBody.querySelectorAll('.checkin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleStatusUpdate(e.target.dataset.id, 'CHECKED_IN'));
    });
    tableBody.querySelectorAll('.uncheck-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleStatusUpdate(e.target.dataset.id, 'CONFIRMED'));
    });
    tableBody.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (confirm(`Are you sure you want to cancel ticket ${e.target.dataset.id}?`)) {
          this.handleStatusUpdate(e.target.dataset.id, 'CANCELLED');
        }
      });
    });
  },

  async handleStatusUpdate(registrationId, newStatus) {
    const res = await Api.adminUpdateStatus(this.currentPasskey, registrationId, newStatus);
    if (res.ok) {
      await this.loadDashboardData();
    } else {
      alert(res.error?.message || 'Failed to update status.');
    }
  },

  applyFilters() {
    if (!this.cachedData?.registrations) return;

    const searchTerm = (document.getElementById('adminTableSearch')?.value || '').toLowerCase().trim();
    const eventFilter = document.getElementById('adminFilterEvent')?.value || '';
    const statusFilter = document.getElementById('adminFilterStatus')?.value || '';

    const filtered = this.cachedData.registrations.filter(r => {
      // Search term
      const matchesSearch = !searchTerm ||
        r.registrationId.toLowerCase().includes(searchTerm) ||
        r.leaderName.toLowerCase().includes(searchTerm) ||
        r.rollNumber.toLowerCase().includes(searchTerm) ||
        (r.teamName && r.teamName.toLowerCase().includes(searchTerm)) ||
        (r.email && r.email.toLowerCase().includes(searchTerm)) ||
        (r.members || []).some(m => m.name.toLowerCase().includes(searchTerm) || m.rollNumber.toLowerCase().includes(searchTerm));

      // Event
      const matchesEvent = !eventFilter || r.eventName === eventFilter;

      // Status
      const matchesStatus = !statusFilter || r.status === statusFilter;

      return matchesSearch && matchesEvent && matchesStatus;
    });

    this.renderRegistrationsTable(filtered);
  },

  filterRegistrationsTable(searchTerm) {
    this.applyFilters();
  },

  exportToCsv() {
    if (!this.cachedData?.registrations || this.cachedData.registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = [
      'Registration ID', 'Timestamp', 'Event', 'Type', 'Team Name',
      'Leader / Solo Name', 'Roll Number', 'Class', 'Section', 'Email',
      'Phone', 'Status', 'Team Members Roster'
    ];

    const rows = this.cachedData.registrations.map(r => {
      const membersRoster = (r.members || [])
        .map(m => `${m.name} (${m.rollNumber})`)
        .join('; ');

      return [
        r.registrationId,
        r.timestamp,
        `"${(r.eventName || '').replace(/"/g, '""')}"`,
        r.registrationType,
        `"${(r.teamName || '').replace(/"/g, '""')}"`,
        `"${(r.leaderName || '').replace(/"/g, '""')}"`,
        r.rollNumber,
        `"${r.classGrade || ''}"`,
        r.section,
        r.email,
        r.phone,
        r.status,
        `"${membersRoster.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSF2026_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
