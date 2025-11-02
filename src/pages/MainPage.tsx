import PageFrame from '../sections/global/PageFrame';
import Top from '../sections/top';

export default function MainPage() {
  const Left = (
    <nav>
      <ul>
        <li>서울특별시 ▸</li>
        <li>부산광역시 ▸</li>
      </ul>
    </nav>
  );

  const Center = <div>중앙 시각화 영역 (차트/테이블 예정)</div>;

  // ✅ 진짜 Top 컴포넌트를 전달
  return <PageFrame top={<Top />} left={Left} center={Center} />;
}
