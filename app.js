/* birds SEE you — app logic. Data lives in data/*.json; this file only renders it. */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- data ---------- */
  let BIRDS = {}, ORDER = [], REGIONS = {}, RORDER = [], COMING = [], FEEDBACK = null;
  async function load() {
    const j = u => fetch(u, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    const [b, idx] = await Promise.all([j("data/birds.json"), j("data/regions.json")]);
    b.birds.forEach(x => { BIRDS[x.id] = x; });
    ORDER = b.birds.map(x => x.id);
    RORDER = idx.order; COMING = idx.coming || []; FEEDBACK = idx.feedback || null;
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

  // chibi eagle eye: wide open = not seen yet; happy closed eye + sparkle = seen
  // binoculars (front view, stained-glass panes): pastel = not seen yet; colored panes + gold lenses = seen
  const STAMP_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><g class="no" stroke="#1C1A21" stroke-width="1.25" stroke-linejoin="round"><rect x="4.4" y="3.2" width="5.2" height="5.6" rx="1.3" fill="#E9E4E7"/><rect x="14.4" y="3.2" width="5.2" height="5.6" rx="1.3" fill="#E9E4E7"/><rect x="2.6" y="7.6" width="8.6" height="13" rx="3.4" fill="#BDB9E2"/><rect x="12.8" y="7.6" width="8.6" height="13" rx="3.4" fill="#BDB9E2"/><rect x="9.6" y="9" width="4.8" height="5.4" rx="1.2" fill="#E9E4E7"/><circle cx="6.9" cy="16.4" r="2.7" fill="#C6DAE0"/><circle cx="17.1" cy="16.4" r="2.7" fill="#C6DAE0"/><circle cx="6" cy="15.5" r=".8" fill="#fff" stroke="none"/><circle cx="16.2" cy="15.5" r=".8" fill="#fff" stroke="none"/></g><g class="ok" stroke="#1C1A21" stroke-width="1.25" stroke-linejoin="round"><rect x="4.4" y="3.2" width="5.2" height="5.6" rx="1.3" fill="#C6DAE0"/><rect x="14.4" y="3.2" width="5.2" height="5.6" rx="1.3" fill="#C6DAE0"/><rect x="2.6" y="7.6" width="8.6" height="13" rx="3.4" fill="#EDB8C6"/><rect x="12.8" y="7.6" width="8.6" height="13" rx="3.4" fill="#BDB9E2"/><rect x="9.6" y="9" width="4.8" height="5.4" rx="1.2" fill="#BCD7B3"/><circle cx="6.9" cy="16.4" r="2.7" fill="#FFE27A"/><circle cx="17.1" cy="16.4" r="2.7" fill="#FFE27A"/><path d="M2.9 12 L11 10.2 M12.9 10.6 L21.1 12.4" fill="none" stroke-width="1"/><circle cx="6" cy="15.5" r=".9" fill="#fff" stroke="none"/><circle cx="16.2" cy="15.5" r=".9" fill="#fff" stroke="none"/><path d="M12 .2 l.55 1.25 1.25.55 -1.25.55 -.55 1.25 -.55-1.25 -1.25-.55 1.25-.55z" fill="#fff" stroke="#1C1A21" stroke-width=".6"/></g></svg>`;
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
    const bird = `<g transform="translate(${w / 2 - 66} ${h * 0.44}) scale(1.15)" stroke="#1C1A21" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M30 78 L2 98 L10 70 Z" fill="${colors[0]}"/><path d="M18 70 C18 44 44 30 74 34 C96 38 106 58 98 76 C90 94 62 100 40 94 C28 90 18 82 18 70 Z" fill="${colors[0]}"/><circle cx="90" cy="34" r="20" fill="${colors[0]}"/><path d="M106 28 L126 36 L106 42 Z" fill="#F0D49A"/><path d="M40 58 C56 50 76 54 86 68 C70 78 52 76 40 58 Z" fill="${colors[1]}"/><path d="M56 96 L52 114 M72 96 L74 114" fill="none"/><circle cx="96" cy="30" r="3.5" fill="#1C1A21" stroke="none"/></g>`;
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
      <button class="stamp" type="button" data-stamp="${id}" data-lab="${esc(b.photos[0].label)}" data-region="${ctx === "all" ? "" : ctx}" aria-pressed="${got}" aria-label="我看到了：${esc(b.zh)}">${STAMP_SVG}</button></div>`;
  }
  const bar = (back, title, right = "", ids = "") => `<header class="bar"><div class="bar-in">${back ? `<button class="back" type="button" data-go="${back[0]}">‹ ${esc(back[1])}</button>` : ""}<div class="ttl">${esc(title)}</div><div class="count"${ids ? ` data-ids="${ids}"` : ""}>${right}</div></div></header>`;

  /* ---------- routes ---------- */
  function home() {
    const all = ORDER.length, got = nGot(ORDER);
    const wins = RORDER.map(id => { const r = REGIONS[id]; const ids = regionBirdIds(r);
      return `<button class="window ${TONE[r.tone] || ""}" type="button" data-go="#/r/${id}"><div class="pane">${glassSVG(id, PALETTES[r.tone] || PALETTES.mist)}</div>
        <div><div class="nm">${esc(r.name)}</div><div class="tg">${esc(r.tagline)}</div><div class="st">${nGot(ids)} / ${ids.length} 隻</div></div></button>`; }).join("")
      + COMING.map(c => `<button class="window soon" type="button" data-go="#/wish"><div class="pane"><span class="plus">＋</span>${esc(c.name)}<small>${esc(c.note || "")}</small></div></button>`).join("");
    app.innerHTML = `<main class="wrap">
      <section class="hero"><h1 class="logo">birds <b>SEE</b> you</h1>${S.name ? `<p class="hello"><b>${esc(S.name)}</b>，今天要去哪裡找鳥？</p>` : ""}</section>
      ${S.name ? "" : `<form class="glass double hi" id="hi"><h2>嗨！你是誰？</h2><p class="muted" style="margin:0">寫下你的名字或暱稱，這本賞鳥手冊就是你的了。</p>
        <input id="hi-name" type="text" maxlength="12" autocomplete="nickname" placeholder="例如：小翠、KB、鳥博士" required>
        <button class="bk" type="submit">開始收集鳥</button></form>`}
      <div class="glass progress"><span class="big">${got}</span><span class="lbl">隻鳥<br>已收集</span><span class="meter" aria-label="收集進度"><i style="width:${all ? Math.max(3, got / all * 100) : 0}%"></i></span><span class="lbl">共 ${all} 種</span></div>
      ${needsBackup() ? `<button class="nudge" type="button" data-go="#/me" data-anchor="backup">有 ${stampCount() - (S.backupCount || 0)} 個新章還沒備份，點這裡存一份 ›</button>` : ""}
      <section class="windows">${wins}</section>
      <section class="bigbtns">
        <button class="bigbtn tone-lav" type="button" data-go="#/all"><b>ALL BIRDS</b><span>全部 ${all} 種鳥的照片牆</span></button>
        <button class="bigbtn tone-amber" type="button" data-go="#/me"><b>MY BIRDS</b><span>我的鳥紀錄和徽章</span></button>
      </section>
      <p class="foot">照片來自 iNaturalist 的觀察紀錄，依各自的創用 CC 授權使用。<br>資料版本 ${esc(window.BSY_VERSION || "")}</p>
    </main>`;
    wireHi();
  }

  function wireHi() {
    const f = $("#hi"); if (!f) return;
    f.onsubmit = e => { e.preventDefault(); const v = $("#hi-name").value.trim().slice(0, 12); if (!v) return; S.name = v; save(); home(); toast(`歡迎，${v}！`); };
  }
  let allFilter = "all";
  function allBirds() {
    const ids = ORDER.filter(id => allFilter === "all" || (allFilter === "got" ? has(id) : !has(id)));
    app.innerHTML = bar(["#/", "首頁"], "ALL BIRDS", `${nGot(ORDER)} / ${ORDER.length}`, ORDER.join(",")) + `<main class="wrap">
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
      return `<section class="sec" id="sec-${s.type}"><div class="sech"><h2>${esc(s.title)}</h2><span class="sub">${esc(s.sub || "")}</span><span class="n" data-ids="${g.join(",")}">${nGot(g)} / ${g.length}</span></div>${extra}
        ${g.length ? `<div class="grid">${g.map(id => tile(id, rid)).join("")}</div>` : `<p class="empty">${ss}天這裡比較少季節限定的鳥，點其他季節看看。</p>`}</section>`;
    }).join("");
    const mis = missionsFor(r).map(id => `<button class="mchip ${has(id) ? "got" : ""}" type="button" data-open="${id}" data-ctx="${rid}"><img src="${BIRDS[id].photos[0].src}" alt="">${esc(BIRDS[id].zh)}${has(id) ? `<span class="mini">${STAMP_SVG}</span>` : ""}</button>`).join("");
    app.innerHTML = bar(["#/", "首頁"], r.full, `${nGot(ids)} / ${ids.length}`, ids.join(",")) + `<main class="wrap ${TONE[r.tone] || ""}">
      <section class="rhead"><div class="pane">${glassSVG(rid, PALETTES[r.tone] || PALETTES.mist, 300, 400)}</div><div><p class="eyebrow">賞鳥區</p><h2>${esc(r.name)}</h2><p class="full">${esc(r.full)}</p><p class="tg">${esc(r.tagline)}</p></div></section>
      <dl class="glass double info">${r.info.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}${k === "交通" && r.map ? `<a class="maplink" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.map)}" target="_blank" rel="noopener">在 Google 地圖打開 ↗</a>` : ""}</dd></div>`).join("")}</dl>
      ${r.tips && r.tips.length ? `<ul class="glass tips">${r.tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <section class="missions"><h3>今天的任務鳥 <span class="muted" style="font-size:13px">${nowSeason()}天・先找容易遇到的</span></h3>${mis ? `<div class="mrow">${mis}</div>` : `<p class="empty">這一季的鳥都收集到了，太厲害了！</p>`}</section>
      ${secs}
    </main>`;
  }

  // 3 missions: in season, not collected yet, easiest first (common → seasonal → lucky), data-listed missions first within a tier
  function missionsFor(r) {
    const ss = nowSeason(), tier = { common: 0, seasonal: 1, lucky: 2 }, pref = r.missions || [], seen = new Set(), pool = [];
    r.sections.forEach(s => s.birds.forEach((b, i) => {
      if (seen.has(b.id) || !BIRDS[b.id]) return;
      if (b.seasons && !b.seasons.includes(ss)) return;
      seen.add(b.id); if (has(b.id)) return;
      const p = pref.indexOf(b.id);
      pool.push({ id: b.id, k: (tier[s.type] ?? 1) * 1000 + (p >= 0 ? p : 100 + i) });
    }));
    return pool.sort((a, b) => a.k - b.k).slice(0, 3).map(x => x.id);
  }
  function regionList(rid) { const r = REGIONS[rid]; if (!r) return ORDER; return regionBirdIds(r); }
  function bird(id, ctx) {
    const b = BIRDS[id]; if (!b) return home();
    const list = ctx === "all" || !REGIONS[ctx] ? ORDER : regionList(ctx);
    const i = list.indexOf(id), prev = list[i - 1], next = list[i + 1];
    const backT = ctx === "all" || !REGIONS[ctx] ? ["#/all", "ALL BIRDS"] : [`#/r/${ctx}`, REGIONS[ctx].name];
    const tone = REGIONS[ctx] ? TONE[REGIONS[ctx].tone] : "";
    // one swipeable album per group (公/母, 成鳥/幼鳥, or one group); one stamp per group
    const labs = [...new Set(b.photos.map(p => p.label))];
    const photos = labs.map(lab => { const got = has(id, lab), ps = b.photos.filter(p => p.label === lab);
      const slides = ps.map(p => `<div class="slide"><div class="inner" data-zoom="${p.src}"><img src="${p.src}" ${p.w ? `width="${p.w}" height="${p.h}"` : ""} loading="lazy" alt="${esc(b.zh + lab)}"><span class="cr">© ${esc(p.by)} · ${esc(p.license)}</span></div></div>`).join("");
      return `<figure class="ph ${got ? "got-frame" : ""}" style="margin:0">${lab ? `<span class="lab ${labClass(lab)}">${esc(labSym(lab))}</span>` : ""}
        <div class="car">${slides}</div>
        ${ps.length > 1 ? `<div class="dots" aria-hidden="true">${ps.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div><span class="more">左右滑看 ${ps.length} 張</span>` : ""}
        <button class="stamp" type="button" data-stamp="${id}" data-lab="${esc(lab)}" data-region="${REGIONS[ctx] ? ctx : ""}" aria-pressed="${got}" aria-label="我看到了：${esc(b.zh + lab)}">${STAMP_SVG}</button>
        <span class="hint" ${got ? "hidden" : ""}>我看到了</span></figure>`; }).join("");
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
    app.querySelectorAll(".car").forEach(car => { const dots = car.parentElement.querySelectorAll(".dots i"), more = car.parentElement.querySelector(".more"); if (!dots.length) return;
      car.addEventListener("scroll", () => { const i = Math.round(car.scrollLeft / car.clientWidth); dots.forEach((d, k) => d.classList.toggle("on", k === i)); if (more) more.hidden = true; }, { passive: true }); });
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
    app.innerHTML = bar(["#/", "首頁"], S.name ? `${S.name} 的鳥` : "MY BIRDS", `${got.length} / ${ORDER.length}`) + `<main class="wrap">
      <section class="sec"><div class="sech"><h2>徽章</h2><span class="n">${B.filter(x => x[2]).length} / ${B.length}</span></div>
        <div class="badges">${B.map(([t, d, on, c1, c2, g]) => `<div class="badge ${on ? "" : "off"}">${MEDAL(c1, c2, g)}<b>${esc(t)}</b><span class="muted">${esc(d)}</span></div>`).join("")}</div></section>
      <section class="sec"><div class="sech"><h2>賞鳥日記</h2><span class="sub">每一次蓋章都記在這裡</span></div>
        ${days ? `<div class="log">${days}</div>` : `<p class="empty">還沒有紀錄。看到鳥時，按照片右上角的章！</p>`}</section>
      <section class="sec" id="backup"><div class="sech"><h2>備份</h2><span class="sub">刪掉 App 或換手機時，用備份找回紀錄</span></div>
        <div class="glass box">
          <p style="margin:0">${backupStatus()}</p>
          <div class="bkbtns"><button class="bk" type="button" id="bk-save">存一份備份到 iCloud / 檔案</button>
            <button class="bk ghost" type="button" id="bk-copy">複製備份碼（可以貼到 LINE 或備忘錄）</button></div>
          <details class="restore"><summary>從備份還原</summary>
            <label class="bk ghost filebtn">選擇備份檔<input type="file" id="bk-file" accept=".json,application/json,text/plain"></label>
            <textarea id="bk-code" rows="3" placeholder="或把備份碼貼在這裡"></textarea>
            <button class="bk" type="button" id="bk-restore">還原</button>
            <p class="muted" style="margin:0;font-size:13px">還原會和現在的紀錄合併，不會把已經蓋的章蓋掉。</p>
          </details>
        </div></section>
      <p class="foot"><button class="linkbtn" type="button" id="rename">改名字</button>　<button class="linkbtn" type="button" id="reset">清除全部紀錄</button> <span id="confirm" hidden>再按一次確認清除</span></p>
    </main>`;
    wireBackup();
    $("#rename").onclick = () => { delete S.name; save(); go("#/"); };
    let armed = false; const rb = $("#reset");
    rb.onclick = () => { if (!armed) { armed = true; $("#confirm").hidden = false; rb.textContent = "確認清除"; return; }
      S = { birds: {}, log: [], name: S.name, lastBackup: S.lastBackup, backupCount: 0 }; save(); me(); toast("已清除"); };
  }


  /* ---------- backup / restore (no server: the file stays with the family) ---------- */
  const stampCount = () => S.log.length;
  function backupStatus() {
    const last = S.lastBackup ? new Date(S.lastBackup) : null, since = stampCount() - (S.backupCount || 0);
    if (!last) return stampCount() ? `還沒有備份過，目前有 ${stampCount()} 個章。` : "還沒有任何章，蓋了章之後記得備份。";
    return `上次備份：${last.getFullYear()}/${last.getMonth() + 1}/${last.getDate()}${since > 0 ? `，之後又蓋了 ${since} 個章。` : "，紀錄都已經備份好了。"}`;
  }
  const needsBackup = () => stampCount() - (S.backupCount || 0) >= 10;
  function packBackup() { return JSON.stringify({ app: "birdseeyou", v: 1, at: new Date().toISOString(), name: S.name || "", birds: S.birds, log: S.log }); }
  function markBackedUp() { S.lastBackup = new Date().toISOString(); S.backupCount = stampCount(); save(); }
  const toCode = txt => "BSY1." + btoa(unescape(encodeURIComponent(txt)));
  function fromAny(txt) {
    txt = (txt || "").trim(); if (!txt) throw new Error("沒有內容");
    if (txt.startsWith("BSY1.")) txt = decodeURIComponent(escape(atob(txt.slice(5).replace(/\s+/g, ""))));
    let d; try { d = JSON.parse(txt); } catch (e) { throw new Error("看不懂這段內容，請確認是完整的備份碼或備份檔"); }
    if (d.app !== "birdseeyou" || !d.birds) throw new Error("這不是 birds SEE you 的備份");
    return d;
  }
  function mergeBackup(d) {
    let added = 0;
    if (!S.name && d.name) S.name = String(d.name).slice(0, 12);
    Object.entries(d.birds || {}).forEach(([id, v]) => { if (!BIRDS[id] || !v || !v.stamps) return;
      S.birds[id] = S.birds[id] || { stamps: {} };
      Object.entries(v.stamps).forEach(([k, t]) => { const cur = S.birds[id].stamps[k]; if (!cur) added++; if (!cur || t < cur) S.birds[id].stamps[k] = t; }); });
    const key = l => `${l.t}|${l.id}|${l.lab || ""}`, seen = new Set(S.log.map(key));
    (d.log || []).forEach(l => { if (l && l.id && l.t && !seen.has(key(l))) { S.log.push(l); seen.add(key(l)); } });
    S.log.sort((a, b) => a.t.localeCompare(b.t)); save(); return added;
  }
  function wireBackup() {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    $("#bk-save").onclick = async () => {
      const txt = packBackup(), name = `birdseeyou-備份-${day}.json`;
      try {
        const file = new File([txt], name, { type: "application/json" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "birds SEE you 備份" }); markBackedUp(); me(); toast("備份完成"); return; }
      } catch (e) { if (e && e.name === "AbortError") return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" })); a.download = name;
      document.body.appendChild(a); a.click(); a.remove(); markBackedUp(); me(); toast("備份檔已下載");
    };
    $("#bk-copy").onclick = async () => {
      const code = toCode(packBackup());
      try { await navigator.clipboard.writeText(code); markBackedUp(); me(); toast("備份碼已複製，貼到 LINE 或備忘錄存起來"); }
      catch (e) { const t = $("#bk-code"); t.closest("details").open = true; t.value = code; t.select(); toast("請長按選取後複製"); }
    };
    $("#bk-file").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $("#bk-code").value = r.result; doRestore(); }; r.readAsText(f); };
    $("#bk-restore").onclick = doRestore;
    function doRestore() { try { const n = mergeBackup(fromAny($("#bk-code").value)); me(); toast(n ? `還原成功，找回 ${n} 個章` : "還原完成，沒有新的章"); } catch (e) { toast("還原失敗：" + e.message); } }
  }


  /* ---------- wish: tell us where to go next (sent by email through FormSubmit; queued while offline) ---------- */
  const QKEY = "bsy-wish-queue";
  const readQ = () => { try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch (e) { return []; } };
  const writeQ = q => { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) {} };
  async function sendWish(w) {
    if (!FEEDBACK || !FEEDBACK.endpoint) throw new Error("no endpoint");
    const res = await fetch(FEEDBACK.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ 暱稱: w.name, 想去的地方: w.place, 想說的話: w.msg || "（沒有）", 已收集: w.count + " 種鳥", 時間: w.at, _subject: FEEDBACK.subject || "birds SEE you 回饋", _template: "box", _captcha: "false" }) });
    if (!res.ok) throw new Error("HTTP " + res.status);
  }
  async function flushWishes() {
    const q = readQ(); if (!q.length || !navigator.onLine) return;
    const left = [];
    for (const w of q) { try { await sendWish(w); } catch (e) { left.push(w); } }
    writeQ(left); if (left.length < q.length) toast("先前寫的願望已經送出了");
  }
  window.addEventListener("online", flushWishes);
  function wish() {
    app.innerHTML = bar(["#/", "首頁"], "下一個地方") + `<main class="wrap">
      <section class="hero"><h2>想去哪裡賞鳥？</h2><p class="hello">告訴我們你想去的地方，我們會把它做成新的賞鳥手冊。</p></section>
      <form class="glass double hi" id="wish">
        <label for="w-name"><b>你的暱稱</b></label>
        <input id="w-name" type="text" maxlength="12" required value="${esc(S.name || "")}" placeholder="例如：小翠">
        <label for="w-place"><b>想去哪裡？</b></label>
        <input id="w-place" type="text" maxlength="40" required placeholder="例如：陽明山、華江雁鴨公園、墾丁">
        <label for="w-msg"><b>想說的話</b> <span class="muted">（可以不寫）</span></label>
        <textarea id="w-msg" rows="3" maxlength="300" placeholder="例如：我想看貓頭鷹！"></textarea>
        <input type="text" name="_honey" id="w-honey" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <button class="bk" type="submit" id="w-send">送出</button>
        <p class="muted" style="margin:0;font-size:13px">只要寫暱稱就好，不用寫真實姓名、電話或地址。</p>
      </form>
      ${readQ().length ? `<p class="muted">有 ${readQ().length} 則還沒送出，連上網路後會自動送出。</p>` : ""}
    </main>`;
    $("#wish").onsubmit = async e => {
      e.preventDefault(); if ($("#w-honey").value) return;
      const w = { name: $("#w-name").value.trim(), place: $("#w-place").value.trim(), msg: $("#w-msg").value.trim(), count: nGot(ORDER), at: new Date().toLocaleString("zh-TW") };
      if (!w.name || !w.place) return;
      const btn = $("#w-send"); btn.disabled = true; btn.textContent = "送出中…";
      try { await sendWish(w); thanks(w, true); }
      catch (err) { const q = readQ(); q.push(w); writeQ(q); thanks(w, false); }
    };
  }
  function thanks(w, sent) {
    app.innerHTML = bar(["#/", "首頁"], "下一個地方") + `<main class="wrap"><section class="glass double hi" style="text-align:center">
      <h2>${sent ? "收到了，謝謝你！" : "先幫你存起來了"}</h2>
      <p style="margin:0">${sent ? `我們會研究「${esc(w.place)}」有哪些鳥。` : "現在好像沒有網路。連上網路後，打開 App 就會自動送出。"}</p>
      <button class="bk" type="button" data-go="#/">回首頁</button></section></main>`;
  }


  /* ---------- pull to refresh (home-screen apps have no browser reload) ---------- */
  (function pullToRefresh() {
    const ind = document.createElement("div"); ind.className = "ptr"; ind.setAttribute("aria-hidden", "true");
    ind.innerHTML = `<span class="ptr-dot"><svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 0 8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M20 4v6h-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="ptr-t">往下拉更新</span>`;
    document.body.appendChild(ind);
    const T = 80; let y0 = null, d = 0, busy = false;
    const set = v => { d = v; ind.style.transform = `translate(-50%, ${Math.min(v, 120) - 70}px)`; ind.style.opacity = Math.min(1, v / T);
      ind.querySelector(".ptr-dot").style.transform = `rotate(${v * 3}deg)`; ind.querySelector(".ptr-t").textContent = v >= T ? "放開就更新" : "往下拉更新"; ind.classList.toggle("ready", v >= T); };
    const blocked = e => busy || document.querySelector(".lb") || e.target.closest("input,textarea,.mrow");
    window.addEventListener("touchstart", e => { if (window.scrollY > 0 || e.touches.length !== 1 || blocked(e)) { y0 = null; return; } y0 = e.touches[0].clientY; }, { passive: true });
    window.addEventListener("touchmove", e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy <= 0 || window.scrollY > 0) { if (d) set(0); return; } set(dy * 0.5); }, { passive: true });
    window.addEventListener("touchend", async () => {
      if (y0 == null) return; y0 = null;
      if (d < T) { ind.classList.add("back"); set(0); setTimeout(() => ind.classList.remove("back"), 250); return; }
      busy = true; ind.classList.add("spin"); ind.querySelector(".ptr-t").textContent = "更新中…";
      try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await Promise.race([reg.update(), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
      location.reload();
    });
  })();

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
    else if (p[0] === "wish") wish();
    else home();
    window.scrollTo(0, scrollMem[h] || 0);
  }
  window.addEventListener("hashchange", render);
  window.addEventListener("scroll", () => { scrollMem[location.hash || "#/"] = window.scrollY; }, { passive: true });

  /* ---------- events ---------- */
  function refreshStamps(id) {
    app.querySelectorAll(`[data-stamp="${id}"]`).forEach(btn => {
      const inTile = btn.closest(".tile"), ph = btn.closest(".ph");
      const on = inTile ? has(id) : has(id, btn.dataset.lab || "");
      btn.setAttribute("aria-pressed", on);
      (inTile || ph)?.classList.toggle("got-frame", on);
      const hint = ph && ph.querySelector(".hint"); if (hint) hint.hidden = on;
    });
    app.querySelectorAll("[data-ids]").forEach(el => { const ids = el.dataset.ids.split(",").filter(Boolean); el.textContent = `${nGot(ids)} / ${ids.length}`; });
    app.querySelectorAll(`.mchip[data-open="${id}"]`).forEach(m => m.classList.toggle("got", has(id)));
  }
  function rerenderKeepScroll() { const y = window.scrollY; render(); window.scrollTo(0, y); }
  app.addEventListener("click", e => {
    const st = e.target.closest("[data-stamp]");
    if (st) { e.stopPropagation(); const id = st.dataset.stamp, lab = st.dataset.lab || "", on = !has(id, lab);
      stampSet(id, lab, on, st.dataset.region || null);
      if (on) toast(`蓋章！${BIRDS[id].zh}${lab ? "・" + lab : ""}`);
      refreshStamps(id);
      if (on) { st.classList.remove("pop"); void st.offsetWidth; st.classList.add("pop"); }
      return; }
    const z = e.target.closest("[data-zoom]"); if (z) { const id = (location.hash.match(/#\/b\/([^/]+)/) || [])[1], ps = id && BIRDS[id] ? BIRDS[id].photos : [{ src: z.dataset.zoom, label: "", by: "", license: "" }];
      lightbox(ps, Math.max(0, ps.findIndex(p => p.src === z.dataset.zoom))); return; }
    const o = e.target.closest("[data-open]"); if (o) { go(`#/b/${o.dataset.open}/${o.dataset.ctx || "all"}`); return; }
    const g = e.target.closest("[data-go]"); if (g) { go(g.dataset.go); if (g.dataset.anchor) setTimeout(() => { const t = document.getElementById(g.dataset.anchor); if (t) t.scrollIntoView({ block: "start" }); }, 60); return; }
    const f = e.target.closest("[data-filter]"); if (f) { allFilter = f.dataset.filter; rerenderKeepScroll(); return; }
    const s = e.target.closest("[data-season]"); if (s) { seasonPick[s.dataset.rid] = s.dataset.season; rerenderKeepScroll(); return; }
  });
  app.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("[data-open]")) e.target.click(); });

  /* ---------- swipe between birds ---------- */
  function swipe(el, onLeft, onRight) {
    if (!el) return; let x0 = null, y0 = null, t0 = 0;
    el.addEventListener("touchstart", e => { if (e.touches.length !== 1 || e.target.closest(".car")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); }, { passive: true });
    el.addEventListener("touchend", e => { if (x0 == null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - t0 < 700) { dx < 0 ? onLeft() : onRight(); } x0 = null; }, { passive: true });
  }

  /* ---------- lightbox with pinch zoom ---------- */
  // full-screen viewer: swipe left/right through every photo of the bird (公 → 母 …), pinch / double-tap to zoom, swipe down to close
  function lightbox(list, start) {
    let i = Math.max(0, start || 0);
    const lb = document.createElement("div"); lb.className = "lb";
    lb.innerHTML = `<div class="lb-top"><span class="lb-lab"></span><span class="lb-n"></span></div><img alt=""><button class="x" type="button" aria-label="關閉">×</button>
      <button class="lb-nav prev" type="button" aria-label="上一張">‹</button><button class="lb-nav next" type="button" aria-label="下一張">›</button>
      <p class="lb-cr"></p><p class="tip">左右滑換照片・兩指或點兩下放大・往下滑關閉</p>`;
    document.body.appendChild(lb); document.body.style.overflow = "hidden";
    const img = lb.querySelector("img"); let sc = 1, tx = 0, ty = 0, st = null, lastTap = 0, anim = false;
    const W = () => window.innerWidth, H = () => window.innerHeight;
    const apply = (t) => { img.style.transition = t ? "transform .22s ease" : "none"; img.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`; };
    const reset = (t) => { sc = 1; tx = 0; ty = 0; apply(t); };
    function show(k, dir) {
      i = (k + list.length) % list.length; const p = list[i];
      const swap = () => { img.src = p.src; lb.querySelector(".lb-lab").textContent = p.label ? labSym(p.label) : ""; lb.querySelector(".lb-lab").hidden = !p.label;
        lb.querySelector(".lb-n").textContent = list.length > 1 ? `${i + 1} / ${list.length}` : ""; lb.querySelector(".lb-cr").textContent = `© ${p.by} · ${p.license}`;
        lb.querySelectorAll(".lb-nav").forEach(n => n.hidden = list.length < 2);
        if (dir) { tx = dir * W() * 0.6; sc = 1; ty = 0; apply(false); requestAnimationFrame(() => { tx = 0; apply(true); setTimeout(() => anim = false, 230); }); } else reset(false); };
      if (dir) { anim = true; tx = -dir * W(); apply(true); setTimeout(swap, 180); } else swap();
    }
    const go = d => { if (list.length > 1 && !anim) show(i + d, d); };
    show(i);
    const close = () => { lb.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); syncAlbum(list[i]); };
    const onKey = e => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", onKey);
    lb.querySelector(".x").onclick = close; lb.querySelector(".prev").onclick = () => go(-1); lb.querySelector(".next").onclick = () => go(1);
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = t => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
    // keep the point under the finger fixed while zooming (transform-origin is the image centre = screen centre)
    const zoomTo = (px, py, ns, from) => { ns = Math.min(6, Math.max(1, ns)); const cx = W() / 2, cy = H() / 2, f = ns / from.s;
      tx = px - cx - f * (px - cx - from.tx); ty = py - cy - f * (py - cy - from.ty); sc = ns; if (sc === 1) { tx = 0; ty = 0; } };
    lb.addEventListener("touchstart", e => { if (e.target.closest("button")) return; const t = e.touches;
      if (t.length === 2) st = { d: dist(t), s: sc, m: mid(t), tx, ty };
      else if (t.length === 1) { const now = Date.now();
        if (now - lastTap < 280) { zoomTo(t[0].clientX, t[0].clientY, sc > 1 ? 1 : 2.5, { s: sc, tx, ty }); apply(true); lastTap = 0; st = null; return; }
        lastTap = now; st = { x: t[0].clientX, y: t[0].clientY, tx, ty, one: true, axis: null }; } }, { passive: true });
    lb.addEventListener("touchmove", e => { const t = e.touches; if (!st || anim) return;
      if (t.length === 2 && st.d) { const m = mid(t); zoomTo(m[0], m[1], st.s * dist(t) / st.d, { s: st.s, tx: st.tx + (m[0] - st.m[0]), ty: st.ty + (m[1] - st.m[1]) }); apply(false); return; }
      if (t.length !== 1 || !st.one) return;
      const dx = t[0].clientX - st.x, dy = t[0].clientY - st.y;
      if (sc > 1) { tx = st.tx + dx; ty = st.ty + dy; apply(false); return; }
      if (!st.axis && Math.hypot(dx, dy) > 8) st.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (st.axis === "x") { tx = dx; apply(false); } else if (st.axis === "y") { ty = Math.max(0, dy); lb.style.background = `rgba(14,12,18,${Math.max(.4, .96 - dy / 400)})`; apply(false); } }, { passive: true });
    lb.addEventListener("touchend", e => { if (!st || e.touches.length) return; const s0 = st; st = null; if (anim) return;
      if (sc > 1 || !s0.one) { if (sc < 1.02) reset(true); return; }
      const dx = e.changedTouches[0].clientX - s0.x, dy = e.changedTouches[0].clientY - s0.y;
      if (s0.axis === "x" && Math.abs(dx) > 60) { go(dx < 0 ? 1 : -1); return; }
      if (s0.axis === "y" && dy > 110) { close(); return; }
      lb.style.background = ""; reset(true); });
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    lb.addEventListener("wheel", e => { e.preventDefault(); zoomTo(e.clientX, e.clientY, sc * (e.deltaY < 0 ? 1.15 : 0.87), { s: sc, tx, ty }); apply(false); }, { passive: false });
  }
  function syncAlbum(p) { // after closing, leave the page album on the photo you were looking at
    const el = p && app.querySelector(`.car [data-zoom="${CSS.escape(p.src)}"]`); if (!el) return;
    const car = el.closest(".car"), slide = el.closest(".slide"); car.scrollTo({ left: slide.offsetLeft - car.offsetLeft });
  }

  let tt; function toast(msg) { let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 1600); }

  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  load().then(() => { migrateOld(); render(); flushWishes(); }).catch(err => {
    app.innerHTML = `<main class="wrap"><h2>載入失敗</h2><p>第一次打開需要網路。請連上網路後重新整理。</p><p class="muted">${esc(err.message)}</p></main>`;
  });
})();
