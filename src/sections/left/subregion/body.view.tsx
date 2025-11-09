// src/sections/left/subregion/body.view.tsx
type Item = { code: string; name: string };

type Props = {
  items: Item[];
};

export function SubregionBodyRows({ items }: Props) {
  return (
    <>
      {items.map(it => (
        <li key={it.code} className="left-body__row" data-code={it.code}>
          <div className="left-body__content">
            <span className="left-body__label">{it.name}</span>
          </div>
        </li>
      ))}
    </>
  );
}
