# USST Avionics Master Schedule

Master schedule and engineering backlog web application for the University Student Space Team (USST) Avionics division preparing for Launch Canada 2027.

The Google Sheet in your shared drive is the primary source of truth for all schedule dates and milestones. The website presents the timeline, Gantt chart, calendar, and workforce capacity model.

---

## Google Sheets Setup Instructions

Follow these steps to link your Google Sheet with the web application:

1. **Create the Spreadsheet**
   - Create a new Google Sheet inside your team's Shared Google Drive.
   - Name it `USST Avionics Master Schedule`.

2. **Add the Apps Script Backend**
   - In the Google Sheet, open **Extensions > Apps Script**.
   - Delete any default boilerplate in the code editor.
   - Open [`google-apps-script/Code.gs`](google-apps-script/Code.gs) in this repository and paste its entire contents into the editor.
   - In the toolbar dropdown, select `setupSpreadsheet` and click **Run**.
   - Grant the one-time Google permission prompt.
   - This populates two formatted sheets: `Schedule` (all deliverables and reviews) and `Backlog & Sizing` (subsystem priorities and student allocations).

3. **Deploy as a Web App**
   - In Apps Script, click **Deploy > New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Set **Execute as** to **Me** (your Google account).
   - Set **Who has access** to **Anyone** (allows the static GitHub Pages app to read rows).
   - Click **Deploy** and copy the generated **Web app URL**.

4. **Connect to the Web Application**
   - Open the web application.
   - Click **Connect Sheet** in the top navigation bar.
   - Paste the Web app URL and click **Save & Fetch Schedule**.
   - The web app will now sync with your Google Sheet.

5. **Optional: Native Google Sheets Gantt View**
   - In your Google Sheet, select the `Schedule` tab.
   - In the top menu, click **Insert > Timeline**.
   - Set the date range to **Start Date** and end date to **End Date**.
   - Google Sheets will generate a native interactive Gantt chart directly inside the spreadsheet.

---

## Modifying the Schedule

- To alter task start dates, deadlines, dependencies, or assignees, edit the values in the Google Sheet.
- Only members with Edit permissions on the Google Sheet in your Shared Google Drive can make changes.
- Click **Refresh** in the web app header to pull the latest updates.

---

## Features

- **Gantt Timeline:**
  - Clear horizontal timeline mapping deliverables and milestones from September kickoff through Launch Canada in August.
  - Smooth dependency curves linking predecessors to successors.
  - Scale toggle for Day, Week, and Month views.
  - Diamond markers for design reviews (IDR, PDR, CDR, FRR) and design freezes.
- **Monthly Calendar:**
  - Standard month grid with event chips.
  - Instant category filtering:
    - Avionics Hardware
    - Avionics Software
    - Milestones & Reviews
    - University Dates (Reading Weeks, Final Exam Blackouts)
- **Technical Backlog & Sizing:**
  - Software backlog sized in person-terms.
  - Hardware backlog prioritized by power stability and sensor reliability.
  - Live capacity model: Total Effort (9.0 person-terms) / Terms (2) = 4.5 active members required per term.

---

## Development & Build

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run unit tests
npm test

# Build production bundle for GitHub Pages
npm run build
```

---

## GitHub Pages Deployment

The repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`. Every push to `main` runs unit tests, compiles the production bundle, and publishes the site to GitHub Pages.
