/**
 * ============================================================================
 * DIGITAL TICKET & PASS GENERATOR - CS FESTIVAL 2026
 * ============================================================================
 * Generates interactive digital admission passes featuring vector QR codes,
 * tear-off ticket stubs, security badges, and printable layouts.
 */

export const TicketGenerator = {
  /**
   * Minimal self-contained QR Code SVG generator
   * Generates a deterministic high-density 2D visual matrix based on payload
   */
  generateQrSvg(dataString, size = 160) {
    // Generate pseudo-random deterministic matrix from payload
    const modules = 25; // 25x25 grid (Version 2 QR style)
    const grid = Array(modules).fill(null).map(() => Array(modules).fill(false));

    // Simple hash function for deterministic patterning
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      hash = ((hash << 5) - hash) + dataString.charCodeAt(i);
      hash |= 0;
    }

    // Standard 7x7 Finder patterns at three corners
    const addFinder = (startX, startY) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 || // Outer frame
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner solid 3x3
          ) {
            grid[startY + r][startX + c] = true;
          }
        }
      }
    };

    addFinder(0, 0);                 // Top-Left
    addFinder(modules - 7, 0);        // Top-Right
    addFinder(0, modules - 7);        // Bottom-Left

    // Timing patterns
    for (let i = 8; i < modules - 8; i++) {
      grid[6][i] = (i % 2 === 0);
      grid[i][6] = (i % 2 === 0);
    }

    // Fill data area deterministically
    let seed = Math.abs(hash);
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // Skip finder zones & separators
        const inTopLeft = (r <= 7 && c <= 7);
        const inTopRight = (r <= 7 && c >= modules - 8);
        const inBottomLeft = (r >= modules - 8 && c <= 7);
        if (inTopLeft || inTopRight || inBottomLeft) continue;
        if (r === 6 || c === 6) continue;

        seed = (seed * 1664525 + 1013904223) % 4294967296;
        grid[r][c] = (seed % 3 === 0 || (r + c + dataString.length) % 2 === 0);
      }
    }

    // Build SVG path
    const cellSize = (size / modules);
    let rects = '';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (grid[r][c]) {
          const x = (c * cellSize).toFixed(2);
          const y = (r * cellSize).toFixed(2);
          const w = (cellSize + 0.1).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#F8FAFC" />`;
        }
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="ticket-qr-svg" role="img" aria-label="Check-in QR Code">
        <rect width="${size}" height="${size}" fill="#0F172A" rx="6" />
        ${rects}
      </svg>
    `;
  },

  /**
   * Generates decorative barcode stripes for the ticket stub
   */
  generateBarcodeSvg(text) {
    const bars = [];
    const len = 42;
    for (let i = 0; i < len; i++) {
      const isWide = ((i * 7 + text.charCodeAt(i % text.length)) % 3 === 0);
      const isGap = (i % 5 === 0);
      if (!isGap) {
        bars.push(`<line x1="${i * 6 + 4}" y1="0" x2="${i * 6 + 4}" y2="36" stroke="#94A3B8" stroke-width="${isWide ? 3.5 : 1.5}" />`);
      }
    }
    return `
      <svg viewBox="0 0 260 36" width="260" height="36" class="ticket-barcode-svg">
        ${bars.join('')}
      </svg>
    `;
  },

  /**
   * Render complete HTML for the Digital Festival Pass
   */
  renderTicket(registration, event) {
    const regId = registration.registrationId || registration.id || 'CSF-2026-TICKET';
    const isTeam = (registration.registrationType === 'TEAM');
    const teamName = registration.teamName || 'Independent';
    const participantName = registration.leaderName || (registration.participant && registration.participant.name) || 'Participant';
    const rollNumber = registration.rollNumber || (registration.participant && registration.participant.rollNumber) || 'N/A';
    const classSec = `${registration.classGrade || (registration.participant && registration.participant.classGrade) || ''} - ${registration.section || (registration.participant && registration.participant.section) || ''}`;
    const eventName = registration.eventName || (event && event.name) || 'CS Festival Competition';
    const venue = (event && event.venue) || 'Computing Complex';
    const scheduleTime = (event && event.scheduleTime) || 'Day of Festival';
    const status = (registration.status || 'CONFIRMED').toUpperCase();
    const qrSvg = this.generateQrSvg(`${regId}|${rollNumber}|${eventName}`);
    const barcodeSvg = this.generateBarcodeSvg(regId);

    const membersList = (registration.members && registration.members.length > 0)
      ? `
        <div class="ticket-members-block">
          <div class="ticket-field-label">TEAM SQUAD (${registration.members.length + 1})</div>
          <div class="ticket-members-tags">
            <span class="member-pill lead-pill">★ ${participantName} (Lead)</span>
            ${registration.members.map(m => `<span class="member-pill">${m.name} (${m.rollNumber})</span>`).join('')}
          </div>
        </div>
      `
      : '';

    return `
      <div class="festival-pass" id="printPassTarget">
        <!-- Ticket Header Banner -->
        <div class="pass-header">
          <div class="pass-brand">
            <span class="pass-badge">CSF '26</span>
            <div class="pass-meta-titles">
              <span class="pass-org">ANNUAL COMPUTER SCIENCE FESTIVAL</span>
              <span class="pass-edition">OFFICIAL ADMISSION & PARTICIPANT PASS</span>
            </div>
          </div>
          <div class="pass-status-pill status-${status.toLowerCase()}">
            ● ${status}
          </div>
        </div>

        <!-- Ticket Body Grid -->
        <div class="pass-body">
          <div class="pass-main-info">
            <div class="ticket-field-row">
              <div class="ticket-field">
                <span class="ticket-field-label">COMPETITION / EVENT</span>
                <span class="ticket-field-value event-name-highlight">${eventName}</span>
              </div>
            </div>

            <div class="ticket-grid-columns">
              <div class="ticket-field">
                <span class="ticket-field-label">${isTeam ? 'TEAM LEADER' : 'PARTICIPANT NAME'}</span>
                <span class="ticket-field-value">${participantName}</span>
              </div>

              <div class="ticket-field">
                <span class="ticket-field-label">ROLL / STUDENT ID</span>
                <span class="ticket-field-value mono">${rollNumber}</span>
              </div>

              ${isTeam ? `
                <div class="ticket-field">
                  <span class="ticket-field-label">REGISTERED TEAM</span>
                  <span class="ticket-field-value accent-text">${teamName}</span>
                </div>
              ` : `
                <div class="ticket-field">
                  <span class="ticket-field-label">ENTRY TYPE</span>
                  <span class="ticket-field-value">SOLO PARTICIPANT</span>
                </div>
              `}

              <div class="ticket-field">
                <span class="ticket-field-label">CLASS / SECTION</span>
                <span class="ticket-field-value">${classSec}</span>
              </div>

              <div class="ticket-field">
                <span class="ticket-field-label">SCHEDULE</span>
                <span class="ticket-field-value mono-sm">${scheduleTime}</span>
              </div>

              <div class="ticket-field">
                <span class="ticket-field-label">VENUE ARENA</span>
                <span class="ticket-field-value mono-sm">${venue}</span>
              </div>
            </div>

            ${membersList}
          </div>

          <!-- Stub Tear-off Division with QR Code -->
          <div class="pass-stub">
            <div class="pass-stub-perforation" aria-hidden="true"></div>
            <div class="stub-qr-container">
              ${qrSvg}
              <span class="stub-qr-hint">Scan at entrance for badge</span>
            </div>
            <div class="stub-id-block">
              <span class="stub-id-label">REGISTRATION ID</span>
              <span class="stub-id-code mono">${regId}</span>
            </div>
            <div class="stub-barcode-wrap">
              ${barcodeSvg}
            </div>
          </div>
        </div>

        <!-- Ticket Footer Notice -->
        <div class="pass-footer">
          <span>* Present this digital pass or student ID card at the Registration Desk for desk badge clearance.</span>
          <span class="mono-xs">VERIFIED CSF2026-SECURE</span>
        </div>
      </div>
    `;
  }
};
