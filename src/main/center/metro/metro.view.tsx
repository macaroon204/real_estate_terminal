// src/main/center/metro/metro.view.tsx

import type { MetroPageState } from './metro.event';
import type { MetroPoint, MetroChildRegion } from './metro.data';
import './metro.style.css';

type Props = MetroPageState;

// ========================================================
//  유틸
// ========================================================

// YYYYMM → YYYY-MM
function formatYmLabel(pt: MetroPoint): string {
  const ym = String(pt.ym ?? '');
  if (ym.includes('-')) return ym;
  if (ym.length >= 6) {
    return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
  }
  return ym;
}

function parseYear(ym: string | null | undefined): number | null {
  if (!ym) return null;
  const s = String(ym);
  if (s.length < 4) return null;
  const y = parseInt(s.slice(0, 4), 10);
  return Number.isNaN(y) ? null : y;
}

// 값 범위에 여백(padding)을 조금 주어서 위/아래가 딱 붙지 않게
// ✅ 기존 getPaddedRange 전부 교체
function getPaddedRange(
  values: number[],
  paddingRatio = 0.05, // 기본 여백 비율(5%)
): { min: number; max: number } {
  if (!values.length) return { min: 0, max: 1 };

  let min = Math.min(...values);
  let max = Math.max(...values);

  // 모든 값이 같을 때
  if (min === max) {
    const delta = Math.abs(min) || 1;
    return {
      min: min - delta * paddingRatio,
      max: max + delta * paddingRatio,
    };
  }

  const range = max - min;
  const pad = range * paddingRatio;

  return {
    min: min - pad,
    max: max + pad,
  };
}


// 0~100 좌표계 기준 polyline 생성
function buildPolyline(
  points: MetroPoint[],
  totalCount: number,
  minVal: number,
  maxVal: number,
): string {
  if (!Array.isArray(points) || points.length === 0) return '';

  const denom = maxVal - minVal || 1;
  const lastIndex = Math.max(totalCount - 1, 1);
  const coords: string[] = [];

  points.forEach((pt, idx) => {
    if (pt.indexValue == null) return;

    const x = (idx / lastIndex) * 100;
    const ratio = (pt.indexValue - minVal) / denom;
    const y = 100 - ratio * 100; // 위가 값이 큰 쪽

    coords.push(`${x},${y}`);
  });

  return coords.join(' ');
}

// ========================================================
//  상단 메인 차트
// ========================================================

// ✅ MetroMainChart 전체 함수 교체
function MetroMainChart(props: {
  metroName: string;
  metro: MetroPoint[];
  high: MetroPoint[];
  low: MetroPoint[];
}) {
  const { metro, high, low, metroName } = props;

  const base = metro ?? [];
  const highSeries = high ?? [];
  const lowSeries = low ?? [];

  const allValues: number[] = [];
  [base, highSeries, lowSeries].forEach((arr) => {
    arr.forEach((pt) => {
      if (pt.indexValue != null) allValues.push(pt.indexValue);
    });
  });

  // y축 범위 + 패딩
  const { min: minVal, max: maxVal } = getPaddedRange(allValues, 0.08);

  // y축 눈금 9개 (세밀하게)
  const yTicks: number[] =
    maxVal > minVal
      ? Array.from({ length: 9 }, (_, i) => {
          const ratio = i / 8;
          return minVal + (maxVal - minVal) * ratio;
        })
      : [minVal];

  const totalCount =
    base.length || Math.max(highSeries.length, lowSeries.length);

  const avgPolyline = buildPolyline(base, totalCount, minVal, maxVal);
  const highPolyline = buildPolyline(highSeries, totalCount, minVal, maxVal);
  const lowPolyline = buildPolyline(lowSeries, totalCount, minVal, maxVal);

  // 🔸 X축에 연도 3개(처음/중간/마지막)를 표시
  const firstYear = parseYear(base[0]?.ym) ?? new Date().getFullYear();
  const lastYear =
    parseYear(base[base.length - 1]?.ym) ?? firstYear;
  const span = lastYear - firstYear;
  const midYear =
    span >= 2 ? firstYear + 1 : Math.round((firstYear + lastYear) / 2);

  const xYearLabels = [
    String(firstYear),
    String(midYear),
    String(lastYear),
  ];

  return (
    <section className="metro-main-chart">
      <header className="metro-main-chart__header">
        <h2 className="metro-main-chart__title">{metroName} 지가지수</h2>
        <p className="metro-main-chart__subtitle">최근 3개년 시계열</p>
      </header>

      <div className="metro-main-chart__body">
        <div className="metro-main-chart__legend">
          <span className="legend-line legend-line--avg" />
          <span>광역시 평균</span>
          <span className="legend-line legend-line--high" />
          <span>상단(최고 구)</span>
          <span className="legend-line legend-line--low" />
          <span>하단(최저 구)</span>
        </div>

        <div className="metro-main-chart__canvas">
          <svg
            className="metro-main-chart__svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1="0" y1="100" x2="100" y2="100" className="metro-axis" />

            {lowPolyline && (
              <polyline
                className="metro-line metro-line--low"
                points={lowPolyline}
              />
            )}

            {highPolyline && (
              <polyline
                className="metro-line metro-line--high"
                points={highPolyline}
              />
            )}

            {avgPolyline && (
              <polyline
                className="metro-line metro-line--avg"
                points={avgPolyline}
              />
            )}
          </svg>

          {/* y축 라벨 좌/우 */}
          {yTicks.length > 0 && (
            <>
              <div className="metro-main-chart__ylabels metro-main-chart__ylabels--left">
                {yTicks.map((v) => (
                  <span key={`yl-${v.toFixed(3)}`}>{v.toFixed(1)}</span>
                ))}
              </div>
              <div className="metro-main-chart__ylabels metro-main-chart__ylabels--right">
                {yTicks.map((v) => (
                  <span key={`yr-${v.toFixed(3)}`}>{v.toFixed(1)}</span>
                ))}
              </div>
            </>
          )}

          {/* 🔸 X축 연도 라벨 3개 (2023 / 2024 / 2025 이런 식) */}
          <div className="metro-main-chart__xlabels">
            <span className="metro-main-chart__xlabels-item metro-main-chart__xlabels-item--left">
              {xYearLabels[0]}
            </span>
            <span className="metro-main-chart__xlabels-item metro-main-chart__xlabels-item--center">
              {xYearLabels[1]}
            </span>
            <span className="metro-main-chart__xlabels-item metro-main-chart__xlabels-item--right">
              {xYearLabels[2]}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}




// ========================================================
//  하위 지역용 미니 차트 (Nationwide 스타일 재사용)
// ========================================================

const MINI_WIDTH = 220;
const MINI_HEIGHT = 145;
const MINI_PADDING = 6;
const MINI_AXIS_AREA = 28;
const MINI_LINE_OFFSET_Y = 6;
const MINI_AXIS_OFFSET_Y = 10;
const MINI_LABEL_OFFSET_Y = 10;

interface MetroMiniChartProps {
  series: MetroPoint[];
  variant: 'above' | 'below';
}

// ✅ MetroMiniChart 전체 함수 교체
function MetroMiniChart({ series, variant }: MetroMiniChartProps) {
  if (!series || series.length === 0) {
    return (
      <span className="metro-child-card__chart-placeholder">
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

  const values = series
    .map((p) => p.indexValue)
    .filter((v): v is number => v != null);

  // 🔹 미니 차트는 기본 5% 여백
  const { min: minY, max: maxY } = getPaddedRange(values, 0.05);
  const range = maxY - minY || 1;

  const points = series
    .map((p, idx) => {
      const t = series.length === 1 ? 0.5 : idx / (series.length - 1);
      const x = padding + innerWidth * t;

      const baseY =
        padding +
        innerHeight * (1 - ((p.indexValue ?? minY) - minY) / range);

      const y = baseY + MINI_LINE_OFFSET_Y;
      return `${x},${y}`;
    })
    .join(' ');

  const axisY = padding + innerHeight + MINI_AXIS_OFFSET_Y;

  const firstYear = parseYear(series[0]?.ym) ?? new Date().getFullYear();
  const lastYear =
    parseYear(series[series.length - 1]?.ym) ?? firstYear;
  const yearSpan = lastYear - firstYear;
  const midYear =
    yearSpan >= 2 ? firstYear + 1 : Math.round((firstYear + lastYear) / 2);

  const years = [String(firstYear), String(midYear), String(lastYear)];

  const xLeft = padding + 4;
  const xCenter = padding + innerWidth / 2;
  const xRight = width - padding - 4;
  const labelY = axisY + MINI_LABEL_OFFSET_Y;

  return (
    <svg
      className={`metro-mini-chart metro-mini-chart--${variant}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        className={`metro-mini-chart__line metro-mini-chart__line--${variant}`}
        points={points}
      />

      <line
        className="metro-mini-chart__axis"
        x1={padding}
        y1={axisY}
        x2={width - padding}
        y2={axisY}
      />

      <text
        className="metro-mini-chart__axis-label"
        x={xLeft}
        y={labelY}
        textAnchor="start"
      >
        {years[0]}
      </text>
      <text
        className="metro-mini-chart__axis-label"
        x={xCenter}
        y={labelY}
        textAnchor="middle"
      >
        {years[1]}
      </text>
      <text
        className="metro-mini-chart__axis-label"
        x={xRight}
        y={labelY}
        textAnchor="end"
      >
        {years[2]}
      </text>
    </svg>
  );
}


// ========================================================
//  하위 지역 카드 컴포넌트 (큰 카드 / 작은 카드)
// ========================================================

interface MetroChildCardBaseProps {
  item: MetroChildRegion;
  onClick: (c: MetroChildRegion) => void;
  avgAbove: boolean;
}

interface MetroChildBigCardProps extends MetroChildCardBaseProps {
  label: string;
}

function MetroChildBigCard({
  item,
  onClick,
  avgAbove,
  label,
}: MetroChildBigCardProps) {
  const dev = item.totalDeviation ?? 0;
  const series = item.series ?? [];

  return (
    <button
      type="button"
      className={`metro-child-card metro-child-card--big ${
        avgAbove ? 'metro-child-card--above' : 'metro-child-card--below'
      }`}
      onClick={() => onClick(item)}
    >
      <div className="metro-child-card__label-big">{label}</div>
      <div className="metro-child-card__name-big">{item.name}</div>

      <div className="metro-child-card__chart metro-child-card__chart--big">
        <MetroMiniChart
          series={series}
          variant={avgAbove ? 'above' : 'below'}
        />
      </div>

      <div className="metro-child-card__meta">
        <span>편차 합계</span>
        <strong>{dev.toFixed(2)}</strong>
      </div>

      <div className="metro-child-card__year-range">
        {series.length > 0 && (
          <>
            <span>{formatYmLabel(series[0])}</span>
            <span> ~ </span>
            <span>{formatYmLabel(series[series.length - 1])}</span>
          </>
        )}
      </div>
    </button>
  );
}

interface MetroChildSmallCardProps extends MetroChildCardBaseProps {}

function MetroChildSmallCard({
  item,
  onClick,
  avgAbove,
}: MetroChildSmallCardProps) {
  const dev = item.totalDeviation ?? 0;
  const series = item.series ?? [];

  return (
    <button
      type="button"
      className={`metro-child-card metro-child-card--small ${
        avgAbove ? 'metro-child-card--above' : 'metro-child-card--below'
      }`}
      onClick={() => onClick(item)}
    >
      <div className="metro-child-card__name">{item.name}</div>

      <div className="metro-child-card__chart metro-child-card__chart--small">
        <MetroMiniChart
          series={series}
          variant={avgAbove ? 'above' : 'below'}
        />
      </div>

      <div className="metro-child-card__meta">
        <span>편차 합계</span>
        <strong>{dev.toFixed(2)}</strong>
      </div>

      <div className="metro-child-card__year-range">
        {series.length > 0 && (
          <>
            <span>{formatYmLabel(series[0])}</span>
            <span> ~ </span>
            <span>{formatYmLabel(series[series.length - 1])}</span>
          </>
        )}
      </div>
    </button>
  );
}

// ========================================================
//  페이지 뷰
// ========================================================

export default function MetroPageView(props: Props) {
  const { loading, error, data, onChildClick } = props;

  if (loading) {
    return <div className="metro-page">로딩 중…</div>;
  }

  if (error || !data) {
    return <div className="metro-page">오류: {error ?? '데이터 없음'}</div>;
  }

  const metroName = data.metro?.name ?? '광역시';
  const metroSeries: MetroPoint[] = data.metro?.series ?? [];
  const highSeries: MetroPoint[] = data.band?.high ?? [];
  const lowSeries: MetroPoint[] = data.band?.low ?? [];
  const children: MetroChildRegion[] = data.children ?? [];

  // 백엔드에서 이미 정렬되어 있지만, 혹시 모르니 한 번 더 정렬
  const sortedChildren = [...children].sort((a, b) => {
    const aDev =
      typeof a.totalDeviation === 'number' ? a.totalDeviation : -Infinity;
    const bDev =
      typeof b.totalDeviation === 'number' ? b.totalDeviation : -Infinity;
    return bDev - aDev; // 편차 큰 순
  });

  const topChild = sortedChildren[0];
  const bottomChild =
    sortedChildren.length > 1
      ? sortedChildren[sortedChildren.length - 1]
      : undefined;

  const others = sortedChildren.filter((child) => {
    if (topChild && child.regionCode === topChild.regionCode) return false;
    if (bottomChild && child.regionCode === bottomChild.regionCode) return false;
    return true;
  });

  return (
    <div className="metro-page">
      <MetroMainChart
        metroName={metroName}
        metro={metroSeries}
        high={highSeries}
        low={lowSeries}
      />

      <section className="metro-children">
        <header className="metro-children__header">
          <h3>하위 지역 편차 순</h3>
          <p>{metroName} 평균 지가지수 기준 편차 합계가 큰 순서</p>
        </header>

        {/* 최상 구 / 최하 구 대표 차트 (4번 시안 상단 영역) */}
        {(topChild || bottomChild) && (
          <div className="metro-children__top-row">
            {topChild && (
              <MetroChildBigCard
                item={topChild}
                onClick={onChildClick}
                avgAbove={(topChild.avgDiff ?? 0) >= 0}
                label={`${metroName} 최상 구`}
              />
            )}
            {bottomChild && (
              <MetroChildBigCard
                item={bottomChild}
                onClick={onChildClick}
                avgAbove={(bottomChild.avgDiff ?? 0) >= 0}
                label={`${metroName} 최하 구`}
              />
            )}
          </div>
        )}

        {/* 나머지 구들 3열 그리드 */}
        {others.length > 0 && (
          <section className="metro-children__list">
            <h4 className="metro-children__list-title">나머지 높은 순</h4>
            <div className="metro-children__grid">
              {others.map((child) => (
                <MetroChildSmallCard
                  key={child.regionCode}
                  item={child}
                  onClick={onChildClick}
                  avgAbove={(child.avgDiff ?? 0) >= 0}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
