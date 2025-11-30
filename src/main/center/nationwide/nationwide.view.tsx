// src/main/center/nationwide/nationwide.view.tsx
import type {
  NationwidePageProps,
  MetroBandPoint,
} from './nationwide.event';

/* ------------------------------------------------------------------
   [미니 차트 전용 상수들]
-------------------------------------------------------------------*/

const MINI_WIDTH = 220;
const MINI_HEIGHT = 145;

const MINI_PADDING = 6;
const MINI_AXIS_AREA = 28;

const MINI_LINE_OFFSET_Y = 6;
const MINI_AXIS_OFFSET_Y = 10;
const MINI_LABEL_OFFSET_Y = 10;

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
//  NationwideMiniChart: 카드 안의 미니 시계열
// ===================================================================
function NationwideMiniChart({ band }: { band: MetroBandPoint[] }) {
  if (!band || band.length === 0) {
    return (
      <span className="nationwide-card__chart-placeholder">
        no data
      </span>
    );
  }

  const width = MINI_WIDTH;
  const height = MINI_HEIGHT;

  const padding = MINI_PADDING;
  const axisArea = MINI_AXIS_AREA;

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2 - axisArea;

  const allValues = band.flatMap(p => [p.min, p.max]);
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const range = maxY - minY || 1;

  const points = band
    .map((p, idx) => {
      const t = band.length === 1 ? 0.5 : idx / (band.length - 1);
      const x = padding + innerWidth * t;

      const baseY =
        padding +
        innerHeight * (1 - (p.avg - minY) / range);

      const y = baseY + MINI_LINE_OFFSET_Y;
      return `${x},${y}`;
    })
    .join(' ');

  const axisY = padding + innerHeight + MINI_AXIS_OFFSET_Y;

  const firstYear = parseInt(band[0].ym.slice(0, 4), 10);
  const lastYear = parseInt(
    band[band.length - 1].ym.slice(0, 4),
    10,
  );
  const midYear = firstYear + 1;

  const years = [
    String(firstYear),
    String(midYear),
    String(lastYear),
  ];

  const xLeft = padding + 4;
  const xCenter = padding + innerWidth / 2;
  const xRight = width - padding - 4;

  const labelY = axisY + MINI_LABEL_OFFSET_Y;

  return (
    <svg
      className="nationwide-mini-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        className="nationwide-mini-chart__line"
        points={points}
      />

      <line
        className="nationwide-mini-chart__axis"
        x1={padding}
        y1={axisY}
        x2={width - padding}
        y2={axisY}
      />

      <text
        className="nationwide-mini-chart__axis-label"
        x={xLeft}
        y={labelY}
        textAnchor="start"
      >
        {years[0]}
      </text>
      <text
        className="nationwide-mini-chart__axis-label"
        x={xCenter}
        y={labelY}
        textAnchor="middle"
      >
        {years[1]}
      </text>
      <text
        className="nationwide-mini-chart__axis-label"
        x={xRight}
        y={labelY}
        textAnchor="end"
      >
        {years[2]}
      </text>
    </svg>
  );
}
