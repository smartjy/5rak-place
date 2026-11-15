# 5rak-place (오락실)

AI 수업 학생 팀이 만든 웹 게임을 모아 두는 오락실이에요. 만들고, 놀고, 겨루고, 나누고, 크는 다섯 가지 즐거움.

## 구조

```
index.html          게임 고르는 첫 화면
rank.html           랭킹 (?game=<slug> 게임별, 없으면 전체 1등 판, ?manage 관리)
games.json          팀과 게임 목록
lib/5rak.js         게임이 불러오는 공용 스크립트 (기록 남기기, 닉네임 카드, 랭킹)
assets/             화면 스타일과 스크립트
games/<slug>/       게임 하나 = 폴더 하나
games/_sample/      숨긴 점검용 페이지 (게임 아님)
```

## 게임 올리는 법

1. `games/<slug>/index.html`에 게임을 넣어요. 경로는 상대 경로만 써요.
2. 게임에 공용 스크립트를 넣고, 점수가 나오면 한 줄을 불러요.
   ```html
   <script src="../../lib/5rak.js"></script>
   <script>
     // 게임이 끝났을 때
     FiveRak.submitScore(점수);
   </script>
   ```
3. `games.json`에서 그 게임의 `status`를 `"live"`로 바꾸고, 점수 방향(`score.order`: `high` 또는 `low`)과 단위(`score.unit`)를 적어요. 게임 화면을 4:3으로 찍은 대표 그림(`thumb.jpg`)을 게임 폴더에 넣고 `thumb`에 파일 이름을 적어요. 카드에서 어떤 게임인지 한눈에 알아보는 그림이에요. `coming`(만드는 중)인 게임은 첫 화면에 나오지 않아요.
4. 브랜치에서 작업하고 PR로 올려요.

## 로컬에서 보기

GitHub Pages처럼 `/5rak-place/` 아래에서 열려야 하므로 상위 폴더에서 서버를 띄워요.

```sh
cd ..
python3 -m http.server 8000
# http://localhost:8000/5rak-place/
```

## 기록에 대해

랭킹 기록은 지금 각 기기의 브라우저에만 저장돼요. 폰마다 기록이 따로 쌓여요. 주소 끝에 `?manage`를 붙이면 기록 지우기와 닉네임 정리가 나와요.
