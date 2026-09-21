const initNav = () => {
  const primaryNav = document.querySelector("body > nav");

  if (!primaryNav) {
    return;
  }

  const navItems = Array.from(primaryNav.querySelectorAll('a[href^="#"]'))
    .map((link) => ({
      link,
      target: document.getElementById(link.hash.slice(1)),
    }))
    .filter(({ target }) => target);

  if (navItems.length === 0) {
    return;
  }

  // Scroll positions come back fractional, so comparisons need a little room.
  const PIXEL_SLACK = 1;

  let updatePending = false;

  // Remember a clicked link: short sections never scroll up to the navbar.
  let clickedNav = null;

  // Don't start rewriting the URL until the user scrolls.
  let trackingHash = false;

  // The navbar shrinks on scroll, so a click from the top would scroll too far.
  const getNavShrink = (scrollMarginTop) => {
    if (window.scrollY > 0) {
      return 0;
    }

    const navHeight = primaryNav.getBoundingClientRect().height;

    return Math.max(navHeight - scrollMarginTop, 0);
  };

  const getLandingScrollY = (target) => {
    const scrollMarginTop =
      parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    const navShrink = scrollMarginTop ? getNavShrink(scrollMarginTop) : 0;
    const maxScrollY =
      document.documentElement.scrollHeight - window.innerHeight - navShrink;
    const targetScrollY =
      target.getBoundingClientRect().top +
      window.scrollY -
      scrollMarginTop -
      navShrink;

    // Nothing but the navbar is above the header, so go to the very top.
    if (targetScrollY <= primaryNav.getBoundingClientRect().height) {
      return 0;
    }

    return Math.min(Math.max(targetScrollY, 0), maxScrollY);
  };

  const updateNavbar = () => {
    primaryNav.classList.toggle("is-scrolled", window.scrollY > 0);

    const navBottom = primaryNav.getBoundingClientRect().bottom;
    const atPageBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - PIXEL_SLACK;
    let currentItem = navItems[0];

    // Release the click once the scroll lands and the page moves off it again.
    if (clickedNav) {
      const atLanding =
        Math.abs(window.scrollY - clickedNav.landingScrollY) <= PIXEL_SLACK;

      if (atLanding) {
        clickedNav.arrived = true;
      } else if (clickedNav.arrived) {
        clickedNav = null;
      }
    }

    if (clickedNav) {
      currentItem = clickedNav.item;
    } else if (atPageBottom) {
      currentItem = navItems[navItems.length - 1];
    } else {
      navItems.forEach((item) => {
        if (
          item.target.getBoundingClientRect().top <=
          navBottom + PIXEL_SLACK
        ) {
          currentItem = item;
        }
      });
    }

    navItems.forEach((item) => {
      if (item === currentItem) {
        item.link.setAttribute("aria-current", "location");
      } else {
        item.link.removeAttribute("aria-current");
      }
    });

    // replaceState, not pushState: one entry per section would break Back.
    if (trackingHash && window.location.hash !== currentItem.link.hash) {
      window.history.replaceState(null, "", currentItem.link.hash);
    }
  };

  const scheduleNavbarUpdate = () => {
    if (updatePending) {
      return;
    }

    updatePending = true;
    window.requestAnimationFrame(() => {
      updateNavbar();
      updatePending = false;
    });
  };

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // An exact position, not scrollIntoView, so updateNavbar can detect arrival.
  navItems.forEach((item) => {
    const { link, target } = item;

    link.addEventListener("click", (event) => {
      event.preventDefault();

      const landingScrollY = getLandingScrollY(target);

      clickedNav = { item, landingScrollY, arrived: false };
      window.scrollTo({
        top: landingScrollY,
        behavior: reducedMotionQuery.matches ? "auto" : "smooth",
      });
      window.history.pushState(null, "", link.hash);
      updateNavbar();
    });
  });

  const releaseClickedNav = () => {
    if (clickedNav) {
      clickedNav = null;
      scheduleNavbarUpdate();
    }
  };

  const scrollKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
  ]);

  window.addEventListener("wheel", releaseClickedNav, { passive: true });
  window.addEventListener("touchstart", releaseClickedNav, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (scrollKeys.has(event.key)) {
      releaseClickedNav();
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      trackingHash = true;
      scheduleNavbarUpdate();
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    releaseClickedNav();
    scheduleNavbarUpdate();
  });
  updateNavbar();
};

const initCarousel = (carousel) => {
  const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
  const previousButton = carousel.querySelector(".carousel-button-previous");
  const nextButton = carousel.querySelector(".carousel-button-next");

  if (slides.length === 0 || !previousButton || !nextButton) {
    return;
  }

  let currentSlide = slides.findIndex((slide) =>
    slide.classList.contains("is-active")
  );

  if (currentSlide === -1) {
    currentSlide = 0;
  }

  const pad = (value) => String(value).padStart(2, "0");

  slides.forEach((slide, slideIndex) => {
    const counter = slide.querySelector(".eyebrow");

    if (counter) {
      counter.textContent = `${pad(slideIndex + 1)} / ${pad(slides.length)}`;
    }
  });

  const showSlide = (index) => {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentSlide;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });
  };

  previousButton.addEventListener("click", () => {
    showSlide(currentSlide - 1);
  });

  nextButton.addEventListener("click", () => {
    showSlide(currentSlide + 1);
  });

  // Scoped to the carousel so arrow keys only move slides when focus is inside.
  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    showSlide(currentSlide + (event.key === "ArrowLeft" ? -1 : 1));
  });

  // Sync every slide's class and aria-hidden on load.
  showSlide(currentSlide);
};

const initModal = (trigger) => {
  const dialogId = trigger.getAttribute("aria-controls");
  const dialog = document.getElementById(dialogId);

  if (!dialog || dialog.tagName !== "DIALOG") {
    return;
  }

  trigger.addEventListener("click", () => {
    dialog.showModal();
  });

  dialog.addEventListener("close", () => {
    trigger.focus();
  });

  // A backdrop click reports the dialog as its target, so compare coordinates.
  dialog.addEventListener("click", (event) => {
    const box = dialog.getBoundingClientRect();
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom;

    if (outside) {
      dialog.close();
    }
  });
};

initNav();
document.querySelectorAll(".carousel").forEach(initCarousel);
document
  .querySelectorAll('button[aria-haspopup="dialog"][aria-controls]')
  .forEach(initModal);
