export const organizations = ['Vesper Relay', 'Morrow Index', 'Pale Meridian', 'Glass Harbour', 'Kestrel Array', 'Sable Cartography', 'Bracken Union', 'Night Loom', 'Cinder Works', 'Quiet Tern', 'Ivory Circuit', 'Northwake Office']
export const operators = ['Aster', 'Rook', 'Vale', 'Mica', 'Ash', 'Lumen', 'Pike', 'Ibis', 'Reed', 'Wren', 'Sable', 'Flint', 'Gale', 'Fern', 'Kite', 'Moth', 'Lark', 'Dusk', 'Rain', 'Frost']
export const satellites = ['APHELION', 'AFTERIMAGE', 'CANTICLE', 'DRIFTGLASS', 'FARSIDE', 'HUSH', 'LANTERN', 'UNDERTOW'].map((name, index) => ({
  name, id: 'SAT-' + (index + 1), inclination: 19 + index * 8, period: 86 + index * 5, phase: index * 45,
}))
export const arcs = [
  { title: 'The Quiet Relay', owner: 0, code: 'EMBER', cipher: 'HPEHU', node: 'NODE-042', premise: 'Vesper hid a spare clock in a relay that was meant to be silent.', link: 'The clock follows the same offset as the Glass Harbour beacon.' },
  { title: 'Borrowed Light', owner: 3, code: 'PRISM', cipher: 'SULVP', node: 'NODE-073', premise: 'Glass Harbour logged moonrise twice. The second entry originated from a relay on the ground.', link: 'The duplicate entry carries a Northwake catalog signature.' },
  { title: 'A Catalogue of Absences', owner: 11, code: 'TRACE', cipher: 'WUDFH', node: 'NODE-096', premise: 'Northwake filed an empty record every time a beacon missed its window.', link: 'The blanks reproduce the cadence of a Kestrel ranging pulse.' },
  { title: 'The Last Observer', owner: 4, code: 'WATCH', cipher: 'ZDWFK', node: 'NODE-125', premise: 'Kestrel operators recorded an observer that appeared only between two ranging pulses.', link: 'The observer signed the same clock record as the Quiet Relay.' },
]
const records = [
  ['Public dispatch', 'The consortium has opened its timing ledger for inspection.'],
  ['Field memorandum', 'Operators logged a repeating offset at the end of each observation window.'],
  ['Maintenance journal', 'A spare phase register was moved to the listed relay.'],
  ['Transcription', 'The call sign repeats three times before the channel goes quiet.'],
  ['Observation log', 'Three consecutive frames carry the same clock discrepancy.'],
  ['Incident appendix', 'Operators compared the deviation against a second reference clock.'],
  ['Restricted ledger', 'The discrepant frames were retained in a parallel ledger.'],
  ['Redacted interview', '[REDACTED] asked the night shift to preserve the raw timing labels.'],
  ['Experiment report', 'The next verification pass should correlate the timing sheet with the satellite register.'],
  ['Sealed conclusion', 'The observer is a persistent annotation within our own ledger.'],
]
export const documents = arcs.flatMap((arc, family) => records.map(([kind, text], index) => {
  const passages = index === 0 ? [arc.premise] : index === 9 ? [text, arc.link] : [text]
  const annotation = index === 9 ? 'witness ' + arc.node + '.' : ''
  return {
    id: 'ARCHIVE-' + String(family * 10 + index + 1).padStart(3, '0'), family, index,
    title: arc.title + ' / ' + kind, date: '2084-11-' + String(index + 10).padStart(2, '0'),
    owner: organizations[arc.owner], node: arc.node, passages, annotation,
    body: passages.join(' ') + (annotation ? ' Console annotation: ' + annotation : ''),
  }
}))
export const transmissions = [
  'Clock drift exceeded the observation envelope', 'The phase register is holding a duplicate frame',
  'Observation window opened with a late timestamp', 'A ledger acknowledgment arrived out of sequence',
  'The reserve clock has entered its test window', 'The beacon reported an unexpected phase offset',
  'Passive diagnostics recorded a brief signal dropout', 'The timing crew confirmed a stable carrier',
  'A maintenance marker appeared in the monitoring stream', 'Two observer logs share the same timestamp',
].flatMap((message) => ['timing', 'survey', 'archive', 'reserve', 'orbital', 'control', 'telemetry', 'beacon', 'relay', 'observer'].map(channel => ({ message, channel })))
export const eventTypes = [
  'Clock drift', 'Phase discrepancy', 'Late timestamp', 'Ledger mismatch', 'Reserve clock test',
  'Beacon offset', 'Signal dropout', 'Carrier stabilized', 'Maintenance marker', 'Observer overlap',
  'Window opened', 'Power fluctuation', 'Buffer delay', 'Frame duplicate', 'Ephemeris refresh',
  'Integrity warning', 'Timing correction', 'Calibration request', 'Checksum discrepancy', 'Channel handover',
  'Attestation due', 'Record verified', 'Spectrum shift', 'Sequence mismatch', 'Quiet interval',
  'Virtual link request', 'Register mismatch', 'Relay check', 'Thermal warning', 'Clock reconciliation',
]
export const missions = Array.from({ length: 15 }, (_, index) => {
  const family = index % 4
  const task = Math.floor(index / 4)
  const arc = arcs[family]
  const archive = documents[family * 10].id
  return {
    id: 'MISSION-' + (index + 1), title: arc.title + ' / ' + ['Orientation', 'Signal review', 'Ledger cross-check', 'Shadow confirmation'][task],
    description: ['Read the public dispatch and inspect its relay.', 'Analyze the fragmented transmission.', 'Compare the maintenance journal and observation log.', 'Establish a verified contact in the hidden registry.'][task],
    consequence: ['Dispatch and relay linked.', 'Transmission indexed as evidence.', 'Ledger chronology corroborated.', 'Shadow contact verified.'][task],
    objectives: [[arc.node, archive], ['SIGNAL-00' + (family + 1)], [documents[family * 10 + 2].id, documents[family * 10 + 4].id], ['SECRET-' + (family * 5 + 3)]][task],
  }
})
