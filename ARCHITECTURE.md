# Architecture

`src/engine` is independent of React. World creation takes a seed and clock value. Event advancement uses the seed and sequence plus the timestamp supplied by the caller. Each event links a source device and its neighbors to a synthetic transmission and a generated incident report. The oldest observed or resolved events rotate out of the log while pending incidents are retained. The event interval pauses while the tab is hidden.

`src/content/catalog.ts` owns the stable authored references for the procedural catalog. Keep catalog IDs stable across game versions or provide an explicit migration. `src/database/save.ts` owns the versioned snapshot, validation and IndexedDB transaction. Immutable device metadata is regenerated from the seed. Dynamic state is validated and projected onto defined fields. Separate light preferences live in LocalStorage. A reload can replay up to 12 retrospective events, one per five elapsed minutes.

`src/app` owns navigation, input, clock and sound activation. View components read the same state and send commands through the allowlisted registry. Departments and settings are lazy-loaded. State updates are serialized within an app instance. An atomic revision check rejects saves from stale tabs. The event work is bounded to 200 devices and 145 records, so it runs on the UI thread.

The production build hashes and precaches its complete static output, including lazy chunks and fonts. An installed update waits for an operator action before activation. Runtime audio synthesis starts after an interaction. SVG and Canvas render local data.

To add a department, register its module ID, label, navigation icon, and route view. Wire mutations through `commands.ts`. Add Spanish translations to the catalogs in `src/i18n` for new operator-facing text. Keep language preferences and user-facing strings independent of engine state identifiers.
