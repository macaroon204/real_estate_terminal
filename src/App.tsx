// src/App.tsx
import { RouterProvider, createBrowserRouter } from 'react-router';
import HomePage from './pages/HomePage';
import MainPage from './pages/MainPage';
import NationwidePage from './main/center/nationwide';

// 라우트 테이블 정의
const router = createBrowserRouter([
  {
    path: '/',              // http://localhost:5173/
    Component: HomePage,    // → 홈페이지
  },
  {
    path: '/main',          // http://localhost:5173/main
    Component: MainPage,    // → 프레임(Top/Left/Center)
    children: [
      {
        path: 'nationwide', // → /main/nationwide
        Component: NationwidePage,
      },
      // metro는 나중에 구현
      // {
      //   path: 'metro/:metroCode',
      //   Component: MetroPage,
      // },
    ],
  },
]);

export default function App() {
  // App은 이제 라우터를 전체 앱에 제공하는 역할만 한다
  return <RouterProvider router={router} />;
}

// // src/App.tsx
// import MainPage from './pages/MainPage'; // ✅ MainPage 불러오기

// export default function App() {
//   return <MainPage />; // ✅ MainPage만 렌더
// }
