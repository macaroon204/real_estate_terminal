// src/pages/MainPage.tsx
import PageFrame from '../sections/global/PageFrame';
import Top from '../sections/top';
import LeftPanel from '../sections/left'; 

export default function MainPage() {
  // 중앙 영역 (차트/테이블 등)
  const Center = (
    <div className="center-view">
      중앙 시각화 영역 (차트/테이블 예정)
    </div>
  );

  // 전체 프레임 조립
  return (
    <PageFrame
      top={<Top />}    // 상단 로고/검색 바
      left={<LeftPanel />}      // 좌측 지역 패널
      center={Center}  // 중앙 본문
    />
  );
}

