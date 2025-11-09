// src/pages/data/regions.ts
// -------------------------------------------------------------
// 데이터 소스는 "광역(시·도) → 시·군·구" 2계층만 취급
// 동/읍·면/리 등 하위 레벨은 포함하지 않음 (※ 세종: 실무상 시군구 미설치 특성상 읍·면·동을 하위로 둠)
// -------------------------------------------------------------

export type MetroCode = string;   // 예: '11'(서울), '26'(부산) ...
export type SigunguCode = string; // 예: '11680'(강남구), '30140'(대전 중구) ...

export interface MetroItem {
  code: MetroCode;
  name: string;
  short?: string;
}
export interface SigunguItem {
  code: SigunguCode;
  name: string;
}

/** 광역시·도 1건 + 하위(시·군·구) 배열 */
export interface RegionNode {
  metro: MetroItem;
  sgg: SigunguItem[]; // 세종은 시군구가 없으므로 행정동/읍면을 수록
}

// -------------------------------------------------------------
// 1️⃣ “광역 → [하위 배열]” 단일 트리
// -------------------------------------------------------------
export const REGIONS: RegionNode[] = [
  {
    metro: { code: '11', name: '서울특별시', short: '서울' },
    sgg: [
      { code: '11110', name: '종로구' },
      { code: '11140', name: '중구' },
      { code: '11170', name: '용산구' },
      { code: '11200', name: '성동구' },
      { code: '11215', name: '광진구' },
      { code: '11230', name: '동대문구' },
      { code: '11260', name: '중랑구' },
      { code: '11290', name: '성북구' },
      { code: '11305', name: '강북구' },
      { code: '11320', name: '도봉구' },
      { code: '11350', name: '노원구' },
      { code: '11380', name: '은평구' },
      { code: '11410', name: '서대문구' },
      { code: '11440', name: '마포구' },
      { code: '11470', name: '양천구' },
      { code: '11500', name: '강서구' },
      { code: '11530', name: '구로구' },
      { code: '11545', name: '금천구' },
      { code: '11560', name: '영등포구' },
      { code: '11590', name: '동작구' },
      { code: '11620', name: '관악구' },
      { code: '11650', name: '서초구' },
      { code: '11680', name: '강남구' },
      { code: '11710', name: '송파구' },
      { code: '11740', name: '강동구' },
    ],
  },
  {
    metro: { code: '26', name: '부산광역시', short: '부산' },
    sgg: [
      { code: '26110', name: '중구' },
      { code: '26140', name: '서구' },
      { code: '26170', name: '동구' },
      { code: '26200', name: '영도구' },
      { code: '26230', name: '부산진구' },
      { code: '26260', name: '동래구' },
      { code: '26290', name: '남구' },
      { code: '26320', name: '북구' },
      { code: '26350', name: '해운대구' },
      { code: '26380', name: '사하구' },
      { code: '26410', name: '금정구' },
      { code: '26440', name: '강서구' },
      { code: '26470', name: '연제구' },
      { code: '26500', name: '수영구' },
      { code: '26530', name: '사상구' },
      { code: '26710', name: '기장군' },
    ],
  },
  {
    metro: { code: '27', name: '대구광역시', short: '대구' },
    sgg: [
      { code: '27110', name: '중구' },
      { code: '27140', name: '동구' },
      { code: '27170', name: '서구' },
      { code: '27200', name: '남구' },
      { code: '27230', name: '북구' },
      { code: '27260', name: '수성구' },
      { code: '27290', name: '달서구' },
      { code: '27710', name: '달성군' },
      { code: '27720', name: '군위군' },
    ],
  },
  {
    metro: { code: '28', name: '인천광역시', short: '인천' },
    sgg: [
      { code: '28110', name: '중구' },
      { code: '28140', name: '동구' },
      { code: '28177', name: '미추홀구' },
      { code: '28185', name: '연수구' },
      { code: '28200', name: '남동구' },
      { code: '28237', name: '부평구' },
      { code: '28245', name: '계양구' },
      { code: '28260', name: '서구' },
      { code: '28710', name: '강화군' },
      { code: '28720', name: '옹진군' },
    ],
  },
  {
    metro: { code: '29', name: '광주광역시', short: '광주' },
    sgg: [
      { code: '29110', name: '동구' },
      { code: '29140', name: '서구' },
      { code: '29155', name: '남구' },
      { code: '29170', name: '북구' },
      { code: '29200', name: '광산구' },
    ],
  },
  {
    metro: { code: '30', name: '대전광역시', short: '대전' },
    sgg: [
      { code: '30110', name: '동구' },
      { code: '30140', name: '중구' },
      { code: '30170', name: '서구' },
      { code: '30200', name: '유성구' },
      { code: '30230', name: '대덕구' },
    ],
  },
  {
    metro: { code: '31', name: '울산광역시', short: '울산' },
    sgg: [
      { code: '31110', name: '중구' },
      { code: '31140', name: '남구' },
      { code: '31170', name: '동구' },
      { code: '31200', name: '북구' },
      { code: '31710', name: '울주군' },
    ],
  },
  {
    metro: { code: '36', name: '세종특별자치시', short: '세종' },
    // 시군구 없음 — 읍면동 직접 소속
    sgg: [
      { code: '36110', name: '한솔동' },
      { code: '36120', name: '아름동' },
      { code: '36130', name: '도담동' },
      { code: '36140', name: '보람동' },
      { code: '36150', name: '대평동' },
      { code: '36160', name: '소담동' },
      { code: '36170', name: '새롬동' },
      { code: '36180', name: '나성동' },
      { code: '36190', name: '종촌동' },
      { code: '36200', name: '고운동' },
      { code: '36210', name: '반곡동' },
      { code: '36220', name: '금남면' },
      { code: '36230', name: '연동면' },
      { code: '36240', name: '부강면' },
      { code: '36250', name: '장군면' },
      { code: '36260', name: '전의면' },
      { code: '36270', name: '전동면' },
      { code: '36280', name: '소정면' },
    ],
  },
  {
    metro: { code: '50', name: '제주특별자치도', short: '제주' },
    sgg: [
      { code: '50110', name: '제주시' },
      { code: '50130', name: '서귀포시' },
    ],
  },
];

// -------------------------------------------------------------
// 2️⃣ 조회 편의: 인덱스 및 파생 뷰
// -------------------------------------------------------------

/** code 기반 빠른 접근 인덱스 */
export const REGIONS_BY_METRO: Record<MetroCode, RegionNode> = REGIONS
  .reduce<Record<MetroCode, RegionNode>>((acc, node) => {
    acc[node.metro.code] = node;
    return acc;
  }, {});

/** 기존 API 역호환: 광역 목록만 평탄화 */
export const METROS: MetroItem[] = REGIONS.map(r => r.metro);

/** 뷰 모델: 광역 목록 + 선택 상태 */
export function asMetroView(selected: MetroCode | null) {
  return REGIONS.map(({ metro }) => ({
    id: metro.code,
    name: metro.name,
    selected: metro.code === selected,
  }));
}

/** 주어진 광역코드의 하위(시·군·구) 목록 반환 */
export function getSigunguByMetro(metroCode: MetroCode) {
  const node = REGIONS_BY_METRO[metroCode];
  const list = node ? node.sgg : [];
  return list.map(s => ({ id: s.code, name: s.name }));
}
