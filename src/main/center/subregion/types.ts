export type SeriesPoint = {
  ym: string;           // YYYYMM
  index_value: number;
  change_rate: number;
};

export type SubRegionResponse = {
  regionCode: number;
  regionName: string;
  parentRegionCode: number;
  nameDepth: number;
  series: SeriesPoint[];
};
