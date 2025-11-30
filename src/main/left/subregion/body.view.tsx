// src/sections/left/subregion/body.view.tsx
type Item = { code: string; name: string };

type Props = {
  items: Item[];
  onItemClick?: (code: string) => void;   // ✅ 추가
};

export function SubregionBodyRows({ items, onItemClick }: Props) {
  return (
    <>
      {items.map(it => (
        <li
          key={it.code}
          className="left-body__row"
          data-code={it.code}
          onClick={() => onItemClick?.(it.code)}    // ✅ 클릭 시 콜백 호출
        >
          <div className="left-body__content">
            <span className="left-body__label">{it.name}</span>
          </div>
        </li>
      ))}
    </>
  );
}
