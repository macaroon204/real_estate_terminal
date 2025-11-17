// src/pages/MainPage.tsx
import { Outlet } from 'react-router';
import PageFrame from '../main/global/PageFrame';
import Top from '../main/top';
import LeftPanel from '../main/left'; 

export default function MainPage() {
  // 중앙 영역 (차트/테이블 등)
  const Center = (
    <div className="center-view">
      <Outlet />
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

