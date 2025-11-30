// src/main/center/metro/index.tsx

import MetroPageView from './metro.view';
import { useMetroPage } from './metro.event';

export default function MetroPage() {
  const state = useMetroPage();
  return <MetroPageView {...state} />;
}
