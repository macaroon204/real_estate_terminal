// src/sections/left/nationwide/row.view.tsx
import { useNavigate } from 'react-router';

export function NationwideRow() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/main/nationwide');
  };

  return (
    <li className="left-header__row left-header__row--nationwide">
      <div
        className="left-header__content left-header__content--nationwide"
        onClick={handleClick}
      >
        <span className="left-header__label left-header__label--nationwide is-clickable">
          전국 지역
        </span>
      </div>
    </li>
  );
}
