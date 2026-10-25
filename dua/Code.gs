/**
 * IslamicFamily: Prayers for the Land and Its People, Volume 2
 * Submission backend (Google Apps Script web app)
 *
 * What it does
 *  - doPost: receives a submitted dua, appends it to a Google Sheet, emails you
 *  - doGet:  returns only the rows where the "Approved" checkbox is ticked,
 *            so the carousel on the page shows them
 *
 * SETUP (about 5 minutes)
 *  1. Go to script.google.com, create a New project, paste this whole file in.
 *  2. (Optional) Set NOTIFY_EMAIL below. Blank = the Google account running the script.
 *  3. Select the function "setup" and press Run. Approve the permissions.
 *     It creates the spreadsheet and logs its link (View > Logs / Execution log).
 *  4. Deploy > New deployment > type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *     Copy the Web app URL (ends in /exec).
 *  5. Paste that URL into APPS_SCRIPT_URL at the top of the HTML page.
 *
 * REVIEWING
 *  Open the sheet. Read the dua, then tick the box in column A ("Approved").
 *  It appears in the carousel within about 2 minutes (responses are cached briefly).
 *  Untick the box to remove it.
 *
 * IF YOU EDIT THIS CODE LATER: Deploy > Manage deployments > edit > New version.
 */

const CONFIG = {
  NOTIFY_EMAIL: '',            // e.g. 'you@islamicfamily.ca'. Blank = script owner.
  SHEET_NAME: 'Submissions',
  SPREADSHEET_TITLE: 'Land Acknowledging Duas, Volume 2 (submissions)',
  MAX_DUA_LENGTH: 3000,
  CACHE_SECONDS: 120
};

const HEADERS = [
  'Approved',        // A: checkbox, you tick this
  'Received',        // B
  'Dua',             // C
  'First name',      // D
  'Last name',       // E
  'Title',           // F
  'Job title',       // G
  'Organization',    // H
  'Anonymous',       // I
  'Permission to publish', // J
  'Postal code'      // K (if your sheet already exists, add this header in K1 by hand)
];

/** Run once. Creates the spreadsheet with a checkbox column. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SHEET_ID')) {
    Logger.log('Already set up: ' + SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getUrl());
    return;
  }
  const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_TITLE);
  const sheet = ss.getSheets()[0];
  sheet.setName(CONFIG.SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange(2, 1, 2000, 1).insertCheckboxes();
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 520);
  sheet.getRange(2, 3, 2000, 1).setWrap(true).setVerticalAlignment('top');
  props.setProperty('SHEET_ID', ss.getId());
  Logger.log('Created: ' + ss.getUrl());
}

function getSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Run setup() first.');
  return SpreadsheetApp.openById(id).getSheetByName(CONFIG.SHEET_NAME);
}

function clean_(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Submission endpoint. */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Honeypot: real people leave this empty. Pretend success so bots move on.
    if (body.website) return json_({ ok: true });

    const dua = clean_(body.dua, CONFIG.MAX_DUA_LENGTH);
    const first = clean_(body.firstName, 80);
    const last = clean_(body.lastName, 80);
    const title = clean_(body.title, 60);
    const jobTitle = clean_(body.jobTitle, 120);
    const org = clean_(body.organization, 160);
    const postal = clean_(body.postalCode, 12);
    const anonymous = body.anonymous === true;
    const permission = body.permission === true;

    if (dua.length < 20) return json_({ ok: false, error: 'Please write a little more in your dua.' });
    if (!first || !last) return json_({ ok: false, error: 'First and last name are required.' });
    if (!permission) return json_({ ok: false, error: 'Permission to share is required to submit.' });

    // Stop spreadsheet formula injection
    const safe = function (s) { return /^[=+\-@]/.test(s) ? "'" + s : s; };

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet_();
      const row = sheet.getLastRow() + 1;
      sheet.getRange(row, 1, 1, HEADERS.length).setValues([[
        false, new Date(), safe(dua), safe(first), safe(last), safe(title),
        safe(jobTitle), safe(org), anonymous, permission, safe(postal)
      ]]);
      // Make sure the checkbox renders even past the pre-filled range
      sheet.getRange(row, 1).insertCheckboxes();
      sendNotification_(first, last, anonymous, dua, row);
    } finally {
      lock.releaseLock();
    }
    CacheService.getScriptCache().remove('approved');
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Something went wrong on our side. Please try again.' });
  }
}

function sendNotification_(first, last, anonymous, dua, row) {
  const to = CONFIG.NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;
  const url = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')).getUrl();
  const preview = dua.length > 600 ? dua.slice(0, 600) + '...' : dua;
  MailApp.sendEmail({
    to: to,
    subject: 'New land acknowledging dua from ' + first + ' ' + last + (anonymous ? ' (anonymous)' : ''),
    body:
      'A new dua was submitted for Volume 2.\n\n' +
      'From: ' + first + ' ' + last + (anonymous ? ' (asked to be anonymous)' : '') + '\n\n' +
      preview + '\n\n' +
      'Review it and tick "Approved" (column A, row ' + row + ') to add it to the carousel:\n' + url
  });
}

/** Read endpoint: approved duas only, with attribution worked out here. */
function doGet(e) {
  try {
    const cache = CacheService.getScriptCache();
    const hit = cache.get('approved');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);

    const sheet = getSheet_();
    const last = sheet.getLastRow();
    const duas = [];
    if (last >= 2) {
      const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      rows.forEach(function (r) {
        const approved = r[0] === true;
        const text = String(r[2] || '').trim();
        if (!approved || !text) return;
        const anonymous = r[8] === true;
        let name = 'Anonymous';
        let role = '';
        if (!anonymous) {
          name = [r[5], r[3], r[4]].map(function (x) { return String(x || '').trim(); }).filter(Boolean).join(' ');
          role = [r[6], r[7]].map(function (x) { return String(x || '').trim(); }).filter(Boolean).join(', ');
        }
        duas.push({ dua: text, name: name, role: role });
      });
    }
    const out = JSON.stringify({ duas: duas });
    cache.put('approved', out, CONFIG.CACHE_SECONDS);
    return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return json_({ duas: [] });
  }
}
