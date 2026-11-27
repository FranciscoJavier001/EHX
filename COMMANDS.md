# Terminal commands

Commands are case-insensitive. Command names and entity identifiers stay the same in English and Spanish. OMEGA accepts questions in either language. Entity identifiers are normalized by each handler. Enter `help` to see the active registry or `plus` to open the searchable command reference and guided route.

| Commands | Action |
| --- | --- |
| `help`, `clear`, `status`, `operator`, `modules`, `history` | Local console actions |
| `center`, `system`, `network`, `nodes`, `signals`, `defense`, `incidents`, `orbital`, `osint`, `archive`, `crypto`, `forensics`, `shadow`, `missions`, `omega`, `settings` | Open departments |
| `inspect NODE-042`, `inspect SAT-1` | Virtual device or orbital record |
| `open ARCHIVE-001`, `analyze SIGNAL-001`, `trace EVENT-005` | Read related evidence |
| `isolate NODE-042`, `restore NODE-042`, `reject EVENT-005` | Synthetic defense actions |
| `connect NODE-042`, `disconnect NODE-042`, `connect OMEGA` | Virtual sessions and OMEGA interface |
| `solve KEYWORD`, `ask MESSAGE` | Narrative progression and conversation |
| `accept MISSION-1`, `abandon MISSION-1` | Optional missions |
| `favorite status`, `process clockd` | Toggle a quick command or a virtual process |

Extend the explicit registry in `src/engine/commands.ts` with a handler that resolves input against fictional entities. Add a test for any new state change.

## BLACK

| Command | Action |
| --- | --- |
| `black`, `market` | Open BLACK and see the credit balance |
| `contract MKT-01` | Accept an available commission |
| `review MKT-01` | Read a sealed audit and collect its credit reward |
| `dispatch MKT-03` | Play the sealed frontier order and reveal its closing dispatch |
| `publish MKT-03` | Publish the frontier dossier and forfeit the escrow |
| `seal MKT-03` | Seal the frontier dossier and collect the escrow |

The energy and aviation audits unlock the frontier dossier. The cybersecurity commission is optional.
