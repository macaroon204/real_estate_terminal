// src/main/center/nationwide/nationwide.view.tsx
import type {
  NationwidePageProps,
  MetroBandPoint,
} from './nationwide.event';

/* ------------------------------------------------------------------
   [미니 차트 전용 상수들]

   ★ 레이아웃 크기를 바꾸고 싶으면 여기만 수정하면 됨 ★

   - MINI_WIDTH        : SVG 가로폭 (viewBox 기준)
   - MINI_HEIGHT       : SVG 전체 세로 높이
   - MINI_PADDING      : 상/좌/우 기본 안쪽 여백
   - MINI_AXIS_AREA    : 하단 x축 + 연도 라벨이 사용할 영역 높이
   - MINI_LINE_OFFSET_Y: 라인을 전체적으로 위/아래로 이동
   - MINI_AXIS_OFFSET_Y: 그래프 영역 끝에서 x축 라인을 얼마나 띄울지
   - MINI_LABEL_OFFSET_Y: x축 라인에서 라벨을 얼마나 아래로 내릴지
-------------------------------------------------------------------*/

const MINI_WIDTH = 220;
const MINI_HEIGHT = 145;

const MINI_PADDING = 6;
const MINI_AXIS_AREA = 28;

const MINI_LINE_OFFSET_Y = 6;   // 라인 전체를 아래로 조금 내리는 오프셋
const MINI_AXIS_OFFSET_Y = 10;  // 내부 영역 끝에서 x축 라인까지 간격
const MINI_LABEL_OFFSET_Y = 10; // x축 라인에서 연도 라벨까지 간격

// ===================================================================
//  NationwidePageView (상단 바 + 카드 그리드)
// ===================================================================
export function NationwidePageView({
  items,
  onCardClick,
  onScrollTop,
}: NationwidePageProps) {
  return (
    <div className="nationwide-root">
      {/* 상단 바 (타이틀 + 맨 위로 버튼) */}
      <div className="nationwide-header">
        <div className="nationwide-header__title">전국 지가지수 요약</div>
        <button
          type="button"
          className="nationwide-header__scroll-top"
          onClick={onScrollTop}
        >
          맨 위로
        </button>
      </div>

      {/* 광역시 카드 그리드 */}
      <div className="nationwide-grid">
        {items.map(item => (
          <button
            key={item.code}
            type="button"
            className="nationwide-card"
            onClick={() => onCardClick(item.code)}
          >
            <div className="nationwide-card__name">{item.name}</div>

            <div className="nationwide-card__chart">
              <NationwideMiniChart band={item.band} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===================================================================
//  NationwideMiniChart: 카드 안의 미니 시계열(스파크라인)
// ===================================================================
function NationwideMiniChart({ band }: { band: MetroBandPoint[] }) {
  if (!band || band.length === 0) {
    return (
      <span className="nationwide-card__chart-placeholder">
        no data
      </span>
    );
  }

  // -----------------------------
  // 1) 기본 레이아웃 계산
  // -----------------------------
  const width = MINI_WIDTH;
  const height = MINI_HEIGHT;

  const padding = MINI_PADDING;
  const axisArea = MINI_AXIS_AREA;

  // 실제 라인이 그려지는 "내부 영역" 크기
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2 - axisArea;

  // -----------------------------
  // 2) 데이터 → y 스케일 계산
  // -----------------------------
  const allValues = band.flatMap(p => [p.min, p.max]);
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const range = maxY - minY || 1;

  // -----------------------------
  // 3) avg 라인 좌표 생성
  // -----------------------------
  const points = band
    .map((p, idx) => {
      // 0 ~ 1 구간에서 x 비율
      const t =
        band.length === 1 ? 0.5 : idx / (band.length - 1);

      const x = padding + innerWidth * t;

      // 값이 클수록 위로 올라가게(그래프 좌표계는 아래가 +)
      const baseY =
        padding +
        innerHeight * (1 - (p.avg - minY) / range);

      // 전체 라인을 약간 아래로 내려주는 오프셋
      const y = baseY + MINI_LINE_OFFSET_Y;

      return `${x},${y}`;
    })
    .join(' ');

  // -----------------------------
  // 4) x축 라인 위치
  // -----------------------------
  const axisY =
    padding + innerHeight + MINI_AXIS_OFFSET_Y;

  // -----------------------------
  // 5) 연도(라벨) 계산
  // -----------------------------
  const firstYear = parseInt(band[0].ym.slice(0, 4), 10);
  const lastYear = parseInt(
    band[band.length - 1].ym.slice(0, 4),
    10,
  );
  const midYear =
    lastYear - firstYear >= 2 ? firstYear + 1 : firstYear + 1;

  const years = [
    String(firstYear),
    String(midYear),
    String(lastYear),
  ];

  // 라벨 x 위치 (좌·중·우)
  const xLeft = padding + 4;
  const xCenter = padding + innerWidth / 2;
  const xRight = width - padding - 4;

  // 라벨 y 위치 (축 아래로 살짝)
  const labelY = axisY + MINI_LABEL_OFFSET_Y;

  // -----------------------------
  // 6) SVG 렌더
  // -----------------------------
  return (
    <svg
      className="nationwide-mini-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* 평균 라인 */}
      <polyline
        className="nationwide-mini-chart__line"
        points={points}
      />

      {/* x축 라인 */}
      <line
        className="nationwide-mini-chart__axis"
        x1={padding}
        y1={axisY}
        x2={width - padding}
        y2={axisY}
      />

      {/* 연도 라벨 3개 */}
      <text
        className="nationwide-mini-chart__axis-label"
        x={xLeft}
        y={labelY}
        textAnchor="start" // 왼쪽 정렬
      >
        {years[0]}
      </text>
      <text
        className="nationwide-mini-chart__axis-label"
        x={xCenter}
        y={labelY}
        textAnchor="middle" // 가운데 정렬
      >
        {years[1]}
      </text>
      <text
        className="nationwide-mini-chart__axis-label"
        x={xRight}
        y={labelY}
        textAnchor="end" // 오른쪽 정렬
      >
        {years[2]}
      </text>
    </svg>
  );
}
