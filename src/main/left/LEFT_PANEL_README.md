# 📌 좌측 패널 구조 안내 — “광역 = 헤더, 하위 = 바디” 아코디언  
(현재 소스 기준)

# 1. 전체 구조 이해하기

## 1-1. 사용된 핵심 태그
| 역할 | 태그 | 클래스 | 설명 |
|------|------|---------|-------|
| 전체 리스트 | `<ul>` | `.left-list-root` | 불릿/여백 제거, 리스트 공통 컨테이너 |
| 광역 헤더 | `<li>` | `.left-header__row` | 광역시 1줄 (라벨 + 토글 버튼) |
| 하위 바디 | `<li>` | `.left-body__row` | 시·군·구 목록 (조건부 생성) |

## 1-2. 태그 계층 다이어그램
```
<ul.left-list-root>
  ├─ <li.left-header__row> 서울특별시
  │     └─ <button.left-header__icon>토글</button>
  ├─ <li.left-body__row> 종로구
  ├─ <li.left-body__row> 중구
  ├─ <li.left-body__row> 용산구
  ├─ <li.left-header__row> 부산광역시
  └─ ...
```

## 1-3. 헤더/바디 구조 요약
```
[헤더: 광역시]
   ▼ (열리면)
[바디: 시·군·구 여러 줄]
```

# 2. 헤더/바디 개념을 UI로 구현한 방식

## 2-1. 개념(헤더 = 광역, 바디 = 하위)
- 헤더: 광역시 한 줄  
- 바디: 해당 광역시의 시·군·구 묶음  

## 2-2. 개념을 UI로 옮긴 클래스 구조
| 개념 | UI 요소 | CSS 클래스 | 설명 |
|------|---------|-------------|-------|
| 헤더 | `<li>` | `.left-header__row` | 항상 렌더됨. 토글 이벤트 담당 |
| 바디 | `<li>` | `.left-body__row` | 헤더가 열릴 때만 생성되는 줄 |

## 2-3. DOM·클래스 시각 구조
```
헤더 (항상 표시)
바디 (헤더가 열릴 때 여러 줄 등장)
헤더
바디...
```

## 2-4. React에서 구현되는 흐름
```
헤더 토글 클릭
→ onToggle(metroCode)
→ openSet.add/remove
→ 재렌더
→ 바디 생성/삭제
```

## 2-5. 헤더/바디 클래스 역할 차이
### 헤더
- 항상 존재  
- 인터랙션 담당  
### 바디
- 조건부 생성  
- 들여쓰기·하위 스타일 전용  

## 2-6. 시각 요약
```
헤더 1
  └─ 바디들
헤더 2
...
```

# 3. React 전체 조립 흐름

## 3-1. 상태(openSet)
```ts
const [openSet, setOpenSet] = useState<Set<MetroCode>>(new Set());
```

## 3-2. 렌더 패턴
```jsx
metros.map(m => (
  <>
    <MetroHeaderRow code={m.code} />
    {isOpen(m.code) && <SubregionBodyRows metro={m.code} />}
  </>
))
```

## 3-3. 이벤트 흐름
```
icon 클릭 → onToggle → openSet 변경 → 재렌더 → DOM 생성/삭제
```

## 3-4. React 트리 구조
```
<LeftPanel>
└─ <ul.left-list-root>
     ├─ <MetroHeaderRow />
     ├─ <SubregionBodyRows />
     ├─ <MetroHeaderRow />
     └─ ...
```

## 3-5. 사용자 → DOM 변화 순서도
```
클릭 → 상태 변경 → 렌더 → 바디 생성/삭제
```

# 4. 스타일 구조

## 4-1. 공통 영역
- 불릿 제거  
- 마진/패딩 0  

## 4-2. 헤더 스타일
- 행 높이  
- 텍스트/아이콘 정렬  

## 4-3. 바디 스타일
- padding-left  
- 구분선  
- 경량 텍스트  

# 5. HTML 예시

## 5-1. 모두 닫힘
```
<ul>
  <li class="left-header__row">서울특별시 ▶</li>
  <li class="left-header__row">부산광역시 ▶</li>
</ul>
```

## 5-2. 서울만 열림
```
<ul>
  <li class="left-header__row is-open">서울특별시 ▼</li>
  <li class="left-body__row">종로구</li>
  <li class="left-body__row">중구</li>
  <li class="left-body__row">용산구</li>

  <li class="left-header__row">부산광역시 ▶</li>
</ul>
```

# 6. 최종 요약
- 헤더/바디 구조 명확함  
- React는 openSet 기반  
- 바디는 DOM 조건부 생성  
- 단일 <ul> 내부 아코디언 패턴  
