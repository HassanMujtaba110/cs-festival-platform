/**
 * ============================================================================
 * CS FESTIVAL REGISTRATION PLATFORM - BACKEND (Google Apps Script)
 * File: Code.gs
 * Description: Production-grade API server running on Google Apps Script Web App.
 * Connects to Google Sheets as a database with $0 infrastructure cost.
 *
 * Features:
 *  - CORS Preflight Workaround (parses text/plain JSON payloads)
 *  - LockService concurrency protection (prevents race conditions & corrupt data)
 *  - Server-side unique registration ID generator (e.g., CSF-2026-7K4P9)
 *  - Duplicate prevention (checks Roll Number + Event ID)
 *  - Admin authentication & data aggregation (metrics, search, CSV data)
 * ============================================================================
 */

// Configuration Defaults
var CONFIG = {
  DEFAULT_PASSKEY: 'csf2026admin', // Can be overridden in 'Settings' sheet
  SHEET_NAMES: {
    REGISTRATIONS: 'Registrations',
    TEAM_MEMBERS: 'TeamMembers',
    EVENTS: 'Events',
    SETTINGS: 'Settings'
  },
  LOCK_TIMEOUT_MS: 30000 // 30 seconds
};

/**
 * Handle HTTP GET Requests (Health Check & Event Metadata)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'health';
  
  if (action === 'health') {
    return createJsonResponse({
      ok: true,
      data: {
        status: 'online',
        service: 'CS Festival Registration API',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (action === 'get_events') {
    return handleGetEvents();
  }

  return createJsonResponse({
    ok: false,
    error: { message: 'Invalid GET action specified.' }
  });
}

/**
 * Handle HTTP POST Requests (Submissions, Admin Operations)
 * Note: To bypass CORS preflight issues in Google Apps Script, the frontend
 * sends payload as stringified JSON with Content-Type: text/plain;charset=utf-8.
 */
function doPost(e) {
  // Acquire Script Lock to guarantee serial execution and prevent race conditions
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    hasLock = lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);
    if (!hasLock) {
      return createJsonResponse({
        ok: false,
        error: {
          code: 'SERVER_BUSY',
          message: 'The registration server is experiencing high traffic. Please try submitting again in a moment.'
        }
      });
    }

    // Parse incoming payload safely
    var payload;
    try {
      if (!e || !e.postData || !e.postData.contents) {
        throw new Error('Empty request payload received.');
      }
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createJsonResponse({
        ok: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Malformed JSON payload: ' + parseError.message
        }
      });
    }

    var action = payload.action;

    switch (action) {
      case 'submit_registration':
        return handleSubmitRegistration(payload.registrationData);

      case 'admin_login':
        return handleAdminLogin(payload.passkey);

      case 'admin_get_data':
        return handleAdminGetData(payload.passkey);

      case 'admin_update_status':
        return handleAdminUpdateStatus(payload.passkey, payload.registrationId, payload.newStatus);

      case 'get_events':
        return handleGetEvents();

      default:
        return createJsonResponse({
          ok: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: 'Action "' + action + '" is not recognized.'
          }
        });
    }

  } catch (globalError) {
    return createJsonResponse({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error: ' + globalError.toString()
      }
    });
  } finally {
    if (hasLock) {
      try {
        lock.releaseLock();
      } catch (err) {
        // Lock release safe-guard
      }
    }
  }
}

/**
 * Submit Registration Logic (Individual or Team)
 */
function handleSubmitRegistration(data) {
  if (!data) {
    return createJsonResponse({
      ok: false,
      error: { code: 'MISSING_DATA', message: 'Registration data is missing.' }
    });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsInitialized(ss);

  // 1. Verify if registrations are currently open in Settings
  var settings = getSettingsMap(ss);
  if (settings['RegistrationOpen'] === 'FALSE' || settings['RegistrationOpen'] === false) {
    return createJsonResponse({
      ok: false,
      error: {
        code: 'REGISTRATIONS_CLOSED',
        message: 'Registrations are currently closed by the festival organizers.'
      }
    });
  }

  var eventId = String(data.eventId || '').trim();
  var eventName = String(data.eventName || '').trim();
  var regType = String(data.registrationType || 'INDIVIDUAL').toUpperCase().trim();
  var participant = data.participant || {};
  var members = Array.isArray(data.members) ? data.members : [];

  // 2. Validate Participant / Leader Information
  var leaderName = String(participant.name || '').trim();
  var leaderClass = String(participant.classGrade || '').trim();
  var leaderSection = String(participant.section || '').trim().toUpperCase();
  var leaderRoll = String(participant.rollNumber || '').trim().toUpperCase();
  var leaderEmail = String(participant.email || '').trim().toLowerCase();
  var leaderPhone = String(participant.phone || '').trim();
  var teamName = regType === 'TEAM' ? String(data.teamName || '').trim() : '';

  if (!eventId || !leaderName || !leaderRoll || !leaderEmail || !leaderPhone) {
    return createJsonResponse({
      ok: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Required fields are missing (Name, Roll Number, Email, Phone, or Event).'
      }
    });
  }

  if (regType === 'TEAM' && !teamName) {
    return createJsonResponse({
      ok: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Team Name is required for team registrations.'
      }
    });
  }

  // 3. Duplicate Prevention Check (Server-Side)
  var allowMultiEvents = settings['AllowMultipleEvents'] === 'TRUE' || settings['AllowMultipleEvents'] === true;
  var regSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.REGISTRATIONS);
  var memberSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TEAM_MEMBERS);

  // Check Leader Roll Number
  var leaderDupCheck = checkDuplicateRoll(regSheet, memberSheet, leaderRoll, eventId, allowMultiEvents);
  if (leaderDupCheck.isDuplicate) {
    return createJsonResponse({
      ok: false,
      error: {
        code: 'DUPLICATE_REGISTRATION',
        message: 'Roll number "' + leaderRoll + '" is already registered for ' + leaderDupCheck.existingEventName + '.'
      }
    });
  }

  // Check Each Member Roll Number in Team
  if (regType === 'TEAM') {
    var seenRolls = {};
    seenRolls[leaderRoll] = true;

    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var mRoll = String(m.rollNumber || '').trim().toUpperCase();
      var mName = String(m.name || '').trim();

      if (!mRoll || !mName) continue;

      if (seenRolls[mRoll]) {
        return createJsonResponse({
          ok: false,
          error: {
            code: 'DUPLICATE_IN_TEAM',
            message: 'Roll number "' + mRoll + '" is listed multiple times within your team roster.'
          }
        });
      }
      seenRolls[mRoll] = true;

      var memberDupCheck = checkDuplicateRoll(regSheet, memberSheet, mRoll, eventId, allowMultiEvents);
      if (memberDupCheck.isDuplicate) {
        return createJsonResponse({
          ok: false,
          error: {
            code: 'DUPLICATE_REGISTRATION',
            message: 'Team member "' + mName + '" (' + mRoll + ') is already registered for ' + memberDupCheck.existingEventName + '.'
          }
        });
      }
    }
  }

  // 4. Generate Server-Side Unique Registration ID (e.g. CSF-2026-7K4P9)
  var registrationId = generateUniqueRegistrationId(regSheet);
  var timestamp = new Date().toISOString();
  var initialStatus = 'CONFIRMED';

  // 5. Append to Registrations Sheet
  // Schema: [RegistrationID, Timestamp, EventID, EventName, RegistrationType, TeamName, LeaderName, Class, Section, RollNumber, Email, Phone, Status]
  regSheet.appendRow([
    registrationId,
    timestamp,
    eventId,
    eventName,
    regType,
    teamName,
    leaderName,
    leaderClass,
    leaderSection,
    leaderRoll,
    leaderEmail,
    leaderPhone,
    initialStatus
  ]);

  // 6. Append Team Members (if team registration)
  // Schema: [RegistrationID, MemberName, Class, Section, RollNumber, Role]
  if (regType === 'TEAM') {
    // Append Captain
    memberSheet.appendRow([
      registrationId,
      leaderName,
      leaderClass,
      leaderSection,
      leaderRoll,
      'LEADER'
    ]);

    // Append Members
    for (var j = 0; j < members.length; j++) {
      var member = members[j];
      var memName = String(member.name || '').trim();
      var memRoll = String(member.rollNumber || '').trim().toUpperCase();
      var memClass = String(member.classGrade || '').trim();
      var memSec = String(member.section || '').trim().toUpperCase();

      if (memName && memRoll) {
        memberSheet.appendRow([
          registrationId,
          memName,
          memClass,
          memSec,
          memRoll,
          'MEMBER'
        ]);
      }
    }
  }

  // 7. Return Confirmation Payload
  return createJsonResponse({
    ok: true,
    data: {
      registrationId: registrationId,
      timestamp: timestamp,
      eventId: eventId,
      eventName: eventName,
      registrationType: regType,
      teamName: teamName,
      leaderName: leaderName,
      rollNumber: leaderRoll,
      status: initialStatus,
      memberCount: regType === 'TEAM' ? members.length + 1 : 1
    }
  });
}

/**
 * Check if a roll number is already registered for an event
 */
function checkDuplicateRoll(regSheet, memberSheet, rollNumber, eventId, allowMultiEvents) {
  var regData = regSheet.getDataRange().getValues();
  if (regData.length > 1) {
    for (var i = 1; i < regData.length; i++) {
      var row = regData[i];
      var existingRoll = String(row[9] || '').trim().toUpperCase();
      var existingEvent = String(row[2] || '').trim();
      var existingEventName = String(row[3] || 'another event').trim();
      var existingStatus = String(row[12] || '').trim().toUpperCase();

      if (existingStatus === 'CANCELLED') continue;

      if (existingRoll === rollNumber) {
        if (!allowMultiEvents || existingEvent === eventId) {
          return { isDuplicate: true, existingEventName: existingEventName };
        }
      }
    }
  }

  // Also check Team Members table
  var memberData = memberSheet.getDataRange().getValues();
  if (memberData.length > 1) {
    var regIdToEvent = {};
    for (var r = 1; r < regData.length; r++) {
      var rRow = regData[r];
      regIdToEvent[rRow[0]] = {
        eventId: String(rRow[2] || '').trim(),
        eventName: String(rRow[3] || 'another event').trim(),
        status: String(rRow[12] || '').trim().toUpperCase()
      };
    }

    for (var m = 1; m < memberData.length; m++) {
      var mRow = memberData[m];
      var mRegId = String(mRow[0] || '').trim();
      var mRoll = String(mRow[4] || '').trim().toUpperCase();

      var regInfo = regIdToEvent[mRegId];
      if (!regInfo || regInfo.status === 'CANCELLED') continue;

      if (mRoll === rollNumber) {
        if (!allowMultiEvents || regInfo.eventId === eventId) {
          return { isDuplicate: true, existingEventName: regInfo.eventName };
        }
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Generate Unique Human-Readable ID (e.g., CSF-2026-7K4P9)
 */
function generateUniqueRegistrationId(regSheet) {
  var year = new Date().getFullYear();
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing chars (0, O, 1, I)
  var existingIds = {};

  var data = regSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    existingIds[String(data[i][0]).trim()] = true;
  }

  for (var attempt = 0; attempt < 20; attempt++) {
    var code = '';
    for (var c = 0; c < 5; c++) {
      var randIndex = Math.floor(Math.random() * chars.length);
      code += chars.charAt(randIndex);
    }
    var candidateId = 'CSF-' + year + '-' + code;
    if (!existingIds[candidateId]) {
      return candidateId;
    }
  }

  // Fallback with timestamp slice
  return 'CSF-' + year + '-' + Date.now().toString(36).toUpperCase().slice(-5);
}

/**
 * Admin Authentication
 */
function handleAdminLogin(passkey) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsInitialized(ss);
  var settings = getSettingsMap(ss);
  var expectedPasskey = settings['AdminPasskey'] || CONFIG.DEFAULT_PASSKEY;

  if (String(passkey || '').trim() === String(expectedPasskey).trim()) {
    return createJsonResponse({
      ok: true,
      data: {
        authenticated: true,
        message: 'Admin access granted.'
      }
    });
  } else {
    return createJsonResponse({
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Incorrect organizer passkey.'
      }
    });
  }
}

/**
 * Admin Data Fetch (Registrations, Team Members, Metrics)
 */
function handleAdminGetData(passkey) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsInitialized(ss);
  var settings = getSettingsMap(ss);
  var expectedPasskey = settings['AdminPasskey'] || CONFIG.DEFAULT_PASSKEY;

  if (String(passkey || '').trim() !== String(expectedPasskey).trim()) {
    return createJsonResponse({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized admin request.' }
    });
  }

  var regSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.REGISTRATIONS);
  var memberSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TEAM_MEMBERS);

  var regRows = regSheet.getDataRange().getValues();
  var memberRows = memberSheet.getDataRange().getValues();

  var teamMembersByRegId = {};
  if (memberRows.length > 1) {
    for (var m = 1; m < memberRows.length; m++) {
      var mRow = memberRows[m];
      var rId = String(mRow[0] || '').trim();
      if (!teamMembersByRegId[rId]) teamMembersByRegId[rId] = [];
      teamMembersByRegId[rId].push({
        name: mRow[1],
        classGrade: mRow[2],
        section: mRow[3],
        rollNumber: mRow[4],
        role: mRow[5]
      });
    }
  }

  var registrations = [];
  var totalIndividual = 0;
  var totalTeam = 0;
  var eventBreakdown = {};

  if (regRows.length > 1) {
    for (var r = 1; r < regRows.length; r++) {
      var row = regRows[r];
      var regId = String(row[0]);
      var eventId = String(row[2]);
      var eventName = String(row[3]);
      var regType = String(row[4]);
      var status = String(row[12]);

      if (regType === 'INDIVIDUAL') totalIndividual++;
      else if (regType === 'TEAM') totalTeam++;

      if (!eventBreakdown[eventId]) {
        eventBreakdown[eventId] = { name: eventName, count: 0 };
      }
      eventBreakdown[eventId].count++;

      registrations.push({
        registrationId: regId,
        timestamp: row[1],
        eventId: eventId,
        eventName: eventName,
        registrationType: regType,
        teamName: row[5],
        leaderName: row[6],
        classGrade: row[7],
        section: row[8],
        rollNumber: row[9],
        email: row[10],
        phone: row[11],
        status: status,
        members: teamMembersByRegId[regId] || []
      });
    }
  }

  return createJsonResponse({
    ok: true,
    data: {
      metrics: {
        totalRegistrations: registrations.length,
        totalIndividual: totalIndividual,
        totalTeam: totalTeam,
        eventBreakdown: eventBreakdown
      },
      registrations: registrations
    }
  });
}

/**
 * Admin Update Registration Status (e.g., CHECKED_IN, CANCELLED)
 */
function handleAdminUpdateStatus(passkey, registrationId, newStatus) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsInitialized(ss);
  var settings = getSettingsMap(ss);
  var expectedPasskey = settings['AdminPasskey'] || CONFIG.DEFAULT_PASSKEY;

  if (String(passkey || '').trim() !== String(expectedPasskey).trim()) {
    return createJsonResponse({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized admin request.' }
    });
  }

  var regSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.REGISTRATIONS);
  var data = regSheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(registrationId).trim()) {
      regSheet.getRange(i + 1, 13).setValue(newStatus);
      return createJsonResponse({
        ok: true,
        data: {
          registrationId: registrationId,
          status: newStatus,
          message: 'Status updated successfully.'
        }
      });
    }
  }

  return createJsonResponse({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Registration ID "' + registrationId + '" was not found.'
    }
  });
}

/**
 * Handle Get Events Action
 */
function handleGetEvents() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsInitialized(ss);
  var eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTS);
  var rows = eventsSheet.getDataRange().getValues();
  var events = [];

  if (rows.length > 1) {
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      events.push({
        id: row[0],
        name: row[1],
        category: row[2],
        registrationType: row[3],
        minTeamSize: row[4],
        maxTeamSize: row[5],
        status: row[6],
        venue: row[7],
        scheduleTime: row[8]
      });
    }
  }

  return createJsonResponse({
    ok: true,
    data: { events: events }
  });
}

/**
 * Ensures all standard sheets and headers exist
 */
function ensureSheetsInitialized(ss) {
  var sheetsToCreate = [
    {
      name: CONFIG.SHEET_NAMES.REGISTRATIONS,
      headers: [
        'RegistrationID', 'Timestamp', 'EventID', 'EventName',
        'RegistrationType', 'TeamName', 'LeaderName', 'Class',
        'Section', 'RollNumber', 'Email', 'Phone', 'Status'
      ]
    },
    {
      name: CONFIG.SHEET_NAMES.TEAM_MEMBERS,
      headers: [
        'RegistrationID', 'MemberName', 'Class', 'Section', 'RollNumber', 'Role'
      ]
    },
    {
      name: CONFIG.SHEET_NAMES.EVENTS,
      headers: [
        'EventID', 'EventName', 'Category', 'RegistrationType',
        'MinTeamSize', 'MaxTeamSize', 'Status', 'Venue', 'ScheduleTime'
      ]
    },
    {
      name: CONFIG.SHEET_NAMES.SETTINGS,
      headers: ['Key', 'Value']
    }
  ];

  for (var i = 0; i < sheetsToCreate.length; i++) {
    var item = sheetsToCreate[i];
    var sheet = ss.getSheetByName(item.name);
    if (!sheet) {
      sheet = ss.insertSheet(item.name);
      sheet.appendRow(item.headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, item.headers.length).setFontWeight('bold');

      // Populate default settings if newly created
      if (item.name === CONFIG.SHEET_NAMES.SETTINGS) {
        sheet.appendRow(['RegistrationOpen', 'TRUE']);
        sheet.appendRow(['AllowMultipleEvents', 'FALSE']);
        sheet.appendRow(['AdminPasskey', CONFIG.DEFAULT_PASSKEY]);
      }
    }
  }
}

/**
 * Returns Settings sheet as key-value dictionary
 */
function getSettingsMap(ss) {
  var settings = {};
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var key = String(data[i][0] || '').trim();
      var val = String(data[i][1] || '').trim();
      if (key) settings[key] = val;
    }
  }
  return settings;
}

/**
 * Helper to build JSON responses for Google Apps Script Web App
 */
function createJsonResponse(dataObj) {
  return ContentService.createTextOutput(JSON.stringify(dataObj))
    .setMimeType(ContentService.MimeType.JSON);
}
