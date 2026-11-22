/* 랭킹 화면: 게임 랭킹(게임마다 1등), 게임별 랭킹, 관리(?manage) */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var slug = params.get("game");
  var manage = params.has("manage");
  var period = "week";
  var catalog = null;
  var game = null;

  var $ = function (id) { return document.getElementById(id); };
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function teamOf(g) {
    for (var i = 0; i < catalog.teams.length; i++) if (catalog.teams[i].id === g.team) return catalog.teams[i];
    return null;
  }
  function withManage(url) {
    return manage ? url + (url.indexOf("?") < 0 ? "?" : "&") + "manage" : url;
  }
  function dot(color, cls) {
    var d = h("span", cls || "card-dot");
    d.style.background = color;
    d.setAttribute("aria-hidden", "true");
    return d;
  }
  function table(headers) {
    var t = h("table", "board");
    var head = h("thead");
    var tr = h("tr");
    headers.forEach(function (x) {
      var th = h("th", null, x);
      th.scope = "col";
      tr.appendChild(th);
    });
    head.appendChild(tr);
    t.appendChild(head);
    var body = h("tbody");
    t.appendChild(body);
    return { table: t, body: body };
  }

  // ---------- 기간 탭 ----------

  function selectTab(p, focus) {
    period = p;
    tabs.forEach(function (t) {
      var on = t.dataset.period === p;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $("panel").setAttribute("aria-labelledby", "tab-" + p);
    $("period").textContent = FiveRak.periodLabel(p);
    render();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t.dataset.period); });
    t.addEventListener("keydown", function (e) {
      var next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
      if (next == null) return;
      e.preventDefault();
      selectTab(tabs[(next + tabs.length) % tabs.length].dataset.period, true);
    });
  });

  // ---------- 표 ----------

  function renderGameBoard() {
    return FiveRak.data.ranking(game.slug, period).then(function (rows) {
      var box = $("board");
      box.textContent = "";
      if (!rows.length) {
        box.appendChild(h("p", "empty-note", period === "all" ? "아직 기록이 없어요. 첫 기록을 남겨 보세요!" : "이 기간에는 아직 기록이 없어요."));
        return;
      }
      var t = table(["순위", "닉네임", "최고기록"]);
      t.table.classList.add("ranked");
      rows.forEach(function (r, i) {
        var tr = h("tr", i === 0 ? "top1" : null);
        tr.appendChild(h("td", "rank num", (i + 1) + "등"));
        var who = h("td");
        var wrap = h("span", "who");
        wrap.appendChild(FiveRak.cardBadge(r));
        wrap.appendChild(document.createTextNode(r.name));
        who.appendChild(wrap);
        tr.appendChild(who);
        tr.appendChild(h("td", "score num", FiveRak.formatScore(r.score, game)));
        t.body.appendChild(tr);
      });
      box.appendChild(t.table);
    });
  }

  function renderOverall() {
    var games = catalog.games.filter(function (g) {
      return g.status === "live" && (manage || !g.hidden);
    });
    var box = $("board");
    if (!games.length) {
      box.textContent = "";
      box.appendChild(h("p", "empty-note", "아직 열린 게임이 없어요. 게임이 들어오면 여기에 1등이 모여요."));
      return Promise.resolve();
    }
    return Promise.all(games.map(function (g) {
      return FiveRak.data.best(g.slug, period);
    })).then(function (bests) {
      box.textContent = "";
      var t = table(["게임", "1등", "최고기록"]);
      games.forEach(function (g, i) {
        var b = bests[i];
        var tr = h("tr");
        var cell = h("td", "game-cell");
        var a = h("a", null, g.title);
        a.href = withManage("rank.html?game=" + encodeURIComponent(g.slug));
        cell.appendChild(a);
        var team = teamOf(g);
        if (team) cell.appendChild(h("div", "dim", team.emoji + " " + team.name));
        tr.appendChild(cell);
        var who = h("td");
        if (b) {
          var wrap = h("span", "who");
          wrap.appendChild(FiveRak.cardBadge(b));
          wrap.appendChild(document.createTextNode(b.name));
          who.appendChild(wrap);
        } else {
          who.appendChild(h("span", "dim", "아직 없어요"));
        }
        tr.appendChild(who);
        tr.appendChild(h("td", "score num" + (b ? "" : " dim"), b ? FiveRak.formatScore(b.score, g) : "-"));
        t.body.appendChild(tr);
      });
      box.appendChild(t.table);
    });
  }

  function render() {
    if (!catalog) return;
    (game ? renderGameBoard() : renderOverall()).catch(function () {
      $("board").textContent = "";
      $("board").appendChild(h("p", "empty-note", "기록을 불러오지 못했어요."));
    });
  }

  // ---------- 가족 리뷰 ----------

  function renderReviews() {
    var box = $("reviews");
    var list = FiveRak.reviews(game);
    var sum = FiveRak.reviewSummary(game);
    var avg = $("reviews-avg");
    avg.textContent = "";
    if (sum) {
      var one = FiveRak.starRow(1, "stars one");
      while (one.childNodes.length > 1) one.removeChild(one.lastChild);
      one.setAttribute("aria-label", "평균 " + sum.avg.toFixed(1) + "점");
      avg.appendChild(one);
      avg.appendChild(h("span", "reviews-score num", sum.avg.toFixed(1)));
      avg.appendChild(h("span", "dim", "리뷰 " + sum.count + "개"));
    }
    var holder = $("review-list");
    holder.textContent = "";
    if (!list.length) {
      holder.appendChild(h("p", "empty-note", "아직 리뷰가 없어요. 해 보고 첫 리뷰를 남겨 주세요!"));
    } else {
      var ul = h("ul", "review-list");
      list.forEach(function (r) {
        var li = h("li");
        var top = h("div", "review-top");
        top.appendChild(FiveRak.starRow(r.stars, "stars"));
        top.appendChild(h("span", "review-name", r.name));
        if (r.date) top.appendChild(h("span", "review-date num", r.date.replace(/-/g, ".")));
        li.appendChild(top);
        li.appendChild(h("p", "review-text", r.text));
        ul.appendChild(li);
      });
      holder.appendChild(ul);
    }
    box.hidden = false;
  }
  $("feedback-btn").addEventListener("click", function () {
    if (game) FiveRak.openFeedback(game.slug);
  });

  // ---------- 관리 ----------

  function renderManage() {
    var box = $("manage");
    box.hidden = false;
    box.textContent = "";
    box.appendChild(h("h2", null, "관리"));
    box.appendChild(h("p", null, "이 기기에 저장된 기록과 별명을 정리해요. 지운 기록은 되돌릴 수 없어요."));

    if (game) {
      var clear = h("button", "btn danger small", "「" + game.title + "」 기록 모두 지우기");
      clear.type = "button";
      clear.addEventListener("click", function () {
        if (!confirm("「" + game.title + "」의 이 기기 기록을 모두 지울까요? 되돌릴 수 없어요.")) return;
        FiveRak.data.clearGame(game.slug).then(render);
      });
      var row = h("div", "actions");
      row.style.margin = "0 0 20px";
      row.appendChild(clear);
      box.appendChild(row);
    }

    box.appendChild(h("h2", null, "이 기기의 별명"));
    FiveRak.data.listCards().then(function (cards) {
      if (!cards.length) {
        box.appendChild(h("p", null, "아직 만든 별명이 없어요."));
        return;
      }
      box.appendChild(h("p", null, cards.length + "개 (최대 30개)"));
      var list = h("ul", "manage-list");
      cards.forEach(function (c) {
        var li = h("li");
        li.appendChild(FiveRak.cardBadge(c));
        var input = h("input");
        input.type = "text";
        input.value = c.name;
        input.setAttribute("aria-label", c.name + " 별명 바꾸기");
        li.appendChild(input);
        var save = h("button", "btn plain small", "이름 바꾸기");
        save.type = "button";
        save.addEventListener("click", function () {
          FiveRak.data.renameCard(c.id, input.value).then(function () {
            renderManage();
            render();
          }, function (err) { alert(err.message); });
        });
        var del = h("button", "btn danger small", "지우기");
        del.type = "button";
        del.addEventListener("click", function () {
          if (!confirm("별명 「" + c.name + "」과 이 별명의 기록을 모두 지울까요?")) return;
          FiveRak.data.deleteCard(c.id).then(function () {
            renderManage();
            render();
          });
        });
        li.appendChild(save);
        li.appendChild(del);
        list.appendChild(li);
      });
      box.appendChild(list);
    });
  }

  // ---------- 시작 ----------

  FiveRak.catalog().then(function (c) {
    catalog = c;
    if (slug) {
      game = c.games.filter(function (g) { return g.slug === slug; })[0] || null;
      if (!game || (game.hidden && !manage)) {
        game = null;
        $("title").textContent = "게임을 찾을 수 없어요";
        $("sub").textContent = "주소가 맞는지 확인해 주세요.";
        $("tabs").hidden = true;
        $("panel").hidden = true;
        var back = h("a", "btn plain", "게임 고르러 가기");
        back.href = "./";
        $("actions").appendChild(back);
        if (manage) renderManage();
        return;
      }
      document.title = game.title + " 랭킹 · 오락실";
      $("title").textContent = game.title + " 랭킹";
      var team = teamOf(game);
      var sub = $("sub");
      sub.textContent = "";
      if (team) sub.appendChild(dot(team.color, "team-dot"));
      sub.appendChild(document.createTextNode((team ? team.name + " 팀이 만들었어요 · " : "") + "닉네임마다 최고기록 하나, 상위 " + FiveRak.TOP_N + "명"));
      if (game.status === "live") {
        var play = h("a", "btn", "이 게임 하기");
        play.href = "games/" + encodeURIComponent(game.slug) + "/";
        $("actions").appendChild(play);
      }
      var all = h("a", "btn plain", "게임 랭킹");
      all.href = withManage("rank.html");
      $("actions").appendChild(all);
      renderReviews();
    }
    selectTab("week");
    if (manage) renderManage();
  }).catch(function () {
    $("board").appendChild(h("p", "empty-note", "게임 목록을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요."));
  });
})();
