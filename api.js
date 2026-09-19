/**
 * ============================================================================
 * API CLIENT LAYER - CS FESTIVAL 2026
 * ============================================================================
 * Handles communication with Google Apps Script Web App backend.
 * Provides instant Offline Mock API via localStorage with realistic seed data
 * for zero-latency testing and out-of-the-box demonstration.
 */

import { CONFIG } from './config.js';

const STORAGE_KEY_REGISTRATIONS = 'csf2026_registrations';
const STORAGE_KEY_SETTINGS = 'csf2026_settings';

// Realistic Seed Registrations for out-of-the-box testing & live demo
const SEED_REGISTRATIONS = [
  {
    registrationId: 'CSF-2026-7K4P9',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    eventId: 'code-sprint',
    eventName: 'Algorithmic CodeSprint',
    registrationType: 'INDIVIDUAL',
    teamName: '',
    leaderName: 'Zainab Ahmed',
    classGrade: 'BSCS Semester 6',
    section: 'A',
    rollNumber: '2023-CS-014',
    email: 'zainab.ahmed@student.edu',
    phone: '+1 555-019-4821',
    status: 'CONFIRMED',
    members: []
  },
  {
    registrationId: 'CSF-2026-X9M2L',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    eventId: 'hack-matrix',
    eventName: 'HackMatrix 36h Hackathon',
    registrationType: 'TEAM',
    teamName: 'BitWise Bandits',
    leaderName: 'Hassan Raza',
    classGrade: 'BSSE Semester 7',
    section: 'B',
    rollNumber: '2022-SE-099',
    email: 'hassan.raza@student.edu',
    phone: '+1 555-014-9982',
    status: 'CHECKED_IN',
    members: [
      { name: 'Bilal Khan', classGrade: 'BSSE 7', section: 'B', rollNumber: '2022-SE-105', role: 'MEMBER' },
      { name: 'Sara Qureshi', classGrade: 'BSCS 5', section: 'A', rollNumber: '2023-CS-211', role: 'MEMBER' }
    ]
  },
  {
    registrationId: 'CSF-2026-N4R8Q',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    eventId: 'cyber-siege',
    eventName: 'Capture The Flag: CyberSiege',
    registrationType: 'TEAM',
    teamName: 'NullPointer Exploits',
    leaderName: 'Omar Tariq',
    classGrade: 'BSCS Semester 5',
    section: 'C',
    rollNumber: '2023-CS-184',
    email: 'omar.tariq@student.edu',
    phone: '+1 555-018-7733',
    status: 'CONFIRMED',
    members: [
      { name: 'Hamza Siddiqui', classGrade: 'BSCS 5', section: 'C', rollNumber: '2023-CS-190', role: 'MEMBER' }
    ]
  },
  {
    registrationId: 'CSF-2026-P3B7K',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    eventId: 'neuro-vibe',
    eventName: 'NeuroVibe: GenAI Innovation Challenge',
    registrationType: 'INDIVIDUAL',
    teamName: '',
    leaderName: 'Mahnoor Fatima',
    classGrade: 'BSAI Semester 4',
    section: 'A',
    rollNumber: '2024-AI-012',
    email: 'mahnoor.f@student.edu',
    phone: '+1 555-012-3341',
    status: 'CONFIRMED',
    members: []
  }
];

export const Api = {
  /**
   * Initialize offline storage with seed data if not present
   */
  initMockStorage() {
    if (!localStorage.getItem(STORAGE_KEY_REGISTRATIONS)) {
      localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(SEED_REGISTRATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEY_SETTINGS)) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
        RegistrationOpen: true,
        AllowMultipleEvents: false,
        AdminPasskey: CONFIG.ADMIN.DEFAULT_PASSKEY
      }));
    }
  },

  /**
   * Helper to generate unique registration ID (CSF-2026-XXXXX)
   */
  generateRegistrationId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CSF-2026-${code}`;
  },

  /**
   * Fetch Events Catalog
   */
  async getEvents() {
    if (CONFIG.BACKEND.USE_MOCK_API) {
      return { ok: true, data: { events: CONFIG.EVENTS } };
    }

    try {
      const response = await fetch(`${CONFIG.BACKEND.APPS_SCRIPT_URL}?action=get_events`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      return await response.json();
    } catch (err) {
      console.warn('Live API request failed, falling back to local events catalog:', err);
      return { ok: true, data: { events: CONFIG.EVENTS } };
    }
  },

  /**
   * Submit new registration
   */
  async submitRegistration(registrationData) {
    if (CONFIG.BACKEND.USE_MOCK_API) {
      this.initMockStorage();
      await new Promise(resolve => setTimeout(resolve, 450)); // Realistic network latency simulation

      const regs = JSON.parse(localStorage.getItem(STORAGE_KEY_REGISTRATIONS) || '[]');
      const leaderRoll = String(registrationData.participant.rollNumber || '').trim().toUpperCase();
      const eventId = registrationData.eventId;

      // Duplicate check in Mock Mode
      const isLeaderDup = regs.some(r => {
        if (r.status === 'CANCELLED') return false;
        const sameLeader = r.rollNumber.toUpperCase() === leaderRoll;
        const sameMember = (r.members || []).some(m => m.rollNumber.toUpperCase() === leaderRoll);
        return (sameLeader || sameMember) && r.eventId === eventId;
      });

      if (isLeaderDup) {
        return {
          ok: false,
          error: {
            code: 'DUPLICATE_REGISTRATION',
            message: `Roll number "${leaderRoll}" is already registered for this competition.`
          }
        };
      }

      // Check each team member
      if (registrationData.registrationType === 'TEAM') {
        for (const m of (registrationData.members || [])) {
          const mRoll = String(m.rollNumber || '').trim().toUpperCase();
          const isMemberDup = regs.some(r => {
            if (r.status === 'CANCELLED') return false;
            const sameLeader = r.rollNumber.toUpperCase() === mRoll;
            const sameMember = (r.members || []).some(mem => mem.rollNumber.toUpperCase() === mRoll);
            return (sameLeader || sameMember) && r.eventId === eventId;
          });

          if (isMemberDup) {
            return {
              ok: false,
              error: {
                code: 'DUPLICATE_REGISTRATION',
                message: `Team member "${m.name}" (${mRoll}) is already registered for this competition.`
              }
            };
          }
        }
      }

      // Create new record
      const regId = this.generateRegistrationId();
      const newRecord = {
        registrationId: regId,
        timestamp: new Date().toISOString(),
        eventId: registrationData.eventId,
        eventName: registrationData.eventName,
        registrationType: registrationData.registrationType,
        teamName: registrationData.teamName || '',
        leaderName: registrationData.participant.name,
        classGrade: registrationData.participant.classGrade,
        section: registrationData.participant.section,
        rollNumber: leaderRoll,
        email: registrationData.participant.email,
        phone: registrationData.participant.phone,
        status: 'CONFIRMED',
        members: registrationData.members || []
      };

      regs.unshift(newRecord);
      localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(regs));

      return {
        ok: true,
        data: {
          registrationId: regId,
          message: 'Registration confirmed successfully!',
          registration: newRecord
        }
      };
    }

    // Live Google Apps Script API Call
    try {
      const response = await fetch(CONFIG.BACKEND.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'submit_registration',
          registrationData
        })
      });
      return await response.json();
    } catch (err) {
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the festival server. Please check your internet connection.'
        }
      };
    }
  },

  /**
   * Search / Lookup registration by Roll Number or Registration ID
   */
  async lookupRegistration(query) {
    const q = String(query || '').trim().toUpperCase();
    if (!q) {
      return { ok: false, error: { message: 'Please enter a Roll Number or Ticket ID.' } };
    }

    this.initMockStorage();
    const regs = JSON.parse(localStorage.getItem(STORAGE_KEY_REGISTRATIONS) || '[]');
    const match = regs.find(r => {
      const regIdMatch = (r.registrationId && r.registrationId.toUpperCase() === q);
      const leaderRollMatch = (r.rollNumber && r.rollNumber.toUpperCase() === q);
      const memberRollMatch = (r.members || []).some(m => m.rollNumber && m.rollNumber.toUpperCase() === q);
      return regIdMatch || leaderRollMatch || memberRollMatch;
    });

    if (match) {
      return { ok: true, data: { registration: match } };
    }

    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `No registration found matching "${q}". Verify your roll number or ticket ID.`
      }
    };
  },

  /**
   * Organizer Admin Login Verification
   */
  async adminLogin(passkey) {
    if (CONFIG.BACKEND.USE_MOCK_API) {
      await new Promise(r => setTimeout(r, 200));
      const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
      const expected = settings.AdminPasskey || CONFIG.ADMIN.DEFAULT_PASSKEY;

      if (String(passkey).trim() === expected) {
        return { ok: true, data: { authenticated: true } };
      }
      return { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid organizer passkey.' } };
    }

    try {
      const response = await fetch(CONFIG.BACKEND.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'admin_login', passkey })
      });
      return await response.json();
    } catch (err) {
      return { ok: false, error: { message: 'Server communication error during login.' } };
    }
  },

  /**
   * Fetch complete dataset for organizer dashboard
   */
  async adminGetData(passkey) {
    if (CONFIG.BACKEND.USE_MOCK_API) {
      this.initMockStorage();
      const regs = JSON.parse(localStorage.getItem(STORAGE_KEY_REGISTRATIONS) || '[]');

      let totalIndividual = 0;
      let totalTeam = 0;
      let checkedIn = 0;
      const breakdown = {};

      regs.forEach(r => {
        if (r.registrationType === 'TEAM') totalTeam++;
        else totalIndividual++;
        if (r.status === 'CHECKED_IN') checkedIn++;

        const evName = r.eventName || r.eventId;
        breakdown[evName] = (breakdown[evName] || 0) + 1;
      });

      return {
        ok: true,
        data: {
          metrics: {
            totalRegistrations: regs.length,
            totalIndividual,
            totalTeam,
            checkedIn,
            eventBreakdown: breakdown
          },
          registrations: regs
        }
      };
    }

    try {
      const response = await fetch(CONFIG.BACKEND.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'admin_get_data', passkey })
      });
      return await response.json();
    } catch (err) {
      return { ok: false, error: { message: 'Failed to retrieve organizer data.' } };
    }
  },

  /**
   * Update participant status (CONFIRMED, CHECKED_IN, CANCELLED)
   */
  async adminUpdateStatus(passkey, registrationId, newStatus) {
    if (CONFIG.BACKEND.USE_MOCK_API) {
      this.initMockStorage();
      const regs = JSON.parse(localStorage.getItem(STORAGE_KEY_REGISTRATIONS) || '[]');
      const item = regs.find(r => r.registrationId === registrationId);
      if (item) {
        item.status = newStatus;
        localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(regs));
        return { ok: true, data: { registrationId, status: newStatus } };
      }
      return { ok: false, error: { message: 'Registration not found.' } };
    }

    try {
      const response = await fetch(CONFIG.BACKEND.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'admin_update_status',
          passkey,
          registrationId,
          newStatus
        })
      });
      return await response.json();
    } catch (err) {
      return { ok: false, error: { message: 'Failed to update status on server.' } };
    }
  }
};
