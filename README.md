# USST Flight Software Schedule

Task scheduler for the University of Saskatchewan Space Team (USST) Rocketry flight software crew, working toward Launch Canada 2027 (August 10–16, 2027). It deploys to GitHub Pages and shares data through Cloud Firestore.

## Views

| View | Key | Use it to |
| --- | --- | --- |
| Overview | `1` | See the launch countdown, what is ready to start (ranked by how much work it unblocks), bottlenecks, the critical path, hardware waits, and your own tasks. |
| Dependency map | `2` | See every task as a graph: one swimlane per subsystem, one column per dependency depth. Hover a task to trace what it waits on and what waits on it. Drag a task's right edge onto another task to link them. Click a line to unlink. |
| Board | `3` | Move tasks between statuses by dragging cards. |
| List | `4` | Scan and update status per subsystem in a table. |

Click any task to open its side panel. Every field saves as you edit. The URL updates to `#/<view>?task=<ID>`, so you can paste a link to a task in Discord.

Other shortcuts: `/` focuses search, `N` creates a task, `Esc` closes the panel.

## Accounts and sync

- **Who are you?** picks your seat on the crew. It drives "Assign me", "Mine", and "Your tasks". It is stored per browser and is not a login.
- **Sign in with Google** lets your changes save to Firestore for everyone. Signed-out visitors still see live data, but their edits stay in their own browser.
- The sync indicator in the header reports what actually happened: `Live · not signed in`, `Saving…`, `Saved`, or `Not saved` with the Firestore error.

### Firebase setup

Google sign-in is enabled for project `usst-rocketry-hub`, and `jjoseph357.github.io` is an authorized domain. If the site moves to another domain, add it in **Authentication > Settings > Authorized domains**.

`firestore.rules` lets anyone read the board and any signed-in Google account create, edit, and delete tasks and subsystems. Deploy rule changes with `firebase deploy --only firestore:rules`.

## Code layout

| Path | Owns |
| --- | --- |
| `app.js` | Crew, subsystems, tasks, filters, and every mutation. No DOM access, so tests import it directly. |
| `firebase.js` | Firestore listeners and writes, Google sign-in, and the sync status. |
| `scheduler/graph.ts` | Pure dependency analysis: depth, impact, critical path, cycle check, and map layout. |
| `scheduler/main.ts` | Routing, rendering, keyboard shortcuts, and the action table. |
| `scheduler/ui/` | One module per view, plus the task panel, dialogs, and toasts. All markup goes through the escaping `html` template in `dom.ts`. |
| `src/` | The earlier recruitment booth site. `index.html` does not load it. |

## Development

Requires Node.js 20 or later.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests
npm run build    # type-check and production build into dist/
```

Pushing to `main` runs the tests, builds, and deploys to GitHub Pages.
