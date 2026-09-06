# USST Avionics Master Schedule & Gantt

Interactive schedule management web application for the University Student Space Team (USST) Avionics division preparing for Launch Canada 2027.

The application combines an interactive Gantt chart, a milestone calendar, technical backlog tracking with team capacity modeling, and two-way Google Sheets synchronization with Google Drive access control.

---

## Features

- **Interactive Gantt Chart:**
  - Drag tasks horizontally to shift dates across time.
  - Left and right stretch handles to adjust task durations directly.
  - Automated dependency cascades for downstream tasks.
  - Smooth bezier dependency lines connecting predecessor to successor milestones.
  - Scale zoom controls: Day, Week, and Month views.
  - Visual milestone markers with gold pulse styling.
- **Milestone & Timeline Calendar:**
  - Monthly calendar view with multi-day event spans.
  - Quick-toggle category filter checkboxes:
    - Avionics Hardware
    - Avionics Software
    - Milestones & Formal Reviews (IDR, PDR, CDR, Launch Canada)
    - University Dates (Term Kickoff, Reading Weeks, Exam Blackouts)
    - Work Sessions (Hackathons, Sprints, Range Tests, Fit Checks)
- **Technical Backlog & Sizing:**
  - Full Whiteboard 1 software and hardware backlog items with priority badges.
  - Sizing allocation modeled in person-terms.
  - Interactive workforce capacity formula:
    $$\text{Team Members Required Per Term} = \frac{\text{Total Sized Effort}}{\text{Terms}}$$
    Baseline: $9.0\text{ person-terms} / 2\text{ terms} = 4.5\text{ team members per term}$.
- **Google Sheets & Shared Google Drive Sync:**
  - Client-side synchronization with Google Sheets stored in your team's Shared Google Drive.
  - Permission enforcement: Only users with Edit permissions on the Google Sheet in Google Drive can write changes.
  - Turnkey Google Apps Script (`google-apps-script/Code.gs`) providing a dedicated REST endpoint.
  - Compatible with Google Sheets native **Timeline View** (`Insert > Timeline`).
  - Offline CSV export and import support.
  - Automatic `localStorage` caching so the app works without network dependencies.

---

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated tests (Vitest)
npm test

# Build production bundle
npm run build
```

---

## Deploying to GitHub Pages

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes the web application to GitHub Pages automatically on push to `main`.

1. Push this repository to GitHub.
2. Go to your repository **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Any commit pushed to `main` will automatically build and deploy the site.

---

## Connecting Google Sheets & Shared Drive

1. Create a spreadsheet in your team's Shared Google Drive.
2. In Google Sheets, navigate to **Extensions > Apps Script**.
3. Copy and paste the script from [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
4. Run `setupSpreadsheet()` once from the editor to initialize headers and sheet tabs (`Schedule` and `Backlog & Sizing`).
5. Click **Deploy > New deployment > Web app**:
   - Execute as: **User accessing the web app** or **Me**
   - Who has access: **Anyone within your domain** or **Anyone**
6. Copy the resulting Web App URL.
7. Open the USST Master Schedule web app, click **⚙ Google Sheets**, paste the Web App URL, and click **Save Configuration**.
8. Use **Pull from Google Sheets** and **Push Changes to Sheets** to sync bi-directionally.

---

## Architecture & Code Organization

- `src/types/`: Domain TypeScript models (`ScheduleTask`, `BacklogItem`, `CategoryFilterState`, `GoogleSyncConfig`).
- `src/domain/`: Pure domain logic (`schedule-graph.ts`, `date-utils.ts`). Pure calculations with no DOM or framework dependencies.
- `src/services/`: Boundary adapters (`sheets-adapter.ts` for row/CSV mapping, `google-sync.ts` for network calls).
- `src/components/`: Modular UI views (`GanttChart`, `CalendarView`, `BacklogView`, `TaskModal`, `SyncModal`).
- `src/styles/`: Rocketry dark design system (`main.css`) using vanilla CSS custom properties.
- `tests/`: Automated unit tests for graph shifting, dependency propagation, date math, and sheets adapter.
