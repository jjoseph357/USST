# USST Flight Software Schedule

Task scheduler for the University of Saskatchewan Space Team (USST) Rocketry flight software crew, working toward Launch Canada 2027 (August 10–16, 2027). It deploys to GitHub Pages and shares data through Cloud Firestore.

## Screens

| Screen | Use it to |
| --- | --- |
| My work | See your tasks with one button for the next step (Start, Ready to test, Mark done), tasks nobody owns yet, what each person is working on, and the latest changes. |
| Board | See every task in four columns: To do, Doing, Testing, Done. Drag a card to change its status. Filter by subsystem, your own tasks, or search. |
| Plan | See which tasks have to finish before others can start. Drag from the dot on a task's right edge onto another task to add an arrow. Click an arrow to remove it. |

Click any task to open its panel. It says in plain words where the task stands and what is next. Every field saves as you edit. The URL updates to `#/<screen>?task=<ID>`, so you can paste a link to a task in Discord.

## Signing in

1. Press **Sign in** and pick your Google account. Anyone can look around without signing in, but only signed-in people can change things.
2. Pick your name from the crew list. This is remembered on each device.

The header shows whether your changes are saved: `All changes saved`, `Saving…`, or `Couldn’t save` with the error from Firestore. Each task records who last changed it and when. That record feeds the "Latest changes" list.

The dev server (`npm run dev`) lets you edit without signing in, because headless browser checks cannot complete Google sign-in. Those edits stay in your browser.

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
| `scheduler/ui/` | One module per screen (`home.ts`, `board.ts`, `map.ts`), plus the task panel, dialogs, and toasts. All markup goes through the escaping `html` template in `dom.ts`, which also holds the plain-language status wording. |
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
