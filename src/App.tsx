// src/App.tsx
// import { RouterProvider, createBrowserRouter } from 'react-router';
import { RouterProvider, createBrowserRouter } from 'react-router';
import HomePage from './pages/HomePage';
import MainPage from './pages/MainPage';
import NationwidePage from './main/center/nationwide';
import MetroPage from './main/center/metro';  // ⬅ 추가
import SubRegionPage from './main/center/subregion';

// 라우트 테이블 정의
const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage,           // 홈페이지
  },
  {
    path: '/main',
    Component: MainPage,           // 공통 레이아웃
    children: [
      {
        path: 'nationwide',
        Component: NationwidePage,  // 전국
      },
      {
        path: ':metroCode',
        Component: MetroPage,  // 광역시
      },
      {
        path: ':metroCode/:subRegionCode',
        Component: SubRegionPage,              // ✅ 핵심
      },
    ],
  },
]);


export default function App() {
  // App은 이제 라우터를 전체 앱에 제공하는 역할만 한다
  return <RouterProvider router={router} />;
}

