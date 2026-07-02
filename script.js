// Typewriter Text Logic
const roles = [
  "Web Developer ",
  "Developer ",
  "Web Designer ",
  "Student ",
  "Script Writer ",
  "Game Developer",
  "Game Designer"
];

const textElement = document.querySelector(".typewriter-text");
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const currentRole = roles[roleIndex];
  const currentText = currentRole.substring(0, charIndex);

  textElement.textContent = currentText;

  if (isDeleting) {
    charIndex--;
  } else {
    charIndex++;
  }

  if (!isDeleting && charIndex === currentRole.length) {
    setTimeout(() => {
      isDeleting = true;
      typeEffect();
    }, 1200);
    return;
  }

  if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
  }

  const typingSpeed = isDeleting ? 60 : 100;
  setTimeout(typeEffect, typingSpeed);
}

document.addEventListener("DOMContentLoaded", () => {
  typeEffect(); // Start typewriter effect
  setupContactCaptcha();

  // ===== Modal Functionality =====
  const modalBg = document.getElementById("modal-bg");
  const modalInner = document.getElementById("modal-inner-text");

  const modalContent = {
    ucsc: `
      <h2>University of California, Santa Cruz</h2>
      <p>Studying Computer Science: Game Development (B.S.) with a focus on 3D immersive design, VR Games, and Unity game systems.</p>
      <p>GPA : 3.92/4.0</p>
      <a href="UCSC_transcript.pdf" 
       target="_blank" 
       rel="noopener noreferrer" 
       style="color:#0077cc; text-decoration:none; font-weight:600;">
       📄 View Transcript (PDF)
    </a>
    `,
    stanford: `
      <h2>Stanford Online</h2>
      <p>Courses in Artificial Intelligence, Cryptography, Graph Algorithms, and Machine Learning for Healthcare.</p>
      <p>Certificates:</p>
      <a href="https://www.coursera.org/account/accomplishments/certificate/P3V3F9FTUH72" target="_blank" rel="noopener noreferrer" style="color:#0077cc; text-decoration:none;">AI Implications for the Economy
      and Society</a>
      <p>\n AI in Healthcare Capstone(In Progress)</p>
      <p>Introduction to Logic(In Progress)</p>
      <p>Algorithms Specialization(In Progress)</p>
      

    `,
    imperial: `
      <h2>Imperial College London</h2>
      <p>Engaged in advanced computational engineering and systems design for scientific computing with AI integration.\n</p>
      <ahref="https://www.coursera.org/account/accomplishments/certificate/7F0VBYJF1BOA" target="_blank" rel="noopener noreferrer" style="color:#0077cc; text-decoration:none;">Certificate :Mathematics for Machine Learning: Linear Algebra</a>
    `,
    princeton: `
      <h2>Princeton University (Online)</h2>
      <p>Exploring theoretical CS: Algorithms I & II, Computer Architecture, and Theory of Computation.</p>
      <p>\nBitcoin and Cryptocurrency Technologies(In Progress)<p/>
      <p>Computer Science: Algorithms, Theory, and Machines(In Progress)<p/>
      <p>Algorithms, Part I(In Progress)<p/>
      <p>Algorithms, Part II(Yet to enroll)<p/>
      <p>Computer Architecture(Yet to enroll)<p/>
      
    `,
    swis: `
      <h2>Shen Wai International School</h2>
      <p>IB Diploma Programme with HL Computer Science, Chinese B SL, and research on AI & ethics in education.</p>
      <a \n href="Graduation_certificate.png" 
      target="_blank" 
      rel="noopener noreferrer" 
      style="color:#0077cc; text-decoration:none; font-weight:600;">
      📄 View Transcript (PDF)
   </a>
   `,
   roka: `
     <h2>Republic of Korea's Army</h2>
     <p>Working for Korean goverment's cybersecurity troop, entering 2025 Oct.</p>
  </a>
   `
  };

  window.openModal = function (school) {
    modalInner.innerHTML = modalContent[school];
    modalBg.style.display = "flex";
    document.body.style.overflow = "hidden";
  };

  window.closeModal = function (event) {
    if (event.target.id === "modal-bg") {
      fadeOutModal();
    }
  };

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modalBg.style.display === "flex") {
      fadeOutModal();
    }
  });

  function fadeOutModal() {
    modalBg.classList.add("fade-out");
    setTimeout(() => {
      modalBg.classList.remove("fade-out");
      modalBg.style.display = "none";
      document.body.style.overflow = "auto";
    }, 300);
  }
});

document.getElementById("hireBtn").addEventListener("click", () => {
  document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
});

function setupContactCaptcha() {
  const form = document.querySelector(".contact-form");
  const captcha = document.querySelector(".g-recaptcha");
  const submitButton = document.querySelector(".send-button");
  const status = document.querySelector(".recaptcha-status");

  if (!form || !captcha || !submitButton || !status) {
    return;
  }

  const formAction = form.getAttribute("action") || "";
  const siteKey = captcha.dataset.sitekey || "";
  const hasFormId = !formAction.includes("YOUR_FORM_ID");
  const hasSiteKey = !siteKey.includes("YOUR_RECAPTCHA_SITE_KEY");

  if (!hasFormId || !hasSiteKey) {
    status.textContent = "Setup needed: add your Formspree form ID and reCAPTCHA site key.";
    submitButton.disabled = true;
  }

  window.onPortfolioCaptchaSuccess = function () {
    if (hasFormId && hasSiteKey) {
      submitButton.disabled = false;
      status.textContent = "reCAPTCHA complete. You can send the message.";
    }
  };

  window.onPortfolioCaptchaExpired = function () {
    submitButton.disabled = true;
    status.textContent = "reCAPTCHA expired. Please verify again.";
  };

  form.addEventListener("submit", (event) => {
    const token = typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : "";

    if (!hasFormId || !hasSiteKey || !token) {
      event.preventDefault();
      status.textContent = !hasFormId || !hasSiteKey
        ? "Setup needed: replace the placeholder Formspree ID and reCAPTCHA site key."
        : "Please complete the reCAPTCHA before sending.";
      submitButton.disabled = true;
    }
  });
}
