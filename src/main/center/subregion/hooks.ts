import { useEffect, useState } from 'react';
import { fetchSubRegionSeries } from './api';
import type { SubRegionResponse } from './types';

export function useSubRegion(
  metroCode?: string,
  subRegionCode?: string){
  
  const [data, setData] = useState<SubRegionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!metroCode || !subRegionCode) return;

    setLoading(true);

    fetchSubRegionSeries(metroCode, subRegionCode)
      .then(setData)
      .finally(() => setLoading(false));

  }, [metroCode, subRegionCode]);

  return { data, loading };
}
