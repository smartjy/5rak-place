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
    ".fr-note{margin:0;font-size:13px;color:#4b5563}",
    // 의견 남기기 창
    ".fr-game{margin:-10px 0 0;font-size:15px;color:#4b5563}",
    ".fr-kinds{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:26px;background:#f2f5f9}",
    ".fr-kind{min-height:44px;border:0;border-radius:22px;background:transparent;color:#4b5563;font:inherit;font-size:15px;font-weight:700;cursor:pointer;padding:0 6px;white-space:nowrap}",
    ".fr-kind[aria-checked=true]{background:#fff;color:#16202c;font-weight:800;box-shadow:0 1px 4px rgba(15,23,42,.14)}",
    ".fr-stars{display:flex;gap:4px}",
    ".fr-star{width:48px;height:48px;border:0;border-radius:24px;background:transparent;color:#4b5563;cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center}",
    ".fr-star svg{width:36px;height:36px;display:block;transition:transform .18s cubic-bezier(.16,1,.3,1)}",
    ".fr-star.on{color:#16202c}",
    ".fr-star:not(.on) path{fill:none}",
    ".fr-star.on svg{transform:scale(1.06)}",
    ".fr-star:focus-visible,.fr-kind:focus-visible,.fr-text:focus-visible{outline:3px solid #2563eb;outline-offset:2px}",
    ".fr-text{width:100%;min-height:96px;resize:vertical;padding:10px 14px;border-radius:12px;border:2px solid #d9e0e8;font:inherit;color:#16202c;background:#fff;line-height:1.5;-webkit-user-select:text;user-select:text}",
    ".fr-field{display:flex;flex-direction:column;gap:8px}",
    ".fr-count{margin:-4px 0 0;font-size:13px;color:#4b5563;text-align:right;font-variant-numeric:tabular-nums}",
    ".fr-device{margin:0;padding:10px 14px;border-radius:12px;background:#f2f5f9;font-size:14px;color:#4b5563}",
    ".fr-copy{width:100%;min-height:120px;padding:10px 14px;border-radius:12px;border:2px solid #d9e0e8;background:#f2f5f9;font:inherit;font-size:14px;color:#16202c;line-height:1.5;resize:none;-webkit-user-select:text;user-select:text}",
    "@media (prefers-reduced-motion:reduce){.fr-star svg{transition:none}}"
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
            el("button", { type: "button", class: "fr-btn plain", text: "💬 의견 남기기", onclick: function () { close({ saved: true, weekRank: result.weekRank }); openFeedback(slug); } }),
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
  var COUNT_SINCE = "2026-11-17"; // 방문자 수를 세기 시작한 날

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
    // start가 없으면 전체 합계(TOTAL)가 0으로 나와서, 방문자 수를 세기 시작한 날부터로 물어요.
    return fetch("https://" + GOATCOUNTER_CODE + ".goatcounter.com/counter/" + path + ".json?start=" + COUNT_SINCE)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.count ? String(j.count) : null; })
      .catch(function () { return null; });
  }


  // ---------- 💬 나누는 낙: 가족 리뷰와 의견 남기기 ----------
  // 리뷰는 games.json의 게임마다 "reviews"에 모아 둬요(부모님이 확인하고 넣어요).
  // { "name": "별명", "stars": 1~5, "text": "한 줄 평", "date": "2026-11-22" }
  // 의견 남기기 창은 서버에 보내지 않아요. 글을 만들어 공유하거나 복사해서
  // 부모님께 보내면, 부모님이 리뷰는 games.json에 넣고 버그·의견은 만든 팀에 전해요.
  var REVIEW_MAX = 80;
  var NOTE_MAX = 300;
  var STAR_PATH = "M12 2.6l2.85 5.9 6.45.9-4.7 4.5 1.15 6.4L12 17.2l-5.75 3.1 1.15-6.4-4.7-4.5 6.45-.9z";

  function starSvg() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", STAR_PATH);
    path.setAttribute("fill", "currentColor");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.4");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function cleanReview(r) {
    if (!r || typeof r !== "object") return null;
    var name = cleanName(r.name);
    var stars = Math.round(Number(r.stars));
    var text = String(r.text || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    if (!name.ok || !(stars >= 1 && stars <= 5) || !text) return null;
    return {
      name: name.name,
      stars: stars,
      text: Array.from(text).slice(0, REVIEW_MAX).join(""),
      date: /^\d{4}-\d{2}-\d{2}$/.test(r.date || "") ? r.date : ""
    };
  }
  function reviewsOf(game) {
    var list = (game && Array.isArray(game.reviews) ? game.reviews : []).map(cleanReview).filter(Boolean);
    return list.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  function reviewSummary(game) {
    var list = reviewsOf(game);
    if (!list.length) return null;
    var sum = list.reduce(function (t, r) { return t + r.stars; }, 0);
    return { count: list.length, avg: Math.round((sum / list.length) * 10) / 10 };
  }
  // 별점 그림: 색만으로 알리지 않도록 화면 읽기에는 'N점'으로 읽혀요.
  function starRow(stars, cls) {
    var row = document.createElement("span");
    row.className = cls || "stars";
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", "5점 만점에 " + stars + "점");
    for (var i = 1; i <= 5; i++) {
      var s = starSvg();
      if (i <= stars) s.setAttribute("class", "on");
      row.appendChild(s);
    }
    return row;
  }

  // 버그 신고에 붙이는 기기 정보 (개인정보 없이 기기 종류, 브라우저, 화면 크기만)
  function deviceInfo() {
    var ua = navigator.userAgent || "";
    var os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "iPad"
      : /Android/.test(ua) ? "안드로이드" : /Windows/.test(ua) ? "윈도우 컴퓨터" : /Mac/.test(ua) ? "맥" : /CrOS/.test(ua) ? "크롬북" : "기타 기기";
    var br = /SamsungBrowser/.test(ua) ? "삼성 인터넷" : /Edg\//.test(ua) ? "엣지" : /Whale/.test(ua) ? "웨일" : /KAKAOTALK/i.test(ua) ? "카카오톡 안 브라우저"
      : /CriOS|Chrome\//.test(ua) ? "크롬" : /FxiOS|Firefox\//.test(ua) ? "파이어폭스" : /Safari\//.test(ua) ? "사파리" : "기타 브라우저";
    return os + " · " + br + " · 화면 " + window.innerWidth + "×" + window.innerHeight;
  }
  function kstStamp(withTime) {
    var d = kstDate(Date.now());
    var day = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
    return withTime ? day + " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) : day;
  }

  var KINDS = [
    { id: "review", label: "⭐ 리뷰", tag: "리뷰" },
    { id: "bug", label: "🐞 버그", tag: "버그 신고" },
    { id: "idea", label: "💡 바꿔 주세요", tag: "바꿔 주세요" }
  ];

  function openFeedback(slug, startKind) {
    slug = slug || gameSlugFromLocation();
    injectStyle();
    return Promise.all([findGame(slug), data.listCards(), data.lastCardId()]).then(function (res) {
      var game = res[0];
      var last = res[1].filter(function (c) { return c.id === res[2]; })[0];
      var draft = { kind: startKind || "review", stars: 0, name: last ? last.name : "", text: { review: "", bug: "", idea: "" } };
      var title = game ? game.title : "오락실";

      return new Promise(function (resolve) {
        var dialog = el("dialog", { class: "fr-dialog", "aria-labelledby": "fr-title" });
        var body = el("div", { class: "fr-body" });
        dialog.appendChild(body);
        document.body.appendChild(dialog);
        function close(sent) {
          dialog.close();
          dialog.remove();
          resolve({ sent: sent });
        }
        dialog.addEventListener("cancel", function (e) { e.preventDefault(); close(false); });

        function message() {
          var k = KINDS.filter(function (x) { return x.id === draft.kind; })[0];
          var lines = ["[오락실 " + k.tag + "] " + title];
          var name = cleanName(draft.name);
          var text = draft.text[draft.kind].trim();
          if (draft.kind === "review") {
            lines.push("별점: " + "★★★★★".slice(0, draft.stars) + "☆☆☆☆☆".slice(0, 5 - draft.stars) + " (" + draft.stars + "점)");
            lines.push("별명: " + name.name);
            lines.push("한 줄 평: " + text.replace(/\s+/g, " "));
            lines.push("게임: " + slug + " · " + kstStamp(false));
          } else {
            lines.push("내용: " + text);
            if (name.ok) lines.push("별명: " + name.name);
            if (draft.kind === "bug") lines.push("기기: " + deviceInfo());
            lines.push("게임: " + slug + " · " + kstStamp(true));
          }
          return lines.join("\n");
        }

        function problem() {
          var text = draft.text[draft.kind].trim();
          if (draft.kind === "review") {
            if (!draft.stars) return "별을 눌러 별점을 골라 주세요.";
            var n = cleanName(draft.name);
            if (!n.ok) return n.error;
            if (!text) return "한 줄 평을 써 주세요.";
            return "";
          }
          if (draft.name.trim() && !cleanName(draft.name).ok) return cleanName(draft.name).error;
          return text ? "" : draft.kind === "bug" ? "어떤 문제가 있었는지 써 주세요." : "어떻게 바꾸면 좋을지 써 주세요.";
        }

        function render(errorText, focusSel) {
          body.textContent = "";
          body.appendChild(el("h2", { class: "fr-title", id: "fr-title", text: "의견 남기기" }));
          body.appendChild(el("p", { class: "fr-game", text: title }));

          var kinds = el("div", { class: "fr-kinds", role: "radiogroup", "aria-label": "의견 종류" });
          KINDS.forEach(function (k, i) {
            var on = k.id === draft.kind;
            kinds.appendChild(el("button", {
              type: "button", class: "fr-kind", role: "radio", "aria-checked": String(on), tabindex: on ? "0" : "-1", text: k.label,
              onclick: function () { draft.kind = k.id; render(null, ".fr-kind[aria-checked=true]"); },
              onkeydown: function (e) {
                var step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (!step) return;
                e.preventDefault();
                draft.kind = KINDS[(i + step + KINDS.length) % KINDS.length].id;
                render(null, ".fr-kind[aria-checked=true]");
              }
            }));
          });
          body.appendChild(kinds);

          var max = draft.kind === "review" ? REVIEW_MAX : NOTE_MAX;
          if (draft.kind === "review") {
            var stars = el("div", { class: "fr-stars", role: "radiogroup", "aria-label": "별점" });
            for (var n = 1; n <= 5; n++) (function (n) {
              var on = n <= draft.stars;
              var b = el("button", {
                type: "button", class: "fr-star" + (on ? " on" : ""), role: "radio", "aria-label": n + "점",
                "aria-checked": String(n === draft.stars), tabindex: (draft.stars ? n === draft.stars : n === 1) ? "0" : "-1",
                onclick: function () { draft.stars = n; render(null, ".fr-star[aria-checked=true]"); },
                onkeydown: function (e) {
                  var step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
                  if (!step) return;
                  e.preventDefault();
                  draft.stars = Math.min(5, Math.max(1, (draft.stars || 0) + step));
                  render(null, ".fr-star[aria-checked=true]");
                }
              });
              b.appendChild(starSvg());
              stars.appendChild(b);
            })(n);
            body.appendChild(el("div", { class: "fr-field" }, [el("p", { class: "fr-label", text: "몇 점을 줄까요?" }), stars]));
          }

          var nameInput = el("input", { class: "fr-input", type: "text", id: "fr-name", autocomplete: "off",
            placeholder: draft.kind === "review" ? "별명 (" + NAME_MAX + "글자까지)" : "별명 (안 써도 돼요)" });
          nameInput.value = draft.name;
          nameInput.addEventListener("input", function () { draft.name = nameInput.value; });
          body.appendChild(el("div", { class: "fr-field" }, [
            el("label", { class: "fr-label", for: "fr-name", text: "별명" }),
            nameInput,
            el("p", { class: "fr-hint", style: "margin:0", text: "진짜 이름 말고 별명을 써 주세요." })
          ]));

          var label = draft.kind === "review" ? "한 줄 평" : draft.kind === "bug" ? "어떤 문제가 있었나요?" : "어떻게 바꾸면 좋을까요?";
          var ph = draft.kind === "review" ? "예) 보스 나올 때 깜짝 놀랐어요!"
            : draft.kind === "bug" ? "예) 3단계에서 더미가 벽에 끼어서 안 움직여요." : "예) 3인칭 화면을 더 멀리서 보고 싶어요.";
          var area = el("textarea", { class: "fr-text", id: "fr-text", maxlength: String(max), placeholder: ph, rows: draft.kind === "review" ? "2" : "4" });
          area.value = draft.text[draft.kind];
          var count = el("p", { class: "fr-count", "aria-hidden": "true", text: Array.from(area.value).length + " / " + max });
          area.addEventListener("input", function () {
            draft.text[draft.kind] = area.value;
            count.textContent = Array.from(area.value).length + " / " + max;
          });
          body.appendChild(el("div", { class: "fr-field" }, [el("label", { class: "fr-label", for: "fr-text", text: label }), area, count]));

          if (draft.kind === "bug") body.appendChild(el("p", { class: "fr-device", text: "함께 보내는 정보: " + deviceInfo() }));
          if (errorText) body.appendChild(el("p", { class: "fr-error", style: "margin:0", role: "alert", text: errorText }));

          body.appendChild(el("div", { class: "fr-actions" }, [
            el("button", { type: "button", class: "fr-btn primary", text: "부모님께 보내기", onclick: send }),
            el("button", { type: "button", class: "fr-btn plain", text: "닫기", onclick: function () { close(false); } })
          ]));
          body.appendChild(el("p", { class: "fr-note", text: draft.kind === "review"
            ? "리뷰는 부모님이 확인한 뒤 오락실에 올라가요."
            : "버그와 바꿀 점은 화면에 올라가지 않고, 만든 팀에 전해져요." }));

          var f = focusSel && body.querySelector(focusSel);
          if (f) f.focus();
        }

        function send() {
          var err = problem();
          if (err) { render(err, draft.kind === "review" && !draft.stars ? ".fr-star" : "#fr-text"); return; }
          var text = message();
          var shared = navigator.share
            ? navigator.share({ title: "오락실 의견", text: text }).then(function () { return "shared"; }, function (e) {
              return e && e.name === "AbortError" ? "cancel" : copy(text);
            })
            : copy(text);
          shared.then(function (how) { if (how !== "cancel") done(how, text); });
        }
        function copy(text) {
          if (!navigator.clipboard || !navigator.clipboard.writeText) return Promise.resolve("manual");
          return navigator.clipboard.writeText(text).then(function () { return "copied"; }, function () { return "manual"; });
        }
        function done(how, text) {
          body.textContent = "";
          body.appendChild(el("h2", { class: "fr-title", id: "fr-title", text: how === "shared" ? "보냈어요. 고마워요!" : how === "copied" ? "글을 복사했어요" : "이 글을 복사해 주세요" }));
          body.appendChild(el("p", { class: "fr-result", text: how === "shared" ? "부모님이 확인하고 만든 팀에 전해 줄 거예요."
            : "카카오톡이나 문자에 붙여 넣어서 부모님께 보내 주세요." }));
          var box = el("textarea", { class: "fr-copy", readonly: "readonly", "aria-label": "보낼 글" });
          box.value = text;
          body.appendChild(box);
          body.appendChild(el("div", { class: "fr-actions" }, [
            el("button", { type: "button", class: "fr-btn primary", text: "다 했어요", onclick: function () { close(true); } }),
            el("button", { type: "button", class: "fr-btn plain", text: "하나 더 쓰기", onclick: function () {
              draft.text[draft.kind] = ""; if (draft.kind === "review") draft.stars = 0; render(null, ".fr-kind[aria-checked=true]");
            } })
          ]));
          if (how === "manual") { box.focus(); box.select(); }
        }

        render();
        dialog.showModal();
      });
    });
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
    reviews: reviewsOf,
    reviewSummary: reviewSummary,
    starRow: starRow,
    openFeedback: openFeedback,
    TOP_N: TOP_N
  };
})();
