import './style.css';
import SubRegionChart from './chart';

export default function SubRegionLayout({ data }: any) {
  return (
    <div className="subregion-container">

      <header className="subregion-header">
        <h2>{data.regionName}</h2>
        <span>최근 3개년 지가지수 추이</span>
      </header>

      <section className="subregion-chart">
        <SubRegionChart series={data.series}/>
      </section>

    </div>
  );
}
