document.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const brand = {
    name: "Nordkern Fitness",
    contactEmail: "info@nordkern-fitness.de"
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
    contactForm: "[data-nordkern-contact-form]"
  };

  const keys = {
    escape: "Escape",
    tab: "Tab"
  };

  const shouldReduceMotion = () => prefersReducedMotion.matches;

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

  const getCurrentPage = () => {
    const page = window.location.pathname.split("/").pop();
    return page || "index.html";
  };

  const normalizePageHref = (href) => {
    if (!href) return "";

    try {
      const url = new URL(href, window.location.href);
      const page = url.pathname.split("/").pop();

      return page || "index.html";
    } catch (error) {
      return href.split("#")[0].split("?")[0] || "index.html";
    }
  };

  const setActiveNavLink = () => {
    const currentPage = getCurrentPage();
    const links = document.querySelectorAll(selectors.navLink);

    links.forEach((link) => {
      const href = link.getAttribute("href");
      const linkPage = normalizePageHref(href);
      const isActive = linkPage === currentPage;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

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

  const closeMobileMenu = () => {
    setMenuState(false);
  };

  const setupMobileMenu = () => {
    if (!burger || !nav) return;

    burger.addEventListener("click", () => {
      const isOpen = nav.classList.contains("open");
      setMenuState(!isOpen);
    });

    nav.querySelectorAll("a").forEach((link) => {
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
    let ticking = false;

    const updateHeaderScrollState = () => {
      const scrollY = window.scrollY;

      if (!headerIsScrolled && scrollY > 24) {
        headerIsScrolled = true;
        headerInner.classList.add("scrolled");
      } else if (headerIsScrolled && scrollY < 6) {
        headerIsScrolled = false;
        headerInner.classList.remove("scrolled");
      }

      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(updateHeaderScrollState);
    };

    updateHeaderScrollState();
    window.addEventListener("scroll", requestUpdate, { passive: true });
  };

  const isInternalPageLink = (link) => {
    if (!link) return false;

    const href = link.getAttribute("href");

    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:")) return false;
    if (href.startsWith("tel:")) return false;
    if (href.startsWith("sms:")) return false;
    if (href.startsWith("javascript:")) return false;
    if (link.target === "_blank") return false;
    if (link.hasAttribute("download")) return false;

    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin;
    } catch (error) {
      return true;
    }
  };

  const getSamePageHashTarget = (href) => {
    if (!href || !href.includes("#")) return null;

    try {
      const targetUrl = new URL(href, window.location.href);
      const isSamePage =
        targetUrl.origin === window.location.origin &&
        targetUrl.pathname === window.location.pathname &&
        targetUrl.search === window.location.search &&
        targetUrl.hash.length > 1;

      if (!isSamePage) return null;

      return document.querySelector(targetUrl.hash);
    } catch (error) {
      return null;
    }
  };

  const scrollToHashTarget = (target, hash) => {
    if (!target) return;

    target.scrollIntoView({
      behavior: shouldReduceMotion() ? "auto" : "smooth",
      block: "start"
    });

    if (hash) {
      history.pushState(null, "", hash);
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

        const samePageHashTarget = getSamePageHashTarget(href);

        if (samePageHashTarget) {
          event.preventDefault();
          closeMobileMenu();

          const targetUrl = new URL(href, window.location.href);
          scrollToHashTarget(samePageHashTarget, targetUrl.hash);

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

    const openModals = Array.from(document.querySelectorAll(selectors.modal)).filter((item) =>
      item.classList.contains("show")
    );

    if (openModals.length === 0) {
      body.classList.remove("modal-open");
      activeModal = null;

      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus({ preventScroll: true });
      }

      lastFocusedElement = null;
    }
  };

  const closeAllModals = () => {
    document.querySelectorAll(selectors.modal).forEach((modal) => closeModal(modal));

    document.querySelectorAll("[aria-hidden='false'].show").forEach((modal) => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    });

    body.classList.remove("modal-open");
    activeModal = null;
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

  const setupGenericModals = () => {
    const modalTriggers = document.querySelectorAll(selectors.modalTrigger);
    const modalCloseButtons = document.querySelectorAll(selectors.modalClose);
    const modals = document.querySelectorAll(selectors.modal);

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

  const setupContactForm = () => {
    const contactForm = document.querySelector(selectors.contactForm);
    if (!contactForm) return;

    const errorBox = document.getElementById("contact-error-box");
    const messageField = document.getElementById("contact-message");
    const messageCount = document.getElementById("message-count");

    const fields = {
      firstName: document.getElementById("contact-firstname"),
      lastName: document.getElementById("contact-lastname"),
      email: document.getElementById("contact-email"),
      postal: document.getElementById("contact-postal"),
      street: document.getElementById("contact-street"),
      topic: document.getElementById("contact-topic"),
      memberId: document.getElementById("contact-memberid"),
      message: document.getElementById("contact-message")
    };

    const setFieldState = (field, isInvalid) => {
      if (!field) return;

      if (isInvalid) {
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    };

    const resetFieldStates = () => {
      Object.values(fields).forEach((field) => setFieldState(field, false));
    };

    const showErrors = (errors) => {
      if (!errorBox) return;

      if (!errors.length) {
        errorBox.classList.remove("show");
        errorBox.textContent = "";
        return;
      }

      const errorText = errors.map((error) => `• ${error.message}`).join("\n");

      errorBox.textContent = `Bitte prüfe deine Angaben:\n${errorText}`;
      errorBox.classList.add("show");

      errorBox.scrollIntoView({
        behavior: shouldReduceMotion() ? "auto" : "smooth",
        block: "center"
      });
    };

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    const isValidPostalCode = (value) => /^[0-9]{5}$/.test(value);
    const isValidStreet = (value) => /^[A-Za-zÄÖÜäöüß0-9 .,'’\-\/]{2,90}$/.test(value);
    const isValidMemberId = (value) => /^[A-Za-z]{2}-[0-9]{5}$/.test(value);

    const validateForm = () => {
      const errors = [];

      resetFieldStates();

      const firstName = fields.firstName?.value.trim() || "";
      const lastName = fields.lastName?.value.trim() || "";
      const email = fields.email?.value.trim() || "";
      const postal = fields.postal?.value.trim() || "";
      const street = fields.street?.value.trim() || "";
      const topic = fields.topic?.value.trim() || "";
      const memberId = fields.memberId?.value.trim() || "";
      const messageText = fields.message?.value.trim() || "";

      if (firstName.length < 2) {
        errors.push({
          field: fields.firstName,
          message: "Vorname fehlt oder ist zu kurz."
        });
      }

      if (lastName.length < 2) {
        errors.push({
          field: fields.lastName,
          message: "Nachname fehlt oder ist zu kurz."
        });
      }

      if (!email || !isValidEmail(email)) {
        errors.push({
          field: fields.email,
          message: "E-Mail fehlt oder ist nicht gültig."
        });
      }

      if (!topic) {
        errors.push({
          field: fields.topic,
          message: "Bitte wähle ein Thema aus."
        });
      }

      if (!messageText) {
        errors.push({
          field: fields.message,
          message: "Nachricht fehlt."
        });
      }

      if (postal && !isValidPostalCode(postal)) {
        errors.push({
          field: fields.postal,
          message: "Postleitzahl muss aus genau 5 Zahlen bestehen."
        });
      }

      if (street && !isValidStreet(street)) {
        errors.push({
          field: fields.street,
          message: "Straße und Hausnummer enthalten Zeichen, die nicht passen."
        });
      }

      if (memberId && !isValidMemberId(memberId)) {
        errors.push({
          field: fields.memberId,
          message: "Member-ID muss so aussehen: NK-12345."
        });
      }

      if (!isValidEmail(brand.contactEmail)) {
        errors.push({
          field: fields.message,
          message: "Kontakt-E-Mail ist noch nicht korrekt hinterlegt."
        });
      }

      errors.forEach((error) => setFieldState(error.field, true));

      return errors;
    };

    const autoResizeTextarea = () => {
      if (!messageField) return;

      messageField.style.height = "auto";
      messageField.style.height = `${messageField.scrollHeight}px`;
    };

    const updateCounter = () => {
      if (!messageField || !messageCount) return;

      messageCount.textContent = String(messageField.value.length);
    };

    const liveValidate = () => {
      if (!errorBox || !errorBox.classList.contains("show")) return;

      const errors = validateForm();
      showErrors(errors);
    };

    Object.values(fields).forEach((field) => {
      if (!field) return;

      field.addEventListener("input", liveValidate);
      field.addEventListener("change", liveValidate);
    });

    if (messageField) {
      autoResizeTextarea();
      updateCounter();

      messageField.addEventListener("input", () => {
        autoResizeTextarea();
        updateCounter();
      });
    }

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const errors = validateForm();

      if (errors.length) {
        showErrors(errors);

        const firstInvalidField = errors[0].field;
        if (firstInvalidField) {
          firstInvalidField.focus({ preventScroll: true });
        }

        return;
      }

      showErrors([]);

      const formData = new FormData(contactForm);

      const firstName = String(formData.get("contact-firstname") || "").trim();
      const lastName = String(formData.get("contact-lastname") || "").trim();
      const email = String(formData.get("contact-email") || "").trim();
      const postal = String(formData.get("contact-postal") || "").trim() || "Nicht angegeben";
      const street = String(formData.get("contact-street") || "").trim() || "Nicht angegeben";
      const topic = String(formData.get("contact-topic") || "").trim();
      const memberId = String(formData.get("contact-memberid") || "").trim() || "Nicht angegeben";
      const message = String(formData.get("contact-message") || "").trim();

      const sentAt = new Date().toLocaleString("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      const subject = encodeURIComponent(
        `${brand.name} Kontaktformular – ${topic} – ${firstName} ${lastName}`
      );

      const bodyText = [
        "NORDKERN FITNESS KONTAKTANFRAGE",
        "==================================================",
        "",
        "ÜBERSICHT",
        "--------------------------------------------------",
        `Eingang über: ${brand.name} Website`,
        `Zeitpunkt: ${sentAt}`,
        `Thema: ${topic}`,
        "Status: Neu",
        "",
        "KONTAKTDATEN",
        "--------------------------------------------------",
        `Name: ${firstName} ${lastName}`,
        `E-Mail für Rückantwort: ${email}`,
        `Postleitzahl: ${postal}`,
        `Straße und Hausnummer: ${street}`,
        `Member-ID: ${memberId}`,
        "",
        "NACHRICHT",
        "--------------------------------------------------",
        message,
        "",
        "==================================================",
        "INTERNER HINWEIS",
        "Bitte bei der Antwort die oben angegebene E-Mail-Adresse nutzen.",
        `Diese Anfrage wurde über das ${brand.name} Kontaktformular vorbereitet.`
      ].join("\n");

      window.location.href =
        `mailto:${brand.contactEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    });
  };

  const setupInitialHashScroll = () => {
    if (!window.location.hash) return;

    const target = document.querySelector(window.location.hash);
    if (!target) return;

    window.setTimeout(() => {
      scrollToHashTarget(target, window.location.hash);
    }, shouldReduceMotion() ? 0 : 140);
  };

  setActiveNavLink();
  runPageEnterAnimation();
  setupMobileMenu();
  setupHeaderScrollState();
  setupPageTransitions();
  setupGenericModals();
  setupGlobalKeyboardShortcuts();
  setupContactForm();
  setupInitialHashScroll();
});
