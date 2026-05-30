// Main Page Controller for AI Document Extractor
(function () {
  window.currentStudentId = null; // Global for sharing the student document reference

  document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme Sync
    initThemeSync();

    // 2. Fetch and Validate Query Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get("studentId");

    if (!studentId) {
      alert("Error: No studentId specified in the URL!");
      window.close();
      return;
    }

    window.currentStudentId = studentId;

    // 3. Load Student Data & UI Details
    loadStudentDetails(studentId);

    // 4. Initialize Settings Display Info
    initSettingsDisplay();
  });

  // Synchronize layout theme with general system settings
  function initThemeSync() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-bs-theme", savedTheme);

    // Watch for local storage changes from main window
    window.addEventListener("storage", (e) => {
      if (e.key === "theme") {
        document.documentElement.setAttribute("data-bs-theme", e.newValue || "dark");
      }
    });
  }

  // Fetch the selected student's info from Firebase
  async function loadStudentDetails(studentId) {
    try {
      if (typeof db !== "undefined") {
        const doc = await db.collection("students").doc(studentId).get();
        if (doc.exists) {
          const s = doc.data();

          // Populate Header Elements
          const nameEl = document.getElementById("studentHeaderName");
          const idEl = document.getElementById("studentHeaderId");
          const passportEl = document.getElementById("studentHeaderPassport");

          if (nameEl) nameEl.textContent = s.fullName || "Unnamed Student";
          if (idEl) idEl.textContent = `Student ID: ${s.id || "-"}`;
          if (passportEl) passportEl.textContent = `Passport: ${s.passport || "-"}`;
        } else {
          alert("Error: Student profile not found in database!");
          window.close();
        }
      }
    } catch (error) {
      console.error("Error fetching student profile:", error);
      alert("Error loading student profile. Please check Firebase connection.");
    }
  }

  // Load selected Gemini model name from local storage or Firestore
  async function initSettingsDisplay() {
    let settings = {};
    try {
      const stored = localStorage.getItem("ai_settings");
      if (stored) settings = JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to load local AI settings:", e);
    }

    const modelBadge = document.getElementById("extractionModelBadge");
    if (modelBadge) {
      // Map names to clean display
      let displayModel = "Gemini 2.5 Flash";
      if (settings.model === "gemini-2.5-pro") {
        displayModel = "Gemini 2.5 Pro";
      } else if (settings.model === "gemini-2.5-flash-lite") {
        displayModel = "Gemini Flash Lite";
      } else if (settings.model) {
        displayModel = settings.model;
      }
      modelBadge.textContent = `Model: ${displayModel}`;
    }
  }
})();
