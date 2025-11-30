// src/main/center/metro/metro.path.ts

/**
 * 광역시 상세 페이지
 * 예) buildMetroPath(500007) -> "/main/500007"
 */
export function buildMetroPath(metroCode: string | number): string {
  return `/main/${metroCode}`;
}

/**
 * 하위지역 상세 페이지
 * 예) buildSubRegionPath(500007, 510008) -> "/main/500007/510008"
 */
export function buildSubRegionPath(
  metroCode: string | number,
  subRegionCode: string | number,
): string {
  return `/main/${metroCode}/${subRegionCode}`;
}
