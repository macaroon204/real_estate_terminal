// src/sections/left/nationwide/row.view.tsx

export function NationwideRow() {
  // 전국 클릭 시 밑작업용 핸들러 (나중에 중앙 시각화 로직 연결 예정)
  const handleClick = () => {
    console.log('전국 지역 클릭'); // TODO: 중앙 시각화 상태 변경 등
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
