/* ============================================================
   Creative ON v4 - script.js
   ============================================================ */
(function () {
  const S = window.SITE || {};
  const P = window.PROJECTS || [];
  const A = window.ARCHIVE || [];
  const C = window.CAREER || [];
  const OPT = window.OPT_MAP || {};
  const DIMS = window.IMG_DIMS || {};

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const fc = $("#fontCss");
      if (fc) fc.media = "all";
    })
  );
  const imgName = (n) => OPT[n] || n;
  const IMG = (n) => `assets/img/${imgName(n)}.webp`;
  const THUMB = (n) => `assets/img/${n}-t.webp`;
  const dimsOf = (key) => DIMS[key] || [1600, 1000];
  const srcsetOf = (n) => {
    const tKey = `${n}-t`;
    const oKey = imgName(n);
    const tw = dimsOf(tKey)[0];
    const ow = dimsOf(oKey)[0];
    if (n === "parkmusic-01") {
      return `assets/img/parkmusic-01-m.webp 800w, ${IMG(n)} ${ow}w`;
    }
    return `${THUMB(n)} ${tw}w, ${IMG(n)} ${ow}w`;
  };

  const WHAT = {
    festival: "축제",
    show: "공연 · 콘서트",
    ceremony: "기념식 · 공식행사",
    corp: "기업행사"
  };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esc = (v) =>
    String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const bare = (t) => String(t).replace(/^\d{4}\s+/, "");

  /* ---------- 선택적 GA4 / 전화번호 슬롯 ---------- */
  if (S.ga4_id && /^G-[A-Z0-9]+$/i.test(S.ga4_id)) {
    const gs = document.createElement("script");
    gs.async = true;
    gs.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(S.ga4_id)}`;
    document.head.appendChild(gs);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", S.ga4_id);
  }
  if (S.phone) {
    const pBox = $("#phoneBox");
    const pLink = $("#phoneLink");
    if (pBox && pLink) {
      pLink.href = `tel:${S.phone.replace(/[^+\d]/g, "")}`;
      pLink.textContent = `직통 연락처 ${S.phone}`;
      pBox.hidden = false;
    }
  }

  /* ---------- M1: 무차단 뷰파인더 탤리 인트로 ---------- */
  const vfHud = $("#vfHud");
  if (vfHud && !reduce && !document.documentElement.classList.contains("skip-intro")) {
    setTimeout(() => vfHud.classList.add("is-on"), 450);
    setTimeout(() => {
      vfHud.classList.add("is-done");
      try { sessionStorage.setItem("co_v4_intro", "1"); } catch (_) {}
    }, 950);
    setTimeout(() => vfHud.remove(), 1600);
  } else if (vfHud) {
    vfHud.remove();
  }
  setTimeout(() => {
    const hud = $("#vfHud");
    if (hud) hud.remove();
  }, 2400);

  /* ---------- 네비게이션 & 모바일 메뉴 ---------- */
  const nav = $("#nav");
  const burger = $("#navBurger");
  const navMenu = $("#navMenu");
  const mainEl = $("#main");
  const footEl = $("footer.foot");
  const mobBar = $("#mobBar");
  const desktopMQ = matchMedia("(min-width: 901px)");

  function setMenuOpen(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    document.body.classList.toggle("is-locked", open);
    if (mainEl) mainEl.inert = open;
    if (footEl) footEl.inert = open;
    if (mobBar) mobBar.inert = open;
    if (open) {
      const firstLink = $("a", navMenu);
      if (firstLink) setTimeout(() => firstLink.focus({ preventScroll: true }), 40);
    }
  }

  burger.addEventListener("click", () => {
    setMenuOpen(!nav.classList.contains("is-open"));
  });

  $$("#navMenu a").forEach((a) =>
    a.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) setMenuOpen(false);
    })
  );

  desktopMQ.addEventListener("change", (e) => {
    if (e.matches && nav.classList.contains("is-open")) setMenuOpen(false);
  });

  /* ---------- 실시간 ON AIR 시계 (데스크톱 + 가시 탭에서만 갱신) ---------- */
  const clock = $("#clock");
  let clockTimer = 0;
  function tickClock() {
    if (!clock) return;
    const d = new Date();
    clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function syncClock() {
    clearInterval(clockTimer);
    if (!document.hidden && desktopMQ.matches) {
      tickClock();
      clockTimer = setInterval(tickClock, 1000);
    }
  }
  syncClock();
  desktopMQ.addEventListener("change", syncClock);

  /* ---------- 히어로 슬라이더 & 움직임 일시정지 토글 ---------- */
  const ORDER = ["parkmusic-2023", "piano-2023", "firework-2019", "wonik-2024", "powerful-2025", "yeongcheon-2025"];
  const heroItems = P.filter((p) => p.hero)
    .sort((a, b) => (ORDER.indexOf(a.id) + 99) % 99 - (ORDER.indexOf(b.id) + 99) % 99)
    .slice(0, 6);

  const heroEl = $("#hero");
  const slidesEl = $("#heroSlides");
  const indexEl = $("#heroIndex");
  const motionToggle = $("#motionToggle");
  const DUR = 6000;
  let cur = 0;
  let timer = 0;
  let paused = false;

  heroItems.forEach((p, i) => {
    if (i > 0) {
      const img = new Image();
      const [w, h] = dimsOf(imgName(p.cover));
      img.className = "hero__slide";
      img.alt = `${p.title} 현장`;
      img.width = w;
      img.height = h;
      img.decoding = "async";
      img.dataset.src = IMG(p.cover);
      img.dataset.srcset = srcsetOf(p.cover);
      img.dataset.sizes = "100vw";
      slidesEl.appendChild(img);
    }
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `${i + 1}번 현장: ${p.title}`);
    b.style.setProperty("--dur", `${DUR}ms`);
    b.addEventListener("click", () => {
      go(i);
      restart();
    });
    li.appendChild(b);
    indexEl.appendChild(li);
  });

  const slides = $$(".hero__slide", slidesEl);
  const dots = $$("button", indexEl);

  function loadSlide(i) {
    const s = slides[i];
    if (s && s.dataset.src) {
      s.sizes = s.dataset.sizes || "100vw";
      s.srcset = s.dataset.srcset || "";
      s.src = s.dataset.src;
      delete s.dataset.src;
      delete s.dataset.srcset;
      delete s.dataset.sizes;
    }
  }

  function go(i, immediate) {
    if (!heroItems.length) return;
    cur = (i + heroItems.length) % heroItems.length;
    loadSlide(cur);
    if (cur > 0 || !immediate) loadSlide((cur + 1) % heroItems.length);
    slides.forEach((s, k) => s.classList.toggle("is-active", k === cur));
    dots.forEach((b) => b.classList.remove("is-active"));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (dots[cur]) dots[cur].classList.add("is-active");
      });
    });
    const p = heroItems[cur];
    $("#heroNo").textContent = pad(cur + 1);
    $("#heroName").textContent = `${p.client} · ${bare(p.title)}`;
  }

  function restart() {
    clearInterval(timer);
    if (!reduce && !paused && heroItems.length > 1) {
      timer = setInterval(() => go(cur + 1), DUR);
    }
  }

  if (heroItems.length) {
    go(0, true);
    restart();
    setTimeout(() => loadSlide(1), 5000);
  }

  $("#heroCaption").addEventListener("click", () => {
    if (heroItems[cur]) location.hash = `p/${heroItems[cur].id}`;
  });

  /* ---------- M2: GPU 컴포지터 기반 스크롤 방향·속도 반응형 키네틱 티커 ---------- */
  const marqueeWrap = $(".marquee");
  const marqueeTrack = $("#marqueeTrack");
  let mqDir = 1;
  let mqDecayTimer = 0;

  function getMqAnim() {
    return marqueeTrack && marqueeTrack.getAnimations ? marqueeTrack.getAnimations()[0] : null;
  }

  function boostMarquee(dy) {
    if (reduce || paused || !marqueeTrack) return;
    const anim = getMqAnim();
    if (!anim) return;
    mqDir = dy >= 0 ? 1 : -1;
    const boost = Math.min(3.4, 1 + Math.abs(dy) * 0.045);
    anim.playbackRate = mqDir * boost;
    clearTimeout(mqDecayTimer);
    mqDecayTimer = setTimeout(() => {
      const a = getMqAnim();
      if (a && !paused) a.playbackRate = mqDir;
    }, 160);
  }

  if (motionToggle) {
    motionToggle.addEventListener("click", () => {
      paused = !paused;
      heroEl.classList.toggle("is-paused", paused);
      if (marqueeWrap) marqueeWrap.classList.toggle("is-paused", paused);
      motionToggle.setAttribute("aria-pressed", String(paused));
      motionToggle.setAttribute(
        "aria-label",
        paused ? "슬라이드 및 흐르는 글자 재생" : "슬라이드 및 흐르는 글자 일시정지"
      );
      if (paused) clearInterval(timer);
      else restart();
      const anim = getMqAnim();
      if (anim) paused ? anim.pause() : anim.play();
    });
  }

  document.addEventListener("visibilitychange", () => {
    syncClock();
    if (document.hidden) clearInterval(timer);
    else restart();
  });

  /* ---------- Statement 단어 단위 점등 준비 (아래 섹션 초기화 함수로 분할) ---------- */
  const sayTxt = $("#sayTxt");
  let words = [];
  function initSayWords() {
    if (!sayTxt || words.length) return;
    const split = (node) =>
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(" "));
            else {
              const s = document.createElement("span");
              s.className = "w";
              s.textContent = t;
              f.appendChild(s);
            }
          });
          n.replaceWith(f);
        } else {
          split(n);
        }
      });
    split(sayTxt);
    words = $$(".w", sayTxt);
    if (reduce) words.forEach((w) => w.classList.add("on"));
  }

  /* ---------- M5: 현장 9곳 렌더링 + 필터 + 리빌 캐시 ---------- */
  const casesEl = $("#cases");
  const casesCountEl = $("#casesCount");
  let currentList = P;
  let what = "all";
  let pendingReveals = [];
  let activeMediaFigs = [];

  const seenCase = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          seenCase.unobserve(e.target);
          pendingReveals = pendingReveals.filter((x) => x !== e.target);
          const fig = $(".case__media", e.target);
          if (fig && !activeMediaFigs.includes(fig)) activeMediaFigs.push(fig);
          onScroll();
        }
      }),
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
  );

  function renderCases(skipScrollSync) {
    currentList = P.filter((p) => what === "all" || p.what.includes(what));
    const label = what === "all" ? "전체" : WHAT[what];
    if (casesCountEl) {
      casesCountEl.textContent = `${label} ${currentList.length}건의 현장을 보고 있습니다.`;
    }
    casesEl.innerHTML = currentList.length
      ? ""
      : `<p class="cases__empty">이 분류의 사진 사례는 준비 중입니다. 아래 아카이브에서 이력을 확인해 주세요.</p>`;

    activeMediaFigs = [];
    pendingReveals = pendingReveals.filter((el) => !el.classList.contains("case"));

    currentList.forEach((p, i) => {
      const [w, h] = dimsOf(imgName(p.cover));
      const a = document.createElement("a");
      a.className = "case";
      a.href = `#p/${p.id}`;
      a.setAttribute("aria-label", `${p.title} 자세히 보기`);
      a.innerHTML = `
        <figure class="case__media">
          <img src="${THUMB(p.cover)}" srcset="${srcsetOf(p.cover)}" sizes="(max-width: 860px) 100vw, 66vw" width="${w}" height="${h}" alt="${esc(p.title)} 현장 사진" loading="lazy" decoding="async">
        </figure>
        <div class="case__body">
          <span class="case__no"><b>CUE ${pad(i + 1)}</b> / ${p.year}</span>
          <h3 class="case__hook">${esc(p.hook || p.title)}</h3>
          <p class="case__title">${esc(p.title)}</p>
          <p class="case__meta">${esc(p.client)} · ${esc(p.role)}</p>
          <span class="case__go">현장 들여다보기 <i aria-hidden="true">→</i></span>
        </div>`;
      casesEl.appendChild(a);
      seenCase.observe(a);
      pendingReveals.push(a);
    });
    if (!skipScrollSync) onScroll();
  }

  function setWorkFilter(nextWhat) {
    what = nextWhat || "all";
    $$("#chips button").forEach((x) => {
      const on = x.dataset.what === what;
      x.classList.toggle("is-on", on);
      x.setAttribute("aria-pressed", String(on));
    });
    renderCases();
  }

  $$("#chips button").forEach((b) =>
    b.addEventListener("click", () => setWorkFilter(b.dataset.what))
  );

  /* PC 전용 CUE VIEW → 포인터 배지 */
  const cueCursor = $("#cueCursor");
  if (finePointer && cueCursor && casesEl) {
    casesEl.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".case");
      if (!card) {
        cueCursor.classList.remove("is-show");
        return;
      }
      cueCursor.classList.add("is-show");
      cueCursor.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 16}px, 0)`;
    });
    casesEl.addEventListener("pointerleave", () => cueCursor.classList.remove("is-show"));
  }

  /* ---------- M4: 맡는 일 클릭 필터 점프 & 호버 플로팅 프리뷰 ---------- */
  const floatPreview = $("#floatPreview");
  const floatPreviewImg = $("#floatPreviewImg");
  const floatPreviewCap = $("#floatPreviewCap");
  const previewNames = {
    "parkmusic-01": "입찰 제안 · 2023 달성 파크뮤직 콘서트",
    "sports-01": "기념식 · 제61회 경북도민체육대회 개회식",
    "yeongcheon-01": "축제 · 2025 영천 통합축제",
    "wonik-01": "기업행사 · 원익큐엔씨 신공장 준공식"
  };

  $$(".do__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      setWorkFilter(btn.dataset.jump || "all");
      const workSec = $("#work");
      if (workSec) workSec.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });

    if (finePointer && floatPreview && floatPreviewImg && floatPreviewCap) {
      btn.addEventListener("pointerenter", () => {
        const key = btn.dataset.preview;
        if (!key) return;
        floatPreviewImg.src = THUMB(key);
        floatPreviewCap.textContent = previewNames[key] || "";
        floatPreview.classList.add("is-show");
      });
      btn.addEventListener("pointermove", (e) => {
        floatPreview.style.transform = `translate3d(${e.clientX + 24}px, ${e.clientY - 76}px, 0) scale(1) rotate(-1.5deg)`;
      });
      btn.addEventListener("pointerleave", () => {
        floatPreview.classList.remove("is-show");
      });
    }
  });

  /* ---------- 소개, 경력, 아카이브 필터 & 인쇄 ---------- */
  $("#career").innerHTML = C.map(
    ([y, t, d]) => `<li><b>${esc(y)}</b><div><strong>${esc(t)}</strong><span>${esc(d)}</span></div></li>`
  ).join("");

  const factCount = $("#factCount");
  if (factCount) {
    factCount.dataset.count = P.length + A.length;
    factCount.textContent = P.length + A.length;
  }

  const aboutPhoto = $("#aboutPhoto");
  if (S.profile && aboutPhoto) {
    const profKey = imgName("profile");
    const [pw, ph] = dimsOf(profKey);
    const thumbKey = S.profile_thumb || "profile-t";
    const tw = dimsOf(thumbKey)[0];
    aboutPhoto.innerHTML = `<img src="assets/img/${profKey}.webp" srcset="assets/img/${thumbKey}.webp ${tw}w, assets/img/${profKey}.webp ${pw}w" sizes="(max-width: 900px) 100vw, 420px" width="${pw}" height="${ph}" alt="연출감독 김영근" loading="lazy" decoding="async">`;
  } else if (aboutPhoto) {
    aboutPhoto.remove();
  }

  $("#year").textContent = new Date().getFullYear();

  const arcListEl = $("#archiveList");
  const arcStatusEl = $("#arcStatus");
  function renderArchive(kind) {
    const filtered = kind === "all" ? A : A.filter(([, , , k]) => k === kind);
    const byYear = {};
    filtered.forEach(([y, t, r, k]) => (byYear[y] = byYear[y] || []).push([t, r, k]));
    arcListEl.innerHTML = Object.keys(byYear)
      .sort((a, b) => b - a)
      .map(
        (y) =>
          `<div class="arc"><p class="arc__y">${y}</p><ul>${byYear[y]
            .map(
              ([t, r, k]) =>
                `<li><span>${esc(t)}</span><span class="arc__meta"><span class="arc__role">${esc(r)}</span><span class="arc__badge" data-kind="${esc(k)}">${esc(k)}</span></span></li>`
            )
            .join("")}</ul></div>`
      )
      .join("");
    if (arcStatusEl) {
      arcStatusEl.textContent = `${kind === "all" ? "전체" : kind} 아카이브 ${filtered.length}건이 표시되었습니다.`;
    }
  }
  renderArchive("all");

  $$("#arcChips button").forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.kind;
      $$("#arcChips button").forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", String(on));
      });
      renderArchive(k);
    })
  );

  const printBtn = $("#printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  /* ---------- 등장 모션 + 숫자 카운트 + ON×3 순차 점등 ---------- */
  function count(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = 1;
    const end = +el.dataset.count;
    const from = end > 1000 ? end - 25 : 0;
    const t0 = performance.now();
    const D = 1200;
    (function step(t) {
      const k = Math.min(1, (t - t0) / D);
      const v = Math.round(from + (end - from) * (1 - Math.pow(1 - k, 4)));
      el.textContent = v;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  const rv = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        if (e.target.classList.contains("pill")) e.target.classList.add("is-lit");
        rv.unobserve(e.target);
        pendingReveals = pendingReveals.filter((x) => x !== e.target);
        $$("[data-count]", e.target).forEach(count);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  $$("[data-rv]").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((x) => x.hasAttribute("data-rv"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
    rv.observe(el);
    pendingReveals.push(el);
  });

  /* ---------- M3: ON×3 스포트라이트 + 3D 미세 틸트 ---------- */
  if (finePointer) {
    $$(".spot").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
        if (!reduce) {
          const rx = ((0.5 - y / r.height) * 5).toFixed(2);
          const ry = ((x / r.width - 0.5) * 5).toFixed(2);
          el.style.setProperty("--rx", `${rx}deg`);
          el.style.setProperty("--ry", `${ry}deg`);
        }
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- M6: 큐시트 행 클릭 점프 ---------- */
  const rows = $$(".row");
  rows.forEach((row) => {
    row.addEventListener("click", (e) => {
      if (window.getSelection && window.getSelection().toString()) return;
      row.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      if (e.target.tagName !== "BUTTON") {
        const btn = $(".row__n", row);
        if (btn) btn.focus({ preventScroll: true });
      }
    });
  });

  /* ---------- 단일 rAF 스크롤 엔진 (Read → Write 완전 분리 + 안전장치 유지) ---------- */
  const bar = $("#progressBar");
  const say = $("#say");
  const sheetFill = $("#sheetFill");
  const contactSec = $("#contact");
  let lastY = scrollY;
  let queued = false;

  function frame() {
    queued = false;

    /* 1. READ PHASE (DOM 측정 일괄 수집) */
    const y = scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const dy = y - lastY;

    const sayRect = say && words.length && !reduce ? say.getBoundingClientRect() : null;
    const rowRects = y > vh * 0.5 && rows.length ? rows.map((row) => row.getBoundingClientRect()) : [];
    const contactRect = y > vh * 0.5 && contactSec ? contactSec.getBoundingClientRect() : null;

    const parallaxUpdates = [];
    if (!reduce && activeMediaFigs.length) {
      for (let i = 0; i < activeMediaFigs.length; i++) {
        const fig = activeMediaFigs[i];
        const r = fig.getBoundingClientRect();
        if (r.bottom >= -120 && r.top <= vh + 120) {
          const p = (r.top + r.height / 2 - vh / 2) / vh;
          const m = r.height * 0.07;
          const py = Math.max(-m, Math.min(m, -p * m * 1.45)).toFixed(1) + "px";
          parallaxUpdates.push([fig.firstElementChild, py]);
        }
      }
    }

    const forceRevealEls = [];
    for (let i = 0; i < pendingReveals.length; i++) {
      const el = pendingReveals[i];
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) forceRevealEls.push(el);
    }

    /* 2. WRITE PHASE (DOM 쓰기 일괄 처리) */
    if (Math.abs(dy) > 1.5) boostMarquee(dy);

    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, y / max)) : 0})`;
    nav.classList.toggle("is-solid", y > vh * 0.65);
    if (!nav.classList.contains("is-open")) {
      if (dy > 4 && y > vh) nav.classList.add("is-hidden");
      else if (dy < 0 || y <= vh) nav.classList.remove("is-hidden");
    }
    lastY = y;

    if (mobBar && contactRect) {
      const showMob = y > vh * 0.72 && contactRect.top > vh * 0.85 && !nav.classList.contains("is-open") && openId === null;
      mobBar.classList.toggle("is-show", showMob);
      mobBar.setAttribute("aria-hidden", String(!showMob));
    }

    if (sayRect) {
      const k = Math.max(0, Math.min(1, (-sayRect.top + vh * 0.25) / (sayRect.height - vh * 0.9)));
      const n = Math.round(k * words.length * 1.08);
      for (let i = 0; i < words.length; i++) {
        words[i].classList.toggle("on", i < n);
      }
    }

    if (rowRects.length) {
      const line = vh * 0.56;
      let goIdx = -1;
      for (let i = 0; i < rowRects.length; i++) {
        if (rowRects[i].top < line) goIdx = i;
      }
      const lastDone = rowRects[rowRects.length - 1].bottom < vh * 0.32;
      for (let i = 0; i < rows.length; i++) {
        rows[i].classList.toggle("is-go", i === goIdx && !lastDone);
        rows[i].classList.toggle("is-done", i < goIdx || (lastDone && i <= goIdx));
      }
      if (sheetFill) {
        const pct = lastDone ? 1 : goIdx < 0 ? 0 : (goIdx + 0.5) / rows.length;
        sheetFill.style.transform = `scaleY(${pct.toFixed(3)})`;
      }
    }

    for (let i = 0; i < parallaxUpdates.length; i++) {
      parallaxUpdates[i][0].style.setProperty("--py", parallaxUpdates[i][1]);
    }

    // 안전장치: 감시가 늦더라도 화면 안의 것은 반드시 드러낸다
    if (forceRevealEls.length) {
      for (let i = 0; i < forceRevealEls.length; i++) {
        const el = forceRevealEls[i];
        el.classList.add("in");
        if (el.classList.contains("pill")) el.classList.add("is-lit");
        $$("[data-count]", el).forEach(count);
        if (el.classList.contains("case")) {
          const fig = $(".case__media", el);
          if (fig && !activeMediaFigs.includes(fig)) activeMediaFigs.push(fig);
        }
      }
      pendingReveals = pendingReveals.filter((el) => !el.classList.contains("in"));
    }
  }

  function onScroll() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(frame);
    }
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });

  /* ---------- Q&A: 하나 열면 나머지는 닫는다 ---------- */
  $$(".qa").forEach((d) =>
    d.addEventListener("toggle", () => {
      if (d.open) {
        $$(".qa").forEach((x) => {
          if (x !== d) x.open = false;
        });
      }
    })
  );

  /* ---------- M7: 콘솔 인스펙터 모달 ---------- */
  const modal = $("#modal");
  const panel = $("#modalPanel");
  const modalGrid = $("#modalGrid");
  const modalCover = $("#modalCover");
  const modalGallery = $("#modalGallery");
  const modalShareMsg = $("#modalShareMsg");
  let openId = null;
  let lastFocus = null;
  let currentProject = null;

  function makeImgTag(name, alt, eager) {
    const key = imgName(name);
    const [w, h] = dimsOf(key);
    return `<img src="${IMG(name)}" srcset="${srcsetOf(name)}" sizes="(max-width: 900px) 100vw, 56vw" width="${w}" height="${h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  function fillModal(p, switching) {
    currentProject = p;
    const list = currentList.some((x) => x.id === p.id) ? currentList : P;
    const i = list.findIndex((x) => x.id === p.id);

    const renderBody = () => {
      $("#modalCrumb").textContent = `CUE ${pad(i + 1)} / ${pad(list.length)}`;
      $("#modalClient").textContent = p.client;
      $("#modalTitle").textContent = p.title;
      $("#modalHook").textContent = p.hook || "";
      $("#modalSpec").innerHTML = [
        ["일시", `${p.year}.${p.month}`],
        ["발주처", p.client],
        ["분야", p.what.map((w) => WHAT[w]).join(", ")],
        ["역할", p.role]
      ]
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
        .join("");
      $("#modalSummary").textContent = p.summary;
      $("#modalPoints").innerHTML = p.points.map((x) => `<li>${esc(x)}</li>`).join("");
      if (modalShareMsg) modalShareMsg.textContent = "";

      const [firstImg, ...restImgs] = p.images;
      modalCover.innerHTML = firstImg ? makeImgTag(firstImg, `${p.title} 주요 현장 사진`, true) : "";
      modalGallery.innerHTML = restImgs
        .map((n, k) => makeImgTag(n, `${p.title} 현장 사진 ${k + 2}`, false))
        .join("");

      const prev = list[(i - 1 + list.length) % list.length];
      const next = list[(i + 1) % list.length];
      $("#modalPrev").onclick = () => switchModal(prev);
      $("#modalNext").onclick = () => switchModal(next);
      panel.scrollTop = 0;
    };

    if (switching && !reduce) {
      modalGrid.classList.add("is-switching");
      setTimeout(() => {
        renderBody();
        modalGrid.classList.remove("is-switching");
      }, 150);
    } else {
      renderBody();
    }
  }

  function switchModal(target) {
    if (!target) return;
    openId = target.id;
    history.replaceState(null, "", `#p/${encodeURIComponent(target.id)}`);
    fillModal(target, true);
  }

  function openModal(p) {
    const already = openId !== null;
    if (!already) lastFocus = document.activeElement;
    openId = p.id;
    fillModal(p, false);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    if (nav) nav.inert = true;
    if (mainEl) mainEl.inert = true;
    if (footEl) footEl.inert = true;
    if (mobBar) {
      mobBar.inert = true;
      mobBar.classList.remove("is-show");
    }
    if (!already) setTimeout(() => $("#modalClose").focus({ preventScroll: true }), 60);
  }

  function closeModal() {
    if (openId === null) return;
    openId = null;
    currentProject = null;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (nav) nav.inert = false;
    if (mainEl) mainEl.inert = false;
    if (footEl) footEl.inert = false;
    if (mobBar) mobBar.inert = false;
    if (location.hash.startsWith("#p/")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (lastFocus && document.contains(lastFocus)) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function route() {
    const m = location.hash.match(/^#p\/(.+)$/);
    const p = m && P.find((x) => x.id === decodeURIComponent(m[1]));
    p ? openModal(p) : closeModal();
  }

  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  /* 모달 포커스 트랩 & 키보드 단축키 */
  function trapFocus(container, e) {
    if (e.key !== "Tab") return;
    const focusables = $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (openId !== null) {
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowRight") $("#modalNext").click();
      else if (e.key === "ArrowLeft") $("#modalPrev").click();
      else trapFocus(panel, e);
      return;
    }
    if (nav.classList.contains("is-open")) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        burger.focus({ preventScroll: true });
      } else {
        trapFocus(nav, e);
      }
    }
  });

  /* 모바일 터치 좌우 스와이프 전환 */
  let touchStartX = 0;
  let touchStartY = 0;
  panel.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );
  panel.addEventListener(
    "touchend",
    (e) => {
      if (openId === null || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) >= 64 && Math.abs(dy) < 48) {
        if (dx < 0) $("#modalNext").click();
        else $("#modalPrev").click();
      }
    },
    { passive: true }
  );

  /* 모달 내 [이 현장처럼 문의하기] & [사례 링크 복사] */
  const fType = $("#f-type");
  const fMsg = $("#f-msg");
  const modalInquire = $("#modalInquire");
  if (modalInquire) {
    modalInquire.addEventListener("click", () => {
      const p = currentProject;
      const typeLabel = p && p.what && p.what[0] ? WHAT[p.what[0]] : "기타";
      const refTitle = p ? p.title : "";
      closeModal();
      if (fType && [...fType.options].some((o) => o.value === typeLabel)) {
        fType.value = typeLabel;
      }
      if (fMsg && refTitle) {
        fMsg.value = `[참고 사례: ${refTitle}]\n비슷한 성격의 행사를 준비 중입니다. 연출 및 운영 가능 여부를 문의드립니다.`;
      }
      if (contactSec) contactSec.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(() => {
        const fn = $("#f-name");
        if (fn) fn.focus({ preventScroll: true });
      }, reduce ? 30 : 450);
    });
  }

  const modalShare = $("#modalShare");
  if (modalShare) {
    modalShare.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        if (modalShareMsg) modalShareMsg.textContent = "사례 링크를 복사했습니다.";
      } catch (_) {
        if (modalShareMsg) modalShareMsg.textContent = "주소창의 링크를 직접 복사해 주세요.";
      }
      setTimeout(() => {
        if (modalShareMsg) modalShareMsg.textContent = "";
      }, 2200);
    });
  }

  addEventListener("hashchange", route);

  /* ---------- 문의 폼, 빠른 상황 칩, 한글 라벨 & 내용 복사 ---------- */
  const mail = S.email || "";
  const form = $("#contactForm");
  const status = $("#formStatus");
  const submitBtn = $("#submitBtn");
  const copyDraftBtn = $("#copyDraftBtn");
  const formNotice = $("#formNotice");

  if (S.form_endpoint && formNotice) formNotice.hidden = true;
  $("#mailLink").href = `mailto:${mail}`;
  $("#mailLink").textContent = mail;

  $("#mailCopy").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(mail);
      e.target.textContent = "복사했습니다";
    } catch (_) {
      e.target.textContent = "직접 복사해 주세요";
    }
    setTimeout(() => {
      e.target.textContent = "주소 복사";
    }, 1800);
  });

  $$("#quickChips button").forEach((b) =>
    b.addEventListener("click", () => {
      $$("#quickChips button").forEach((x) => x.classList.toggle("is-picked", x === b));
      if (fType && b.dataset.type) fType.value = b.dataset.type;
      if (fMsg && b.dataset.msg) fMsg.value = b.dataset.msg;
      clearFieldErr($("#f-msg"));
    })
  );

  function setFieldErr(el, msg) {
    if (!el) return;
    el.setAttribute("aria-invalid", "true");
    const errEl = $("#" + el.getAttribute("aria-describedby"));
    if (errEl) errEl.textContent = msg;
  }

  function clearFieldErr(el) {
    if (!el) return;
    el.removeAttribute("aria-invalid");
    const id = el.getAttribute("aria-describedby");
    const errEl = id ? $("#" + id) : null;
    if (errEl) errEl.textContent = "";
  }

  ["#f-name", "#f-email", "#f-msg"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("input", () => clearFieldErr(el));
  });

  function validateForm() {
    const nameEl = $("#f-name");
    const emailEl = $("#f-email");
    const msgEl = $("#f-msg");
    [nameEl, emailEl, msgEl].forEach(clearFieldErr);

    let firstBad = null;
    if (!nameEl.value.trim()) {
      setFieldErr(nameEl, "성함과 소속을 적어 주세요.");
      firstBad = firstBad || nameEl;
    }
    const emailVal = emailEl.value.trim();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setFieldErr(emailEl, "올바른 이메일 주소를 적어 주세요.");
      firstBad = firstBad || emailEl;
    }
    if (!msgEl.value.trim()) {
      setFieldErr(msgEl, "행사 개요나 고민 지점을 간단히 적어 주세요.");
      firstBad = firstBad || msgEl;
    }

    if (firstBad) {
      status.textContent = "필수 입력 항목을 확인해 주세요.";
      status.className = "form__status is-err";
      firstBad.focus();
      return false;
    }
    return true;
  }

  function buildKoreanSummary() {
    const fd = new FormData(form);
    return [
      `성함·소속: ${fd.get("name") || "-"}`,
      `답장 이메일: ${fd.get("email") || "-"}`,
      `행사 유형: ${fd.get("type") || "-"}`,
      `예정 시기: ${fd.get("when") || "미정"}`,
      `문의 내용:\n${fd.get("message") || "-"}`
    ].join("\n");
  }

  if (copyDraftBtn) {
    copyDraftBtn.addEventListener("click", async () => {
      if (!validateForm()) return;
      try {
        await navigator.clipboard.writeText(buildKoreanSummary());
        status.textContent = `작성 내용을 복사했습니다. ${mail} 주소로 붙여 넣어 보내 주세요.`;
        status.className = "form__status is-ok";
      } catch (_) {
        status.textContent = "클립보드 복사가 차단되었습니다. 내용을 직접 선택해 복사해 주세요.";
        status.className = "form__status is-err";
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const fd = new FormData(form);

    if (S.form_endpoint) {
      if (submitBtn) submitBtn.disabled = true;
      status.textContent = "문의 큐를 보내는 중입니다.";
      status.className = "form__status";
      try {
        const r = await fetch(S.form_endpoint, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" }
        });
        if (!r.ok) throw new Error(r.status);
        status.textContent = "문의 큐가 접수되었습니다. 영업일 하루 안에 답장드립니다.";
        status.className = "form__status is-ok";
        form.reset();
        $$("#quickChips button").forEach((x) => x.classList.remove("is-picked"));
      } catch (_) {
        status.textContent = `전송이 원활하지 않습니다. '작성 내용 복사' 후 ${mail}로 보내 주세요.`;
        status.className = "form__status is-err";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    } else {
      const subject = `[Creative ON 문의] ${fd.get("type")} / ${fd.get("name")}`;
      const body = buildKoreanSummary();
      location.href = `mailto:${mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = "메일 앱이 열립니다. 안 열리면 '작성 내용 복사' 버튼을 눌러 이메일로 보내 주세요.";
      status.className = "form__status is-ok";
    }
  });

  route();
  function initBelowFold() {
    initSayWords();
    renderCases(true);
  }
  if (scrollY > 40 || (location.hash && !location.hash.startsWith("#p/"))) {
    initSayWords();
    renderCases(false);
  } else {
    requestAnimationFrame(() => setTimeout(initBelowFold, 60));
    setTimeout(() => { if (pendingReveals.length && !document.hidden) onScroll(); }, 4500);
  }
})();
