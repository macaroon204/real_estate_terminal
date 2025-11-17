// // src/sections/top/function/useTopControl.ts
// import { useNavigate } from 'react-router-dom';

// export default function useTopControl() {
//   const navigate = useNavigate();

//   // 로고 클릭 → 메인 페이지 이동
//   const goHome = () => navigate('/');

//   // 검색어 입력 후 엔터 or 버튼 → 검색 결과 페이지로 이동
//   const goSearch = (keyword: string) => {
//     const trimmed = keyword.trim();
//     if (!trimmed) return;
//     navigate(`/search/${encodeURIComponent(trimmed)}`);
//   };

//   return { goHome, goSearch };
// }
