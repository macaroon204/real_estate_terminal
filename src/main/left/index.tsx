// src/sections/left/index.tsx
import { Fragment } from 'react';
import type { MetroCode } from '../../pages/data/regions';
import { MetroHeaderRow } from './metro/header.view';
import { SubregionBodyRows } from './subregion/body.view';
import './list.base.css';
import './metro/header.style.css';
import './subregion/body.style.css';
import { NationwideRow } from './nationwide/row.view';
import './nationwide/row.style.css';
import { useNavigate } from 'react-router';
import { useLeftPanelState } from './index.connect';

export default function LeftPanel() {
  const navigate = useNavigate();

  const { metros, loading, error, isOpen, onToggle } = useLeftPanelState();

  // 광역시 라벨 클릭 → /main/:metroCode
  const handleMetroLabelClick = (code: MetroCode) => {
    navigate(`/main/${code}`);
  };

  // ✅ 하위지역 클릭 → /main/:metroCode/:subRegionCode
  const handleSubregionClick = (metroCode: MetroCode, subCode: string) => {
    navigate(`/main/${metroCode}/${subCode}`);
  };

  return (
    <ul className="left-list-root">
      <NationwideRow />

      {loading && (
        <li className="left-body__row">
          <div className="left-body__content">
            <span className="left-body__label">불러오는 중...</span>
          </div>
        </li>
      )}

      {error && !loading && (
        <li className="left-body__row">
          <div className="left-body__content">
            <span className="left-body__label">{error}</span>
          </div>
        </li>
      )}

      {!loading &&
        !error &&
        metros.map((m) => (
          <Fragment key={m.code}>
            <MetroHeaderRow
              code={m.code}
              name={m.name}
              isOpen={isOpen(m.code)}
              onToggle={() => onToggle(m.code)}
              onLabelClick={() => handleMetroLabelClick(m.code)}
            />

            {isOpen(m.code) && (
              <SubregionBodyRows
                items={m.subregions}
                // ✅ 여기서 metro 코드와 subregion 코드를 합쳐서 라우팅
                onItemClick={(subCode) => handleSubregionClick(m.code, subCode)}
              />
            )}
          </Fragment>
        ))}
    </ul>
  );
}
