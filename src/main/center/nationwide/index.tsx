// src/main/center/nationwide/index.tsx
import { useNationwidePage } from './nationwide.event';
import { NationwidePageView } from './nationwide.view';
import './nationwide.style.css';

export default function NationwidePage() {
  const props = useNationwidePage();
  return <NationwidePageView {...props} />;
}
