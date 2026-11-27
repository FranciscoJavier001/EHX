# EHX — Enjoy Hacker Xperience

EHX is an offline intelligence game with a persistent world, a command terminal and interconnected departments.

## Run locally

Use Node 22.13+ from the Node 22 LTS line or Node 24+. Install with `npm ci` and run `npm run dev`. Use `npm test`, `npm run lint` and `npm run build` to verify the project. Serve the production build locally with `npm run preview`.

Offline operation requires an initial successful production load from localhost or HTTPS. Once the service worker has activated, reload offline using the same origin. Use the browser's install action or iOS Safari's Add to Home Screen action where available. Different origins and browser profiles have independent saves.

## First investigation

1. Enter or skip system initialization.
2. Open PLUS for the operator route and command reference, or type `help` in the terminal. Use Tab to complete commands and Up/Down to traverse command history.
3. Inspect `NODE-042` and analyze `SIGNAL-001` to establish a Shadow contact.
4. Ask OMEGA for a clue. Use Defense to investigate and restore a device when an incident opens.
5. Use Settings to switch modes, tune audio and motion, or export/import a JSON save. Change the interface language under Settings → Language.

## Current scope

The world uses procedural device, mission and document templates. OSINT starts with four public dispatches. Switch between English and Español under Settings → Language. The selection is saved on the device. Session logs and saves are bounded. The service worker and lazy-loaded modules ship together in the production build. Save replacement takes effect for the current browser origin. If another tab saves first, export the current session or reload to resume the latest stored universe.

See [architecture](ARCHITECTURE.md), [game design](GAME_DESIGN.md), [content guide](CONTENT_GUIDE.md), [commands](COMMANDS.md), [changelog](CHANGELOG.md) and [roadmap](ROADMAP.md).

## Browser smoke check

On the production preview, complete the first investigation, open and exit Cinematic mode through Settings, and reload offline after the service worker takes control. Check the same operator ID and OMEGA conversation after reload. Visit SIGINT and Settings while offline to exercise lazy-loaded departments. At a narrow viewport, open the mobile department menu and confirm that the page fits horizontally. Export a save, reset with the typed confirmation, import the save and check the restored identity. Inspect the browser console and network panel for errors and external requests.
