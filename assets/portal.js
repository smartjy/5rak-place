/* 오락실 첫 화면: 게임 카드 */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var manage = params.has("manage");
  var TROPHY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3h10v2h3a1 1 0 0 1 1 1v2a5 5 0 0 1-4.6 5A5 5 0 0 1 13 15.9V18h3v3H8v-3h3v-2.1A5 5 0 0 1 7.6 13 5 5 0 0 1 3 8V6a1 1 0 0 1 1-1h3V3Zm10 4v3.9A3 3 0 0 0 19 8V7h-2ZM5 7v1a3 3 0 0 0 2 2.9V7H5Z"/></svg>';

  var state = { teams: [], games: [], best: {}, visits: {}, popular: {} };

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function teamOf(game) {
    for (var i = 0; i < state.teams.length; i++) if (state.teams[i].id === game.team) return state.teams[i];
    return null;
  }

  function card(game) {
    var team = teamOf(game);
    var li = h("li");
    var root = h("a", "game");
    if (team) root.style.setProperty("--team", team.color);
    root.href = "games/" + encodeURIComponent(game.slug) + "/";

    var thumb = h("div", "thumb");
    var best = state.best[game.slug] || null;
    var ribbon = h("span", "ribbon" + (best ? "" : " empty"));
    ribbon.innerHTML = TROPHY;
    ribbon.appendChild(h("span", "num", best ? "주간 1등 " + FiveRak.formatScore(best.score, game) : "첫 1등이 되어 보세요"));
    thumb.appendChild(ribbon);

    // 게임 그림: 게임 폴더의 thumb 그림, 없으면 팀 색 바탕에 팀 이모지
    var art = h("div", "thumb-art");
    if (game.thumb) {
      var img = h("img");
      img.src = "games/" + encodeURIComponent(game.slug) + "/" + game.thumb;
      img.alt = "";
      img.loading = "lazy";
      art.appendChild(img);
    } else {
      var emoji = h("span", "thumb-emoji", team ? team.emoji : "🎮");
      emoji.setAttribute("aria-hidden", "true");
      art.appendChild(emoji);
    }
    thumb.appendChild(art);

    // 오락실 기기: 위 간판(게임 이름) + 가운데 화면 + 아래 조작판
    var cab = h("span", "cab");
    var marquee = h("span", "cab-marquee");
    if (team) {
      var mEmoji = h("span", "cab-emoji", team.emoji);
      mEmoji.setAttribute("aria-hidden", "true");
      marquee.appendChild(mEmoji);
    }
    marquee.appendChild(h("span", "game-name", game.title));
    cab.appendChild(marquee);
    var screen = h("span", "cab-screen");
    screen.appendChild(thumb);
    cab.appendChild(screen);
    var panel = h("span", "cab-panel");
    panel.setAttribute("aria-hidden", "true");
    panel.appendChild(h("span", "cab-stick"));
    panel.appendChild(h("span", "cab-start", "▶ 시작"));
    panel.appendChild(h("span", "cab-btn a"));
    panel.appendChild(h("span", "cab-btn b"));
    cab.appendChild(panel);
    root.appendChild(cab);

    var meta = h("span", "game-meta");
    var dot = h("span", "team-dot");
    dot.setAttribute("aria-hidden", "true");
    meta.appendChild(dot);
    meta.appendChild(document.createTextNode(team ? team.name + " 팀" : "점검용"));
    if (state.visits[game.slug]) {
      meta.appendChild(h("span", "game-visits", "· 👀 " + state.visits[game.slug] + "명"));
    }
    if (state.popular[game.slug]) {
      var hot = h("span", "hot");
      var flame = h("span", "flame", "🔥");
      flame.setAttribute("aria-hidden", "true");
      hot.appendChild(flame);
      hot.appendChild(document.createTextNode("인기 1위"));
      meta.appendChild(hot);
    }
    root.appendChild(meta);
    if (best) {
      var bestLine = h("span", "game-best");
      bestLine.appendChild(h("span", null, "1등"));
      bestLine.appendChild(FiveRak.cardBadge(best));
      bestLine.appendChild(h("span", "game-best-name", best.name));
      root.appendChild(bestLine);
    }

    li.appendChild(root);
    if (game.status === "live") li.appendChild(reviewButton(game));
    return li;
  }

  // 카드 아래 리뷰 남기기 (카드 링크와 따로 눌려요). 리뷰는 화면에 보이지 않고 운영자에게 가요.
  function reviewButton(game) {
    var write = h("button", "review-write", "✍️ 리뷰 남기기");
    write.type = "button";
    write.setAttribute("aria-label", "「" + game.title + "」 리뷰 남기기");
    write.addEventListener("click", function () { FiveRak.openReview(game.slug); });
    return write;
  }

  function fill(listId, sectionId, games, emptyText) {
    var list = document.getElementById(listId);
    list.textContent = "";
    games.forEach(function (g) {
      list.appendChild(card(g));
    });
    var section = document.getElementById(sectionId);
    var old = section.querySelector(".empty-note");
    if (old) old.remove();
    if (!games.length) section.appendChild(h("p", "empty-note", emptyText));
  }

  function renderGames() {
    var visible = state.games.filter(function (g) {
      return manage || !g.hidden;
    });
    // 만드는 중(coming)인 게임은 첫 화면에 보이지 않아요.
    var live = visible.filter(function (g) { return g.status === "live"; });
    fill("live-grid", "live-section", live, "아직 열린 게임이 없어요. 곧 첫 게임이 들어와요!");
  }

  // ---------- 오락실 전광판: 안내 방송 + 누적 손님 ----------
  // 글자가 오른쪽에서 왼쪽으로 계속 흘러가요. 누적 손님은 1분마다 다시 확인해서
  // 바뀌면 숫자가 반짝여요. 모션 줄이기에서는 흐르지 않고 한 줄씩 바뀌어요.
  var PA_LINES = [
    "주의! 한 판만 하려다 열 판 하게 돼요.",
    "너무 재밌어서 숙제를 까먹을 수 있어요. 숙제 먼저!",
    "엄마가 부르면 바로 대답하기. 게임은 도망 안 가요.",
    "눈이 뻑뻑하면 창밖 한 번 보고 오기!",
    "1등 뺏겼다고 밤새우면 안 돼요. 오락실은 내일도 열려요.",
    "여기서는 시간이 두 배로 빨리 가요. 시계를 꼭 보세요!",
    "손가락 쥐 나기 전에 쉬어 가기. 손가락도 소중해요."
  ];
  var TICKER_SPEED = 70; // 1초에 흘러가는 픽셀
  var COUNT_EVERY = 60 * 1000; // 누적 손님을 다시 확인하는 간격
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ticker = { count: null, lines: [] };

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function countText(n) {
    return n > 0 ? "🕹️ 누적 손님 " + n.toLocaleString("ko-KR") + "명!" : "🕹️ 첫 손님을 기다리고 있어요!";
  }

  // 전광판에 흐를 글 목록: 안내 두 개마다 누적 손님 한 번
  function tickerItems() {
    var items = [];
    ticker.lines.forEach(function (line, i) {
      if (ticker.count != null && i % 2 === 0) items.push({ count: true });
      items.push({ text: line });
    });
    return items;
  }

  function itemNode(item) {
    if (item.count) {
      var c = h("span", "tk-item tk-count", countText(ticker.count));
      return c;
    }
    return h("span", "tk-item", item.text);
  }

  function renderTicker() {
    var track = document.getElementById("ticker-track");
    if (!track) return;
    track.textContent = "";
    track.style.animation = "none";
    var items = tickerItems();
    if (reduceMotion) {
      // 흐르지 않고 6초마다 한 줄씩 바뀌어요
      var i = 0;
      var one = h("span", "tk-one");
      one.appendChild(itemNode(items[0]));
      track.appendChild(one);
      clearInterval(ticker.flip);
      ticker.flip = setInterval(function () {
        i = (i + 1) % items.length;
        one.textContent = "";
        one.appendChild(itemNode(items[i]));
      }, 6000);
      return;
    }
    // 같은 글 묶음을 두 번 이어 붙여서 끊김 없이 돌아요
    for (var k = 0; k < 2; k++) {
      var group = h("span", "tk-group");
      if (k === 1) group.setAttribute("aria-hidden", "true");
      items.forEach(function (it) { group.appendChild(itemNode(it)); });
      track.appendChild(group);
    }
    var width = track.firstChild.getBoundingClientRect().width;
    track.style.setProperty("--tk-shift", -width + "px");
    track.style.animation = "";
    track.style.animationDuration = Math.max(20, width / TICKER_SPEED) + "s";
  }

  // 누적 손님 숫자만 바꿔요. 흐르던 자리는 그대로 두고 숫자가 반짝여요.
  function updateCount(n) {
    var first = ticker.count == null;
    var grew = !first && n > ticker.count;
    ticker.count = n;
    if (first) { renderTicker(); }
    else {
      document.querySelectorAll("#ticker-track .tk-count").forEach(function (el) {
        el.textContent = countText(n);
        if (grew) {
          el.classList.remove("bump");
          void el.offsetWidth; // 반짝 효과를 다시 틀려고 한 번 끊어요
          el.classList.add("bump");
        }
      });
    }
    var sr = document.getElementById("ticker-sr");
    if (sr && (first || grew)) sr.textContent = countText(n);
  }

  function checkCount() {
    if (document.hidden) return;
    FiveRak.visitorCount().then(function (count) {
      if (!count) return;
      var n = parseInt(String(count).replace(/[^0-9]/g, ""), 10) || 0;
      if (n !== ticker.count) updateCount(n);
    });
  }

  (function startTicker() {
    if (!document.getElementById("ticker-track")) return;
    ticker.lines = shuffled(PA_LINES);
    renderTicker();
    checkCount();
    setInterval(checkCount, COUNT_EVERY);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) checkCount(); });
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderTicker, 200);
    });
  })();

  // 게임 목록(games.json)을 못 받았을 때만 오류 안내를 보여요.
  // 1등 기록을 못 읽어도 게임 카드는 그대로 보여 줘요.
  FiveRak.catalog().then(function (c) {
    state.teams = c.teams;
    state.games = c.games;
    renderGames();
    var live = c.games.filter(function (g) { return g.status === "live"; });
    Promise.all(live.map(function (g) {
      return FiveRak.data.best(g.slug, "week").then(function (b) {
        state.best[g.slug] = b;
      }, function () {});
    })).then(renderGames);
    // 게임마다 다녀간 사람 수. 못 받은 게임은 숫자 없이 보여요.
    // 게임이 둘 이상이면 가장 많이 다녀간 게임에 "인기 1위"를 붙여요(같으면 함께).
    Promise.all(live.map(function (g) {
      return FiveRak.visitorCount(g.slug).then(function (n) {
        if (n) state.visits[g.slug] = n;
      });
    })).then(function () {
      var num = function (slug) { return parseInt(String(state.visits[slug] || "0").replace(/[^0-9]/g, ""), 10) || 0; };
      var top = 0;
      live.forEach(function (g) { top = Math.max(top, num(g.slug)); });
      if (live.length > 1 && top > 0) {
        live.forEach(function (g) { if (num(g.slug) === top) state.popular[g.slug] = true; });
      }
      renderGames();
    });
  }, function () {
    document.getElementById("load-error").hidden = false;
    document.getElementById("live-section").hidden = true;
  });
})();
