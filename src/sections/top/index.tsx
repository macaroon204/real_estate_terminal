// // src/sections/top/index.tsx
// import LogoLayout from './logo/LogoLayout';
// import SearchLayout from './search/SearchLayout';

// export default function Top() {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
//       {/* ✅ 로고 - 그대로 사용 (변경 금지) */}
//       <LogoLayout />

//       {/* 🔎 검색 - 레이아웃, 스타일 분리 방식 동일 */}
//       <SearchLayout placeholder="지역, 지표, 키워드로 검색" />
//     </div>
//   );
// }


import LogoLayout from './logo/LogoLayout';
import logo from './logo/Logo.svg'; // 로고 이미지 있으면 사용
import SearchLayout from './search/SearchLayout';

export default function TopSection() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <a className="logo-link" href="/" aria-label="메인으로">
            <LogoLayout imgSrc={logo} />
        </a>

        <SearchLayout placeholder="지역, 지표, 키워드로 검색" />
    </div>
  );
}
