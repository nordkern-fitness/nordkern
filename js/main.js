document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const headerInner = document.querySelector(".site-header-inner");
  const burger = document.getElementById("burger");
  const nav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll(".site-nav a");
  const modals = document.querySelectorAll(".modal");
  const modalTriggers = document.querySelectorAll("[data-modal-target]");
  const modalCloseButtons = document.querySelectorAll(".modal-close");

  /* Seitenwechsel-Animation */

  body.classList.add("page-enter");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      body.classList.add("page-ready");
      body.classList.remove("page-enter");
    });
  });

  const isInternalPageLink = (link) => {
    if (!link) return false;

    const href = link.getAttribute("href");

    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:")) return false;
    if (href.startsWith("tel:")) return false;
    if (href.startsWith("http://")) return false;
    if (href.startsWith("https://")) return false;
    if (link.target === "_blank") return false;

    return true;
  };

  document.querySelectorAll("a").forEach((link) => {
    if (!isInternalPageLink(link)) return;

    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();

      body.classList.add("page-leaving");

      window.setTimeout(() => {
        window.location.href = href;
      }, 160);
    });
  });

  window.addEventListener("pageshow", () => {
    body.classList.remove("page-leaving");
  });

  /* Mobile-Menü */

  const setMenuState = (isOpen) => {
    if (!burger || !nav) return;

    burger.classList.toggle("is-active", isOpen);
    nav.classList.toggle("open", isOpen);
    body.classList.toggle("nav-open", isOpen);

    burger.setAttribute("aria-expanded", String(isOpen));
    burger.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");
  };

  const closeMobileMenu = () => setMenuState(false);

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const isOpen = nav.classList.contains("open");
      setMenuState(!isOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
        closeAllModals();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeMobileMenu();
      }
    });
  }

  /* Header beim Scrollen */

  let headerIsScrolled = false;

  const updateHeaderScrollState = () => {
    if (!headerInner) return;

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

  /* Modals */

  const openModal = (modal) => {
    if (!modal) return;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");

    const closeButton = modal.querySelector(".modal-close");
    if (closeButton) closeButton.focus();
  };

  const closeModal = (modal) => {
    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
  };

  function closeAllModals() {
    modals.forEach((modal) => closeModal(modal));
  }

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const modalId = trigger.getAttribute("data-modal-target");
      const modal = document.getElementById(modalId);
      openModal(modal);
    });
  });

  modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      closeModal(modal);
    });
  });

  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  /* Kontaktformular – ältere Variante als Fallback */

  const contactForm = document.querySelector("[data-nordfit-contact-form]");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);

      const firstName = formData.get("contact-firstname") || "";
      const lastName = formData.get("contact-lastname") || "";
      const email = formData.get("contact-email") || "";
      const phone = formData.get("contact-phone") || "";
      const topic = formData.get("contact-topic") || "";
      const memberId = formData.get("contact-memberid") || "";
      const message = formData.get("contact-message") || "";

      const subject = encodeURIComponent(`NordFit Kontakt – ${topic || "Allgemeine Anfrage"}`);

      const bodyText = [
        `Vorname: ${firstName}`,
        `Nachname: ${lastName}`,
        `E-Mail: ${email}`,
        `Telefon: ${phone || "Nicht angegeben"}`,
        `Thema: ${topic}`,
        `Member ID: ${memberId || "Nicht angegeben"}`,
        "",
        "Nachricht:",
        message
      ].join("\n");

      window.location.href =
        `mailto:nordgroup.business@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    });
  }

  /* Galerie ziehen */

  const galleryRows = document.querySelectorAll(".gallery-row");

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

  const galleryArrows = document.querySelectorAll("[data-gallery-target]");

  galleryArrows.forEach((arrow) => {
    arrow.addEventListener("click", () => {
      const targetId = arrow.getAttribute("data-gallery-target");
      const direction = arrow.getAttribute("data-gallery-direction");
      const row = document.getElementById(targetId);

      if (!row) return;

      const scrollAmount = Math.min(row.clientWidth * 0.85, 460);

      row.scrollBy({
        left: direction === "next" ? scrollAmount : -scrollAmount,
        behavior: "smooth"
      });
    });
  });

  /* Alte Standort-Logik als Fallback */

  const locationPicker = document.querySelector(".location-picker");
  const locationButtons = document.querySelectorAll("[data-location-button]");

  const locationImage = document.getElementById("location-image");
  const locationImageLabel = document.getElementById("location-image-label");
  const locationStatus = document.getElementById("location-status");
  const locationLine = document.getElementById("location-line");
  const locationName = document.getElementById("location-name");
  const locationTitle = document.getElementById("location-title");
  const locationDescription = document.getElementById("location-description");

  const factStatus = document.getElementById("fact-status");
  const factAccess = document.getElementById("fact-access");
  const factAreas = document.getElementById("fact-areas");
  const factBooking = document.getElementById("fact-booking");

  const mapTitle = document.getElementById("map-title");
  const mapStatus = document.getElementById("map-status");
  const locationMap = document.getElementById("location-map");

  const updateLocation = (button) => {
    if (!button) return;
    if (button.getAttribute("aria-disabled") === "true") return;

    locationButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    const data = button.dataset;

    if (locationImage) {
      locationImage.src = data.image || "";
      locationImage.alt = data.name || "NordFit Standort";
    }

    if (locationImageLabel) locationImageLabel.textContent = data.name || "";
    if (locationStatus) locationStatus.textContent = data.status || "";
    if (locationLine) locationLine.textContent = data.locationLine || "";
    if (locationName) locationName.textContent = data.name || "";
    if (locationTitle) locationTitle.textContent = data.title || "";
    if (locationDescription) locationDescription.textContent = data.description || "";

    if (factStatus) factStatus.textContent = data.status || "";
    if (factAccess) factAccess.textContent = data.access || "";
    if (factAreas) factAreas.textContent = data.areas || "";
    if (factBooking) factBooking.textContent = data.booking || "";

    if (mapTitle) mapTitle.textContent = data.name || "";
    if (mapStatus) mapStatus.textContent = data.status || "";

    if (locationMap && data.map) {
      locationMap.src = data.map;
      locationMap.title = `Karte: ${data.name}`;
    }

    button.scrollIntoView({
      behavior: "smooth",
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
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }, 120);
  }
});
