export const commandGroups = {
  Console: ['help', 'clear', 'status', 'operator', 'modules', 'history', 'favorite', 'process'],
  Departments: ['center', 'system', 'network', 'nodes', 'signals', 'defense', 'incidents', 'orbital', 'osint', 'archive', 'crypto', 'forensics', 'shadow', 'missions', 'omega', 'settings', 'black', 'market', 'plus'],
  Investigation: ['inspect', 'open', 'analyze', 'trace', 'solve', 'ask', 'witness'],
  Operations: ['connect', 'disconnect', 'isolate', 'restore', 'reject', 'accept', 'abandon'],
  BLACK: ['contract', 'review', 'dispatch', 'publish', 'seal'],
} as const

export const examples: Record<string, string> = {
  favorite: 'favorite status', process: 'process clockd',
  inspect: 'inspect NODE-042', open: 'open ARCHIVE-001', analyze: 'analyze SIGNAL-001',
  trace: 'trace EVENT-005', solve: 'solve KEYWORD', ask: 'ask MESSAGE',
  witness: 'witness NODE-042', connect: 'connect OMEGA', disconnect: 'disconnect NODE-042',
  isolate: 'isolate NODE-042', restore: 'restore NODE-042', reject: 'reject EVENT-ID',
  accept: 'accept MISSION-1', abandon: 'abandon MISSION-1',
  contract: 'contract MKT-01', review: 'review MKT-01', dispatch: 'dispatch MKT-03',
  publish: 'publish MKT-03', seal: 'seal MKT-03',
}

export interface RouteStage {
  title: string
  instructions: string
  commands: string[]
  choices?: string[]
  hint?: string
}

export const operatorRoute: RouteStage[] = [
  {
    title: 'Pick up an assignment',
    instructions: 'Check your console and take the first case. It links a relay to a public dispatch.',
    commands: ['status', 'accept MISSION-1', 'inspect NODE-042', 'open ARCHIVE-001'],
  },
  {
    title: 'Follow the broken signal',
    instructions: 'Analyze the transmission from the relay. Use OMEGA’s hint, then replace KEYWORD with the decoded word.',
    commands: ['analyze SIGNAL-001', 'ask hint', 'solve KEYWORD'],
    hint: 'Move each letter of HPEHU three places backward. The answer is EMBER.',
  },
  {
    title: 'Open the restricted ledger',
    instructions: 'Read the ledger, ask OMEGA about the case, then look for an annotation in the sealed conclusion.',
    commands: ['open ARCHIVE-007', 'ask The Quiet Relay', 'open ARCHIVE-010'],
  },
  {
    title: 'Trace the money in BLACK',
    instructions: 'Follow the audit payments. The first two reviews unlock the sealed commission.',
    commands: ['contract MKT-01', 'review MKT-01', 'contract MKT-02', 'review MKT-02', 'contract MKT-03', 'dispatch MKT-03'],
  },
  {
    title: 'Decide who sees the evidence',
    instructions: 'Choose one ending. Publish the file and lose the escrow, or seal it and collect.',
    commands: [],
    choices: ['publish MKT-03', 'seal MKT-03'],
  },
]
