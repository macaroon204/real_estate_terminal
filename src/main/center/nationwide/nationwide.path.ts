// src/main/center/nationwide/nationwide.path.ts

// 전국 페이지
export function linkToNationwide(): string {
  return '/main/nationwide';
}

// 광역시 상세 페이지
export function linkToMetro(metroCode: string): string {
  return `/main/${metroCode}`;
}
