// src/sections/left/metro/header.view.tsx
import type { MouseEvent } from 'react';
import iconOpenUrl from './toggle_open.svg';
import iconCloseUrl from './toggle_close.svg';

type Props = {
  code: string;
  name: string;
  isOpen: boolean;
  onToggle: () => void;           // ✅ 토글은 아이콘 버튼에서만
  onLabelClick?: () => void;      // ⬅️ (옵션) 라벨 클릭 별도 동작
};

export function MetroHeaderRow({ code, name, isOpen, onToggle, onLabelClick }: Props) {
  // ✅ 아이콘 버튼만 토글
  const onIconClick = (e: MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  // ⬅️ (옵션) 라벨 클릭 분리: 라우팅/선택 등에 활용
  const onNameClick = (e: MouseEvent) => {
    if (!onLabelClick) return;
    e.stopPropagation();
    onLabelClick();
  };

  return (
    <li
      className={`left-header__row${isOpen ? ' is-open' : ''}`}
      data-code={code}
    >
      <div className="left-header__content">
        {/* ✅ 라벨은 기본적으로 클릭해도 토글되지 않음 */}
        <span
          className={`left-header__label${onLabelClick ? ' is-clickable' : ''}`}
          onClick={onNameClick}
        >
          {name}
        </span>

        {/* ✅ 토글은 아이콘 버튼에서만 */}
        <button
          type="button"
          className="left-header__icon"
          aria-label={isOpen ? '접기' : '펼치기'}
          onClick={onIconClick}
        >
          <img
            src={isOpen ?iconOpenUrl : iconCloseUrl}
            alt=""
            aria-hidden
          />
        </button>
      </div>
    </li>
  );
}