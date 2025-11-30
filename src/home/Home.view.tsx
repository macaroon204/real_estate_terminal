import { useState } from 'react';

import Logo from './media/Logo.png';
import LineGraph from './media/Line_Graph.png';
import Drawing from './media/Drawing.png';
import ButtonImage from './media/Butten.png';

import './Home.style.css';

export default function Home() {
  // 버튼 hover 상태
  const [isHovered, setIsHovered] = useState(false);

  const buttonClassName = isHovered
    ? 'home-button home-button--hover'
    : 'home-button';

  return (
    <div className="home-root">
      {/* 로고 + 사이트 이름 */}
      <img src={Logo} alt="로고 이미지" className="home-logo" />

      {/* 상단 그래프 */}
      <img src={LineGraph} alt="그래프 이미지" className="home-graph" />

      {/* 도면 */}
      <img src={Drawing} alt="도면 이미지" className="home-drawing" />

      {/* 메인 페이지로 이동하는 버튼 */}
      <a
        href="/main"
        className={buttonClassName}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={ButtonImage}
          alt="버튼 이미지"
          className="home-button-image"
        />
      </a>
    </div>
  );
}
