import './LogoStyle.css'; // ✅ 스타일은 내부 결합

type LogoLayoutProps = {
  imgSrc?: string;
};

export default function LogoLayout({ imgSrc }: LogoLayoutProps) {
  return (
    <div className="logo">
      {imgSrc ? (
        <img className="logo__img" src={imgSrc} alt="로고" />
      ) : (
        <div className="logo__fallback" aria-hidden />
      )}
      <span className="logo__text">부동산 터미널</span>
    </div>
  );
}
