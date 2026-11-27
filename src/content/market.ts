export const contracts = [
  {
    id: 'MKT-01', title: 'Black Current', sponsor: 'Cinder Works · Assurance Division', sector: 'ENERGY', reward: 180,
    brief: 'Cinder Works pays you to review a sealed audit of the Northwake power exchange. The insurer attached a prepared statement blaming Bracken Union.',
    evidence: 'The audit records a blackout at 04:12. The insurance claim carrying that timestamp was signed the previous day.',
    es: {
      title: 'Corriente negra', sponsor: 'Cinder Works · División de garantías', sector: 'ENERGÍA',
      brief: 'Cinder Works te paga por revisar una auditoría sellada de la central de intercambio de Northwake. La aseguradora adjuntó un comunicado que culpa a Bracken Union.',
      evidence: 'La auditoría registra un apagón a las 04:12. La reclamación del seguro con esa hora se firmó el día anterior.',
    },
  },
  {
    id: 'MKT-02', title: 'Borrowed Tail', sponsor: 'Ivory Circuit · Aviation Assurance', sector: 'AVIATION', reward: 220,
    brief: 'Ivory Circuit commissions an independent review of an incident report from the Pale Meridian air corridor. Its client already booked a press conference.',
    evidence: 'The air corridor report and the power exchange claim carry the same approval stamp. An invoice bills twice for a failure that investigators never confirmed.',
    es: {
      title: 'Matrícula prestada', sponsor: 'Ivory Circuit · Garantías de aviación', sector: 'AVIACIÓN',
      brief: 'Ivory Circuit encarga una revisión independiente de un informe del corredor aéreo de Pale Meridian. Su cliente ya reservó la sala de prensa.',
      evidence: 'El informe del corredor aéreo y la reclamación de la central llevan el mismo sello de aprobación. Una factura cobra dos veces por un fallo que los investigadores nunca confirmaron.',
    },
  },
  {
    id: 'MKT-04', title: 'Double Entry', sponsor: 'Glass Harbour · Incident Response', sector: 'CYBERSECURITY', reward: 260,
    brief: 'A security contractor offers a bounty for corroborating a breach it reported at the Morrow Index. It attached two contradictory versions of the same incident.',
    evidence: 'The alleged intrusion was filed under a case number issued by the contractor weeks before the alarm. The contractor billed both the victim and the people funding the false allegation.',
    es: {
      title: 'Doble asiento', sponsor: 'Glass Harbour · Respuesta a incidentes', sector: 'CIBERSEGURIDAD',
      brief: 'Una contratista de seguridad ofrece una recompensa por corroborar una intrusión que reportó en Morrow Index. Adjuntó dos versiones contradictorias del mismo incidente.',
      evidence: 'La supuesta intrusión se archivó con un número de caso emitido por la contratista semanas antes de la alarma. La contratista le cobró tanto a la víctima como a quienes financiaron la acusación falsa.',
    },
  },
  {
    id: 'MKT-03', title: 'Border Ledger', sponsor: 'Northwake Office · Frontier Command', sector: 'FRONTIER', reward: 600,
    brief: 'Frontier Command asks you to execute a sealed drone order bearing a rival faction’s signature. Its communiqué attributes an incident at the Sable Line to Bracken Union before the order even exists.',
    evidence: 'DISPATCH CLOSED. The drones never reached the Sable Line. The sponsor had already released footage of the supposed strike. The archive links the order, both audit invoices and a request to extend the war budget.',
    es: {
      title: 'Expediente fronterizo', sponsor: 'Northwake Office · Mando fronterizo', sector: 'FRONTERA',
      brief: 'El Mando fronterizo te pide ejecutar una orden sellada de drones firmada por una facción rival. Su comunicado atribuye a Bracken Union un incidente en la Línea Sable antes de que exista la orden.',
      evidence: 'DESPACHO CERRADO. Los drones nunca llegaron a la Línea Sable. El patrocinador ya había difundido imágenes del supuesto ataque. El archivo vincula la orden, las dos facturas de auditoría y una solicitud para ampliar el presupuesto de guerra.',
    },
  },
] as const

export type ContractId = typeof contracts[number]['id']
export type ContractStatus = 'accepted' | 'reviewed' | 'published' | 'sealed'
export type MarketLedger = Partial<Record<ContractId, ContractStatus>>
export const frontierId: ContractId = 'MKT-03'
export const requiredReviews = ['MKT-01', 'MKT-02'] as const

export function frontierUnlocked(ledger: MarketLedger) {
  return requiredReviews.every(id => ledger[id] === 'reviewed')
}
