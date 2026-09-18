const primaryNav = document.querySelector("header > nav");

if (primaryNav) {
  const navItems = Array.from(primaryNav.querySelectorAll('a[href^="#"]'))
    .map((link) => ({
      link,
      target: document.getElementById(link.hash.slice(1)),
    }))
    .filter(({ target }) => target);

  if (navItems.length > 0) {
    let updatePending = false;

    // A nav click keeps its link highlighted until the user scrolls on their
    // own. Otherwise a section too close to the end of the page to reach the
    // navbar (Tech Stack on tall screens) lands at the page bottom, where the
    // last link wins, and the wrong item lights up.
    let clickedNav = null;

    const getLandingScrollY = (target) => {
      const scrollMarginTop =
        parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;
      const targetScrollY =
        target.getBoundingClientRect().top + window.scrollY - scrollMarginTop;

      return Math.min(Math.max(targetScrollY, 0), maxScrollY);
    };

    const updateNavbar = () => {
      primaryNav.classList.toggle("is-scrolled", window.scrollY > 0);

      const navBottom = primaryNav.getBoundingClientRect().bottom;
      const atPageBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 1;
      let currentItem = navItems[0];

      if (clickedNav) {
        const atLanding =
          Math.abs(window.scrollY - clickedNav.landingScrollY) <= 1;

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
          if (item.target.getBoundingClientRect().top <= navBottom + 1) {
            currentItem = item;
          }
        });
      }

      navItems.forEach((item) => {
        if (item === currentItem) {
          item.link.setAttribute("aria-current", "page");
        } else {
          item.link.removeAttribute("aria-current");
        }
      });
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

    // scrollIntoView honors each section's scroll-margin-top, which matches
    // the compact navbar height, so sections land just below the navbar.
    navItems.forEach((item) => {
      const { link, target } = item;

      link.addEventListener("click", (event) => {
        event.preventDefault();
        clickedNav = {
          item,
          landingScrollY: getLandingScrollY(target),
          arrived: false,
        };
        target.scrollIntoView({
          behavior: reducedMotionQuery.matches ? "auto" : "smooth",
          block: "start",
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

    window.addEventListener("scroll", scheduleNavbarUpdate, { passive: true });
    window.addEventListener("resize", () => {
      releaseClickedNav();
      scheduleNavbarUpdate();
    });
    updateNavbar();
  }
}

const carousels = document.querySelectorAll(".carousel");

carousels.forEach((carousel) => {
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

  showSlide(currentSlide);
});

const modalTriggers = document.querySelectorAll(
  'button[aria-haspopup="dialog"][aria-controls]'
);

modalTriggers.forEach((trigger) => {
  const dialogId = trigger.getAttribute("aria-controls");
  const dialog = document.getElementById(dialogId);

  if (!dialog || dialog.tagName !== "DIALOG") {
    return;
  }

  trigger.addEventListener("click", () => {
    dialog.showModal();
  });
});
