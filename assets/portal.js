/* 오락실 첫 화면: 게임 카드 */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var manage = params.has("manage");
  var TROPHY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3h10v2h3a1 1 0 0 1 1 1v2a5 5 0 0 1-4.6 5A5 5 0 0 1 13 15.9V18h3v3H8v-3h3v-2.1A5 5 0 0 1 7.6 13 5 5 0 0 1 3 8V6a1 1 0 0 1 1-1h3V3Zm10 4v3.9A3 3 0 0 0 19 8V7h-2ZM5 7v1a3 3 0 0 0 2 2.9V7H5Z"/></svg>';

  var state = { teams: [], games: [], best: {} };

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

    // 게임 그림: 게임 폴더의 thumb 그림, 없으면 팀 색 바탕에 게임 이름
    var art = h("div", "thumb-art");
    if (game.thumb) {
      var img = h("img");
      img.src = "games/" + encodeURIComponent(game.slug) + "/" + game.thumb;
      img.alt = "";
      img.loading = "lazy";
      art.appendChild(img);
    } else {
      art.appendChild(h("span", "thumb-title", game.title));
      if (team) {
        var emoji = h("span", "thumb-emoji", team.emoji);
        emoji.setAttribute("aria-hidden", "true");
        art.appendChild(emoji);
      }
    }
    thumb.appendChild(art);
    root.appendChild(thumb);

    root.appendChild(h("span", "game-name", game.title));
    var meta = h("span", "game-meta");
    var dot = h("span", "team-dot");
    dot.setAttribute("aria-hidden", "true");
    meta.appendChild(dot);
    meta.appendChild(document.createTextNode(team ? team.name + " 팀" : "점검용"));
    root.appendChild(meta);
    if (best) {
      var bestLine = h("span", "game-best");
      bestLine.appendChild(h("span", null, "1등"));
      bestLine.appendChild(FiveRak.cardBadge(best));
      bestLine.appendChild(h("span", "game-best-name", best.name));
      root.appendChild(bestLine);
    }

    li.appendChild(root);
    return li;
  }

  function fill(listId, countId, sectionId, games, emptyText) {
    var list = document.getElementById(listId);
    list.textContent = "";
    games.forEach(function (g) {
      list.appendChild(card(g));
    });
    document.getElementById(countId).textContent = games.length + "개";
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
    fill("live-grid", "live-count", "live-section", live, "아직 열린 게임이 없어요. 곧 첫 게임이 들어와요!");
  }

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
  }, function () {
    document.getElementById("load-error").hidden = false;
    document.getElementById("live-section").hidden = true;
  });
})();
