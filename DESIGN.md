---
name: 오락실 (5rak-place)
description: 만들고, 놀고, 겨루고, 나누고, 크는 다섯 가지 즐거움
colors:
  ground: "#ffffff"
  surface: "#f2f5f9"
  surface-strong: "#e6ebf2"
  line: "#d9e0e8"
  line-strong: "#b8c3d1"
  ink: "#16202c"
  muted: "#4b5563"
  accent: "#2563eb"
  accent-ink: "#1d4ed8"
  gold: "#f5b301"
  gold-ink: "#2b1d00"
  gold-deep: "#a16207"
  danger: "#b91c1c"
  danger-deep: "#991b1b"
  team-doumy: "#6d35c9"
  team-wanted: "#c2410c"
  team-c: "#0e7490"
typography:
  display:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  brand:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  thumb-title:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "clamp(18px, 4.6vw, 24px)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1.3
  body:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  meta:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  ribbon:
    fontFamily: "Pretendard, sans-serif"
    fontSize: "13px"
    fontWeight: 800
    lineHeight: 1.2
rounded:
  input: "12px"
  card: "18px"
  dialog: "20px"
  pill: "22px"
  button: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  lg: "20px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ground}"
    typography: "{typography.title}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.accent-ink}"
  button-plain:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "48px"
  button-plain-hover:
    backgroundColor: "{colors.surface-strong}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ground}"
    rounded: "{rounded.button}"
    height: "48px"
  button-danger-hover:
    backgroundColor: "{colors.danger-deep}"
  top-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  tab-selected:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
  thumb:
    rounded: "{rounded.card}"
  ribbon-first:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.gold-ink}"
    typography: "{typography.ribbon}"
    padding: "7px 12px"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0 12px"
    height: "44px"
---

# Design System: 오락실 (5rak-place)

## Overview

**Creative North Star: "동네 오락실의 진열장"** (게임 카드는 2026-11-17부터 오락실 기기 모양)

오락실은 이 분야의 표준 게임 포털(Poki, Scratch 탐색 페이지)을 그 수준의 완성도로 따른다. 따로 세계관 장식을 얹지 않는다. 흰 바탕에 아주 옅은 회청 면, 짙은 잉크 글자, 주 행동색 파랑 하나. 화면을 채우는 건 썸네일 카드 격자이고, 카드를 서로 구별하는 건 만든 팀의 색과 '주간 1등' 금색 띠다.

밀도는 휴대폰 한 손 기준이다. 390px에서 카드 2열, 넓어지면 3열과 4열. 모든 누름 영역은 44px 이상이고, 글자는 Pretendard 한 가족 안에서 굵기 대비(400, 700, 800)로만 위계를 만든다. 쉬고 있을 때는 평평하고, 손가락이나 마우스가 닿을 때 카드가 살짝 떠오른다.

색은 역할마다 자리가 정해져 있다. 파랑은 누르는 것, 팀 색은 누가 만들었는지, 금색은 1등. 세 가지가 서로의 자리를 침범하지 않아서 아이가 설명 없이 화면을 읽는다.

**Key Characteristics:**
- 흰 바탕, 회청 면, 잉크 글자, 파랑 하나
- 팀 색은 썸네일 바탕, 팀 점, 로고에만
- 금색은 1등에만
- Pretendard 한 가족, 굵기 대비로 위계
- 둥근 카드(18px), 알약 모양 칩과 버튼
- 쉬고 있을 땐 평평, 닿을 때만 그림자
- 모든 누름 영역 44px 이상

## Colors

밝은 중립 바탕 위에 역할이 겹치지 않는 세 가지 색 무리(행동 파랑, 팀 색, 1등 금색)를 얹는다.

### Primary
- **행동 파랑** (accent): 버튼, 링크, 포커스 테두리, 대화상자에서 고른 닉네임 카드의 테두리. 화면에서 누를 수 있는 것을 알려 주는 유일한 색.
- **짙은 행동 파랑** (accent-ink): 파랑 버튼의 hover, 본문 링크 글자, 기록 저장 결과 문구.

### Secondary
- **1등 금색** (gold): '주간 1등' 띠의 바탕, '게임 랭킹' 링크의 트로피 아이콘.
- **금색 위 글자** (gold-ink): 금색 띠 위의 글자와 트로피. 금색 바탕에서 읽히는 짙은 갈색.
- **짙은 금색** (gold-deep): 흰 바탕 위에서 1등을 표시할 때. 랭킹 표의 1위 순위 숫자, 빈 띠의 트로피 아이콘.

### Tertiary
- **Doumy 보라** (team-doumy), **Wanted 주황** (team-wanted), **브실 청록** (team-c): 팀 정체성 색. 썸네일이 없을 때 썸네일 바탕, 카드 아래 팀 점, 로고 점에만 쓴다. 팀 색은 `games.json`의 팀마다 하나씩 정해진다.
- **닉네임 카드 색**: 닉네임 카드마다 순서대로 붙는 여덟 가지 색(파랑, 자홍, 초록, 호박, 보라, 청록, 빨강, 올리브). 언제나 카드 번호와 함께 표시한다.

### Neutral
- **흰 바탕** (ground): 페이지 바탕, 칩 바탕, 고른 탭의 바탕.
- **회청 면** (surface): 탭 묶음 바탕, 보조 버튼, 상단 링크, 빈 상태 안내.
- **짙은 회청 면** (surface-strong): 회청 면 위 요소의 hover.
- **선** (line): 칩 테두리, 표의 가로줄, 바닥 구분선, 입력칸 테두리.
- **짙은 선** (line-strong): 칩 hover 테두리, 관리 영역의 점선 테두리.
- **잉크** (ink): 본문과 제목 글자, 고른 칩의 바탕.
- **흐린 글자** (muted): 안내 방송 머리글, 낙 설명, 개수, 팀 이름, 표 머리, 날짜 범위.
- **위험 빨강** (danger, danger-deep): 관리 화면의 지우기 버튼과 그 hover, 입력 오류 문구.

### Named Rules
**The One Blue Rule.** 누르는 것은 파랑이다. 팀 색이나 금색으로 버튼을 칠하지 않는다. 고른 팀 칩조차 팀 색이 아니라 잉크로 채운다.

**The Team Territory Rule.** 팀 색은 기기 간판, 조이스틱 공, 썸네일 바탕, 팀 점, 로고에만 산다. 글자색, 테두리, 버튼으로 번지지 않는다.

**The Gold Means First Rule.** 금색은 1등 이야기에만 쓴다. 금색 바탕에는 gold-ink 글자, 흰 바탕에서는 gold-deep을 쓴다.

**The Number With Color Rule.** 닉네임 카드는 색과 번호를 언제나 함께 보여 준다. 같은 이름의 두 카드가 색만으로 구별되는 일이 없게 한다.

## Typography

**Display Font:** Pretendard (with sans-serif)
**Body Font:** Pretendard (with sans-serif)

**Character:** 한 가족의 한글 고딕. 굵기 400, 700, 800 세 단계만 쓰고, 제목은 800에 자간을 살짝 좁혀(-0.02em) 단단하게 만든다. 숫자 자리에는 tabular-nums를 켜서 점수가 줄 맞춰 선다. `word-break: keep-all`로 한국어 낱말이 중간에서 끊기지 않는다.

### Hierarchy
- **Display** (800, 26px, -0.02em): 랭킹 화면의 페이지 제목.
- **Brand** (800, 24px, -0.02em): 머리의 '오락실' 이름.
- **Thumb Title** (800, clamp(18px, 4.6vw, 24px), 1.2): 썸네일 그림이 없을 때 팀 색 바탕 위에 흰 글자로 쓰는 게임 이름.
- **Headline** (800, 19px, -0.01em): '지금 할 수 있어요' 같은 구역 제목.
- **Title** (800, 16px, 1.3): 카드 아래 게임 이름, 표의 점수와 게임 이름.
- **Body** (400, 16px, 1.55): 본문, 표 칸.
- **Label** (700~800, 15px): 칩, 탭, 상단 링크, 작은 버튼.
- **Meta** (400~700, 14px): 팀 이름, 개수, 1등 닉네임 줄, 바닥 안내.
- **Ribbon** (800, 13px, 1.2): 게임 그림 위 1등 띠.

### Named Rules
**The Single Family Rule.** 글꼴은 Pretendard 하나다(OFL-1.1, 사이트에 필요한 글자만 담은 subset woff2). 위계는 크기와 굵기로만 만든다. 두 번째 글꼴이나 시스템 글꼴 제목을 들이지 않는다.

**The Tabular Score Rule.** 점수, 순위, 카드 번호는 tabular-nums로 쓴다.

## Layout

한 줄 기둥(shell) 안에 모든 것이 선다. 기본 최대 폭은 1120px이고 좌우 여백(gutter)은 16px. 랭킹 화면은 표를 읽는 화면이라 기둥을 752px로 좁힌다.

게임 격자는 2열(gap 20px 세로, 12px 가로)에서 시작해 640px 이상에서 3열(28px, 16px), 960px 이상에서 4열이 된다. 게임 수가 적어서 첫 화면에는 팀 필터를 두지 않는다. 만든 팀은 카드 아래 팀 점과 'OO 팀'으로 보여 준다.

간격은 4, 8, 12, 16, 20, 32, 48px 단계로 쓴다. 카드 안 요소 사이는 8px, 구역 머리 위 20px, 관리 영역 위 32px, 바닥 위 48px. 관리 목록은 520px 이하에서 두 줄로 접힌다.

**The Narrow Board Rule.** 랭킹처럼 표를 읽는 화면은 752px 기둥을 쓴다. 게임을 고르는 격자 화면만 1120px까지 넓힌다.

**The Hidden Means Hidden Rule.** `[hidden]`은 `display: none !important`로 덮어쓴다. 컴포넌트의 display 값이 숨김 속성을 이기지 못하게 한다.

## Elevation & Depth

쉬고 있는 화면은 평평하다. 깊이는 흰 바탕과 회청 면의 명도 차이로 나눈다. 그림자는 상태에 반응할 때와 떠 있는 층에만 나타나고, 모두 잉크 계열(rgba(15, 23, 42, …))의 부드러운 그림자다.

### Shadow Vocabulary
- **기기 떠오름** (`filter: drop-shadow(0 12px 12px rgba(15, 23, 42, .3))`): 게임 기기의 hover와 키보드 포커스. 기기 모양을 따라 그림자가 지도록 box-shadow 대신 drop-shadow를 쓴다.
- **고른 탭** (`box-shadow: 0 1px 4px rgba(15, 23, 42, .14)`): 회청 탭 묶음 안에서 고른 흰 탭.
- **대화상자** (`box-shadow: 0 24px 60px rgba(15, 23, 42, .28)`): 게임 위에 뜨는 기록 남기기 대화상자.

### Named Rules
**The Flat At Rest Rule.** 카드는 쉬고 있을 때 그림자가 없다. 그림자는 hover, 선택, 떠 있는 대화상자에만 쓴다.

## Shapes

모서리는 모두 둥글다. 썸네일과 안내 상자, 관리 영역은 18px, 기록 대화상자는 20px. 누름 요소(칩, 탭, 상단 링크, 버튼)는 높이의 절반을 반지름으로 써서 알약 모양이 된다(44px 높이에 22px, 48px 버튼에 24px). 입력칸만 12px로 덜 둥글다. 팀 점은 10px 원, 닉네임 카드 배지는 24px 높이의 알약.

테두리는 1.5px 선(칩, 입력칸, '곧 열려요' 배지)과 1px 선(표 가로줄, 바닥)을 쓴다. 관리 영역만 2px 점선으로 일반 화면과 구별한다.

썸네일은 `overflow: hidden`으로 위의 띠와 아래 그림을 둥근 모서리에 맞춰 자른다.

## Components

### Buttons
알약 모양이고 굵다(800).
- **Shape:** 알약(24px, 높이 48px). 작은 버튼은 44px 높이, 15px 글자.
- **Primary:** 행동 파랑 바탕에 흰 글자, 좌우 22px.
- **Hover / Focus:** hover에서 짙은 행동 파랑. 포커스는 3px 파랑 outline, 2px 띄움.
- **Plain:** 회청 면 바탕에 잉크 글자, hover에서 짙은 회청.
- **Danger:** 관리 화면의 지우기 전용. 위험 빨강, hover에서 더 짙게.

### Cards / Containers (오락실 기기)
게임 카드 하나가 오락실 기기 한 대다. 위에서부터 간판, 화면, 조작판이 붙고, 기기 아래에 팀 줄과 1등 줄이 온다.
- **간판:** 팀 색 바탕, 위 모서리 14px, 높이 44px 이상. 팀 이모지와 게임 이름(흰 글자 15px 800, 두 줄까지). 위쪽 절반에 형광등 빛처럼 옅은 흰 그라데이션.
- **화면:** 잉크 몸통(#16202c) 안 8px 안쪽 여백에 8px 모서리 화면. 화면 테두리는 더 짙은 베젤(#0b1118) 2px. 위는 1등 띠, 아래는 4:3 게임 그림(`thumb`). 그림 위에 아주 옅은 브라운관 가로줄. 그림이 없으면 팀 색 바탕에 팀 이모지만 크게(이름은 간판에 있다).
- **조작판:** 몸통보다 양옆으로 6px 넓은 판(높이 34px, 아래 모서리 12px), 짙은 남색(#26344a)에서 잉크로 내려가는 그라데이션. 왼쪽에 팀 색 조이스틱 공, 오른쪽에 파랑·흰 버튼 둘. 장식이라 화면 읽기에서는 숨긴다.
- **Shadow Strategy:** 쉬고 있을 땐 그림자 없음. hover·포커스에서 기기가 4px 떠오르며 아래 그림자(drop-shadow), 화면 유리에 빛줄기가 한 번 지나가고, 조이스틱이 -18도 기운다. 누르는 순간 기기는 0.98로 줄고 파랑 버튼이 눌린다. 모션 줄이기에서는 3px 떠오르기만 남는다.
- **기기 아래:** 팀 점과 'OO 팀', 방문자 수 `· 👀 N명`, 인기 1위 배지(Meta, 좁으면 줄바꿈). 1등 기록이 있으면 '1등' + 닉네임 카드 배지 + 닉네임.
- **Focus:** 기기 전체에 3px 파랑 outline, 3px 띄움.

### Inputs / Fields
- **Style:** 흰 바탕, 1.5px 선 테두리, 12px 모서리, 높이 44px.
- **Focus:** 공통 3px 파랑 outline.
- **Error:** 위험 빨강 14px 700 문구를 칸 아래에.

### Navigation
- **Top bar:** 왼쪽에 36px 로고와 '오락실'(Brand), 오른쪽에 상단 링크(회청 알약, 44px, 15px 700). 메인에서는 금색 트로피 아이콘과 '게임 랭킹', 랭킹에서는 '게임 고르기'.
- **Tabs:** 회청 알약 묶음(4px 안쪽 여백, 26px 모서리) 안에 탭 셋(주간, 월간, 올타임). 고른 탭은 흰 바탕, 잉크 글자, 고른 탭 그림자. 나머지는 흐린 글자.

### 주간 1등 띠 (Signature)
게임 그림 바로 위에 왼쪽 끝부터 오른쪽 끝까지 붙는 띠. 그림을 가리지 않도록 그림 위에 겹치지 않고 따로 한 줄을 차지한다. 금색 바탕에 gold-ink 글자 13px 800, 16px 트로피 SVG와 '주간 1등 (점수)'. 썸네일의 둥근 모서리가 띠의 위 모서리를 함께 자른다. 기록이 없으면 빈 띠: surface 바탕, 아래 1px line, 잉크 글자, gold-deep 트로피, '첫 1등이 되어 보세요'.

### 인기 1위 배지
게임이 둘 이상이고 방문자 수가 가장 많은 게임의 팀 줄 끝에 붙는 알약. 연한 주황 바탕(#fff1e6)에 짙은 주황 글자(#9a3412) 12px 800, 앞에 🔥. 금색은 점수 1등 자리라서 인기에는 쓰지 않는다. 나타날 때 0.6배에서 커지며 한 번 튀어나오고(.45s), 불꽃은 아래를 축으로 살랑살랑 흔들린다(1.3s 왕복). 모션 줄이기에서는 둘 다 멈춘다.

### 동전 (구역 제목 앞)
'동전 없이 바로 시작' 제목 앞에 32px 은색 500원 동전 그림(`assets/coin.png`, 96px 투명 PNG). 가운데 '500'이 새겨진 만화풍 동전으로(실제 동전의 학·국가명·연도는 넣지 않는다), 2.6초마다 두 바퀴(rotateY 720도) 돌며 6px 튀어 올랐다가 내려앉고 쉰다. 모션 줄이기에서는 멈춘다.
- 출처: 2026-11-17 Codex(ChatGPT 계정) 이미지 생성 도구로 만든 그림을 ffmpeg로 96px로 줄였다. 모델 gpt-6.1-terra. 프롬프트: 정면 은색 500원풍 동전, 굵은 테두리와 톱니, 가운데 500 양각, 학·국가명·연도 없음, 짙은 회색 외곽선의 만화풍 게임 아이콘, 투명 배경.

### 오락실 전광판
머리 바로 아래, 기둥 폭을 꽉 채우는 한 줄. 게임 기기 조작판과 같은 재료다: 남색(#26344a)에서 잉크로 내려가는 틀(14px 모서리, 5px 안쪽 여백, 위쪽 흰 1px 빛줄)에, 왼쪽 '📢 방송'(흰 글자 13px 800, 바탕 없음), 오른쪽에 게임 화면 베젤과 같은 짙은 LED 창(#0b1118, 9px 모서리, 옅은 브라운관 줄무늬). 행동 파랑은 쓰지 않는다(누르는 것이 아니므로). 창 안에서 흰 글자 15px 700이 오른쪽에서 왼쪽으로 1초에 70px씩 끊김 없이 흐르고(같은 묶음을 두 번 이어 붙여 돈다), 창 양끝 28px는 화면색 그늘로 글자가 스르륵 나타나고 사라진다. 글 사이에는 옅은 ★.
- 글: "너무 재밌으니 조심하라"는 과장된 안내 일곱 개(순서는 열 때마다 섞임) 사이사이, 안내 두 개마다 '🕹️ 누적 손님 N명!'(연한 파랑 #93c5fd, 800). 0명이면 '🕹️ 첫 손님을 기다리고 있어요!'.
- 누적 손님은 1분마다(화면이 보일 때만) GoatCounter에 다시 묻고, 숫자가 늘면 흐르던 자리 그대로 숫자만 바뀌며 잠깐 밝아진다(1.2s). 화면 읽기 프로그램에는 숨긴 글로 새 숫자를 읽어 준다.
- 마우스를 올리면 멈춘다. 모션 줄이기에서는 흐르지 않고 6초마다 한 줄씩 바뀐다.

### 오락실 뜻과 다섯 가지 낙 (바닥)
바닥 맨 위에 '오락실(五樂室)이란?'(Headline)와 이름 풀이 한 문단. 그 아래 다섯 가지 낙을 동전(토큰) 목록으로: 44px 원형 동전(흰빛에서 짙은 회청으로 가는 원형 그라데이션, 테두리 두 겹) 안에 낙 이모지, 옆에 낙 이름(15px 800 잉크)과 장난스러운 한 줄(14px 흐린 글자). 좁은 화면에서는 한 줄에 하나씩(동전 왼쪽, 글 오른쪽), 960px 이상에서는 다섯 개를 한 줄에 나란히(동전 위, 글 아래). 3개·2개로 나뉘는 배치는 쓰지 않는다. hover에서 동전이 한 바퀴 뒤집힌다. 맨 아래에 '기록은 이 기기에만 저장돼요' 안내.

### 닉네임 카드 배지
24px 높이의 알약(12px 모서리, 최소 폭 24px)에 카드 색 바탕, 흰 카드 번호 12px 800 tabular-nums. 화면 읽기 프로그램에는 'N번 카드'로 읽힌다. 카드 1등 줄에서는 20px, 관리 목록에서는 28px로 크기만 바뀐다.

### 별점
별 다섯 개를 직접 그린 SVG 별(둥근 꼭짓점)로 쓴다. 채운 별은 잉크, 빈 별은 흐린 글자색 테두리만 그려서 색이 아니라 모양으로도 구별한다. 금색은 1등 자리라서 별에 쓰지 않는다. 화면 읽기에는 '5점 만점에 N점'으로 읽힌다. 목록에서는 16px, 평균과 카드에서는 별 하나와 숫자(평균은 19px 800, 카드는 Meta 줄의 '· ★ 4.5').

### 게임 리뷰 (랭킹 화면)
게임별 랭킹 화면에서 행동 버튼 아래, 1px 선으로 나눈 구역. 'Headline' 제목 '게임 리뷰'와 오른쪽에 평균(별 하나, 점수, '리뷰 N개'). 리뷰마다 한 줄에 별점, 별명(800), 날짜(오른쪽, 흐린 글자 tabular), 아래에 한 줄 평(Body, 65ch까지). 줄 사이는 랭킹 표처럼 1px 선. 리뷰가 없으면 빈 상태 안내 상자. 맨 아래에 보조 버튼 '💬 의견 남기기'와 부모님이 확인한 뒤 올라간다는 흐린 안내.

### 의견 남기기 창
기록 남기기 대화상자와 같은 재료(20px 모서리, 대화상자 그림자, 52px 알약 버튼). 위에 제목과 게임 이름, 그 아래 회청 알약 묶음 안에 종류 둘(⭐ 게임 평가, 🐞 버그 신고)을 탭처럼 고른다. 리뷰는 48px 별 버튼 다섯 개(고르면 살짝 커진다), 별명, 한 줄 평(80자). 버그 신고는 별명(안 써도 됨)과 긴 글(300자), 함께 보내는 기기 정보 상자. 주 버튼은 '부모님께 보내기'. 보낸 뒤에는 공유됐는지 복사됐는지 알려 주고, 보낼 글을 읽기 전용 상자에 보여 준다. 화살표 키로 종류와 별점을 고를 수 있다.

### 랭킹 표
머리줄은 13px 700 흐린 글자, 1.5px 선 아래줄. 칸은 위아래 14px, 1px 선. 순위는 18px 800, 1위만 gold-deep. 점수 칸은 오른쪽 정렬 800.

## Do's and Don'ts

### Do:
- **Do** 누르는 것은 행동 파랑으로, 고른 상태는 잉크 바탕으로 표시한다.
- **Do** 팀 색은 썸네일 바탕, 팀 점, 로고에만 쓴다.
- **Do** 1등은 게임 그림 바로 위에 붙은 금색 띠로 보여 주고, 기록이 없으면 surface 색 빈 띠를 쓴다. 띠는 그림을 가리지 않는다.
- **Do** 닉네임 카드는 색 배지 안에 번호를 함께 넣는다.
- **Do** 모든 누름 영역을 44px 이상으로 만든다(주 버튼 48px).
- **Do** 랭킹처럼 표를 읽는 화면은 752px 기둥을 쓴다.
- **Do** 모션 줄이기 설정에서는 전환과 애니메이션을 끈다.

### Don't:
- **Don't** 팀 색이나 금색으로 버튼, 링크, 테두리를 칠하지 않는다.
- **Don't** 닉네임 카드나 상태를 색만으로 구별하지 않는다.
- **Don't** Pretendard 말고 다른 글꼴을 들이지 않는다.
- **Don't** 금색을 1등이 아닌 곳에 쓰지 않는다.
- **Don't** 쉬고 있는 카드에 그림자를 주지 않는다.
