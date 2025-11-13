// 시계열 한 점(연도별 값)
export type YearPoint = {
  year: number;   // 연도
  value: number;  // 지가 지수/가격 등 숫자값
};

// 단일 시계열(테스트용)
export const sampleTimeSeries: YearPoint[] = [
  { year: 2023, value: 98.2 },
  { year: 2024, value: 94.7 },
  { year: 2025, value: 105.3 },
];
