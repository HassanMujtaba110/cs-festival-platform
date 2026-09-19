# 5-Minute Google Sheets & Apps Script Setup Guide

Follow this guide to deploy your zero-cost, serverless backend using Google Sheets and Google Apps Script.

---

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Title it: **`CS Festival 2026 Database`**.
3. You do not need to manually create tabs or headers — the script will automatically create:
   - `Registrations`
   - `TeamMembers`
   - `Events`
   - `Settings` (with default admin passkey: `csf2026admin`)

---

## Step 2: Open Google Apps Script

1. In your spreadsheet, click on **Extensions** in the top menu bar.
2. Select **Apps Script**.
3. A new tab will open with the Apps Script code editor.
4. Delete any code currently in the `Code.gs` file.
5. Copy the entire contents of [`backend/Code.gs`](./Code.gs) and paste it into the editor.
6. Click the **Save** icon (floppy disk) or press `Ctrl + S`.

---

## Step 3: Deploy as a Web App

1. In the top right corner of the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Configure the deployment settings:
   - **Description**: `CSF 2026 Production API`
   - **Execute as**: `Me (your email)` *(This ensures it writes to your sheet without asking participants for Google sign-in)*
   - **Who has access**: `Anyone` *(Crucial: Allows school participants to submit without logging into Google)*
4. Click **Deploy**.
5. Google will ask for **Authorization**:
   - Click **Authorize access**.
   - Select your Google account.
   - If you see "Google hasn't verified this app", click **Advanced** (bottom left), then click **Go to Untitled project (unsafe)**.
   - Click **Allow**.
6. Copy the generated **Web App URL** (it ends in `/exec`).

---

## Step 4: Connect Frontend to Your Web App

1. Open `js/config.js` in this repository.
2. Paste your Web App URL into the `APPS_SCRIPT_WEB_APP_URL` field:
   ```javascript
   export const festivalConfig = {
     // ...
     backend: {
       APPS_SCRIPT_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
     }
   };
   ```
3. In `js/api.js`, set `USE_MOCK_API = false;` to switch from mock local testing to live Google Sheets!

---

## How to Change the Admin Passkey
- In your Google Sheet, switch to the `Settings` tab.
- Find the row where Key is `AdminPasskey`.
- Change the Value in Column B to any secret password you prefer.
- Your change takes effect immediately without redeploying!
