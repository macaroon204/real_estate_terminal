// src/sections/left/subregion/body.connect.ts
import { REGIONS_BY_METRO } from '../../../pages/data/regions';

export function getSubregions(metroCode: string) {
  const node = REGIONS_BY_METRO[metroCode];
  const sgg = node ? node.sgg : [];
  return sgg.map(s => ({ code: s.code, name: s.name }));
}
