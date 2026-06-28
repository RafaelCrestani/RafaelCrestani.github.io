/* ============================================================
   RAFAEL NASSIF — PORTFÓLIO 2026 · main.js
   GSAP + ScrollTrigger + Lenis · degradação graciosa
   ============================================================ */
(function () {
  "use strict";

  const docEl = document.documentElement;
  // Animações por padrão; "reduced" só com opt-out explícito via ?motion=off.
  const reduced = docEl.classList.contains("motion-off");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined";

  /* ---------- básicos que funcionam sem GSAP ---------- */

  // relógio — horário de São Paulo
  function startClock() {
    const els = document.querySelectorAll("[data-clock]");
    if (!els.length) return;
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });
    const update = () => {
      const t = fmt.format(new Date());
      els.forEach((el) => (el.textContent = t));
    };
    update();
    setInterval(update, 10000);
  }

  // toast
  let toastTimer = null;
  function toast(msg) {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 2200);
  }

  // copiar e-mail
  function initCopyEmail() {
    const btn = document.querySelector("[data-copy-email]");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const email = "rafael.nassifcrestani@gmail.com";
      try {
        await navigator.clipboard.writeText(email);
        toast("e-mail copiado ✓");
      } catch (err) {
        window.location.href = "mailto:" + email;
      }
    });
  }

  // header com fundo ao rolar
  function initHeaderState() {
    const header = document.querySelector(".header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function forceVisible() {
    docEl.classList.add("no-anim");
    const pre = document.querySelector(".preloader");
    if (pre) pre.remove();
  }

  // hero: texto que alterna entre os dois cargos (efeito morph/typewriter)
  function initRoleMorph() {
    const el = document.querySelector("[data-morph]");
    if (!el) return;
    const phrases = ["UX/UI Designer", "Product Designer"];

    // movimento reduzido: mostra os dois, estático, sem cursor animado
    if (reduced) {
      el.textContent = "UX/UI & Product Designer";
      const caret = document.querySelector(".hero__role-caret");
      if (caret) caret.style.display = "none";
      return;
    }

    const erase = 38;   // ms por caractere apagando
    const type = 60;    // ms por caractere digitando
    const hold = 2200;  // pausa com a palavra completa
    let index = 0;
    let t;

    function cycle() {
      const current = phrases[index];
      const next = phrases[(index + 1) % phrases.length];
      let i = current.length;
      (function eraseStep() {
        el.textContent = current.slice(0, i);
        if (i-- > 0) { t = setTimeout(eraseStep, erase); return; }
        let j = 0;
        (function typeStep() {
          el.textContent = next.slice(0, j);
          if (j++ < next.length) { t = setTimeout(typeStep, type); return; }
          index = (index + 1) % phrases.length;
          t = setTimeout(cycle, hold);
        })();
      })();
    }

    el.textContent = phrases[0];
    t = setTimeout(cycle, 2600); // começa após a intro do hero
  }

  startClock();
  initCopyEmail();
  initHeaderState();
  initRoleMorph();

  if (!hasGsap) {
    // CDN bloqueado: página estática, tudo visível
    forceVisible();
    initNavFallback();
    return;
  }

  function initNavFallback() {
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || !id.startsWith("#")) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    });
    const top = document.querySelector("[data-to-top]");
    if (top) top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
  }

  /* ---------- GSAP ---------- */
  try {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    /* ----- Lenis (scroll suave) ----- */
    let lenis = null;
    if (!reduced && typeof window.Lenis !== "undefined") {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    function scrollToTarget(target) {
      if (lenis) {
        lenis.scrollTo(target, { offset: -64, duration: 1.4 });
      } else {
        const el = typeof target === "string" ? document.querySelector(target) : target;
        if (el === 0 || target === 0) window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        else if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    }

    /* ----- split helpers ----- */
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

    function wrapWords(node, store) {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              frag.appendChild(document.createTextNode(" "));
            } else {
              const w = document.createElement("span");
              w.className = "word";
              const inner = document.createElement("span");
              inner.className = "word-in";
              inner.textContent = p;
              w.appendChild(inner);
              frag.appendChild(w);
              store.push(inner);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          wrapWords(child, store);
        }
      });
    }

    /* ----- menu mobile ----- */
    const menu = document.querySelector(".menu");
    const burger = document.querySelector("[data-menu-toggle]");
    let menuOpen = false;
    let menuTl = null;

    if (menu && burger) {
      const links = menu.querySelectorAll(".menu__nav a");
      const foot = menu.querySelector(".menu__foot");
      menuTl = gsap.timeline({ paused: true });
      menuTl
        .set(menu, { visibility: "visible" })
        .to(menu.querySelector(".menu__bg"), { yPercent: 101, duration: 0.6, ease: "expo.inOut" }, 0)
        .to(links, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power3.out" }, 0.32)
        .to(foot, { opacity: 1, duration: 0.4 }, 0.55);

      const setMenu = (open) => {
        menuOpen = open;
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
        menu.setAttribute("aria-hidden", String(!open));
        menu.classList.toggle("is-open", open);
        if (open) {
          menuTl.timeScale(1).play();
          if (lenis) lenis.stop();
          document.body.style.overflow = "hidden";
        } else {
          menuTl.timeScale(1.4).reverse();
          if (lenis) lenis.start();
          document.body.style.overflow = "";
        }
      };

      burger.addEventListener("click", () => setMenu(!menuOpen));
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menuOpen) setMenu(false);
      });
      menu._close = setMenu;
    }

    /* ----- navegação âncora ----- */
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        if (!id || !id.startsWith("#")) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (menuOpen && menu && menu._close) {
          menu._close(false);
          setTimeout(() => scrollToTarget(target), 450);
        } else {
          scrollToTarget(target);
        }
      });
    });
    const topBtn = document.querySelector("[data-to-top]");
    if (topBtn) topBtn.addEventListener("click", () => scrollToTarget(0));

    /* ----- preparação dos splits ----- */
    const heroCharGroups = [];
    document.querySelectorAll(".hero__title [data-split-chars]").forEach((el) => {
      heroCharGroups.push(splitChars(el));
    });
    const ctaCharGroups = [];
    document.querySelectorAll(".contact__cta [data-split-chars]").forEach((el) => {
      ctaCharGroups.push(splitChars(el));
    });

    const statementWords = [];
    const statement = document.querySelector("[data-split-words]");
    if (statement && !reduced) wrapWords(statement, statementWords);

    /* ----- estado inicial ----- */
    const heroChars = heroCharGroups.flat();
    const introEls = {
      kicker: document.querySelector("[data-hero-kicker]"),
      role: document.querySelector("[data-hero-role]"),
      desc: document.querySelector("[data-hero-desc]"),
      frame: document.querySelectorAll(".hero__frame-item"),
      bottom: document.querySelector(".hero__bottom"),
      header: document.querySelector(".header"),
      star: document.querySelector(".hero__star"),
    };

    if (!reduced) {
      gsap.set(heroChars, { yPercent: 112 });
      gsap.set(introEls.star, { autoAlpha: 0, scale: 0 });
      gsap.set([introEls.kicker, introEls.role, introEls.desc, introEls.bottom], { autoAlpha: 0, y: 26 });
      gsap.set(introEls.frame, { autoAlpha: 0 });
      gsap.set(introEls.header, { autoAlpha: 0, y: -18 });
      if (statementWords.length) gsap.set(statementWords, { display: "inline-block", yPercent: 115 });
      gsap.set(ctaCharGroups.flat(), { yPercent: 112 });
    } else {
      gsap.set("[data-reveal]", { opacity: 1 });
    }

    /* ----- preloader + intro ----- */
    const preloader = document.querySelector(".preloader");
    const countEl = document.querySelector("[data-preloader-count]");
    const barEl = document.querySelector("[data-preloader-bar]");

    function heroIntro() {
      if (reduced) return;
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.to(introEls.header, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.1)
        .to(heroCharGroups[0] || [], { yPercent: 0, duration: 1.15, stagger: 0.034 }, 0.05)
        .to(heroCharGroups[1] || [], { yPercent: 0, duration: 1.15, stagger: 0.034 }, 0.17)
        .to(introEls.star, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(2.2)" }, 0.85)
        .to(introEls.kicker, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.5)
        .to([introEls.role, introEls.desc], { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.62)
        .to(introEls.frame, { autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 0.8)
        .to(introEls.bottom, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.9);
      return tl;
    }

    function hidePreloader() {
      if (!preloader) {
        heroIntro();
        return;
      }
      gsap.timeline()
        .to(preloader.querySelector(".preloader__inner"), { autoAlpha: 0, y: -30, duration: 0.45, ease: "power2.in" })
        .to(preloader, { yPercent: -100, duration: 0.75, ease: "expo.inOut" }, "-=0.1")
        .add(() => {
          preloader.remove();
          heroIntro();
        }, "-=0.45");
    }

    if (preloader && countEl && !reduced) {
      const counter = { v: 0 };
      const fontsReady = Promise.race([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise((res) => setTimeout(res, 1600)),
      ]);
      const countDone = new Promise((res) => {
        gsap.to(counter, {
          v: 100,
          duration: 1.05,
          ease: "power2.inOut",
          onUpdate: () => {
            countEl.textContent = Math.round(counter.v);
            if (barEl) barEl.style.transform = "scaleX(" + counter.v / 100 + ")";
          },
          onComplete: res,
        });
      });
      Promise.all([countDone, fontsReady]).then(hidePreloader);
    } else {
      if (preloader) preloader.remove();
      if (reduced) {
        gsap.set(
          [heroChars, ctaCharGroups.flat(), introEls.kicker, introEls.role, introEls.desc, introEls.bottom, introEls.header, introEls.star],
          { clearProps: "all" }
        );
        gsap.set(introEls.frame, { clearProps: "all" });
      } else {
        heroIntro();
      }
    }

    /* ----- scroll reveals ----- */
    function fmtCounter(v) {
      return v < 10 ? "0" + v : String(v);
    }
    function setCountersFinal() {
      document.querySelectorAll("[data-counter]").forEach((el) => {
        el.textContent = fmtCounter(parseInt(el.dataset.counter, 10) || 0);
      });
    }
    if (reduced) setCountersFinal();

    if (window.ScrollTrigger && !reduced) {
      // genérico
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 38 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            clearProps: "transform", // preserva transforms de :hover do CSS após o reveal
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });

      // frase de impacto — palavra a palavra
      if (statementWords.length) {
        gsap.to(statementWords, {
          yPercent: 0,
          duration: 0.9,
          stagger: 0.028,
          ease: "power4.out",
          scrollTrigger: { trigger: statement, start: "top 82%", once: true },
        });
      }

      // contadores
      document.querySelectorAll("[data-counter]").forEach((el) => {
        const final = parseInt(el.dataset.counter, 10) || 0;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: final,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = fmtCounter(Math.round(obj.v));
          },
        });
      });

      // CTA do contato
      const ctaChars = ctaCharGroups.flat();
      if (ctaChars.length) {
        gsap.to(ctaChars, {
          yPercent: 0,
          duration: 1.05,
          stagger: 0.022,
          ease: "power4.out",
          scrollTrigger: { trigger: ".contact__cta", start: "top 86%", once: true },
        });
      }

      // parallax do hero
      gsap.to(".hero__content", {
        yPercent: -9,
        autoAlpha: 0.25,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".hero__canvas", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });

      window.addEventListener("load", () => ScrollTrigger.refresh());
    } else if (!reduced) {
      // sem ScrollTrigger: mostra tudo
      gsap.set("[data-reveal]", { autoAlpha: 1 });
      if (statementWords.length) gsap.set(statementWords, { yPercent: 0 });
      gsap.set(ctaCharGroups.flat(), { yPercent: 0 });
      setCountersFinal();
    }

    /* ----- cursor custom ----- */
    if (finePointer && !reduced) {
      const cursor = document.querySelector(".cursor");
      const dot = document.querySelector(".cursor__dot");
      const ring = document.querySelector(".cursor__ring");
      if (cursor && dot && ring) {
        const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power2.out" });
        const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power2.out" });
        const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
        const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

        window.addEventListener("pointermove", (e) => {
          dotX(e.clientX); dotY(e.clientY);
          ringX(e.clientX); ringY(e.clientY);
        }, { passive: true });

        const hoverables = "a, button, .xp__row, .case, .token";
        document.querySelectorAll(hoverables).forEach((el) => {
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

    /* ----- tilt nos cases ----- */
    if (finePointer && !reduced && window.innerWidth > 880) {
      document.querySelectorAll("[data-tilt]").forEach((el) => {
        gsap.set(el, { transformPerspective: 900 });
        const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
        const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          rx(py * -5);
          ry(px * 5);
        });
        el.addEventListener("pointerleave", () => { rx(0); ry(0); });
      });
    }

    /* ----- parallax interno do retrato (Sobre) ----- */
    const portraitImg = document.querySelector(".portrait__img");
    if (window.ScrollTrigger && !reduced && portraitImg) {
      gsap.fromTo(
        portraitImg,
        { yPercent: -2.5, scale: 1.06 },
        {
          yPercent: 2.5, scale: 1.06, ease: "none",
          scrollTrigger: { trigger: ".portrait", start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    }
  } catch (err) {
    console.error("[portfólio] falha na inicialização das animações:", err);
    forceVisible();
  }
})();
