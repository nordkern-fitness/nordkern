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
    contactForm: "[data-nordkern-contact-form]",
    galleryRow: ".gallery-row",
    galleryArrow: "[data-gallery-target]",
    locationPicker: ".location-picker",
    locationButton: "[data-location-button]",
    tariffInfoModal: "#tariff-info-modal",
    tariffInfoBox: ".tariff-info-box",
    tariffInfoTitle: "#tariff-info-title",
    tariffInfoText: "#tariff-info-text",
    tariffInfoClose: ".tariff-info-close",
    tariffInfoButton: ".runtime-info-button, .extra-info-button"
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

    const tariffInfoModal = document.querySelector(selectors.tariffInfoModal);

    if (tariffInfoModal && tariffInfoModal.classList.contains("show")) {
      tariffInfoModal.classList.remove("show");
      tariffInfoModal.setAttribute("aria-hidden", "true");
      body.classList.remove("modal-open");
    }
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

  const setupTariffInfoModal = () => {
    const modal = document.querySelector(selectors.tariffInfoModal);
    if (!modal) return;

    const modalBox = modal.querySelector(selectors.tariffInfoBox);
    const modalTitle = document.querySelector(selectors.tariffInfoTitle);
    const modalText = document.querySelector(selectors.tariffInfoText);
    const closeButton = document.querySelector(selectors.tariffInfoClose);
    const infoButtons = document.querySelectorAll(selectors.tariffInfoButton);

    let tariffLastFocusedElement = null;

    const openTariffModal = (title, text, trigger) => {
      if (!modal || !modalBox || !modalTitle || !modalText) return;

      tariffLastFocusedElement = trigger || document.activeElement;

      modalTitle.textContent = title || "Information";
      modalText.textContent = text || "";
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      body.classList.add("modal-open");

      activeModal = modal;

      window.setTimeout(() => {
        closeButton?.focus({ preventScroll: true });
      }, shouldReduceMotion() ? 0 : 80);
    };

    const closeTariffModal = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      body.classList.remove("modal-open");

      if (tariffLastFocusedElement && typeof tariffLastFocusedElement.focus === "function") {
        tariffLastFocusedElement.focus({ preventScroll: true });
      }

      tariffLastFocusedElement = null;

      if (activeModal === modal) {
        activeModal = null;
      }
    };

    infoButtons.forEach((button) => {
      button.addEventListener("click", () => {
        openTariffModal(
          button.dataset.infoTitle || "Information",
          button.dataset.infoText || "",
          button
        );
      });
    });

    if (closeButton) {
      closeButton.addEventListener("click", closeTariffModal);
    }

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeTariffModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!modal.classList.contains("show")) return;

      if (event.key === keys.escape) {
        closeTariffModal();
        return;
      }

      if (event.key !== keys.tab) return;

      const focusableElements = getFocusableElements(modal);
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
  setupContactForm();
  setupTariffInfoModal();
  setupGalleryDrag();
  setupGalleryArrows();
  setupLocationFallback();
  setupSmoothHashScrolling();
});
