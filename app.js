/**
 * ============================================================================
 * MAIN APPLICATION CONTROLLER - NEO-BRUTALIST EDITION
 * ============================================================================
 * Coordinates dynamic catalog filtering, interactive platform tour tabs,
 * squad readiness calculator, registration wizard, ticket passes, and modals.
 */

import { CONFIG } from './config.js';
import { Validation } from './validation.js';
import { Api } from './api.js';
import { TicketGenerator } from './ticket.js';
import { AdminPortal } from './admin.js';

class CSFestivalApp {
  constructor() {
    this.selectedEvent = null;
    this.selectedRegType = 'INDIVIDUAL';
    this.activeCategory = 'all';
    this.teamMembers = [];
    this.currentTicket = null;
  }

  init() {
    Api.initMockStorage();
    this.initCountdown();
    this.renderEventsCatalog();
    this.renderCategoryFilterPills();
    this.populateEventSelectDropdown();
    this.initPlatformTour();
    this.initSquadCalculator();
    this.bindDOMEvents();
    AdminPortal.init();

    // Check last ticket
    const lastRegId = localStorage.getItem('csf2026_last_reg_id');
    if (lastRegId) {
      const quickLookupBtn = document.getElementById('quickViewLastTicketBtn');
      if (quickLookupBtn) {
        quickLookupBtn.style.display = 'inline-flex';
        quickLookupBtn.textContent = `🎫 View My Pass (${lastRegId})`;
      }
    }
  }

  /* --------------------------------------------------------------------------
     1. Live Countdown Timer
     -------------------------------------------------------------------------- */
  initCountdown() {
    const targetDate = new Date(CONFIG.FESTIVAL.START_DATE).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        document.getElementById('countdownDays').textContent = '00';
        document.getElementById('countdownHours').textContent = '00';
        document.getElementById('countdownMinutes').textContent = '00';
        document.getElementById('countdownSeconds').textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      document.getElementById('countdownDays').textContent = pad(days);
      document.getElementById('countdownHours').textContent = pad(hours);
      document.getElementById('countdownMinutes').textContent = pad(minutes);
      document.getElementById('countdownSeconds').textContent = pad(seconds);
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  /* --------------------------------------------------------------------------
     2. Interactive Platform Tour / "The Interface" Tabs (Exact EdPrep Style)
     -------------------------------------------------------------------------- */
  initPlatformTour() {
    const tabsContainer = document.getElementById('tourNavTabs');
    const slugEl = document.getElementById('tourUrlSlug');
    const contentEl = document.getElementById('tourTerminalContent');

    if (!tabsContainer || !contentEl) return;

    const tourData = {
      codesprint: {
        slug: 'codesprint',
        html: `
          <div class="terminal-code-block">
            <p><span class="terminal-code-prompt">csf2026@arena:~$</span> ./benchmark --track=codesprint</p>
            <p style="color: #9CA3AF;">[+] Initializing Sandboxed Competitive Environment...</p>
            <p style="color: #9CA3AF;">[+] Compiler Stack: GCC 14.2 / Clang 18 / OpenJDK 21 / Rust 1.80</p>
            <p><span class="terminal-code-keyword">struct</span> <span class="terminal-code-string">Submission</span> {</p>
            <p>&nbsp;&nbsp;id: <span class="terminal-code-string">"CSF-2026-ROUND-1"</span>,</p>
            <p>&nbsp;&nbsp;runtime_limit_ms: <span style="color: #F87171;">1000</span>,</p>
            <p>&nbsp;&nbsp;memory_bound_mb: <span style="color: #F87171;">256</span>,</p>
            <p>&nbsp;&nbsp;eval_mode: <span class="terminal-code-string">"STRICT_IO_DIFF_CHECK"</span></p>
            <p>};</p>
            <p style="color: #4ADE80; font-weight: 700; margin-top: 1rem;">>>> ALL 7 TEST BATCHES PASSED [0.038s Execution Time]</p>
          </div>
          <div class="flex items-center justify-between border-t border-gray-800 pt-3">
            <span class="text-xs text-muted mono">ARENA STATUS: ONLINE (1,200 CAPACITY)</span>
            <button type="button" class="nb-btn btn-xs btn-yellow tour-direct-reg-btn" data-event="code-sprint">Register for this &rarr;</button>
          </div>
        `
      },
      hackmatrix: {
        slug: 'hackmatrix',
        html: `
          <div class="terminal-code-block">
            <p><span class="terminal-code-prompt">csf2026@arena:~$</span> git clone https://github.com/csf2026/hackmatrix-squad.git</p>
            <p style="color: #9CA3AF;">[+] Verifying Repository Checkpoint 1 (Auth, DB Schemas, Core API)...</p>
            <p><span class="terminal-code-keyword">export default</span> <span class="terminal-code-keyword">async function</span> <span class="terminal-code-string">evaluatePrototype</span>(repo) {</p>
            <p>&nbsp;&nbsp;<span class="terminal-code-keyword">const</span> metrics = <span class="terminal-code-keyword">await</span> analyzeCommits(repo);</p>
            <p>&nbsp;&nbsp;<span class="terminal-code-keyword">return</span> {</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;originalCodeScore: <span style="color: #F87171;">98.4</span>,</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;mentorSignOff: <span class="terminal-code-string">"VERIFIED"</span>,</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;deploymentUrl: <span class="terminal-code-string">"https://prototype.csf2026.app"</span></p>
            <p>&nbsp;&nbsp;};</p>
            <p>}</p>
            <p style="color: #60A5FA; font-weight: 700; margin-top: 1rem;">>>> 36H TIME REMAINING: 31h 44m • STAGE: MENTOR CHECKPOINT</p>
          </div>
          <div class="flex items-center justify-between border-t border-gray-800 pt-3">
            <span class="text-xs text-muted mono">ARENA STATUS: TEAMS FORMING (2-4 MEMBERS)</span>
            <button type="button" class="nb-btn btn-xs btn-yellow tour-direct-reg-btn" data-event="hack-matrix">Register Squad &rarr;</button>
          </div>
        `
      },
      cybersiege: {
        slug: 'cybersiege',
        html: `
          <div class="terminal-code-block">
            <p><span class="terminal-code-prompt">csf2026@arena:~$</span> nc ctf.csf2026.edu 1337</p>
            <p style="color: #9CA3AF;">[+] Connected to CyberSiege Target Node [Kernel 6.8.0-Hardened]</p>
            <p style="color: #FACC15;">[CHALLENGE] Category: Binary Exploitation • Points: 450</p>
            <p><span class="terminal-code-keyword">buffer_overflow_exploit</span>: payload = b"A" * 64 + p64(0x004011d6)</p>
            <p style="color: #9CA3AF;">[+] Submitting Flag: CSF2026{s7ack_sm4shing_f0r_th3_w1n}...</p>
            <p style="color: #4ADE80; font-weight: 700; margin-top: 1rem;">>>> FLAG ACCEPTED! +450 PTS ADDED TO SQUAD SCOREBOARD</p>
            <p style="color: #C084FC;">CURRENT LEADERBOARD RANK: #03</p>
          </div>
          <div class="flex items-center justify-between border-t border-gray-800 pt-3">
            <span class="text-xs text-muted mono">ARENA STATUS: JEOPARDY-STYLE SCORING ACTIVE</span>
            <button type="button" class="nb-btn btn-xs btn-yellow tour-direct-reg-btn" data-event="cyber-siege">Register Squad &rarr;</button>
          </div>
        `
      }
    };

    tabsContainer.querySelectorAll('.tour-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.tour;
        tabsContainer.querySelectorAll('.tour-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (tourData[key]) {
          if (slugEl) slugEl.textContent = tourData[key].slug;
          contentEl.innerHTML = tourData[key].html;
          contentEl.querySelector('.tour-direct-reg-btn')?.addEventListener('click', (ev) => {
            const evId = ev.currentTarget.dataset.event;
            this.selectEventForRegistration(evId);
          });
        }
      });
    });

    // Wire up initial direct register button
    contentEl.querySelector('.tour-direct-reg-btn')?.addEventListener('click', (ev) => {
      const evId = ev.currentTarget.dataset.event;
      this.selectEventForRegistration(evId);
    });
  }

  /* --------------------------------------------------------------------------
     3. Interactive Squad Readiness Calculator (Like EdPrep Calculator)
     -------------------------------------------------------------------------- */
  initSquadCalculator() {
    const uniTabs = document.getElementById('calcUniTabs');
    const sizeSelect = document.getElementById('calcSquadSize');
    const semSelect = document.getElementById('calcSemester');
    const strengthSelect = document.getElementById('calcStrength');
    const recArena = document.getElementById('calcRecommendedArena');
    const recScore = document.getElementById('calcBenchmarkScore');
    const applyBtn = document.getElementById('calcApplyTrackBtn');

    if (!sizeSelect || !recArena || !recScore) return;

    let selectedDept = 'BSCS';

    if (uniTabs) {
      uniTabs.querySelectorAll('.calc-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          uniTabs.querySelectorAll('.calc-tab-btn').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          selectedDept = e.currentTarget.dataset.dept;
          recompute();
        });
      });
    }

    const recompute = () => {
      const size = parseInt(sizeSelect.value, 10);
      const sem = semSelect.value;
      const strength = strengthSelect.value;

      let score = 75;
      let targetEventId = 'code-sprint';
      let targetEventName = 'Algorithmic CodeSprint';

      // Semester multiplier
      if (sem === 'senior') score += 12;
      else if (sem === 'final') score += 18;
      else score += 6;

      // Match strength to optimal arena
      if (strength === 'coding') {
        score += 8;
        if (size === 1) {
          targetEventId = 'code-sprint';
          targetEventName = 'Algorithmic CodeSprint (Solo DSA)';
        } else {
          targetEventId = 'tech-trivia';
          targetEventName = 'TechTrivia: CS SuperBowl (Pair)';
        }
      } else if (strength === 'hackathon') {
        score += 9;
        if (size >= 2) {
          targetEventId = 'hack-matrix';
          targetEventName = 'HackMatrix 36h Hackathon (Team)';
        } else {
          targetEventId = 'neuro-vibe';
          targetEventName = 'NeuroVibe: GenAI Challenge (Solo/Team)';
        }
      } else if (strength === 'security') {
        score += 10;
        targetEventId = 'cyber-siege';
        targetEventName = 'Capture The Flag: CyberSiege';
      } else if (strength === 'robotics') {
        score += 7;
        targetEventId = 'robo-clash';
        targetEventName = 'RoboClash: Autonomous Arena';
      }

      score = Math.min(score, 99);
      recScore.textContent = `${score} / 100`;
      recArena.textContent = targetEventName;
      recArena.dataset.eventId = targetEventId;
    };

    sizeSelect.addEventListener('change', recompute);
    semSelect.addEventListener('change', recompute);
    strengthSelect.addEventListener('change', recompute);
    recompute();

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const evId = recArena.dataset.eventId || 'hack-matrix';
        this.selectEventForRegistration(evId);
        this.showToast(`Locked in ${recArena.textContent}! Proceeding to registration desk.`, 'success');
      });
    }
  }

  /* --------------------------------------------------------------------------
     4. Category Filter Pills & Dynamic Event Cards
     -------------------------------------------------------------------------- */
  renderCategoryFilterPills() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    container.innerHTML = CONFIG.CATEGORIES.map(cat => `
      <button type="button" class="filter-btn ${cat.id === this.activeCategory ? 'active' : ''}" data-category="${cat.id}">
        ${cat.label}
      </button>
    `).join('');

    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const catId = e.currentTarget.dataset.category;
        this.activeCategory = catId;
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.renderEventsCatalog();
      });
    });
  }

  renderEventsCatalog() {
    const grid = document.getElementById('eventsGrid');
    const searchInput = document.getElementById('eventSearchInput');
    const searchTerm = (searchInput?.value || '').toLowerCase().trim();

    if (!grid) return;

    const filtered = CONFIG.EVENTS.filter(ev => {
      const matchCat = (this.activeCategory === 'all' || ev.category === this.activeCategory);
      const matchSearch = !searchTerm ||
        ev.name.toLowerCase().includes(searchTerm) ||
        ev.shortDesc.toLowerCase().includes(searchTerm) ||
        ev.venue.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center border-4 border-dashed border-gray-300 p-12 font-black text-gray-400 uppercase tracking-widest text-sm">
          No competitions match your filter.
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(ev => {
      const typeBadge = ev.registrationType === 'INDIVIDUAL'
        ? '<span class="nb-tag badge-yellow">Solo Only</span>'
        : ev.registrationType === 'TEAM'
        ? `<span class="nb-tag badge-blue">Team (${ev.minTeamSize}-${ev.maxTeamSize})</span>`
        : '<span class="nb-tag badge-green">Solo or Team</span>';

      return `
        <article class="event-card">
          <div>
            <div class="event-card-header">
              <span class="nb-tag badge-dark">${ev.category.toUpperCase()}</span>
              ${typeBadge}
            </div>

            <h3 class="event-card-title">${ev.name}</h3>
            <p class="event-card-desc">${ev.shortDesc}</p>

            <div class="event-prize-box">
              <span class="event-prize-lbl">PRIZE BOUNTY POOL</span>
              <div class="event-prize-val">${ev.prizePool}</div>
            </div>

            <ul class="event-feature-list">
              <li><span class="check-icon">✓</span> ${ev.rounds}</li>
              <li><span class="check-icon">✓</span> ${ev.venue}</li>
              <li><span class="check-icon">✓</span> ${ev.scheduleTime}</li>
            </ul>
          </div>

          <div class="event-card-buttons">
            <button type="button" class="nb-btn btn-sm btn-secondary flex-1 view-rules-btn" data-id="${ev.id}">
              Details
            </button>
            <button type="button" class="nb-btn btn-sm btn-primary flex-1 quick-register-btn" data-id="${ev.id}">
              Register &rarr;
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Attach card handlers
    grid.querySelectorAll('.view-rules-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openEventDetailsModal(id);
      });
    });

    grid.querySelectorAll('.quick-register-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.selectEventForRegistration(id);
      });
    });
  }

  openEventDetailsModal(eventId) {
    const ev = CONFIG.EVENTS.find(e => e.id === eventId);
    if (!ev) return;

    document.getElementById('modalEventTitle').textContent = ev.name;
    document.getElementById('modalEventCategory').textContent = ev.category.toUpperCase();
    document.getElementById('modalEventPrizes').textContent = ev.prizePool;
    document.getElementById('modalEventSchedule').textContent = ev.scheduleTime;
    document.getElementById('modalEventVenue').textContent = ev.venue;
    document.getElementById('modalEventEligibility').textContent = ev.eligibility;
    document.getElementById('modalEventRounds').textContent = ev.rounds;
    document.getElementById('modalEventCoordinator').textContent = ev.coordinator;

    const rulesList = document.getElementById('modalEventRulesList');
    rulesList.innerHTML = ev.rules.map(r => `<li>${r}</li>`).join('');

    const regBtn = document.getElementById('modalEventRegisterBtn');
    regBtn.onclick = () => {
      this.closeModal('eventDetailModal');
      this.selectEventForRegistration(ev.id);
    };

    this.openModal('eventDetailModal');
  }

  /* --------------------------------------------------------------------------
     5. Registration Wizard Workflow
     -------------------------------------------------------------------------- */
  populateEventSelectDropdown() {
    const select = document.getElementById('regEventSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Competition Arena --</option>' +
      CONFIG.EVENTS.map(ev => `
        <option value="${ev.id}">${ev.name} [${ev.registrationType}]</option>
      `).join('');
  }

  selectEventForRegistration(eventId) {
    const ev = CONFIG.EVENTS.find(e => e.id === eventId);
    if (!ev) return;

    this.selectedEvent = ev;
    const select = document.getElementById('regEventSelect');
    if (select) select.value = ev.id;

    this.updateEventSelectionUI();

    const regSection = document.getElementById('registration');
    if (regSection) {
      regSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateEventSelectionUI() {
    const ev = this.selectedEvent;
    const infoBar = document.getElementById('selectedEventInfoBar');
    const teamNameGroup = document.getElementById('teamNameGroup');
    const teamMembersSection = document.getElementById('teamMembersSection');

    if (!ev) {
      if (infoBar) infoBar.style.display = 'none';
      return;
    }

    if (infoBar) {
      infoBar.style.display = 'flex';
      document.getElementById('infoBarEventName').textContent = ev.name;
      document.getElementById('infoBarEventMeta').textContent = `${ev.venue} • ${ev.scheduleTime}`;
    }

    const soloToggleCard = document.getElementById('toggleCardSolo');
    const teamToggleCard = document.getElementById('toggleCardTeam');

    if (ev.registrationType === 'INDIVIDUAL') {
      this.selectedRegType = 'INDIVIDUAL';
      soloToggleCard?.classList.add('selected');
      teamToggleCard?.classList.remove('selected');
      if (teamToggleCard) teamToggleCard.style.opacity = '0.35';
      if (teamToggleCard) teamToggleCard.style.pointerEvents = 'none';
      if (soloToggleCard) soloToggleCard.style.pointerEvents = 'auto';
    } else if (ev.registrationType === 'TEAM') {
      this.selectedRegType = 'TEAM';
      soloToggleCard?.classList.remove('selected');
      teamToggleCard?.classList.add('selected');
      if (soloToggleCard) soloToggleCard.style.opacity = '0.35';
      if (soloToggleCard) soloToggleCard.style.pointerEvents = 'none';
      if (teamToggleCard) teamToggleCard.style.pointerEvents = 'auto';
    } else {
      if (soloToggleCard) {
        soloToggleCard.style.opacity = '1';
        soloToggleCard.style.pointerEvents = 'auto';
      }
      if (teamToggleCard) {
        teamToggleCard.style.opacity = '1';
        teamToggleCard.style.pointerEvents = 'auto';
      }
    }

    const isTeam = (this.selectedRegType === 'TEAM');
    if (teamNameGroup) teamNameGroup.style.display = isTeam ? 'block' : 'none';
    if (teamMembersSection) teamMembersSection.style.display = isTeam ? 'block' : 'none';

    const sizeHint = document.getElementById('teamSizeHint');
    if (sizeHint && ev) {
      sizeHint.textContent = `Required squad size: ${ev.minTeamSize} to ${ev.maxTeamSize} members (including squad lead).`;
    }

    if (isTeam && ev.minTeamSize > 1 && this.teamMembers.length === 0) {
      const need = ev.minTeamSize - 1;
      for (let i = 0; i < need; i++) {
        this.addTeamMemberRow();
      }
    }
  }

  setRegistrationType(type) {
    if (!this.selectedEvent) return;

    if (this.selectedEvent.registrationType === 'INDIVIDUAL' && type === 'TEAM') {
      this.showToast('This competition is strictly solo entry.', 'warning');
      return;
    }
    if (this.selectedEvent.registrationType === 'TEAM' && type === 'INDIVIDUAL') {
      this.showToast('This competition requires a team squad.', 'warning');
      return;
    }

    this.selectedRegType = type;
    document.querySelectorAll('.type-toggle-card').forEach(c => c.classList.remove('selected'));
    if (type === 'INDIVIDUAL') {
      document.getElementById('toggleCardSolo')?.classList.add('selected');
    } else {
      document.getElementById('toggleCardTeam')?.classList.add('selected');
    }

    this.updateEventSelectionUI();
  }

  addTeamMemberRow() {
    if (!this.selectedEvent) return;
    const maxAllowedMembers = this.selectedEvent.maxTeamSize - 1;

    if (this.teamMembers.length >= maxAllowedMembers) {
      this.showToast(`Maximum squad size (${this.selectedEvent.maxTeamSize} members) reached.`, 'warning');
      return;
    }

    const memberId = 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    this.teamMembers.push({ id: memberId, name: '', rollNumber: '', classGrade: '', section: '' });
    this.renderTeamMembersList();
  }

  removeTeamMemberRow(memberId) {
    if (!this.selectedEvent) return;
    const minMembersNeeded = this.selectedEvent.minTeamSize - 1;

    if (this.teamMembers.length <= minMembersNeeded) {
      this.showToast(`Cannot remove: this event requires at least ${this.selectedEvent.minTeamSize} total members.`, 'warning');
      return;
    }

    this.teamMembers = this.teamMembers.filter(m => m.id !== memberId);
    this.renderTeamMembersList();
  }

  renderTeamMembersList() {
    const container = document.getElementById('teamMembersContainer');
    if (!container) return;

    if (this.teamMembers.length === 0) {
      container.innerHTML = `
        <div class="border-2 border-dashed border-black p-4 text-center text-xs font-bold text-gray-500">
          No additional squad members added. Click "+ Add Squad Member" above.
        </div>
      `;
      return;
    }

    container.innerHTML = this.teamMembers.map((m, idx) => {
      const memberNumber = idx + 2;
      return `
        <div class="team-member-card" id="${m.id}">
          <div class="member-card-header">
            <span class="member-order-tag mono">SQUAD MEMBER #${memberNumber}</span>
            <button type="button" class="btn-icon remove-member-btn" data-id="${m.id}" title="Remove member">&times;</button>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">Full Name <span class="required-indicator">*</span></label>
              <input type="text" class="form-input member-name-input" data-id="${m.id}" placeholder="e.g. Sara Tariq" value="${m.name}" required />
              <div class="form-feedback"></div>
            </div>

            <div class="form-group">
              <label class="form-label">Roll Number <span class="required-indicator">*</span></label>
              <input type="text" class="form-input mono member-roll-input" data-id="${m.id}" placeholder="e.g. 2024-CS-099" value="${m.rollNumber}" required />
              <div class="form-feedback"></div>
            </div>

            <div class="form-group">
              <label class="form-label">Class &amp; Section</label>
              <input type="text" class="form-input member-class-input" data-id="${m.id}" placeholder="e.g. BSCS-4B" value="${m.classGrade}" />
              <div class="form-feedback"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.member-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.id;
        const target = this.teamMembers.find(m => m.id === id);
        if (target) target.name = e.target.value;
      });
    });

    container.querySelectorAll('.member-roll-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.id;
        const target = this.teamMembers.find(m => m.id === id);
        if (target) target.rollNumber = e.target.value.trim().toUpperCase();
      });
    });

    container.querySelectorAll('.member-class-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.id;
        const target = this.teamMembers.find(m => m.id === id);
        if (target) target.classGrade = e.target.value;
      });
    });

    container.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.removeTeamMemberRow(e.currentTarget.dataset.id);
      });
    });
  }

  /* --------------------------------------------------------------------------
     6. Form Submission & Ticket Generation
     -------------------------------------------------------------------------- */
  async handleRegistrationSubmit(e) {
    e.preventDefault();

    if (!this.selectedEvent) {
      this.showToast('Please select a competition to register for.', 'error');
      document.getElementById('regEventSelect')?.focus();
      return;
    }

    const isTeam = (this.selectedRegType === 'TEAM');

    const leaderName = document.getElementById('regLeaderName').value.trim();
    const leaderRoll = document.getElementById('regLeaderRoll').value.trim().toUpperCase();
    const leaderClass = document.getElementById('regLeaderClass').value.trim();
    const leaderSection = document.getElementById('regLeaderSection').value.trim().toUpperCase();
    const leaderEmail = document.getElementById('regLeaderEmail').value.trim();
    const leaderPhone = document.getElementById('regLeaderPhone').value.trim();
    const teamName = isTeam ? document.getElementById('regTeamName').value.trim() : '';

    const payload = {
      eventId: this.selectedEvent.id,
      eventName: this.selectedEvent.name,
      registrationType: this.selectedRegType,
      teamName: teamName,
      participant: {
        name: leaderName,
        rollNumber: leaderRoll,
        classGrade: leaderClass,
        section: leaderSection,
        email: leaderEmail,
        phone: leaderPhone
      },
      members: isTeam ? this.teamMembers.map(m => ({
        name: m.name.trim(),
        rollNumber: m.rollNumber.trim().toUpperCase(),
        classGrade: m.classGrade.trim(),
        section: m.section.trim(),
        role: 'MEMBER'
      })) : []
    };

    const valResult = Validation.validateRegistrationPayload(payload, this.selectedEvent);
    if (!valResult.isValid) {
      this.showToast(valResult.errors[0], 'error');
      return;
    }

    const submitBtn = document.getElementById('regSubmitBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Securing Admission Pass...';

    try {
      const response = await Api.submitRegistration(payload);

      if (response.ok) {
        this.showToast('Registration Confirmed! Official Pass Issued.', 'success');
        this.currentTicket = {
          ...response.data.registration,
          registrationId: response.data.registrationId
        };

        localStorage.setItem('csf2026_last_reg_id', response.data.registrationId);
        const quickLookupBtn = document.getElementById('quickViewLastTicketBtn');
        if (quickLookupBtn) {
          quickLookupBtn.style.display = 'inline-flex';
          quickLookupBtn.textContent = `🎫 View My Pass (${response.data.registrationId})`;
        }

        this.resetRegistrationForm();
        this.displayDigitalTicket(this.currentTicket, this.selectedEvent);
      } else {
        this.showToast(response.error?.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      this.showToast('Server connection error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }

  resetRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (form) form.reset();
    this.teamMembers = [];
    this.renderTeamMembersList();
    document.querySelectorAll('.form-input').forEach(i => i.classList.remove('is-valid', 'is-invalid'));
    document.querySelectorAll('.form-feedback').forEach(f => f.textContent = '');
  }

  displayDigitalTicket(registration, event) {
    const container = document.getElementById('ticketPassModalBody');
    if (!container) return;

    container.innerHTML = TicketGenerator.renderTicket(registration, event);
    this.openModal('ticketPassModal');
  }

  /* --------------------------------------------------------------------------
     7. Ticket Lookup / Finder
     -------------------------------------------------------------------------- */
  async handleTicketLookup(e) {
    e.preventDefault();
    const queryInput = document.getElementById('lookupQueryInput');
    const query = queryInput.value.trim();

    if (!query) {
      this.showToast('Please enter your Roll Number or Ticket ID.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('lookupSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Searching...';

    const res = await Api.lookupRegistration(query);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Find Ticket';

    if (res.ok) {
      this.closeModal('ticketLookupModal');
      const reg = res.data.registration;
      const ev = CONFIG.EVENTS.find(e => e.id === reg.eventId) || {
        name: reg.eventName,
        venue: 'Computing Complex',
        scheduleTime: 'Day of Festival'
      };
      this.displayDigitalTicket(reg, ev);
    } else {
      this.showToast(res.error?.message || 'No matching ticket found.', 'error');
    }
  }

  /* --------------------------------------------------------------------------
     8. Toast Notifications & Modals
     -------------------------------------------------------------------------- */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-indicator"></span>
      <span class="toast-message">${message}</span>
      <button type="button" class="toast-close">&times;</button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const removeToast = () => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    setTimeout(removeToast, 4000);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  bindDOMEvents() {
    const searchInput = document.getElementById('eventSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderEventsCatalog());
    }

    const select = document.getElementById('regEventSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        this.selectEventForRegistration(e.target.value);
      });
    }

    document.getElementById('toggleCardSolo')?.addEventListener('click', () => {
      this.setRegistrationType('INDIVIDUAL');
    });
    document.getElementById('toggleCardTeam')?.addEventListener('click', () => {
      this.setRegistrationType('TEAM');
    });

    document.getElementById('addTeamMemberBtn')?.addEventListener('click', () => {
      this.addTeamMemberRow();
    });

    document.getElementById('registrationForm')?.addEventListener('submit', (e) => {
      this.handleRegistrationSubmit(e);
    });

    document.getElementById('ticketLookupForm')?.addEventListener('submit', (e) => {
      this.handleTicketLookup(e);
    });

    document.getElementById('quickViewLastTicketBtn')?.addEventListener('click', () => {
      const lastId = localStorage.getItem('csf2026_last_reg_id');
      if (lastId) {
        document.getElementById('lookupQueryInput').value = lastId;
        this.handleTicketLookup(new Event('submit'));
      }
    });

    document.getElementById('navLookupBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openModal('ticketLookupModal');
      setTimeout(() => document.getElementById('lookupQueryInput')?.focus(), 100);
    });

    document.getElementById('navAdminBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      AdminPortal.openAdminModal();
    });

    document.getElementById('ticketPrintBtn')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('ticketCopyIdBtn')?.addEventListener('click', () => {
      if (this.currentTicket?.registrationId) {
        navigator.clipboard.writeText(this.currentTicket.registrationId);
        this.showToast(`Copied Ticket ID: ${this.currentTicket.registrationId}`, 'success');
      }
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.dataset.closeModal;
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.is-open').forEach(m => {
          m.classList.remove('is-open');
        });
        document.body.style.overflow = '';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new CSFestivalApp();
  window.app.init();
});
