import PageFrame from '../sections/global/PageFrame.tsx';

export default function MainPage() {
  // 아직 top/left/center가 없으니 임시 슬롯으로 확인
  const Top = <div>Top (Logo + Search 예정)</div>;
  const Left = (
    <nav>
      <ul>
        <li>서울특별시 ▸</li>
        <li>부산광역시 ▸</li>
      </ul>
    </nav>
  );
  const Center = <div>중앙 시각화 영역 (차트/테이블 예정)</div>;

  return <PageFrame top={Top} left={Left} center={Center} />;
}
