/* ==========================================================================
   FARIS NAUFALIANTO — PORTFOLIO
   Vanilla JavaScript
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     1. Navbar: scrolled state, mobile menu closing, active link
     ------------------------------------------------------------------------ */
  var nav = document.getElementById("siteNav");
  var navMenu = document.getElementById("navMenu");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav .nav-link"));

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Close the mobile menu after choosing a link
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (navMenu && navMenu.classList.contains("show") && window.bootstrap && window.bootstrap.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
      }
    });
  });

  // Highlight the link of the section currently in view
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

  function setActive(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ------------------------------------------------------------------------
     2. Smooth scrolling fallback (CSS handles it; this keeps the URL clean
        and respects reduced motion)
     ------------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });

  /* ------------------------------------------------------------------------
     3. Reveal on scroll
     ------------------------------------------------------------------------ */
  var revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ------------------------------------------------------------------------
     4. Hero spotlight follows the pointer
     ------------------------------------------------------------------------ */
  var hero = document.getElementById("home");
  if (hero && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    var raf = null;
    hero.addEventListener("pointermove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        hero.style.setProperty("--my", (e.clientY - rect.top) + "px");
        raf = null;
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Project screenshots
        Images live next to index.html. The loader tries common extensions so
        it works whether your files are .png, .jpg, .jpeg or .webp.
     ------------------------------------------------------------------------ */
  var EXTENSIONS = ["png", "jpg", "jpeg", "webp", "PNG", "JPG", "JPEG"];

  function loadShot(img) {
    return new Promise(function (resolve) {
      var base = img.getAttribute("data-shot");
      // Name variants: browsers/OS sometimes rename "name (2)" to "name__2_" or "name_(2)"
      var names = [base,
        base.replace(/ \((\d+)\)/, "__$1_"),
        base.replace(/ \((\d+)\)/, "_($1)"),
        base.replace(/ \((\d+)\)/, "_$1")];
      names = names.filter(function (n, idx) { return names.indexOf(n) === idx; });
      var candidates = [];
      names.forEach(function (n) {
        EXTENSIONS.forEach(function (ext) { candidates.push(n + "." + ext); });
      });
      var i = 0;

      function tryNext() {
        if (i >= candidates.length) {
          img.classList.add("is-failed");
          resolve(false);
          return;
        }
        img.src = encodeURI(candidates[i++]);
      }

      img.addEventListener("load", function () {
        img.classList.add("is-loaded");
        resolve(true);
      });
      img.addEventListener("error", tryNext);
      tryNext();
    });
  }

  function getLoadedShots(card) {
    return Array.prototype.slice.call(card.querySelectorAll(".shot.is-loaded"));
  }

  function showShot(card, index) {
    var all = Array.prototype.slice.call(card.querySelectorAll(".shot"));
    var loaded = getLoadedShots(card);
    var current = loaded[index];
    if (!current) return;
    all.forEach(function (s) { s.classList.toggle("is-active", s === current); });
    card.querySelectorAll(".shot-tab").forEach(function (tab, i) {
      tab.setAttribute("aria-pressed", String(i === index));
    });
    card.dataset.current = String(index);
  }

  function buildTabs(card) {
    var tabs = card.querySelector(".shot-tabs");
    var loaded = getLoadedShots(card);
    if (!tabs || loaded.length < 2) return;

    loaded.forEach(function (img, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shot-tab";
      btn.textContent = img.getAttribute("data-label") || "Preview " + (index + 1);
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () { showShot(card, index); });
      tabs.appendChild(btn);
    });
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll(".project"));

  cards.forEach(function (card) {
    var shots = Array.prototype.slice.call(card.querySelectorAll(".shot"));
    var screen = card.querySelector(".browser__screen");

    Promise.all(shots.map(loadShot)).then(function () {
      var loaded = getLoadedShots(card);
      if (!loaded.length) {
        if (screen) screen.classList.add("is-missing");
        return;
      }
      buildTabs(card);
      showShot(card, 0);
    });

    // Clicking a screenshot opens the viewer
    shots.forEach(function (img) {
      img.addEventListener("click", function () {
        openViewer(card, Number(card.dataset.current || 0));
      });
    });

    var openBtn = card.querySelector(".js-open-shots");
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        openViewer(card, Number(card.dataset.current || 0));
      });
    }
  });

  /* ------------------------------------------------------------------------
     6. Screenshot viewer (native <dialog>)
     ------------------------------------------------------------------------ */
  var viewer = document.getElementById("viewer");
  var viewerImg = document.getElementById("viewerImg");
  var viewerTitle = document.getElementById("viewerTitle");
  var viewerTabs = viewer ? viewer.querySelector(".viewer__tabs") : null;
  var viewerClose = viewer ? viewer.querySelector(".viewer__close") : null;
  var lastTrigger = null;

  function renderViewer(card, index) {
    var loaded = getLoadedShots(card);
    var name = card.getAttribute("data-project") || "Project";

    viewerTitle.textContent = name;
    viewerTabs.innerHTML = "";

    if (!loaded.length) {
      viewerImg.removeAttribute("src");
      viewerImg.alt = "";
      viewerTitle.textContent = name + " (screenshots not found)";
      return;
    }

    var current = loaded[index] || loaded[0];
    viewerImg.src = current.currentSrc || current.src;
    viewerImg.alt = current.alt;

    if (loaded.length > 1) {
      loaded.forEach(function (img, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "shot-tab";
        btn.textContent = img.getAttribute("data-label") || "Preview " + (i + 1);
        btn.setAttribute("aria-pressed", String(img === current));
        btn.addEventListener("click", function () {
          showShot(card, i);
          renderViewer(card, i);
        });
        viewerTabs.appendChild(btn);
      });
    }
  }

  function openViewer(card, index) {
    if (!viewer || typeof viewer.showModal !== "function") return;
    lastTrigger = document.activeElement;
    renderViewer(card, index);
    viewer.showModal();
    document.body.style.overflow = "hidden";
  }

  if (viewer) {
    if (viewerClose) viewerClose.addEventListener("click", function () { viewer.close(); });

    // Click on the dark backdrop closes the viewer
    viewer.addEventListener("click", function (e) {
      if (e.target === viewer) viewer.close();
    });

    viewer.addEventListener("close", function () {
      document.body.style.overflow = "";
      if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
    });
  }
})();