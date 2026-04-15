/**
 * NLM Clinical Tables ICD-10-CM search (free, no API key).
 * @see https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html
 */
const NLM_ICD10_URL = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';

export interface Icd10Result {
  code: string;
  name: string;
  /** Approximate billability hint from code patterns (validate with payer rules). */
  likelyBillable: boolean;
}

function parseLikelyBillable(code: string): boolean {
  const c = code.replace(/\./g, '');
  // Many V/W/X/Y and some Z codes are often non-billable as primary; heuristic only.
  if (/^[VWXY]/.test(c)) return false;
  return true;
}

export async function searchIcd10Cm(terms: string, signal?: AbortSignal): Promise<Icd10Result[]> {
  const q = terms.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    terms: q,
    maxList: '25',
    sf: 'code,name',
    df: 'code,name',
  });

  const res = await fetch(`${NLM_ICD10_URL}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`ICD-10 search failed: ${res.status}`);

  const data: unknown = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[3])) return [];

  const rows = data[3] as string[][];
  return rows.map((row) => {
    const code = String(row[0] ?? '');
    const name = String(row[1] ?? '');
    return {
      code,
      name,
      likelyBillable: parseLikelyBillable(code),
    };
  });
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
