document.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const brand = {
    name: "Nordkern Fitness",
    contactEmail: "info@nordkern-fitness.de",
    fallbackLocationName: "Nordkern Fitness Standort"
  };

  const selectors = {
    headerSlot: "[data-header]",
    footerSlot: "[data-footer]",
    navLink: ".nav-link",
    siteHeaderInner: ".site-header-inner",
    burger: "#burger",
    siteNav: ".site-nav",
    modal: ".modal",
    modalTrigger: "[data-modal-target]",
    modalClose: ".modal-close",
    contactFallbackForm: "[data-nordkern-contact-form]",
    galleryRow: ".gallery-row",
    galleryArrow: "[data-gallery-target]",
    locationPicker: ".location-picker",
    locationButton: "[data-location-button]"
  };

  const keys = {
    escape: "Escape",
    tab: "Tab"
  };

  const componentFiles = [
    {
      selector: selectors.headerSlot,
      file: "components/header.html"
    },
    {
      selector: selectors.footerSlot,
      file: "components/footer.html"
    }
  ];

  const loadComponent = async (selector, file) => {
    const target = document.querySelector(selector);
    if (!target) return;

    try {
      const response = await fetch(file);

      if (!response.ok) {
        throw new Error(`Komponente konnte nicht geladen werden: ${file}`);
      }

      target.innerHTML = await response.text();
    } catch (error) {
      console.error(error);
    }
  };

  await Promise.all(
    componentFiles.map((component) => loadComponent(component.selector, component.file))
  );

  const headerInner = document.querySelector(selectors.siteHeaderInner);
  const burger = document.querySelector(selectors.burger);
  const nav = document.querySelector(selectors.siteNav);
  const navLinks = document.querySelectorAll(".site-nav a");
  const modals = document.querySelectorAll(selectors.modal);
  const modalTriggers = document.querySelectorAll(selectors.modalTrigger);
  const modalCloseButtons = document.querySelectorAll(selectors.modalClose);

  const getCurrentPage = () => {
    const page = window.location.pathname.split("/").pop();
    return page || "index.html";
  };

  const setActiveNavLink = () => {
    const currentPage = getCurrentPage();
    const links = document.querySelectorAll(selectors.navLink);

    links.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = href === currentPage;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  setActiveNavLink();

  const shouldReduceMotion = () => prefersReducedMotion.matches;

  const runPageEnterAnimation = () => {
    if (shouldReduceMotion()) {
      body.classList.remove("page-enter", "page-leaving");
      body.classList.add("page-ready");
      return;
    }

    body.classList.add("page-enter");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        body.classList.add("page-ready");
        body.classList.remove("page-enter");
      });
    });
  };

  runPageEnterAnimation();

  const isInternalPageLink = (link) => {
    if (!link) return false;

    const href = link.getAttribute("href");

    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:")) return false;
    if (href.startsWith("tel:")) return false;
    if (href.startsWith("sms:")) return false;
    if (href.startsWith("http://")) return false;
    if (href.startsWith("https://")) return false;
    if (href.startsWith("javascript:")) return false;
    if (link.target === "_blank") return false;
    if (link.hasAttribute("download")) return false;

    return true;
  };

  const isSamePageHashLink = (link) => {
    if (!link) return false;

    const href = link.getAttribute("href");
    if (!href || !href.includes("#")) return false;

    try {
      const targetUrl = new URL(href, window.location.href);

      return (
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetUrl.hash.length > 1
      );
    } catch (error) {
      return false;
    }
  };

  const setupPageTransitions = () => {
    document.querySelectorAll("a").forEach((link) => {
      if (!isInternalPageLink(link)) return;

      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (!href) return;
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        if (isSamePageHashLink(link)) {
          return;
        }

        event.preventDefault();
        closeMobileMenu();

        if (shouldReduceMotion()) {
          window.location.href = href;
          return;
        }

        body.classList.add("page-leaving");

        window.setTimeout(() => {
          window.location.href = href;
        }, 160);
      });
    });

    window.addEventListener("pageshow", () => {
      body.classList.remove("page-leaving");

      if (shouldReduceMotion()) {
        body.classList.add("page-ready");
      }
    });
  };

  const setMenuState = (isOpen) => {
    if (!burger || !nav) return;

    burger.classList.toggle("is-active", isOpen);
    nav.classList.toggle("open", isOpen);
    body.classList.toggle("nav-open", isOpen);

    burger.setAttribute("aria-expanded", String(isOpen));
    burger.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");

    if (isOpen) {
      const activeLink = nav.querySelector(".nav-link.active");
      const firstLink = nav.querySelector("a");

      window.setTimeout(() => {
        (activeLink || firstLink)?.focus({ preventScroll: true });
      }, shouldReduceMotion() ? 0 : 120);
    }
  };

  function closeMobileMenu() {
    setMenuState(false);
  }

  const setupMobileMenu = () => {
    if (!burger || !nav) return;

    burger.addEventListener("click", () => {
      const isOpen = nav.classList.contains("open");
      setMenuState(!isOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeMobileMenu();
      }
    });
  };

  const setupHeaderScrollState = () => {
    if (!headerInner) return;

    let headerIsScrolled = false;

    const updateHeaderScrollState = () => {
      const scrollY = window.scrollY;

      if (!headerIsScrolled && scrollY > 24) {
        headerIsScrolled = true;
        headerInner.classList.add("scrolled");
      } else if (headerIsScrolled && scrollY < 6) {
        headerIsScrolled = false;
        headerInner.classList.remove("scrolled");
      }
    };

    updateHeaderScrollState();
    window.addEventListener("scroll", updateHeaderScrollState, { passive: true });
  };

  const getFocusableElements = (root) => {
    if (!root) return [];

    return Array.from(
      root.querySelectorAll(
        [
          "a[href]",
          "button:not([disabled])",
          "textarea:not([disabled])",
          "input:not([disabled])",
          "select:not([disabled])",
          "[tabindex]:not([tabindex='-1'])"
        ].join(",")
      )
    ).filter((element) => {
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden";
    });
  };

  let activeModal = null;
  let lastFocusedElement = null;

  const openModal = (modal, trigger = null) => {
    if (!modal) return;

    lastFocusedElement = trigger || document.activeElement;
    activeModal = modal;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");

    const closeButton = modal.querySelector(selectors.modalClose);
    const focusableElements = getFocusableElements(modal);

    window.setTimeout(() => {
      (closeButton || focusableElements[0] || modal).focus({ preventScroll: true });
    }, shouldReduceMotion() ? 0 : 80);
  };

  const closeModal = (modal) => {
    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    const anyOpenModal = Array.from(modals).some((item) => item.classList.contains("show"));

    if (!anyOpenModal) {
      body.classList.remove("modal-open");
      activeModal = null;

      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus({ preventScroll: true });
      }

      lastFocusedElement = null;
    }
  };

  const closeAllModals = () => {
    modals.forEach((modal) => closeModal(modal));
  };

  const trapModalFocus = (event) => {
    if (!activeModal || event.key !== keys.tab) return;

    const focusableElements = getFocusableElements(activeModal);
    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const setupModals = () => {
    modalTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const modalId = trigger.getAttribute("data-modal-target");
        const modal = document.getElementById(modalId);

        openModal(modal, trigger);
      });
    });

    modalCloseButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const modal = button.closest(selectors.modal);
        closeModal(modal);
      });
    });

    modals.forEach((modal) => {
      modal.setAttribute("aria-hidden", modal.classList.contains("show") ? "false" : "true");

      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          closeModal(modal);
        }
      });
    });
  };

  const setupGlobalKeyboardShortcuts = () => {
    document.addEventListener("keydown", (event) => {
      if (event.key === keys.escape) {
        closeMobileMenu();
        closeAllModals();
      }

      trapModalFocus(event);
    });
  };

  const setupContactFallbackForm = () => {
    const contactForm = document.querySelector(selectors.contactFallbackForm);

    if (!contactForm) return;

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);

      const firstName = String(formData.get("contact-firstname") || "").trim();
      const lastName = String(formData.get("contact-lastname") || "").trim();
      const email = String(formData.get("contact-email") || "").trim();
      const topic = String(formData.get("contact-topic") || "").trim();
      const memberId = String(formData.get("contact-memberid") || "").trim();
      const message = String(formData.get("contact-message") || "").trim();

      const subject = encodeURIComponent(
        `${brand.name} Kontakt – ${topic || "Allgemeine Anfrage"}`
      );

      const bodyText = [
        "NORDKERN FITNESS KONTAKTANFRAGE",
        "==================================================",
        "",
        "KONTAKTDATEN",
        "--------------------------------------------------",
        `Vorname: ${firstName}`,
        `Nachname: ${lastName}`,
        `E-Mail für Rückantwort: ${email}`,
        `Thema: ${topic || "Nicht angegeben"}`,
        `Member-ID: ${memberId || "Nicht angegeben"}`,
        "",
        "NACHRICHT",
        "--------------------------------------------------",
        message
      ].join("\n");

      window.location.href =
        `mailto:${brand.contactEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    });
  };

  const setupGalleryDrag = () => {
    const galleryRows = document.querySelectorAll(selectors.galleryRow);

    galleryRows.forEach((row) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      row.addEventListener("mousedown", (event) => {
        isDown = true;
        row.classList.add("is-dragging");
        startX = event.pageX - row.offsetLeft;
        scrollLeft = row.scrollLeft;
      });

      row.addEventListener("mouseleave", () => {
        isDown = false;
        row.classList.remove("is-dragging");
      });

      row.addEventListener("mouseup", () => {
        isDown = false;
        row.classList.remove("is-dragging");
      });

      row.addEventListener("mousemove", (event) => {
        if (!isDown) return;

        event.preventDefault();

        const x = event.pageX - row.offsetLeft;
        const walk = (x - startX) * 1.4;
        row.scrollLeft = scrollLeft - walk;
      });
    });
  };

  const setupGalleryArrows = () => {
    const galleryArrows = document.querySelectorAll(selectors.galleryArrow);

    galleryArrows.forEach((arrow) => {
      arrow.addEventListener("click", () => {
        const targetId = arrow.getAttribute("data-gallery-target");
        const direction = arrow.getAttribute("data-gallery-direction");
        const row = document.getElementById(targetId);

        if (!row) return;

        const scrollAmount = Math.min(row.clientWidth * 0.85, 460);

        row.scrollBy({
          left: direction === "next" ? scrollAmount : -scrollAmount,
          behavior: shouldReduceMotion() ? "auto" : "smooth"
        });
      });
    });
  };

  const setupLocationFallback = () => {
    const locationPicker = document.querySelector(selectors.locationPicker);
    const locationButtons = document.querySelectorAll(selectors.locationButton);

    if (!locationButtons.length) return;

    const elements = {
      image: document.getElementById("location-image"),
      imageLabel: document.getElementById("location-image-label"),
      status: document.getElementById("location-status"),
      line: document.getElementById("location-line"),
      name: document.getElementById("location-name"),
      title: document.getElementById("location-title"),
      description: document.getElementById("location-description"),
      factStatus: document.getElementById("fact-status"),
      factAccess: document.getElementById("fact-access"),
      factAreas: document.getElementById("fact-areas"),
      factBooking: document.getElementById("fact-booking"),
      mapTitle: document.getElementById("map-title"),
      mapStatus: document.getElementById("map-status"),
      map: document.getElementById("location-map")
    };

    const updateLocation = (button) => {
      if (!button) return;
      if (button.getAttribute("aria-disabled") === "true") return;

      locationButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      const data = button.dataset;

      if (elements.image) {
        elements.image.src = data.image || "";
        elements.image.alt = data.name || brand.fallbackLocationName;
      }

      if (elements.imageLabel) elements.imageLabel.textContent = data.name || "";
      if (elements.status) elements.status.textContent = data.status || "";
      if (elements.line) elements.line.textContent = data.locationLine || "";
      if (elements.name) elements.name.textContent = data.name || "";
      if (elements.title) elements.title.textContent = data.title || "";
      if (elements.description) elements.description.textContent = data.description || "";

      if (elements.factStatus) elements.factStatus.textContent = data.status || "";
      if (elements.factAccess) elements.factAccess.textContent = data.access || "";
      if (elements.factAreas) elements.factAreas.textContent = data.areas || "";
      if (elements.factBooking) elements.factBooking.textContent = data.booking || "";

      if (elements.mapTitle) elements.mapTitle.textContent = data.name || "";
      if (elements.mapStatus) elements.mapStatus.textContent = data.status || "";

      if (elements.map && data.map) {
        elements.map.src = data.map;
        elements.map.title = `Karte: ${data.name || brand.fallbackLocationName}`;
      }

      button.scrollIntoView({
        behavior: shouldReduceMotion() ? "auto" : "smooth",
        block: "nearest",
        inline: "center"
      });
    };

    locationButtons.forEach((button) => {
      button.addEventListener("click", () => updateLocation(button));
    });

    if (locationPicker) {
      const activeLocation = locationPicker.querySelector(".location-choice.is-active");

      window.setTimeout(() => {
        if (!activeLocation) return;

        activeLocation.scrollIntoView({
          behavior: shouldReduceMotion() ? "auto" : "smooth",
          block: "nearest",
          inline: "center"
        });
      }, shouldReduceMotion() ? 0 : 120);
    }
  };

  const setupSmoothHashScrolling = () => {
    document.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: shouldReduceMotion() ? "auto" : "smooth",
          block: "start"
        });

        history.pushState(null, "", href);
      });
    });
  };

  setupPageTransitions();
  setupMobileMenu();
  setupHeaderScrollState();
  setupModals();
  setupGlobalKeyboardShortcuts();
  setupContactFallbackForm();
  setupGalleryDrag();
  setupGalleryArrows();
  setupLocationFallback();
  setupSmoothHashScrolling();
});
