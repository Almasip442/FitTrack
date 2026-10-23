const HUNGARIAN_CUES = new Set([
  'a', 'az', 'alapján', 'adat', 'adatok', 'átlag', 'cél', 'csökkent',
  'edzés', 'és', 'ezért', 'hiányzik', 'hét', 'heti', 'hogy', 'kalória',
  'napló', 'naplózott', 'nem', 'rögzített', 'szerepel', 'teljesült',
  'testsúly', 'viszont',
])

// These are unambiguous signs that a model switched languages in an otherwise
// Hungarian response. Cyrillic/Greek scripts are never needed in this UI.
const FOREIGN_MARKERS = [
  /\b(?:tampoco|logrado|entrenamiento|alimentaci[oó]n|progreso|semana)\b/iu,
  /\b(?:progr[eè]s|semaine|entra[iî]nement|alimentation|r[eé]ussi)\b/iu,
  /[\u0400-\u052f\u0370-\u03ff]/u,
]

/** Reject model text that is clearly mixed-language or not Hungarian. */
export function isHungarianAnalysisText(parts: string[]): boolean {
  const text = parts.join(' ').trim()
  if (!text || FOREIGN_MARKERS.some((marker) => marker.test(text))) return false

  const tokens = text.toLocaleLowerCase('hu-HU').match(/[\p{L}]+/gu) ?? []
  let hungarianCueCount = 0
  for (const token of tokens) {
    if (HUNGARIAN_CUES.has(token)) hungarianCueCount++
  }

  // Requiring multiple Hungarian function/content words avoids accepting a
  // mostly foreign answer just because it contains a single Hungarian token.
  return hungarianCueCount >= 2
}
