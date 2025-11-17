// src/sections/top/search/SearchLayout.tsx
import './SearchStyle.css';

type SearchLayoutProps = {
  placeholder?: string;
  defaultValue?: string;
};

export default function SearchLayout({
  placeholder = '검색어를 입력하세요',
  defaultValue = '',
}: SearchLayoutProps) {
  return (
    <div className="search" role="search" aria-label="사이트 검색">
      <input
        className="search__input"
        type="search"
        name="q"
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
      />
      <button className="search__btn">검색</button>
    </div>
  );
}
