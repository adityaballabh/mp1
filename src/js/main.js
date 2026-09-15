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

    const updateNavbar = () => {
      primaryNav.classList.toggle("is-scrolled", window.scrollY > 0);

      const navBottom = primaryNav.getBoundingClientRect().bottom;
      const atPageBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 1;
      let currentItem = navItems[0];

      if (atPageBottom) {
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
    navItems.forEach(({ link, target }) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        target.scrollIntoView({
          behavior: reducedMotionQuery.matches ? "auto" : "smooth",
          block: "start",
        });
        window.history.pushState(null, "", link.hash);
      });
    });

    window.addEventListener("scroll", scheduleNavbarUpdate, { passive: true });
    window.addEventListener("resize", scheduleNavbarUpdate);
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
