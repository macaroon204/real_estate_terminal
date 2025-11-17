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
