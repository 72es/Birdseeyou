/* birds SEE you — app logic. Data lives in data/*.json; this file only renders it. */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- data ---------- */
  let BIRDS = {}, ORDER = [], REGIONS = {}, RORDER = [], COMING = [];
  async function load() {
    const j = u => fetch(u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    const [b, idx] = await Promise.all([j("data/birds.json"), j("data/regions.json")]);
    b.birds.forEach(x => { BIRDS[x.id] = x; });
    ORDER = b.birds.map(x => x.id);
    RORDER = idx.order; COMING = idx.coming || [];
    const rs = await Promise.all(RORDER.map(id => j(`data/regions/${id}.json`)));
    rs.forEach(r => { REGIONS[r.id] = r; });
  }

  /* ---------- collection store ---------- */
  const KEY = "bsy-v1";
  let S = { birds: {}, log: [] };
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && v.birds) S = v; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  function migrateOld() {
    // first version stored indexes of the Guandu booklet
    const OLD = ["egret_little","night_heron","moorhen","waterhen","grebe","kingfisher","prinia_plain","prinia_yb","munia","sparrow","bulbul","white_eye","swallow","kite","teal","pintail","shoveler","grey_heron","great_egret","int_egret","greenshank","wood_sandpiper","common_sandpiper","lrp","kentish","golden_plover","stilt","shrike","white_wagtail","grey_wagtail","osprey","spoonbill","stork","harrier","painted_snipe","yellow_bittern","cinnamon_bittern","peregrine","chinese_egret"];
    try {
      const raw = localStorage.getItem("kb-guandu-found-2026");
      if (!raw || localStorage.getItem("bsy-migrated")) return;
      const day = new Date().toISOString();
      JSON.parse(raw).forEach(i => { const id = OLD[+i]; if (!id || !BIRDS[id]) return;
        const lab = BIRDS[id].photos[0].label || "";
        stampSet(id, lab, true, "guandu", day, true); });
      localStorage.setItem("bsy-migrated", "1"); save();
    } catch (e) {}
  }
  const stamps = id => (S.birds[id] && S.birds[id].stamps) || {};
  const has = (id, lab) => lab == null ? Object.keys(stamps(id)).length > 0 : !!stamps(id)[lab || "_"];
  function stampSet(id, lab, on, region, when, quiet) {
    const k = lab || "_";
    S.birds[id] = S.birds[id] || { stamps: {} };
    if (on) {
      S.birds[id].stamps[k] = when || new Date().toISOString();
      S.log.push({ t: S.birds[id].stamps[k], id, lab: lab || "", r: region || null });
    } else {
      delete S.birds[id].stamps[k];
      for (let i = S.log.length - 1; i >= 0; i--) if (S.log[i].id === id && (S.log[i].lab || "") === (lab || "")) { S.log.splice(i, 1); break; }
      if (!Object.keys(S.birds[id].stamps).length) delete S.birds[id];
    }
    if (!quiet) save();
  }
  const nGot = ids => ids.filter(id => has(id)).length;

  /* ---------- helpers ---------- */
  const SEASONS = ["春", "夏", "秋", "冬"];
  const nowSeason = () => { const m = new Date().getMonth() + 1; return m >= 3 && m <= 5 ? "春" : m <= 8 && m >= 6 ? "夏" : m >= 9 && m <= 11 ? "秋" : "冬"; };
  const TONE = { mist: "tone-mist", sage: "tone-sage", rose: "tone-rose", amber: "tone-amber" };
  const regionBirdIds = r => [...new Set(r.sections.flatMap(s => s.birds.map(b => b.id)))];
  const labClass = l => l === "公" ? "m" : l === "母" ? "f" : "s";
  const labSym = l => l === "公" ? "♂ 公" : l === "母" ? "♀ 母" : l;

  const STAMP_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><g class="no" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke-dasharray="3 2.4"/><path d="M8 13.5c1.2-3.2 4.6-4.6 7.6-3.4-1 .6-1.6 1.4-1.8 2.6-.4 2-2.4 3.2-4.4 2.6"/><circle cx="14.6" cy="10.4" r=".6" fill="currentColor"/></g><g class="ok" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4.2 4.2 8.8-9.4"/></g></svg>`;
  const SPARROW = '<svg viewBox="0 0 24 18" aria-hidden="true"><path d="M3 11c0-4 3-7 8-7 2 0 3.5.8 4.5 2l4.5-.5-3 2.6c.3.8.5 1.7.5 2.9 0 3-2.5 5-6 5H7l-5 2 2-4c-.6-.9-1-1.9-1-3z" fill="currentColor"/></svg>';

  /* ---------- stained-glass window generator ---------- */
  function rng(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function splitPoly(p, a, b, c) { // line a*x+b*y=c ; returns [left,right]
    const L = [], R = [], f = q => a * q[0] + b * q[1] - c;
    for (let i = 0; i < p.length; i++) {
      const P = p[i], Q = p[(i + 1) % p.length], fp = f(P), fq = f(Q);
      (fp <= 0 ? L : R).push(P);
      if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); const X = [P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]; L.push(X); R.push(X); }
    }
    return [L, R];
  }
  const area = p => Math.abs(p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0) / 2);
  function glassSVG(seed, colors, w = 300, h = 400) {
    const rand = rng(seed); let polys = [[[0, 0], [w, 0], [w, h], [0, h]]];
    for (let k = 0; k < 13; k++) {
      polys.sort((x, y) => area(y) - area(x)); const p = polys.shift();
      const cx = p.reduce((s, q) => s + q[0], 0) / p.length, cy = p.reduce((s, q) => s + q[1], 0) / p.length;
      const ang = rand() * Math.PI, a = Math.cos(ang), b = Math.sin(ang), c = a * (cx + (rand() - .5) * 30) + b * (cy + (rand() - .5) * 30);
      const [L, R] = splitPoly(p, a, b, c); if (L.length > 2) polys.push(L); if (R.length > 2) polys.push(R);
    }
    const r = w / 2, arch = `M0 ${h} V${r} A${r} ${r} 0 0 1 ${w} ${r} V${h} Z`, id = "g" + seed.replace(/\W/g, "");
    const panes = polys.map((p, i) => `<polygon points="${p.map(q => q.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="${colors[Math.floor(rand() * colors.length)]}"/>`).join("");
    const bird = `<g transform="translate(${w / 2 - 70} ${h * 0.46}) scale(1.4)" stroke="#1C1A21" stroke-width="5" stroke-linejoin="round"><path d="M8 62c0-26 20-46 52-46 12 0 22 5 28 12l26-2-18 15c2 5 3 10 3 17 0 18-15 30-37 30H34l-30 12 12-24c-5-5-8-9-8-14z" fill="${colors[0]}"/><path d="M40 54c10 8 26 10 40 4" fill="none"/><circle cx="88" cy="40" r="4" fill="#1C1A21"/></g>`;
    return `<svg viewBox="-6 -6 ${w + 12} ${h + 12}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="${id}"><path d="${arch}"/></clipPath><linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient></defs><g clip-path="url(#${id})" stroke="#1C1A21" stroke-width="5" stroke-linejoin="round">${panes}${bird}<rect width="${w}" height="${h}" fill="url(#${id}s)" stroke="none"/></g><path d="${arch}" fill="none" stroke="#1C1A21" stroke-width="9"/></svg>`;
  }
  const PALETTES = { mist: ["#7FA9B8", "#C6DAE0", "#E9E4E7", "#BDB9E2", "#A9C8D1", "#DDE9EC"], sage: ["#6F9D7B", "#BCD7B3", "#E3EDD9", "#C6DAE0", "#A3C79A", "#EDB8C6"], rose: ["#C9667F", "#EDB8C6", "#F5DCE3", "#BDB9E2", "#E9E4E7", "#BCD7B3"] };

  /* ---------- view helpers ---------- */
  function tile(id, ctx) {
    const b = BIRDS[id]; if (!b) return "";
    const got = has(id);
    const flags = (b.endemic ? '<span class="flag">特有種</span>' : "") + (b.alien ? '<span class="flag alien">外來種</span>' : "");
    return `<div class="tile ${got ? "got-frame" : ""}" data-open="${id}" data-ctx="${ctx}" role="button" tabindex="0" aria-label="${esc(b.zh)}">
      <div class="inner"><img src="${b.photos[0].src}" alt="" loading="lazy"><span class="flags">${flags}</span><span class="nm">${esc(b.zh)}</span></div>
      <button class="stamp" type="button" data-stamp="${id}" data-lab="${esc(b.photos[0].label)}" data-region="${ctx === "all" ? "" : ctx}" aria-pressed="${got}" aria-label="蓋章：${esc(b.zh)}">${STAMP_SVG}</button></div>`;
  }
  const bar = (back, title, right = "") => `<header class="bar"><div class="bar-in">${back ? `<button class="back" type="button" data-go="${back[0]}">‹ ${esc(back[1])}</button>` : ""}<div class="ttl">${esc(title)}</div><div class="count">${right}</div></div></header>`;

  /* ---------- routes ---------- */
  function home() {
    const all = ORDER.length, got = nGot(ORDER);
    const wins = RORDER.map(id => { const r = REGIONS[id]; const ids = regionBirdIds(r);
      return `<button class="window ${TONE[r.tone] || ""}" type="button" data-go="#/r/${id}"><div class="pane">${glassSVG(id, PALETTES[r.tone] || PALETTES.mist)}</div>
        <div><div class="nm">${esc(r.name)}</div><div class="tg">${esc(r.tagline)}</div><div class="st">${nGot(ids)} / ${ids.length} 隻</div></div></button>`; }).join("")
      + COMING.map(c => `<div class="window soon"><div class="pane">${esc(c.name)}<br><small>${esc(c.note || "")}</small></div></div>`).join("");
    app.innerHTML = `<main class="wrap">
      <section class="hero"><h1 class="logo">birds <b>SEE</b> you</h1><p class="hello">KB，今天要去哪裡找鳥？</p></section>
      <div class="glass progress"><span class="big">${got}</span><span class="lbl">隻鳥<br>已收集</span><span class="meter" aria-label="收集進度"><i style="width:${all ? Math.max(3, got / all * 100) : 0}%"></i></span><span class="lbl">共 ${all} 種</span></div>
      <section class="windows">${wins}</section>
      <section class="bigbtns">
        <button class="bigbtn tone-lav" type="button" data-go="#/all"><b>ALL BIRDS</b><span>全部 ${all} 種鳥的照片牆</span></button>
        <button class="bigbtn tone-amber" type="button" data-go="#/me"><b>MY BIRDS</b><span>我的鳥紀錄和徽章</span></button>
      </section>
      <p class="foot">照片來自 iNaturalist 的觀察紀錄，依各自的創用 CC 授權使用。<br>資料版本 ${esc(window.BSY_VERSION || "")}</p>
    </main>`;
  }

  let allFilter = "all";
  function allBirds() {
    const ids = ORDER.filter(id => allFilter === "all" || (allFilter === "got" ? has(id) : !has(id)));
    app.innerHTML = bar(["#/", "首頁"], "ALL BIRDS", `${nGot(ORDER)} / ${ORDER.length}`) + `<main class="wrap">
      <div class="filters" role="group" aria-label="篩選">${[["all", "全部"], ["got", "已收集"], ["todo", "還沒找到"]].map(([k, t]) => `<button type="button" data-filter="${k}" aria-pressed="${allFilter === k}">${t}</button>`).join("")}</div>
      ${ids.length ? `<div class="grid">${ids.map(id => tile(id, "all")).join("")}</div>` : `<p class="empty">${allFilter === "got" ? "還沒有收集到鳥，去找第一隻吧！" : "全部都收集到了，太厲害了！"}</p>`}
    </main>`;
  }

  const seasonPick = {};
  function region(rid) {
    const r = REGIONS[rid]; if (!r) return home();
    const ids = regionBirdIds(r);
    const ss = seasonPick[rid] || nowSeason();
    const secs = r.sections.map(s => {
      let list = s.birds, extra = "";
      if (s.type === "seasonal") {
        list = s.birds.filter(b => (b.seasons || SEASONS).includes(ss));
        extra = `<div class="seasons" role="group" aria-label="季節">${SEASONS.map(x => `<button type="button" data-season="${x}" data-rid="${rid}" aria-pressed="${x === ss}">${x}${x === nowSeason() ? '<span class="now">現在</span>' : ""}</button>`).join("")}</div>`;
      }
      const g = list.map(b => b.id);
      return `<section class="sec" id="sec-${s.type}"><div class="sech"><h2>${esc(s.title)}</h2><span class="sub">${esc(s.sub || "")}</span><span class="n">${nGot(g)} / ${g.length}</span></div>${extra}
        ${g.length ? `<div class="grid">${g.map(id => tile(id, rid)).join("")}</div>` : `<p class="empty">${ss}天這裡比較少季節限定的鳥，點其他季節看看。</p>`}</section>`;
    }).join("");
    const mis = (r.missions || []).filter(id => BIRDS[id]).map(id => `<button class="mchip ${has(id) ? "got" : ""}" type="button" data-open="${id}" data-ctx="${rid}"><img src="${BIRDS[id].photos[0].src}" alt="">${esc(BIRDS[id].zh)}${has(id) ? " ✓" : ""}</button>`).join("");
    app.innerHTML = bar(["#/", "首頁"], r.full, `${nGot(ids)} / ${ids.length}`) + `<main class="wrap ${TONE[r.tone] || ""}">
      <section class="rhead"><div class="pane">${glassSVG(rid, PALETTES[r.tone] || PALETTES.mist, 300, 400)}</div><div><p class="eyebrow">賞鳥區</p><h2>${esc(r.name)}</h2><p class="full">${esc(r.full)}</p><p class="tg">${esc(r.tagline)}</p></div></section>
      <dl class="glass double info">${r.info.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      ${r.tips && r.tips.length ? `<ul class="glass tips">${r.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${mis ? `<section class="missions"><h3>今天的任務鳥</h3><div class="mrow">${mis}</div></section>` : ""}
      ${secs}
    </main>`;
  }

  function regionList(rid) { const r = REGIONS[rid]; if (!r) return ORDER; return regionBirdIds(r); }
  function bird(id, ctx) {
    const b = BIRDS[id]; if (!b) return home();
    const list = ctx === "all" || !REGIONS[ctx] ? ORDER : regionList(ctx);
    const i = list.indexOf(id), prev = list[i - 1], next = list[i + 1];
    const backT = ctx === "all" || !REGIONS[ctx] ? ["#/all", "ALL BIRDS"] : [`#/r/${ctx}`, REGIONS[ctx].name];
    const tone = REGIONS[ctx] ? TONE[REGIONS[ctx].tone] : "";
    const photos = b.photos.map((p, k) => { const got = has(id, p.label);
      return `<figure class="ph ${got ? "got-frame" : ""}" style="margin:0">${p.label ? `<span class="lab ${labClass(p.label)}">${esc(labSym(p.label))}</span>` : ""}
        <div class="inner" data-zoom="${p.src}"><img src="${p.src}" alt="${esc(b.zh + p.label)}"><span class="cr">© ${esc(p.by)} · ${esc(p.license)}</span></div>
        <button class="stamp" type="button" data-stamp="${id}" data-lab="${esc(p.label)}" data-region="${REGIONS[ctx] ? ctx : ""}" aria-pressed="${got}" aria-label="蓋章：${esc(b.zh + p.label)}">${STAMP_SVG}</button>
        ${got ? "" : `<span class="hint">看到了就按</span>`}</figure>`; }).join("");
    const nSp = Math.max(1, Math.round(b.cm / 14));
    const where = RORDER.map(rid => { const r = REGIONS[rid]; for (const s of r.sections) { const e = s.birds.find(x => x.id === id);
        if (e) return `<div class="wr"><button class="pill ${TONE[r.tone]}" type="button" data-go="#/r/${rid}">${esc(r.name)}</button><span>${esc(s.title)}${e.seasons ? "・" + e.seasons.join("") : "・全年"}</span></div>`; } return ""; }).join("");
    app.innerHTML = bar(backT, b.zh, list.length > 1 ? `${i + 1} / ${list.length}` : "") + `<main class="wrap ${tone}" id="birdpage">
      <header class="bhead"><h2>${esc(b.zh)}</h2><p class="en">${esc(b.en)} · <span class="sci">${esc(b.sci)}</span></p>
        <div class="bflags">${b.endemic ? '<span class="flag">台灣特有種</span>' : ""}${b.alien ? '<span class="flag alien">外來種</span>' : ""}</div></header>
      <div class="photos">${photos}</div>
      <p class="sexnote"><b>公母怎麼分？</b>${esc(b.sex)}</p>
      <p class="intro">${esc(b.intro)}</p>
      <div class="glass box"><h3>怎麼認</h3><ul>${b.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>
      <div class="facts"><div class="glass box"><h3>去哪找</h3><div class="pills">${b.habitat.map(h => `<span class="pill">${esc(h)}</span>`).join("")}</div></div>
        <div class="glass box"><h3>多大隻</h3><span class="cm">${b.cm}<small> 公分</small></span><span class="spar">${SPARROW.repeat(Math.min(nSp, 9))}${nSp > 9 ? "…" : ""}</span><span class="ratio">≈ ${nSp} 隻麻雀長</span></div></div>
      ${where ? `<div class="glass box"><h3>在哪些地方看得到</h3><div class="where">${where}</div></div>` : ""}
      <nav class="pager"><button type="button" ${prev ? `data-open="${prev}" data-ctx="${ctx}"` : "disabled"}>‹ ${prev ? esc(BIRDS[prev].zh) : ""}</button><button type="button" ${next ? `data-open="${next}" data-ctx="${ctx}"` : "disabled"}>${next ? esc(BIRDS[next].zh) : ""} ›</button></nav>
      <ul class="credits">${b.photos.map(p => `<li>${esc(p.label || "照片")}：© ${esc(p.by)} · ${esc(p.license)} · <a href="${esc(p.url)}" target="_blank" rel="noopener">iNaturalist</a></li>`).join("")}</ul>
    </main>`;
    swipe($("#birdpage"), () => next && go(`#/b/${next}/${ctx}`, true), () => prev && go(`#/b/${prev}/${ctx}`, true));
  }

  /* ---------- badges ---------- */
  const MEDAL = (c1, c2, glyph) => `<svg class="medal" viewBox="0 0 80 80" aria-hidden="true"><g stroke="#1C1A21" stroke-width="3.5" stroke-linejoin="round"><circle cx="40" cy="40" r="34" fill="${c1}"/><path d="M40 6 L40 74 M6 40 L74 40 M16 16 L64 64 M64 16 L16 64" fill="none" stroke-width="2.5"/><circle cx="40" cy="40" r="20" fill="${c2}"/></g><text x="40" y="47" text-anchor="middle" font-size="20" font-family="Huninn, sans-serif" fill="#1C1A21">${glyph}</text></svg>`;
  function badges() {
    const got = ORDER.filter(id => has(id));
    const pairs = got.filter(id => has(id, "公") && has(id, "母")).length;
    const regs = new Set(S.log.map(l => l.r).filter(Boolean));
    const luckyIn = rid => new Set(REGIONS[rid].sections.filter(s => s.type === "lucky").flatMap(s => s.birds.map(b => b.id)));
    const luckyHit = S.log.some(l => l.r && REGIONS[l.r] && luckyIn(l.r).has(l.id));
    const endemic = got.filter(id => BIRDS[id].endemic).length;
    const L = [
      ["第一隻鳥", "蓋下第一個章", got.length >= 1, "#EDB8C6", "#F5DCE3", "1"],
      ["小鳥友", "收集 10 種", got.length >= 10, "#BCD7B3", "#E3EDD9", "10"],
      ["鳥博士", "收集 25 種", got.length >= 25, "#C6DAE0", "#E9F1F3", "25"],
      ["鳥大師", "收集 50 種", got.length >= 50, "#BDB9E2", "#E4E2F4", "50"],
      ["公母雙收", "同一種鳥公母都看到", pairs >= 1, "#9FB4E6", "#F2C2CF", "♂♀"],
      ["配對高手", "5 種鳥公母都看到", pairs >= 5, "#9FB4E6", "#F2C2CF", "5"],
      ["幸運星", "在賞鳥區看到一隻幸運星", luckyHit, "#F0D49A", "#FBF0D6", "★"],
      ["台灣寶貝", "看到 5 種台灣特有種", endemic >= 5, "#F0D49A", "#BCD7B3", "台"],
      ["三區探險家", "在三個地方都蓋過章", regs.size >= 3, "#EDB8C6", "#C6DAE0", "3"],
    ];
    RORDER.forEach(rid => { const r = REGIONS[rid]; const c = r.sections.find(s => s.type === "common"); if (!c) return;
      const ids = c.birds.map(b => b.id); L.push([`${r.name}畢業`, `${r.name}常見鳥全收集（${nGot(ids)}/${ids.length}）`, ids.length && nGot(ids) === ids.length, (PALETTES[r.tone] || PALETTES.mist)[1], "#FBF8F9", "✓"]); });
    return L;
  }
  function me() {
    const got = ORDER.filter(id => has(id));
    const B = badges();
    const byDay = {};
    [...S.log].sort((a, b) => b.t.localeCompare(a.t)).forEach(l => { const d = l.t.slice(0, 10); (byDay[d] = byDay[d] || []).push(l); });
    const fmt = d => { const [y, m, dd] = d.split("-"); return `${y} 年 ${+m} 月 ${+dd} 日`; };
    const days = Object.keys(byDay).map(d => `<div class="day"><span>${fmt(d)}</span><span class="muted">${byDay[d].length} 個章</span></div>` + byDay[d].map(l => { const b = BIRDS[l.id]; if (!b) return "";
      const p = b.photos.find(x => x.label === l.lab) || b.photos[0];
      return `<button class="entry" type="button" data-open="${l.id}" data-ctx="${l.r || "all"}"><img src="${p.src}" alt=""><span class="t"><b>${esc(b.zh)}${l.lab ? "・" + esc(l.lab) : ""}</b><span>${l.r && REGIONS[l.r] ? esc(REGIONS[l.r].name) : "ALL BIRDS"}</span></span></button>`; }).join("")).join("");
    app.innerHTML = bar(["#/", "首頁"], "MY BIRDS", `${got.length} / ${ORDER.length}`) + `<main class="wrap">
      <section class="sec"><div class="sech"><h2>徽章</h2><span class="n">${B.filter(x => x[2]).length} / ${B.length}</span></div>
        <div class="badges">${B.map(([t, d, on, c1, c2, g]) => `<div class="badge ${on ? "" : "off"}">${MEDAL(c1, c2, g)}<b>${esc(t)}</b><span class="muted">${esc(d)}</span></div>`).join("")}</div></section>
      <section class="sec"><div class="sech"><h2>賞鳥日記</h2><span class="sub">每一次蓋章都記在這裡</span></div>
        ${days ? `<div class="log">${days}</div>` : `<p class="empty">還沒有紀錄。看到鳥時，按照片右上角的章！</p>`}</section>
      <p class="foot"><button class="linkbtn" type="button" id="reset">清除全部紀錄</button> <span id="confirm" hidden>再按一次確認清除</span></p>
    </main>`;
    let armed = false; const rb = $("#reset");
    rb.onclick = () => { if (!armed) { armed = true; $("#confirm").hidden = false; rb.textContent = "確認清除"; return; }
      S = { birds: {}, log: [] }; save(); me(); toast("已清除"); };
  }

  /* ---------- router ---------- */
  function go(h, replace) { if (replace) { history.replaceState(null, "", h); render(); } else location.hash = h; }
  const scrollMem = {};
  function render() {
    const h = location.hash || "#/";
    const p = h.replace(/^#\/?/, "").split("/");
    if (p[0] === "all") allBirds();
    else if (p[0] === "r") region(p[1]);
    else if (p[0] === "b") bird(p[1], p[2] || "all");
    else if (p[0] === "me") me();
    else home();
    window.scrollTo(0, scrollMem[h] || 0);
  }
  window.addEventListener("hashchange", render);
  window.addEventListener("scroll", () => { scrollMem[location.hash || "#/"] = window.scrollY; }, { passive: true });

  /* ---------- events ---------- */
  function rerenderKeepScroll() { const y = window.scrollY; render(); window.scrollTo(0, y); }
  app.addEventListener("click", e => {
    const st = e.target.closest("[data-stamp]");
    if (st) { e.stopPropagation(); const id = st.dataset.stamp, lab = st.dataset.lab || "", on = !has(id, lab);
      stampSet(id, lab, on, st.dataset.region || null);
      if (on) toast(`蓋章！${BIRDS[id].zh}${lab ? "・" + lab : ""}`);
      rerenderKeepScroll();
      const again = app.querySelector(`[data-stamp="${CSS.escape(id)}"][data-lab="${CSS.escape(lab)}"]`); if (again && on) again.classList.add("pop");
      return; }
    const z = e.target.closest("[data-zoom]"); if (z) { lightbox(z.dataset.zoom); return; }
    const o = e.target.closest("[data-open]"); if (o) { go(`#/b/${o.dataset.open}/${o.dataset.ctx || "all"}`); return; }
    const g = e.target.closest("[data-go]"); if (g) { go(g.dataset.go); return; }
    const f = e.target.closest("[data-filter]"); if (f) { allFilter = f.dataset.filter; rerenderKeepScroll(); return; }
    const s = e.target.closest("[data-season]"); if (s) { seasonPick[s.dataset.rid] = s.dataset.season; rerenderKeepScroll(); return; }
  });
  app.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-open]")) e.target.click(); });

  /* ---------- swipe between birds ---------- */
  function swipe(el, onLeft, onRight) {
    if (!el) return; let x0 = null, y0 = null, t0 = 0;
    el.addEventListener("touchstart", e => { if (e.touches.length !== 1) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
    el.addEventListener("touchend", e => { if (x0 == null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - t0 < 700) { dx < 0 ? onLeft() : onRight(); } x0 = null; }, { passive: true });
  }

  /* ---------- lightbox with pinch zoom ---------- */
  function lightbox(src) {
    const lb = document.createElement("div"); lb.className = "lb";
    lb.innerHTML = `<img src="${src}" alt=""><button class="x" type="button" aria-label="關閉">×</button><p class="tip">兩指放大・點兩下放大・往下滑關閉</p>`;
    document.body.appendChild(lb); document.body.style.overflow = "hidden";
    const img = lb.querySelector("img"); let sc = 1, tx = 0, ty = 0, start = null, lastTap = 0;
    const apply = () => { img.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`; };
    let base = null;
    img.onload = () => { if (!base) { const r = img.getBoundingClientRect(); base = [r.left, r.top]; img.style.position = "absolute"; img.style.left = "0"; img.style.top = "0"; }
      tx = base[0]; ty = base[1]; sc = 1; apply(); };
    if (img.complete) img.onload();
    const close = () => { lb.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    lb.querySelector(".x").onclick = close;
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = t => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
    const zoomAt = (px, py, ns) => { ns = Math.min(6, Math.max(1, ns)); tx = px - (px - tx) * (ns / sc); ty = py - (py - ty) * (ns / sc); sc = ns; if (sc === 1) img.onload(); apply(); };
    lb.addEventListener("touchstart", e => { const t = e.touches;
      if (t.length === 2) start = { d: dist(t), s: sc, m: mid(t), tx, ty };
      else if (t.length === 1) { const now = Date.now(); if (now - lastTap < 300) { zoomAt(t[0].clientX, t[0].clientY, sc > 1 ? 1 : 2.5); lastTap = 0; return; } lastTap = now; start = { x: t[0].clientX, y: t[0].clientY, tx, ty, one: true }; } }, { passive: true });
    lb.addEventListener("touchmove", e => { const t = e.touches; if (!start) return;
      if (t.length === 2 && start.d) { const ns = Math.min(6, Math.max(1, start.s * dist(t) / start.d)); const m = mid(t);
        tx = m[0] - (start.m[0] - start.tx) * (ns / start.s); ty = m[1] - (start.m[1] - start.ty) * (ns / start.s); sc = ns; apply(); }
      else if (t.length === 1 && start.one) { const dx = t[0].clientX - start.x, dy = t[0].clientY - start.y;
        if (sc > 1) { tx = start.tx + dx; ty = start.ty + dy; apply(); } else { ty = start.ty + Math.max(0, dy); apply(); } } }, { passive: true });
    lb.addEventListener("touchend", e => { if (start && start.one && sc === 1) { const dy = (e.changedTouches[0].clientY - start.y); if (dy > 110) { close(); return; } img.onload(); }
      if (e.touches.length === 0) start = null; if (sc < 1.02 && sc !== 1) { sc = 1; img.onload(); } });
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    lb.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, sc * (e.deltaY < 0 ? 1.15 : 0.87)); }, { passive: false });
  }

  let tt; function toast(msg) { let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 1600); }

  load().then(() => { migrateOld(); render(); }).catch(err => {
    app.innerHTML = `<main class="wrap"><h2>載入失敗</h2><p>第一次打開需要網路。請連上網路後重新整理。</p><p class="muted">${esc(err.message)}</p></main>`;
  });
})();
