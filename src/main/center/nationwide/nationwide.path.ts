// src/main/center/nationwide/nationwide.path.ts
export const NATIONWIDE_PATH = '/main/nationwide';

export function linkToNationwide(): string {
  return NATIONWIDE_PATH;
}

export function linkToMetro(metroCode: string): string {
  // metroCode는 보통 '11', '26' 같은 코드
  return `/main/metro/${encodeURIComponent(metroCode)}`;
}
