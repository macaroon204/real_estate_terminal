// src/App.tsx
import MainPage from './pages/MainPage'; // ✅ MainPage 불러오기
// import './App.css'; // ❌ 데모 스타일 제거 (원하면 잠시 유지해도 됨)

export default function App() {
  return <MainPage />; // ✅ MainPage만 렌더
}
