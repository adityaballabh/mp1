const primaryNav = document.querySelector("body > nav");

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

    // The address bar only starts following sections once the reader scrolls,
    // so a freshly loaded page keeps whatever URL they arrived on.
    let trackingHash = false;

    // The navbar sits in the flow, so compacting it shortens the document and
    // pulls every section up with it. A click that starts at the very top is
    // therefore measured against the expanded navbar but lands against the
    // compact one, overshooting by the difference. scroll-margin-top is set to
    // the compact navbar height, so it doubles as that measurement.
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

      // Only the navbar sits above the header, and it is sticky, so a landing
      // that close to the start of the document is the top of the page. Going
      // there rather than to the header's own offset lets the navbar expand
      // back to its full size.
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
          item.link.setAttribute("aria-current", "location");
        } else {
          item.link.removeAttribute("aria-current");
        }
      });

      // Keep the address bar on the section being read, so a copied link
      // lands where the reader is. replaceState rather than pushState: one
      // history entry per section would turn the back button into a scroll
      // log. It also leaves the scroll position alone, which assigning to
      // location.hash would not.
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

    // Scrolling to an explicit position rather than with scrollIntoView, so
    // the landing accounts for the navbar compacting mid-scroll and the
    // arrival check below compares against the same number.
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

  // Scoped to the carousel, so the arrow keys only move slides while focus is
  // already inside it. Up and down stay untouched: they scroll the page.
  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    showSlide(currentSlide + (event.key === "ArrowLeft" ? -1 : 1));
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
