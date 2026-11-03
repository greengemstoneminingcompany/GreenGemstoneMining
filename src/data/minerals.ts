/**
 * Mineral finder data. Point records come from USGS MRDS (src/data/mineralsMrds.ts, generated); district records come from
 * the research notes (docs/somaliland-minerals-research.md) and carry no coordinates, so they highlight a region but get no pin.
 */
import { MRDS } from './mineralsMrds';
import { PROJECTS, SOURCE_COMPANY, type Evidence } from './company';

export type Group = 'gems' | 'metals' | 'industrial' | 'energy';
export type Precision = 'point' | 'district' | 'reported';
export type Basis = 'survey' | 'gov' | 'trade' | 'anomaly' | 'estimate' | 'unverified';

export interface MrdsRow {
  id: string; name: string; type: 'occurrence' | 'prospect' | 'mine' | 'spring'; region: string | null; lon: number; lat: number;
  minerals: string[]; host: string | null; outside: boolean; ref: string; dep: string;
}
export interface Locality {
  id: string; name?: string; region: string | null; precision: Precision; lon?: number; lat?: number; minerals: string[];
  basis?: Basis; source: string; link?: string; outside?: boolean; evidence?: Evidence; company?: boolean;
}

/** id -> group. Names live in mineralText.ts. */
export const MINERAL_GROUP: Record<string, Group> = {
  emerald: 'gems', beryl: 'gems', sapphire: 'gems', garnet: 'gems', spinel: 'gems', jade: 'gems', ruby: 'gems', amethyst: 'gems', tourmaline: 'gems', topaz: 'gems',
  gold: 'metals', silver: 'metals', copper: 'metals', lead: 'metals', zinc: 'metals', tin: 'metals', tungsten: 'metals', tantalum: 'metals', niobium: 'metals', molybdenum: 'metals',
  nickel: 'metals', chromium: 'metals', iron: 'metals', manganese: 'metals', titanium: 'metals', bismuth: 'metals', platinum: 'metals', lithium: 'metals', zircon: 'metals', monazite: 'metals', rareearth: 'metals',
  gypsum: 'industrial', anhydrite: 'industrial', limestone: 'industrial', salt: 'industrial', barite: 'industrial', fluorite: 'industrial', mica: 'industrial', graphite: 'industrial', kyanite: 'industrial',
  talc: 'industrial', vermiculite: 'industrial', asbestos: 'industrial', quartz: 'industrial', apatite: 'industrial', guano: 'industrial', kaolin: 'industrial', strontium: 'industrial',
  bromine: 'industrial', clay: 'industrial', stone: 'industrial', feldspar: 'industrial',
  oil: 'energy', coal: 'energy', oilshale: 'energy', uranium: 'energy',
};

const D = (id: string, region: string | null, precision: Precision, minerals: string[], basis: Basis, source: string): Locality => ({ id, region, precision, minerals, basis, source });
const GOV = 'Somaliland government investment material (Ministry of Energy and Minerals; Representative Office, Taiwan)';
const H13 = 'Hussein 2013, Minerals of Somalia';
const GEMA = 'Gem-A Journal 1999; Mindat (Borama); USGS Minerals Yearbook 2017-18';

/** Region-level records with no published coordinates. */
const DISTRICT: Locality[] = [
  D('d-awdal-gems', 'awdal', 'district', ['emerald', 'beryl', 'garnet'], 'trade', GEMA),
  D('d-awdal-au', 'awdal', 'district', ['gold', 'copper', 'lead', 'zinc'], 'gov', GOV + '; Abdiqadir zone'),
  D('d-awdal-ta', 'awdal', 'district', ['tantalum', 'niobium'], 'gov', GOV + ' (columbite-tantalite)'),
  D('d-awdal-mica', 'awdal', 'district', ['mica'], 'trade', 'Mindat (Borama): phlogopite'),
  D('d-awdal-salt', 'awdal', 'district', ['salt'], 'survey', H13 + ' (Zeila)'),
  D('d-awdal-apatite', 'awdal', 'district', ['apatite'], 'survey', H13 + ' (Darkainle alkaline complex)'),
  D('d-mj-gems', 'maroodiJeex', 'district', ['sapphire', 'garnet', 'emerald'], 'trade', GEMA + '; sapphire in pegmatite west of Hargeisa, emerald reported around the capital'),
  D('d-mj-base', 'maroodiJeex', 'district', ['gold', 'copper', 'lead', 'zinc', 'molybdenum'], 'anomaly', 'UNDP 1975 reconnaissance, Dhagax-kuure (Gabiley); Hussein 2013 (Arabsiyo)'),
  D('d-mj-ni', 'maroodiJeex', 'district', ['nickel', 'chromium', 'bismuth', 'platinum'], 'anomaly', H13 + ' (Arabsiyo, Mandhera complex, Hamar gabbro)'),
  D('d-mj-nb', 'maroodiJeex', 'district', ['kaolin'], 'survey', H13 + ' (Las Gal to Merodile)'),
  D('d-sahil-gems', 'sahil', 'district', ['emerald', 'beryl'], 'gov', GOV),
  D('d-sahil-metal', 'sahil', 'district', ['gold', 'copper', 'lead', 'iron'], 'gov', GOV + '; Laalays zone'),
  D('d-sahil-ta', 'sahil', 'district', ['tantalum', 'niobium'], 'gov', GOV + ' (columbite-tantalite)'),
  D('d-sahil-simp', 'sahil', 'district', ['tantalum'], 'survey', H13 + ': simpsonite in beach sands east of Berbera'),
  D('d-sahil-sands', 'sahil', 'district', ['titanium', 'zircon', 'monazite'], 'estimate', GOV + '; BGS Earthwise (ilmenite, rutile, zircon, monazite sands, viability unproven)'),
  D('d-sahil-gyp', 'sahil', 'district', ['gypsum', 'anhydrite'], 'estimate', 'BGS Pamphlet 1 (1954); ' + GOV + ' (Daban Basin, surface estimates above 100 Mt)'),
  D('d-sahil-lime', 'sahil', 'district', ['limestone', 'stone'], 'survey', 'USGS Minerals Yearbook 2017-18 (Berbera cement, marble and granite)'),
  D('d-sahil-quartz', 'sahil', 'district', ['quartz'], 'survey', H13 + ' (piezoelectric quartz at Lafaruug)'),
  D('d-sahil-coal', 'sahil', 'district', ['coal'], 'estimate', 'Geology and coal potential of Somaliland (Daban, Hed-Hed valley)'),
  D('d-sahil-oil', 'sahil', 'district', ['oil'], 'gov', GOV + ' (Guban basin)'),
  D('d-tog-jade', 'togdheer', 'district', ['jade', 'copper'], 'gov', 'Ministry of Energy and Minerals (nephrite jade mine); ' + GOV),
  D('d-tog-oil', 'togdheer', 'district', ['oil'], 'gov', GOV + ' (Oodweyne)'),
  D('d-san-metal', 'sanaag', 'district', ['gold', 'copper', 'lead', 'iron'], 'gov', GOV + '; Laasa-Surad zone'),
  D('d-san-ta', 'sanaag', 'district', ['tantalum', 'tin'], 'survey', H13 + ' (tin-tantalum at Dhalan, Majiyahan and Elayo, Erigavo district)'),
  D('d-san-lime', 'sanaag', 'district', ['limestone', 'coal'], 'survey', 'BGS Earthwise; Geology and coal potential of Somaliland (minor lignite)'),
  D('d-sool-lime', 'sool', 'district', ['limestone'], 'survey', 'BGS Earthwise; Wikipedia, Geology of Somaliland'),
  D('d-sool-oil', 'sool', 'district', ['oil'], 'gov', GOV + ' (Nugaal basin)'),
  D('r-gems', null, 'reported', ['ruby', 'amethyst', 'tourmaline', 'topaz', 'spinel', 'zircon', 'feldspar', 'rareearth'], 'survey', 'Somaliland Central minerals list; BGS Earthwise (allanite, samarskite): locality not given'),
  D('r-li', null, 'reported', ['lithium'], 'unverified', 'Somaliland Chronicle, 2024 (Kilomass exploration licence reported; area not stated, no independent survey)'),
];

const MRDS_LOC: Locality[] = MRDS.map((r) => ({
  id: r.id, name: r.name, region: r.region, precision: 'point', lon: r.lon, lat: r.lat, minerals: r.minerals, source: r.ref,
  link: `https://mineralresourcemap.com/detail/${r.dep}`, outside: r.outside,
}));

const COMPANY_LOC: Locality[] = PROJECTS.flatMap((p) =>
  p.lon === null || p.lat === null ? [] : p.findings.map((fd) => ({
    id: `c-${p.id}-${fd.mineral}`, name: p.name, region: p.region, precision: 'point' as const,
    lon: p.lon as number, lat: p.lat as number, minerals: [fd.mineral], source: SOURCE_COMPANY,
    evidence: fd.evidence, company: true,
  })),
);

export const LOCALITIES: Locality[] = [...MRDS_LOC, ...COMPANY_LOC, ...DISTRICT];

/** Localities that record a mineral, points first. */
export const recordsFor = (mineral: string): Locality[] =>
  LOCALITIES.filter((l) => l.minerals.includes(mineral)).sort((a, b) => Number(b.precision === 'point') - Number(a.precision === 'point') || (a.region ?? 'zz').localeCompare(b.region ?? 'zz'));

/** Minerals recorded in a region, grouped. */
export const mineralsInRegion = (region: string): Record<Group, string[]> => {
  const out: Record<Group, string[]> = { gems: [], metals: [], industrial: [], energy: [] };
  for (const l of LOCALITIES) if (l.region === region) for (const m of l.minerals) if (MINERAL_GROUP[m] && !out[MINERAL_GROUP[m]].includes(m)) out[MINERAL_GROUP[m]].push(m);
  return out;
};

/** Minerals that appear in the data, by group, with record counts. */
export const MINERAL_COUNT: Record<string, number> = {};
for (const l of LOCALITIES) for (const m of l.minerals) MINERAL_COUNT[m] = (MINERAL_COUNT[m] ?? 0) + 1;
