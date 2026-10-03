export function normalizeDate(value) {
  const raw = String(value ?? '').trim();
  let parts;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/);
  const numeric = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:[, ]+(?:alle )?\d{1,2}:\d{2}(?::\d{2})?)?$/);
  const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const words = raw.toLowerCase().replace(/^(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica),?\s+/, '').match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})(?:[, ]+(?:alle )?\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if (iso) parts = [iso[1], iso[2], iso[3]];
  else if (numeric) parts = [numeric[3], numeric[2], numeric[1]];
  else if (words) {
    const month = months.findIndex(name => name === words[2] || name.slice(0,3) === words[2]);
    if (month >= 0) parts = [words[3], String(month + 1), words[1]];
  }
  if (!parts) throw new Error('Data non riconosciuta: "' + raw.slice(0,80) + '". Usa GG/MM/AAAA, ad esempio 03/10/2026.');
  const day = parts.map((part, i) => part.padStart(i === 0 ? 4 : 2, '0')).join('-');
  const parsed = new Date(day + 'T12:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== day) throw new Error('Data inesistente. Usa GG/MM/AAAA.');
  return day;
}
