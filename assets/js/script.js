// ================== DOM Elements ==================
const themeToggle = document.getElementById("themeToggle");
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const filterBtns = document.querySelectorAll(".filter-btn");
const portfolioItems = document.querySelectorAll(".portfolio-item");
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const contactForm = document.getElementById("contactForm");
const skillBars = document.querySelectorAll(".skill-progress");

// ================== Debug ==================
console.log("[debug] script.js loaded");
window.addEventListener("error", (ev) =>
  console.error(
    "[global error]",
    ev.message,
    "@",
    ev.filename + ":" + ev.lineno + ":" + ev.colno,
    ev.error
  )
);
window.addEventListener("unhandledrejection", (ev) =>
  console.error("[unhandled rejection]", ev.reason)
);

// ================== EmailJS helper (opsional) ==================
// Kalau kamu punya PUBLIC KEY, set di <script> sebelum file ini:
// <script>window.EMAILJS_PUBLIC_KEY="xxxxx";</script>
(function initEmailJS() {
  try {
    if (window.emailjs && typeof emailjs.init === "function") {
      if (window.EMAILJS_PUBLIC_KEY) {
        emailjs.init(window.EMAILJS_PUBLIC_KEY);
        // tandai agar tidak double init
        emailjs.__inited = true;
        console.log("[EmailJS] initialized with provided PUBLIC KEY");
      } else {
        console.warn(
          "[EmailJS] PUBLIC KEY tidak terdeteksi. " +
            "Tambahkan: window.EMAILJS_PUBLIC_KEY='YOUR_PUBLIC_KEY'; sebelum script ini."
        );
      }
    } else {
      console.warn(
        "[EmailJS] SDK tidak ditemukan. Pastikan CDN sudah disertakan."
      );
    }
  } catch (e) {
    console.error("[EmailJS] init error:", e);
  }
})();

// (opsi util lama—boleh dipakai manual via onclick jika mau)
function sendMail() {
  if (!window.emailjs) {
    alert("Gagal mengirim pesan! (EmailJS SDK tidak ditemukan)");
    return;
  }
  let params = {
    name: document.getElementById("name")?.value,
    email: document.getElementById("email")?.value,
    subject: document.getElementById("subject")?.value,
    message: document.getElementById("message")?.value,
  };
  emailjs
    .send("service_onyr4wn", "template_9vtlfjh", params)
    .then((res) => {
      alert("Pesan berhasil dikirim!");
      console.log("SUCCESS", res);
    })
    .catch((err) => {
      alert("Gagal mengirim pesan!");
      console.error("FAILED", err);
    });
}

// ================== THEME ==================
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem("theme") || "light";
    this.init();
  }
  init() {
    this.setTheme(this.currentTheme);
    if (themeToggle)
      themeToggle.addEventListener("click", () => this.toggleTheme());
  }
  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.updateThemeIcon(theme);
    localStorage.setItem("theme", theme);
    this.currentTheme = theme;
  }
  toggleTheme() {
    const t = this.currentTheme === "light" ? "dark" : "light";
    // jika mau tanpa confirm, hapus 2 baris berikut:
    if (!confirm(`Yakin mau ganti tema jadi ${t}?`)) return;
    this.setTheme(t);
    document.body.style.transition = "all .3s";
    setTimeout(() => (document.body.style.transition = ""), 300);
  }
  updateThemeIcon(theme) {
    const icon = themeToggle?.querySelector("i");
    if (!icon) return;
    icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }
}

// ================== NAV ==================
class NavigationManager {
  constructor() {
    this.init();
  }
  init() {
    this.setupMobileMenu();
    this.setupSmoothScrolling();
    this.setupActiveSection();
    this.setupNavbarScroll();
  }
  setupMobileMenu() {
    if (!hamburger || !navMenu) return;
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });
    navLinks.forEach((l) =>
      l.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      })
    );
    document.addEventListener("click", (e) => {
      if (!e.target.closest?.(".navbar")) {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });
  }
  setupSmoothScrolling() {
    navLinks.forEach((link) =>
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href?.startsWith("#")) return;
        e.preventDefault();
        const target = document.getElementById(href.slice(1));
        const navH =
          document.querySelector(".navbar")?.getBoundingClientRect().height ||
          80;
        if (target)
          window.scrollTo({ top: target.offsetTop - navH, behavior: "smooth" });
      })
    );
  }
  setupActiveSection() {
    const sections = document.querySelectorAll("section");
    if (!sections.length) return;
    const obs = new IntersectionObserver(
      (ents) =>
        ents.forEach((en) => {
          if (en.isIntersecting) this.updateActiveNavLink(en.target.id);
        }),
      { root: null, rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
  }
  updateActiveNavLink(id) {
    navLinks.forEach((l) => {
      l.classList.toggle("active", l.getAttribute("href") === `#${id}`);
    });
  }

  // === FIX: jangan set warna inline; cukup toggle kelas .is-scrolled ===
  setupNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;
    let last = 0;
    const onScroll = () => {
      const cur = window.pageYOffset || window.scrollY || 0;
      // toggle state visual via CSS variable (lihat CSS yang sudah kamu paste)
      navbar.classList.toggle("is-scrolled", cur > 10);
      // sembunyikan saat scroll turun cepat (tetap inline transform aman)
      navbar.style.transform =
        cur > last && cur > 500 ? "translateY(-100%)" : "translateY(0)";
      last = cur;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set state awal
  }
}

// ================== PORTFOLIO ==================
class PortfolioManager {
  constructor() {
    this.init();
  }
  init() {
    this.setupFilters();
    this.animateOnScroll();
  }
  setupFilters() {
    filterBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-filter");
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.filterItems(f);
      })
    );
  }
  filterItems(f) {
    portfolioItems.forEach((it, i) => {
      const show = f === "all" || it.classList.contains(f);
      if (show) {
        it.style.display = "block";
        setTimeout(() => {
          it.style.opacity = "1";
          it.style.transform = "translateY(0)";
        }, i * 100);
      } else {
        it.style.opacity = "0";
        it.style.transform = "translateY(20px)";
        setTimeout(() => {
          it.style.display = "none";
        }, 300);
      }
    });
  }
  animateOnScroll() {
    const obs = new IntersectionObserver(
      (ents) =>
        ents.forEach((en) => {
          if (en.isIntersecting) en.target.classList.add("animate-in");
        }),
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    );
    portfolioItems.forEach((it) => obs.observe(it));
  }
}

// ================== EXPERIENCE ==================
class ExperienceManager {
  constructor() {
    this.init();
  }
  init() {
    this.setupTabs();
  }
  setupTabs() {
    tabBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-tab");
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        tabContents.forEach((c) => {
          c.classList.remove("active");
          if (c.id === id) setTimeout(() => c.classList.add("active"), 150);
        });
      })
    );
  }
}

// ================== CONTACT (EmailJS) ==================
class ContactManager {
  constructor() {
    this.init();
  }
  init() {
    if (!contactForm) {
      console.warn("Contact form not found: #contactForm");
      return;
    }
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    const inputs = contactForm.querySelectorAll("input, textarea");
    inputs.forEach((inp) => {
      inp.addEventListener("blur", () => this.validateField(inp));
      inp.addEventListener("input", () => this.clearErrors(inp));
    });
  }

  validateField(field) {
    const v = (field.value || "").trim();
    let ok = true,
      msg = "";
    this.clearErrors(field);
    const isTextarea = field.tagName === "TEXTAREA";
    const type = field.type || "";
    if (type === "email") {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(v)) {
        ok = false;
        msg = "Please enter a valid email address";
      }
    } else if (type === "text" || isTextarea) {
      if (v.length < 2) {
        ok = false;
        msg = "This field must be at least 2 characters long";
      }
    }
    if (!ok) this.showError(field, msg);
    return ok;
  }
  showError(field, msg) {
    field.style.borderColor = "#e53e3e";
    const p = field.parentNode;
    if (!p) return;
    let el = p.querySelector(".error-message");
    if (!el) {
      el = document.createElement("div");
      el.className = "error-message";
      el.style.color = "#e53e3e";
      el.style.fontSize = ".875rem";
      el.style.marginTop = ".25rem";
      p.appendChild(el);
    }
    el.textContent = msg;
  }
  clearErrors(field) {
    field.style.borderColor = "";
    const p = field.parentNode;
    if (!p) return;
    const el = p.querySelector(".error-message");
    if (el) el.remove();
  }

  async handleSubmit() {
    // validasi
    const inputs = contactForm.querySelectorAll("input, textarea");
    let ok = true;
    inputs.forEach((i) => {
      if (!this.validateField(i)) ok = false;
    });
    if (!ok) {
      this.toast("Please fix the errors above", "error");
      return;
    }

    // state tombol
    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn ? btn.innerHTML : null;
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      btn.disabled = true;
    }

    try {
      // Cek EmailJS available & initialized
      if (!window.emailjs) {
        throw new Error(
          "EmailJS SDK not loaded. Tambahkan CDN: https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
        );
      }
      // beberapa versi expose _userID, beberapa tidak; cek flag custom __inited juga
      const isInited =
        emailjs.__inited === true ||
        (typeof emailjs.getPublicKey === "function" &&
          !!emailjs.getPublicKey()) ||
        (emailjs._userID && typeof emailjs._userID === "string");

      if (!isInited) {
        console.warn(
          "[EmailJS] Belum di-init. Coba kirim tetap, tapi sebaiknya panggil emailjs.init(PUBLIC_KEY)."
        );
      }

      // ====== KIRIM KE EMAILJS ======
      await emailjs.send("service_onyr4wn", "template_9vtlfjh", {
        // variabel sesuai template kamu
        name: contactForm.name.value,
        email: contactForm.email.value,
        title: contactForm.subject.value,
        message: contactForm.message.value,

        // alias umum (aman kalau template tak pakai)
        from_name: contactForm.name.value,
        from_email: contactForm.email.value,
        reply_to: contactForm.email.value,
        subject: contactForm.subject.value,
      });

      this.toast(
        "Message sent successfully! I'll get back to you soon.",
        "success"
      );
      contactForm.reset();
    } catch (err) {
      console.error("EmailJS FAILED", err);
      const detail =
        (err && (err.text || err.message)) ||
        JSON.stringify(err) ||
        "Unknown error";
      this.toast(`Failed to send message: ${detail}`, "error");
    } finally {
      if (btn) {
        if (original !== null) btn.innerHTML = original;
        btn.disabled = false;
      }
    }
  }

  toast(message, type) {
    const n = document.createElement("div");
    n.className = `notification ${type}`;
    n.innerHTML = `
      <div class="notification-content">
        <i class="fas ${
          type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
        }"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
      </div>`;
    n.style.cssText = `
      position: fixed; top: 100px; right: 20px; z-index: 10000;
      background:${type === "success" ? "#10b981" : "#ef4444"}; color:#fff;
      padding:1rem 1.5rem; border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,.15);
      transform:translateX(400px); transition:transform .3s ease; max-width:400px;`;
    n.querySelector(".notification-content").style.cssText =
      "display:flex;align-items:center;gap:.75rem;";
    const close = n.querySelector(".notification-close");
    close.style.cssText =
      "background:none;border:none;color:#fff;cursor:pointer;margin-left:auto;";
    document.body.appendChild(n);
    setTimeout(() => {
      n.style.transform = "translateX(0)";
    }, 100);
    setTimeout(() => {
      this.removeToast(n);
    }, 5000);
    close.addEventListener("click", () => this.removeToast(n));
  }
  removeToast(n) {
    n.style.transform = "translateX(400px)";
    setTimeout(() => n.remove(), 300);
  }
}

// ================== ANIMATIONS ==================
class AnimationManager {
  constructor() {
    this.init();
  }
  init() {
    this.scrollAnims();
    this.skillBars();
    this.parallax();
  }
  scrollAnims() {
    const els = document.querySelectorAll(
      ".hero-text > *, .about-content > *, .section-title, .skill-category, .timeline-item"
    );
    const obs = new IntersectionObserver(
      (ents) =>
        ents.forEach((en, i) => {
          if (en.isIntersecting)
            setTimeout(() => {
              en.target.style.opacity = "1";
              en.target.style.transform = "translateY(0)";
            }, i * 100);
        }),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "all .6s ease";
      obs.observe(el);
    });
  }
  skillBars() {
    const sec = document.getElementById("skills");
    let done = false;
    const obs = new IntersectionObserver((ents) =>
      ents.forEach((en) => {
        if (en.isIntersecting && !done) {
          this.runBars();
          done = true;
        }
      })
    );
    if (sec) obs.observe(sec);
  }
  runBars() {
    skillBars.forEach((bar, i) => {
      const width = bar.style.width || "0%";
      bar.style.width = "0%";
      setTimeout(() => {
        bar.style.width = width;
      }, i * 200);
    });
  }
  parallax() {
    window.addEventListener(
      "scroll",
      () => {
        const y = window.pageYOffset;
        document.querySelectorAll(".hero-image").forEach((el) => {
          el.style.transform = `translateY(${y * 0.5}px)`;
        });
      },
      { passive: true }
    );
  }
}

// ================== INIT APP ==================
class App {
  constructor() {
    this.init();
  }
  init() {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", () => this.mount());
    else this.mount();
  }
  mount() {
    try {
      this.themeManager = new ThemeManager();
      this.navigationManager = new NavigationManager();
      this.portfolioManager = new PortfolioManager();
      this.experienceManager = new ExperienceManager();
      this.contactManager = new ContactManager();
      this.animationManager = new AnimationManager();
      document.body.classList.add("loaded");
      console.log("🚀 Portfolio website initialized successfully!");
    } catch (e) {
      console.error("Error initializing application:", e);
    }
  }
}
new App();
