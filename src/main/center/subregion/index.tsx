import { useParams } from 'react-router';
import { useSubRegion } from './hooks';
import SubRegionLayout from './layout';

export default function SubRegionPage() {
  const { metroCode, subRegionCode } = useParams();

  const { data, loading } = useSubRegion(
    metroCode,
    subRegionCode
  );

  if (loading)
    return <p>Loading...</p>;

  if (!data)
    return <p>데이터 없음</p>;

  return (
    <SubRegionLayout data={data} />
  );
}
