import { animate, stagger, inView } from "motion";

// ─── Hero section: page-load animations ────────────────────────────────────
animate(
  ".service-breadcrumb",
  { opacity: [0, 1] },
  { duration: 0.5, delay: 0.1 },
);
animate(
  ".service-badge",
  { opacity: [0, 1], y: [16, 0] },
  { duration: 0.5, delay: 0.2 },
);
animate(
  ".service-title",
  { opacity: [0, 1], y: [16, 0] },
  { duration: 0.7, delay: 0.35 },
);
animate(
  ".service-desc",
  { opacity: [0, 1], y: [16, 0] },
  { duration: 0.6, delay: 0.55 },
);
animate(
  ".service-benefits",
  { opacity: [0, 1], y: [16, 0] },
  { duration: 0.6, delay: 0.7 },
);
animate(
  ".service-btns",
  { opacity: [0, 1], y: [16, 0] },
  { type: "spring", stiffness: 100, delay: 0.85 },
);
animate(
  ".service-image",
  { opacity: [0, 1], scale: [0.95, 1] },
  { duration: 0.9, delay: 0.4 },
);

// ─── FAQ: stagger items in when section scrolls into view ──────────────────
inView(
  "#preguntas-frecuentes",
  (section) => {
    animate(
      section.querySelectorAll(".faq-item"),
      { opacity: [0, 1], y: [14, 0] },
      {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        delay: stagger(0.08, { startDelay: 0.25 }),
      },
    );
  },
  { margin: "0px 0px -15% 0px" },
);

// ─── FAQ: animated accordion open / close ──────────────────────────────────
document.querySelectorAll(".faq-item").forEach((details) => {
  const summary = details.querySelector("summary");
  const content = details.querySelector(".faq-content");
  if (!summary || !content) return;

  summary.addEventListener("click", (e) => {
    e.preventDefault();

    if (details.open) {
      // Collapse
      const startH = content.offsetHeight;
      content.style.overflow = "hidden";
      animate(
        content,
        { height: [startH, 0], opacity: [1, 0] },
        { duration: 0.25, ease: [0.4, 0, 1, 1] },
      );
      setTimeout(() => {
        details.removeAttribute("open");
        content.style.height = "";
        content.style.overflow = "";
      }, 260);
    } else {
      // Expand
      content.style.overflow = "hidden";
      content.style.height = "0px";
      details.setAttribute("open", "");
      const targetH = content.scrollHeight;
      animate(
        content,
        { height: [0, targetH], opacity: [0, 1] },
        { duration: 0.3, ease: [0, 0, 0.2, 1] },
      );
      setTimeout(() => {
        content.style.height = "";
        content.style.overflow = "";
      }, 310);
    }
  });
});
