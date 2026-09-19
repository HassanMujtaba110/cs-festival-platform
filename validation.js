/**
 * ============================================================================
 * FORM VALIDATION ENGINE - CS FESTIVAL 2026
 * ============================================================================
 * Robust, zero-layout-shift client-side validation logic with clear,
 * human-friendly error messages and keyboard/focus accessibility.
 */

import { CONFIG } from './config.js';

export const Validation = {
  /**
   * Validate a single input field value against type
   */
  validateField(type, value, required = true) {
    const trimmed = String(value || '').trim();

    if (required && !trimmed) {
      return { isValid: false, message: 'This field is required.' };
    }

    if (!required && !trimmed) {
      return { isValid: true, message: '' };
    }

    switch (type) {
      case 'name':
        if (trimmed.length < 3) {
          return { isValid: false, message: 'Full name must be at least 3 characters.' };
        }
        if (!CONFIG.VALIDATION.NAME_REGEX.test(trimmed)) {
          return { isValid: false, message: 'Please enter a valid human name (letters only).' };
        }
        return { isValid: true, message: '' };

      case 'rollNumber':
        if (trimmed.length < 4) {
          return { isValid: false, message: 'Roll number must be at least 4 characters.' };
        }
        if (!CONFIG.VALIDATION.ROLL_NUMBER_REGEX.test(trimmed)) {
          return { isValid: false, message: 'Format should be like 2026-CS-042 or CS24-102.' };
        }
        return { isValid: true, message: '' };

      case 'email':
        if (!CONFIG.VALIDATION.EMAIL_REGEX.test(trimmed)) {
          return { isValid: false, message: 'Please enter a valid email address.' };
        }
        return { isValid: true, message: '' };

      case 'phone':
        if (!CONFIG.VALIDATION.PHONE_REGEX.test(trimmed) || trimmed.replace(/\D/g, '').length < 8) {
          return { isValid: false, message: 'Please enter a valid phone number (min 8 digits).' };
        }
        return { isValid: true, message: '' };

      case 'classGrade':
        if (!trimmed) {
          return { isValid: false, message: 'Please specify your class or semester.' };
        }
        return { isValid: true, message: '' };

      case 'section':
        if (!trimmed) {
          return { isValid: false, message: 'Please specify your section.' };
        }
        return { isValid: true, message: '' };

      case 'teamName':
        if (trimmed.length < 3) {
          return { isValid: false, message: 'Team name must be at least 3 characters.' };
        }
        if (!CONFIG.VALIDATION.TEAM_NAME_REGEX.test(trimmed)) {
          return { isValid: false, message: 'Only letters, numbers, and basic punctuation permitted.' };
        }
        return { isValid: true, message: '' };

      default:
        return { isValid: true, message: '' };
    }
  },

  /**
   * Set field visual state and update reserved feedback container
   */
  applyFieldFeedback(inputEl, feedbackEl, result) {
    if (!inputEl) return;

    if (result.isValid) {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.add('is-valid');
      if (feedbackEl) {
        feedbackEl.textContent = '';
      }
    } else {
      inputEl.classList.remove('is-valid');
      inputEl.classList.add('is-invalid');
      if (feedbackEl) {
        feedbackEl.textContent = result.message;
      }
    }
  },

  /**
   * Clear validation markings from an input
   */
  clearFieldFeedback(inputEl, feedbackEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid', 'is-valid');
    if (feedbackEl) {
      feedbackEl.textContent = '';
    }
  },

  /**
   * Validate entire registration payload before API dispatch
   */
  validateRegistrationPayload(payload, eventMeta) {
    const errors = [];

    if (!payload.eventId) {
      errors.push('An event must be selected.');
    }

    const isTeam = payload.registrationType === 'TEAM';

    // 1. Leader / Primary participant validation
    const p = payload.participant || {};
    const nameRes = this.validateField('name', p.name);
    if (!nameRes.isValid) errors.push(`Leader: ${nameRes.message}`);

    const rollRes = this.validateField('rollNumber', p.rollNumber);
    if (!rollRes.isValid) errors.push(`Leader: ${rollRes.message}`);

    const emailRes = this.validateField('email', p.email);
    if (!emailRes.isValid) errors.push(`Leader: ${emailRes.message}`);

    const phoneRes = this.validateField('phone', p.phone);
    if (!phoneRes.isValid) errors.push(`Leader: ${phoneRes.message}`);

    if (!p.classGrade) errors.push('Leader: Class or Year is required.');
    if (!p.section) errors.push('Leader: Section is required.');

    // 2. Team validations
    if (isTeam) {
      const teamNameRes = this.validateField('teamName', payload.teamName);
      if (!teamNameRes.isValid) errors.push(teamNameRes.message);

      const members = Array.isArray(payload.members) ? payload.members : [];
      const totalTeamSize = 1 + members.length; // Leader counts as 1

      if (eventMeta) {
        if (totalTeamSize < eventMeta.minTeamSize) {
          errors.push(`This competition requires at least ${eventMeta.minTeamSize} members (including team lead).`);
        }
        if (totalTeamSize > eventMeta.maxTeamSize) {
          errors.push(`This competition allows at most ${eventMeta.maxTeamSize} members.`);
        }
      }

      // Check for duplicate roll numbers within team
      const seenRolls = new Set();
      const leaderRollNorm = String(p.rollNumber || '').trim().toUpperCase();
      if (leaderRollNorm) seenRolls.add(leaderRollNorm);

      members.forEach((m, idx) => {
        const mNum = idx + 2;
        const mName = String(m.name || '').trim();
        const mRoll = String(m.rollNumber || '').trim().toUpperCase();

        if (!mName) {
          errors.push(`Member #${mNum}: Full Name is required.`);
        }
        if (!mRoll) {
          errors.push(`Member #${mNum}: Roll Number is required.`);
        } else {
          if (seenRolls.has(mRoll)) {
            errors.push(`Member #${mNum} has duplicate roll number "${mRoll}" already listed in your team.`);
          }
          seenRolls.add(mRoll);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
