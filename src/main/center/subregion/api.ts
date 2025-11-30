// src/main/center/subregion/api.ts

export async function fetchSubRegionSeries(
  metroCode: string,
  subRegionCode: string
) {
  const res = await fetch(
    `/api/front/center/subregion/${metroCode}/${subRegionCode}`
  );

  if (!res.ok) throw new Error('API failed');

  return res.json();
}
