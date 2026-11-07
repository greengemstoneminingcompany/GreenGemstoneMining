/**
 * Company project areas and field records, from the Somaliland Master File v0.2 (2017 geology report S1, field log S2,
 * 2024 Darimile survey S9). Positions are the average of each area's sample points. Evidence labels follow the Master File:
 * observed (seen in the field), reported (told to the geologist), unverified (no test), inferred (interpretation), confirmed (lab or document).
 * Nothing here is a resource estimate and none of it says an area is licensed.
 */
export type Evidence = 'observed' | 'reported' | 'unverified' | 'inferred' | 'confirmed';

export interface Finding { mineral: string; evidence: Evidence }
export interface ProjectArea {
  id: string; name: string; region: string; lon: number | null; lat: number | null; priority: 1 | 2 | 3 | null; port?: boolean; findings: Finding[];
}

const f = (mineral: string, evidence: Evidence): Finding => ({ mineral, evidence });

export const PROJECTS: ProjectArea[] = [
  { id: 'bacado', name: 'Bacado', region: 'awdal', lon: 43.694, lat: 10.029, priority: 1, findings: [f('copper', 'observed'), f('lead', 'observed')] },
  { id: 'alihayd', name: 'Alihayd', region: 'awdal', lon: 43.82, lat: 10.077, priority: 1, findings: [f('copper', 'observed'), f('gold', 'unverified')] },
  { id: 'garbo', name: 'Garbo', region: 'awdal', lon: 43.596, lat: 10.234, priority: 1, findings: [f('copper', 'observed'), f('lead', 'observed'), f('garnet', 'observed'), f('fluorite', 'observed'), f('emerald', 'unverified'), f('beryl', 'reported'), f('niobium', 'reported')] },
  { id: 'simodi', name: 'Simodi', region: 'awdal', lon: 43.57, lat: 10.103, priority: 2, findings: [f('beryl', 'unverified'), f('emerald', 'unverified'), f('tourmaline', 'observed'), f('garnet', 'observed'), f('niobium', 'reported'), f('copper', 'observed')] },
  { id: 'gargara', name: 'Gargara', region: 'awdal', lon: 43.86, lat: 10.234, priority: 2, findings: [f('ruby', 'reported'), f('sapphire', 'reported'), f('beryl', 'unverified'), f('niobium', 'reported'), f('garnet', 'observed'), f('tourmaline', 'observed'), f('topaz', 'unverified'), f('limestone', 'observed')] },
  { id: 'garboTeeb', name: 'Garbo-Teeb', region: 'awdal', lon: 43.848, lat: 10.163, priority: null, findings: [f('beryl', 'reported'), f('niobium', 'reported')] },
  { id: 'libahlay', name: 'Libahlay', region: 'awdal', lon: 43.139, lat: 10.309, priority: 3, findings: [f('limestone', 'observed')] },
  { id: 'fiqiAdam', name: 'Fiqi Adam', region: 'awdal', lon: 43.137, lat: 10.454, priority: 3, findings: [f('ruby', 'reported'), f('sapphire', 'unverified'), f('garnet', 'observed'), f('tourmaline', 'observed'), f('copper', 'observed'), f('asbestos', 'observed')] },
  { id: 'darkaine', name: 'Darkaine', region: 'awdal', lon: 43.279, lat: 10.399, priority: 3, findings: [f('lead', 'reported'), f('molybdenum', 'reported'), f('sapphire', 'unverified')] },
  { id: 'jiif', name: 'Jiif', region: 'awdal', lon: 43.203, lat: 10.305, priority: 3, findings: [f('emerald', 'reported'), f('beryl', 'reported')] },
  { id: 'abdiKadir', name: 'Abdi Kadir', region: 'awdal', lon: 42.88, lat: 10.539, priority: 3, findings: [f('iron', 'observed')] },
  { id: 'hamartaBarki', name: 'Hamarta Barki', region: 'awdal', lon: 43.366, lat: 10.126, priority: 3, findings: [f('coal', 'inferred')] },
  { id: 'lughaya', name: 'Lughaya port site', region: 'awdal', lon: 43.887, lat: 10.702, priority: null, port: true, findings: [] },
  { id: 'darimile', name: 'Darimile (Gabiley)', region: 'maroodiJeex', lon: 43.6, lat: 9.76, priority: null, findings: [f('tungsten', 'reported')] },
];

export const SOURCE_COMPANY = 'Company field survey, Oct 2017, and 2024 Darimile survey (Somaliland Master File v0.2)';
