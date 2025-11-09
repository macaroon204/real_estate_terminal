// src/sections/left/metro/header.connect.ts
import { METROS } from '../../../pages/data/regions';

export function getMetros() {
  // 필요 시 여기서 정렬/필터(예: 가나다)
  // return [...METROS].sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  return METROS.map(m => ({ code: m.code, name: m.name }));
}
