/*
 * 오락실 공용 스크립트 (5rak.js)
 *
 * 게임은 이 파일을 불러오고 점수가 나오면 한 줄만 부르면 돼요.
 *   <script src="../../lib/5rak.js"></script>
 *   FiveRak.submitScore(점수);
 *
 * 포털 화면(index.html, rank.html)도 같은 파일의 FiveRak.data를 써요.
 *
 * 저장소 경계: 기록은 지금 이 브라우저(localStorage)에만 있어요.
 * 나중에 공유 랭킹 서버로 옮길 때는 아래 `createLocalData`만 같은 모양의
 * 서버용 구현으로 바꾸면 되고, 게임 파일과 화면 코드는 고치지 않아요.
 * 그래서 FiveRak.data의 읽기·쓰기 함수는 모두 Promise를 돌려줘요.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var ROOT = new URL("../", script ? script.src : location.href);
  var PREFIX = "5rak:v1:";
  var MAX_CARDS = 30;
  var TOP_N = 10;
  var NAME_MAX = 8;
  // 흰 글자 번호가 잘 보이도록(대비 4.5 이상) 고른 색이에요.
  var CARD_COLORS = ["#2563eb", "#be185d", "#047857", "#b45309", "#7c3aed", "#0e7490", "#dc2626", "#4d7c0f"];
  var KST_OFFSET = 9 * 60 * 60 * 1000;

  // ---------- 기간 (KST) ----------

  function kstDate(ms) {
    return new Date(ms + KST_OFFSET);
  }
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function weekStart(ms) {
    var d = kstDate(ms);
    var back = (d.getUTCDay() + 6) % 7; // 월요일 = 0
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back));
  }
  function weekKey(ms) {
    var m = weekStart(ms);
    return m.getUTCFullYear() + "-" + pad(m.getUTCMonth() + 1) + "-" + pad(m.getUTCDate());
  }
  function monthKey(ms) {
    var d = kstDate(ms);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1);
  }
  function periodLabel(period, ms) {
    ms = ms || Date.now();
    if (period === "week") {
      var m = weekStart(ms);
      return (m.getUTCMonth() + 1) + "월 " + m.getUTCDate() + "일(월)부터";
    }
    if (period === "month") {
      return (kstDate(ms).getUTCMonth() + 1) + "월 1일부터";
    }
    return "처음부터 지금까지";
  }

  // ---------- 저장 (이 기기) ----------

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- 게임 목록 ----------

  var catalogPromise = null;
  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetch(new URL("games.json", ROOT), { cache: "no-cache" })
        .then(function (r) {
          if (!r.ok) throw new Error("games.json " + r.status);
          return r.json();
        })
        .then(function (data) {
          return { teams: data.teams || [], games: data.games || [] };
        });
    }
    return catalogPromise;
  }
  function findGame(slug) {
    return loadCatalog().then(function (c) {
      for (var i = 0; i < c.games.length; i++) if (c.games[i].slug === slug) return c.games[i];
      return null;
    });
  }
  function orderOf(game) {
    return game && game.score && game.score.order === "low" ? "low" : "high";
  }
  function better(a, b, order) {
    return order === "low" ? a < b : a > b;
  }

  // ---------- 닉네임 카드 ----------

  function cleanName(raw) {
    var name = String(raw || "")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    var len = Array.from(name).length;
    if (len < 1) return { ok: false, error: "별명을 한 글자 이상 써 주세요." };
    if (len > NAME_MAX) return { ok: false, error: "별명은 " + NAME_MAX + "글자까지 쓸 수 있어요." };
    return { ok: true, name: name };
  }
  function newId() {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
  }

  // ---------- 이 기기 저장소 구현 ----------
  // scores[slug][cardId] = { all:{s,at}, w:{key,s,at}, m:{key,s,at} }

  function createLocalData() {
    function cards() {
      var list = read("cards", []);
      list.forEach(function (c, i) {
        if (!c.no) c.no = i + 1;
      });
      return list;
    }
    function cardMap() {
      var map = {};
      cards().forEach(function (c) {
        map[c.id] = c;
      });
      return map;
    }

    function ranking(slug, period) {
      return findGame(slug).then(function (game) {
        var order = orderOf(game);
        var now = Date.now();
        var wk = weekKey(now);
        var mk = monthKey(now);
        var byCard = (read("scores", {})[slug]) || {};
        var names = cardMap();
        var rows = [];
        Object.keys(byCard).forEach(function (cardId) {
          var card = names[cardId];
          if (!card) return;
          var e = byCard[cardId];
          var rec = period === "week" ? (e.w && e.w.key === wk ? e.w : null)
            : period === "month" ? (e.m && e.m.key === mk ? e.m : null)
            : e.all;
          if (rec) rows.push({ cardId: cardId, name: card.name, color: card.color, no: card.no, score: rec.s, at: rec.at });
        });
        // 시작 기록: games.json의 starter. 모든 기기에서 주간·월간·올타임에 함께 보여요.
        // 같은 점수면 이 기기에서 세운 기록이 위로 가도록 at을 가장 늦게 둬요.
        (game && game.starter || []).forEach(function (st, i) {
          rows.push({
            cardId: "starter:" + i, name: String(st.name), score: Number(st.score),
            color: CARD_COLORS[(i + 3) % CARD_COLORS.length], no: i + 1,
            at: Number.MAX_SAFE_INTEGER, starter: true
          });
        });
        rows.sort(function (a, b) {
          if (a.score !== b.score) return better(a.score, b.score, order) ? -1 : 1;
          return a.at - b.at; // 같은 기록이면 먼저 세운 사람이 위
        });
        return rows;
      });
    }

    return {
      listCards: function () {
        return Promise.resolve(cards());
      },
      lastCardId: function () {
        return Promise.resolve(read("lastCard", null));
      },
      createCard: function (rawName) {
        var check = cleanName(rawName);
        if (!check.ok) return Promise.reject(new Error(check.error));
        var list = cards();
        if (list.length >= MAX_CARDS) {
          return Promise.reject(new Error("이 기기에 별명이 너무 많아요. 관리 화면에서 정리해 주세요."));
        }
        var no = list.reduce(function (m, c) { return Math.max(m, c.no || 0); }, 0) + 1;
        var card = { id: newId(), no: no, name: check.name, color: CARD_COLORS[(no - 1) % CARD_COLORS.length], createdAt: Date.now() };
        list.push(card);
        if (!write("cards", list)) return Promise.reject(new Error("이 기기에 저장할 수 없어요."));
        return Promise.resolve(card);
      },
      renameCard: function (id, rawName) {
        var check = cleanName(rawName);
        if (!check.ok) return Promise.reject(new Error(check.error));
        var list = cards();
        list.forEach(function (c) {
          if (c.id === id) c.name = check.name;
        });
        write("cards", list);
        return Promise.resolve();
      },
      deleteCard: function (id) {
        write("cards", cards().filter(function (c) {
          return c.id !== id;
        }));
        var scores = read("scores", {});
        Object.keys(scores).forEach(function (slug) {
          delete scores[slug][id];
        });
        write("scores", scores);
        return Promise.resolve();
      },
      submit: function (slug, cardId, score) {
        return findGame(slug).then(function (game) {
          var order = orderOf(game);
          var now = Date.now();
          var wk = weekKey(now);
          var mk = monthKey(now);
          var scores = read("scores", {});
          var byCard = scores[slug] = scores[slug] || {};
          var e = byCard[cardId] = byCard[cardId] || {};
          var rec = { s: score, at: now };
          var improved = { all: false, week: false, month: false };
          if (!e.all || better(score, e.all.s, order)) { e.all = rec; improved.all = true; }
          if (!e.w || e.w.key !== wk || better(score, e.w.s, order)) { e.w = { key: wk, s: score, at: now }; improved.week = true; }
          if (!e.m || e.m.key !== mk || better(score, e.m.s, order)) { e.m = { key: mk, s: score, at: now }; improved.month = true; }
          if (!write("scores", scores)) throw new Error("이 기기에 저장할 수 없어요.");
          write("lastCard", cardId);
          return ranking(slug, "week").then(function (rows) {
            var rank = 0;
            rows.forEach(function (r, i) {
              if (r.cardId === cardId) rank = i + 1;
            });
            return { improved: improved, weekRank: rank };
          });
        });
      },
      ranking: function (slug, period) {
        return ranking(slug, period).then(function (rows) {
          return rows.slice(0, TOP_N);
        });
      },
      best: function (slug, period) {
        return ranking(slug, period).then(function (rows) {
          return rows[0] || null;
        });
      },
      clearGame: function (slug) {
        var scores = read("scores", {});
        delete scores[slug];
        write("scores", scores);
        return Promise.resolve();
      },
      recordPlay: function (slug) {
        // 2단계 인기 순위를 대비해 플레이 시작만 세어 둬요. 화면에는 아직 보여 주지 않아요.
        var plays = read("plays", {});
        var day = kstDate(Date.now()).toISOString().slice(0, 10);
        var p = plays[slug] = plays[slug] || { total: 0, days: {} };
        p.total += 1;
        p.days[day] = (p.days[day] || 0) + 1;
        var keys = Object.keys(p.days).sort();
        while (keys.length > 60) delete p.days[keys.shift()];
        write("plays", plays);
        return Promise.resolve();
      }
    };
  }

  var data = createLocalData();

  // ---------- 화면 확인용 예시 기록 (내 컴퓨터에서 ?demo일 때만) ----------
  // 실제 사이트(github.io)에서는 절대 동작하지 않아요. 닉네임과 점수는 모두 지어낸 예시예요.
  // 한 번만 넣고, 지우려면 ?manage 화면에서 지우면 돼요.
  var isLocalDemo = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]demo\b/.test(location.search);
  if (isLocalDemo && !read("demoSeeded", false)) {
    (function seedDemo() {
      var now = Date.now();
      var wk = weekKey(now);
      var mk = monthKey(now);
      var list = read("cards", []);
      var scores = read("scores", {});
      var startNo = list.reduce(function (m, c) { return Math.max(m, c.no || 0); }, 0);
      var people = ["번개", "별사탕", "라면왕", "도토리"].map(function (name, i) {
        var no = startNo + i + 1;
        var card = { id: newId(), no: no, name: name, color: CARD_COLORS[(no - 1) % CARD_COLORS.length], createdAt: now };
        list.push(card);
        return card;
      });
      function put(slug, card, score, minutesAgo) {
        var at = now - minutesAgo * 60000;
        var bySlug = scores[slug] = scores[slug] || {};
        bySlug[card.id] = { all: { s: score, at: at }, w: { key: wk, s: score, at: at }, m: { key: mk, s: score, at: at } };
      }
      put("doumy", people[0], 7, 50);
      put("doumy", people[1], 5, 40);
      put("doumy", people[2], 4, 30);
      put("doumy", people[3], 2, 20);
      put("wanted-killer", people[1], 9, 45);
      put("wanted-killer", people[3], 6, 35);
      put("wanted-killer", people[0], 3, 25);
      write("cards", list);
      write("scores", scores);
      write("demoSeeded", true);
    })();
  }

  // ---------- 표시 도우미 ----------

  function formatScore(score, game) {
    var unit = (game && game.score && game.score.unit) || "점";
    var n = Number(score);
    var text = Number.isInteger(n) ? n.toLocaleString("ko-KR") : n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
    return text + unit;
  }

  // 닉네임 카드 표시: 색만으로 구별하지 않도록 번호를 함께 보여 줘요.
  function cardBadge(card, cls) {
    var b = document.createElement("span");
    b.className = cls || "card-badge";
    b.style.background = card.color;
    b.textContent = String(card.no || "");
    b.setAttribute("aria-label", card.no + "번 카드");
    return b;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "class") node.className = attrs[k];
        else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  // ---------- 게임 화면: 기록 남기기 창 ----------

  var CSS = [
    ".fr-dialog{border:0;padding:0;border-radius:20px;width:min(420px,calc(100vw - 32px));max-height:calc(100dvh - 32px);color:#16202c;background:#fff;box-shadow:0 24px 60px rgba(15,23,42,.28);font:16px/1.5 'Pretendard',sans-serif}",
    ".fr-dialog :where(button,input,a){font-family:inherit}",
    ".fr-dialog input{-webkit-user-select:text;user-select:text}",
    ".fr-dialog{color-scheme:light}",
    ".fr-dialog :is(button,input,a),.fr-dialog :is(button,input,a):is(:hover,:active){box-shadow:none;text-shadow:none;transform:none;margin:0;line-height:1.3}",
    ".fr-dialog::backdrop{background:rgba(15,23,42,.55)}",
    ".fr-dialog *{box-sizing:border-box;letter-spacing:normal;text-transform:none;font-family:inherit}",
    ".fr-dialog :where(h2,p){color:#16202c;margin:0;text-align:left}",
    ".fr-body{padding:24px 20px 20px;display:flex;flex-direction:column;gap:16px}",
    ".fr-title{margin:0;font-size:20px;font-weight:800}",
    ".fr-score{margin:0;font-size:40px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;letter-spacing:-.02em}",
    ".fr-label{margin:0;font-size:15px;font-weight:700}",
    ".fr-cards{display:flex;flex-wrap:wrap;gap:8px;max-height:168px;overflow:auto;padding:2px}",
    ".fr-card{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 14px;border-radius:22px;border:2px solid #d9e0e8;background:#fff;color:#16202c;font:inherit;font-weight:700;cursor:pointer}",
    ".fr-card[aria-pressed=true]{border-color:#2563eb;background:#eff4ff}",
    ".fr-badge{display:inline-flex;align-items:center;justify-content:center;flex:none;min-width:24px;height:24px;padding:0 6px;border-radius:12px;color:#fff;font-size:12px;font-weight:800;font-variant-numeric:tabular-nums}",
    "@keyframes fr-in{from{transform:translateY(16px) scale(.97)}to{transform:none}}",
    "@keyframes fr-pop{0%{transform:scale(.85)}60%{transform:scale(1.08)}100%{transform:scale(1)}}",
    ".fr-dialog[open]{animation:fr-in .38s cubic-bezier(.16,1,.3,1)}",
    ".fr-result{transform-origin:left center;animation:fr-pop .5s cubic-bezier(.16,1,.3,1)}",
    "@media (prefers-reduced-motion:reduce){.fr-dialog[open],.fr-result{animation:none}}",
    ".fr-new{display:flex;gap:8px}",
    ".fr-input{flex:1;min-width:0;min-height:44px;padding:8px 14px;border-radius:12px;border:2px solid #d9e0e8;font:inherit;color:#16202c;background:#fff}",
    ".fr-input:focus-visible,.fr-card:focus-visible,.fr-btn:focus-visible{outline:3px solid #2563eb;outline-offset:2px}",
    ".fr-hint{margin:-8px 0 0;font-size:14px;color:#4b5563}",
    ".fr-error{margin:-8px 0 0;font-size:14px;color:#b91c1c;font-weight:700}",
    ".fr-actions{display:flex;flex-direction:column;gap:8px}",
    ".fr-btn{min-height:52px;border-radius:26px;border:0;font:inherit;font-weight:800;font-size:17px;cursor:pointer;padding:0 20px;text-decoration:none;display:flex;align-items:center;justify-content:center}",
    ".fr-btn.primary{background:#2563eb;color:#fff}",
    ".fr-btn.primary:disabled{background:#cbd5e1;color:#475569;cursor:not-allowed}",
    ".fr-btn.plain{background:#f2f5f9;color:#16202c}",
    ".fr-btn.small{min-height:44px;font-size:15px;border-radius:12px;background:#16202c;color:#fff}",
    ".fr-result{margin:0;font-size:18px;font-weight:800;color:#1d4ed8}",
    ".fr-note{margin:0;font-size:13px;color:#4b5563}"
  ].join("\n");

  function injectStyle() {
    if (document.getElementById("fr-style")) return;
    var s = document.createElement("style");
    s.id = "fr-style";
    // 게임 페이지에서도 오락실과 같은 글꼴을 쓰도록 사이트 폰트를 불러와요.
    var fonts = [[400, "Regular"], ["600 700", "Bold"], ["800 900", "ExtraBold"]].map(function (f) {
      return "@font-face{font-family:'Pretendard';font-weight:" + f[0] + ";font-display:swap;src:url('" +
        new URL("assets/fonts/Pretendard-" + f[1] + ".subset.woff2", ROOT).href + "') format('woff2')}";
    }).join("\n");
    s.textContent = fonts + "\n" + CSS;
    document.head.appendChild(s);
  }

  function gameSlugFromLocation() {
    var rel = decodeURIComponent(location.pathname).slice(decodeURIComponent(ROOT.pathname).length);
    var m = rel.match(/^games\/([^/]+)\//);
    return m ? m[1] : null;
  }

  function submitScore(score) {
    var slug = gameSlugFromLocation();
    var n = Number(score);
    if (!slug) return Promise.reject(new Error("게임 폴더(games/<이름>/) 안에서만 점수를 보낼 수 있어요."));
    if (!isFinite(n)) return Promise.reject(new Error("점수는 숫자여야 해요."));

    injectStyle();
    return Promise.all([findGame(slug), data.listCards(), data.lastCardId()]).then(function (res) {
      var game = res[0];
      var cards = res[1];
      var selected = cards.some(function (c) { return c.id === res[2]; }) ? res[2] : null;

      return new Promise(function (resolve) {
        var dialog = el("dialog", { class: "fr-dialog", "aria-labelledby": "fr-title" });
        var body = el("div", { class: "fr-body" });
        dialog.appendChild(body);
        document.body.appendChild(dialog);

        function close(result) {
          dialog.close();
          dialog.remove();
          resolve(result);
        }
        dialog.addEventListener("cancel", function (e) {
          e.preventDefault();
          close({ saved: false });
        });

        function renderPick(errorText, draft) {
          body.textContent = "";
          var list = el("div", { class: "fr-cards", role: "group", "aria-label": "이 기기의 별명" });
          cards.slice().reverse().forEach(function (c) {
            list.appendChild(el("button", {
              type: "button",
              class: "fr-card",
              "aria-pressed": String(c.id === selected),
              onclick: function () {
                selected = c.id;
                renderPick();
              }
            }, [cardBadge(c, "fr-badge"), c.name]));
          });

          var input = el("input", { class: "fr-input", type: "text", autocomplete: "off", "aria-label": "새 별명", placeholder: "새 별명 (" + NAME_MAX + "글자까지)" });
          if (draft) input.value = draft;
          if (errorText) {
            input.setAttribute("aria-invalid", "true");
            input.setAttribute("aria-describedby", "fr-error");
          }
          var create = el("form", {
            class: "fr-new",
            onsubmit: function (e) {
              e.preventDefault();
              data.createCard(input.value).then(function (card) {
                cards.push(card);
                selected = card.id;
                renderPick();
              }, function (err) {
                renderPick(err.message, input.value);
                var again = body.querySelector(".fr-input");
                if (again) again.focus();
              });
            }
          }, [input, el("button", { type: "submit", class: "fr-btn small", text: "만들기" })]);

          var save = el("button", {
            type: "button",
            class: "fr-btn primary",
            text: "기록 남기기",
            onclick: function () {
              save.disabled = true;
              data.submit(slug, selected, n).then(renderDone, function (err) {
                renderPick(err.message);
              });
            }
          });
          save.disabled = !selected;

          body.appendChild(el("h2", { class: "fr-title", id: "fr-title", text: "기록 남기기" }));
          body.appendChild(el("p", { class: "fr-score", text: formatScore(n, game) }));
          body.appendChild(el("p", { class: "fr-label", text: cards.length ? "누구 기록인가요?" : "처음이면 별명을 만들어 주세요" }));
          if (cards.length) body.appendChild(list);
          if (cards.length < MAX_CARDS) {
            body.appendChild(create);
            if (errorText) body.appendChild(el("p", { class: "fr-error", id: "fr-error", role: "alert", text: errorText }));
            body.appendChild(el("p", { class: "fr-hint", text: "진짜 이름 말고 별명을 써 주세요." }));
          } else if (errorText) {
            body.appendChild(el("p", { class: "fr-error", id: "fr-error", role: "alert", text: errorText }));
          }
          body.appendChild(el("div", { class: "fr-actions" }, [
            save,
            el("button", { type: "button", class: "fr-btn plain", text: "기록 안 남기기", onclick: function () { close({ saved: false }); } })
          ]));
          body.appendChild(el("p", { class: "fr-note", text: "기록은 이 기기에만 저장돼요." }));
        }

        function renderDone(result) {
          body.textContent = "";
          var line = result.weekRank > 0 && result.weekRank <= TOP_N
            ? "이번 주 " + result.weekRank + "등이에요!"
            : result.improved.all ? "내 최고 기록을 세웠어요!" : "기록을 남겼어요.";
          body.appendChild(el("h2", { class: "fr-title", id: "fr-title", text: "기록을 남겼어요" }));
          body.appendChild(el("p", { class: "fr-score", text: formatScore(n, game) }));
          body.appendChild(el("p", { class: "fr-result", text: line }));
          body.appendChild(el("div", { class: "fr-actions" }, [
            el("button", { type: "button", class: "fr-btn primary", text: "다시 하기", onclick: function () { close({ saved: true, weekRank: result.weekRank }); location.reload(); } }),
            el("a", { class: "fr-btn plain", href: new URL("rank.html?game=" + encodeURIComponent(slug), ROOT).href, text: "랭킹 보기" }),
            el("a", { class: "fr-btn plain", href: ROOT.href, text: "오락실로 돌아가기" })
          ]));
        }

        renderPick();
        dialog.showModal();
      });
    });
  }

  var slugHere = gameSlugFromLocation();
  if (slugHere) data.recordPlay(slugHere);

  // ---------- 방문자 수 (GoatCounter) ----------
  // 쿠키를 쓰지 않고 IP도 저장하지 않는 무료 카운터예요.
  // GoatCounter 사이트 코드를 넣으면 켜지고, 비워 두면 아무것도 보내지 않아요.
  // 숫자를 화면에 띄우려면 GoatCounter 설정에서
  // "Allow adding visitor counts on your website"를 켜야 해요.
  var GOATCOUNTER_CODE = "kakiblue888";

  function counterOn() {
    if (!GOATCOUNTER_CODE) return false;
    if (location.protocol !== "https:") return false; // 내 컴퓨터에서 열 때는 세지 않아요.
    if (/\/games\/_/.test(location.pathname)) return false; // 점검용 페이지는 세지 않아요.
    return true;
  }

  if (counterOn()) {
    var gc = document.createElement("script");
    gc.async = true;
    gc.src = "https://gc.zgo.at/count.js";
    gc.setAttribute("data-goatcounter", "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count");
    document.head.appendChild(gc);
  }

  // 방문자 수를 "1,234" 같은 글자로 돌려줘요. 못 받으면 null이에요.
  // slug 없이 부르면 오락실 전체, slug를 주면 그 게임 페이지 방문자 수예요.
  function visitorCount(slug) {
    // 내 컴퓨터에서 주소 끝에 ?demo를 붙이면 화면 확인용 예시 숫자를 보여 줘요.
    if (isLocalDemo) {
      var demo = { doumy: "128", "wanted-killer": "87" };
      return Promise.resolve(slug ? (demo[slug] || null) : "1,234");
    }
    if (!counterOn()) return Promise.resolve(null);
    var path = slug ? encodeURI(new URL("games/" + encodeURIComponent(slug) + "/", ROOT).pathname) : "TOTAL";
    return fetch("https://" + GOATCOUNTER_CODE + ".goatcounter.com/counter/" + path + ".json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.count ? String(j.count) : null; })
      .catch(function () { return null; });
  }

  window.FiveRak = {
    submitScore: submitScore,
    homeUrl: ROOT.href,
    goHome: function () {
      location.href = ROOT.href;
    },
    data: data,
    catalog: loadCatalog,
    findGame: findGame,
    formatScore: formatScore,
    cardBadge: cardBadge,
    periodLabel: periodLabel,
    visitorCount: visitorCount,
    TOP_N: TOP_N
  };
})();
