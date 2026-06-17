/* ============================================================
   CASE — SIMULAÇÃO DE CRÉDITO · case.js
   GSAP + ScrollTrigger + Lenis · degradação graciosa
   ============================================================ */
(function () {
  "use strict";

  const docEl = document.documentElement;
  const reduced = docEl.classList.contains("motion-off");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined";

  /* ---------- básicos (funcionam sem GSAP) ---------- */
  function startClock() {
    const els = document.querySelectorAll("[data-clock]");
    if (!els.length) return;
    const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
    const update = () => { const t = fmt.format(new Date()); els.forEach((el) => (el.textContent = t)); };
    update();
    setInterval(update, 10000);
  }

  function initHeaderState() {
    const header = document.querySelector(".header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initReadingBar() {
    const bar = document.querySelector("[data-reading-bar]");
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initToTop(scrollFn) {
    const btn = document.querySelector("[data-to-top]");
    if (btn) btn.addEventListener("click", () => scrollFn(0));
  }

  function forceVisible() {
    docEl.classList.add("no-anim");
    document.querySelectorAll("[data-reveal], [data-hero]").forEach((el) => (el.style.opacity = "1"));
  }

  startClock();
  initHeaderState();
  initReadingBar();

  if (!hasGsap) {
    forceVisible();
    initToTop((t) => window.scrollTo({ top: t === 0 ? 0 : t, behavior: reduced ? "auto" : "smooth" }));
    return;
  }

  /* ---------- GSAP ---------- */
  try {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    let lenis = null;
    if (!reduced && typeof window.Lenis !== "undefined") {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const scrollTo = (target) => {
      if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -80, duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    };
    initToTop(scrollTo);

    /* split chars (CTA final) */
    function splitChars(target) {
      const text = target.textContent;
      target.textContent = "";
      const frag = document.createDocumentFragment();
      const chars = [];
      for (const ch of text) {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = ch === " " ? " " : ch;
        frag.appendChild(s);
        chars.push(s);
      }
      target.appendChild(frag);
      return chars;
    }
    const ctaGroups = [];
    document.querySelectorAll(".cnav__cta [data-split-chars]").forEach((el) => ctaGroups.push(splitChars(el)));

    if (reduced) {
      gsap.set("[data-reveal], [data-hero]", { clearProps: "all", opacity: 1 });
      gsap.set(ctaGroups.flat(), { yPercent: 0 });
    } else {
      /* ----- intro do hero ----- */
      const heroEls = gsap.utils.toArray("[data-hero]");
      gsap.set(heroEls, { autoAlpha: 0, y: 30 });
      gsap.to(heroEls, {
        autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15,
      });

      /* ----- reveals genéricos ----- */
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 38 },
          { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }
        );
      });

      /* ----- contadores ----- */
      document.querySelectorAll("[data-counter]").forEach((el) => {
        const final = parseInt(el.dataset.counter, 10) || 0;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: final, duration: 1.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => { el.textContent = Math.round(obj.v); },
        });
      });

      /* ----- CTA final ----- */
      const ctaChars = ctaGroups.flat();
      if (ctaChars.length) {
        gsap.set(ctaChars, { yPercent: 112 });
        gsap.to(ctaChars, {
          yPercent: 0, duration: 1.05, stagger: 0.022, ease: "power4.out",
          scrollTrigger: { trigger: ".cnav__cta", start: "top 88%", once: true },
        });
      }

      /* ----- parallax sutil no título do hero ----- */
      gsap.to(".chero__title", {
        yPercent: 14, ease: "none",
        scrollTrigger: { trigger: ".chero", start: "top top", end: "bottom top", scrub: true },
      });

      window.addEventListener("load", () => ScrollTrigger.refresh());
    }

    /* ----- cursor ----- */
    if (finePointer && !reduced) {
      const cursor = document.querySelector(".cursor");
      const dot = document.querySelector(".cursor__dot");
      const ring = document.querySelector(".cursor__ring");
      if (cursor && dot && ring) {
        const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2.out" });
        const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2.out" });
        const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
        const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });
        window.addEventListener("pointermove", (e) => { dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY); }, { passive: true });
        document.querySelectorAll("a, button, .compare__card, .cflow__step, .cduo__card").forEach((el) => {
          el.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
          el.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
        });
        window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
        window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
      }
    }

    /* ----- magnetic ----- */
    if (finePointer && !reduced) {
      document.querySelectorAll("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.25);
        });
        el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
      });
    }
  } catch (err) {
    console.error("[case] falha na inicialização:", err);
    forceVisible();
  }
})();
