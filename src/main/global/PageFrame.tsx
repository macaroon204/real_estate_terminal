import './global.css';

type GlobalLayoutProps = {
  top: React.ReactNode;
  left: React.ReactNode;
  center: React.ReactNode;
};

export default function GlobalLayout({ top, left, center }: GlobalLayoutProps) {
  return (
    <div className="global-layout">
      <header className="global-top">{top}</header>
      <div className="global-body">
        <aside className="global-left">{left}</aside>
        <main className="global-center">{center}</main>
      </div>
    </div>
  );
}
