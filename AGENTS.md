# EHX repository instructions

- Keep EHX confined to synthetic world objects. Resolve command targets against the internal registry. Preserve the anonymous operator model and keep operator-facing copy in-universe.
- Keep the simulation engine independent of the DOM, React and wall-clock reads. Inject time and keep generation reproducible by seed.
- Keep entity identifiers stable and migrate old snapshots before changing their schema. Validate imported JSON and render imported strings as text.
- Share state and evidence between departments. Keep runtime logs bounded and retain unresolved records.
- Preserve offline operation and local assets. Start generated audio only after user interaction. Respect reduced-motion preferences.
- Run `npm test`, `npm run lint` and `npm run build` before reporting changes. Report checks actually run.
