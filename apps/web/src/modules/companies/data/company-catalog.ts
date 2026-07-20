import type { CompanySelectorItem } from '@saki-operations/types';

/**
 * Temporary company catalog for Operations V2 until a Company API lands.
 * Mirrors the local fleet-catalog pattern (offline-first, no server dependency).
 * Company ids double as the Tours vs HHCO module selector on Start Operation.
 */
export const COMPANY_ID_SAKI_TOURS = 'co_saki_tours';
export const COMPANY_ID_HHCO = 'co_hhco';

export const COMPANY_CATALOG: CompanySelectorItem[] = [
  {
    id: COMPANY_ID_SAKI_TOURS,
    name: 'Saki Tours & Weddings (Pvt) Ltd',
    shortName: 'Saki Tours',
    active: true,
  },
  {
    id: COMPANY_ID_HHCO,
    name: 'HHCO Helmet Delivery',
    shortName: 'HHCO',
    active: true,
  },
];

export function listCompanies(options?: { activeOnly?: boolean }): CompanySelectorItem[] {
  const activeOnly = options?.activeOnly ?? true;
  return COMPANY_CATALOG.filter((company) => (activeOnly ? company.active : true));
}

export function findCompany(id: string): CompanySelectorItem | undefined {
  return COMPANY_CATALOG.find((company) => company.id === id);
}
