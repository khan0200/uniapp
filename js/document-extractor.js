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

  // Fetch the selected student's info from Firebase in real-time
  function loadStudentDetails(studentId) {
    try {
      if (typeof db !== "undefined") {
        db.collection("students").doc(studentId).onSnapshot((doc) => {
          if (doc.exists) {
            const s = doc.data();
            window.currentStudentData = s;

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
        }, (error) => {
          console.error("Error watching student profile:", error);
          alert("Error loading student profile. Please check Firebase connection.");
        });
      }
    } catch (error) {
      console.error("Error setting up snapshot watcher:", error);
    }
  }

  // Load selected AI provider + model from local storage
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
      const provider = settings.provider || "gemini";

      if (provider === "openai") {
        const openaiModelMap = {
          "gpt-5.5": "GPT-5.5",
          "gpt-5.4": "GPT-5.4",
          "gpt-5.4-mini": "GPT-5.4-mini",
          "gpt-4o": "GPT-4o",
          "gpt-4o-mini": "GPT-4o Mini",
          "gpt-4-turbo": "GPT-4 Turbo",
          "gpt-4": "GPT-4",
          "gpt-3.5-turbo": "GPT-3.5 Turbo",
          "o1": "o1",
          "o1-mini": "o1 Mini",
          "o3-mini": "o3 Mini"
        };
        const modelName = openaiModelMap[settings.openaiModel] || settings.openaiModel || "GPT-4o";
        modelBadge.textContent = `OpenAI · ${modelName}`;
        modelBadge.style.color = "#10a37f";
      } else {
        const geminiModelMap = {
          "gemini-3.5-flash": "Gemini 3.5 Flash",
          "gemini-3.1-pro": "Gemini 3.1 Pro",
          "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
          "gemini-2.5-flash": "Gemini 2.5 Flash",
          "gemini-2.5-pro": "Gemini 2.5 Pro",
          "gemini-2.0-flash": "Gemini 2.0 Flash",
          "gemini-1.5-pro": "Gemini 1.5 Pro",
          "gemini-1.5-flash": "Gemini 1.5 Flash",
          "gemini-2.5-flash-lite": "Gemini Flash Lite"
        };
        const modelName = geminiModelMap[settings.model] || settings.model || "Gemini 3.5 Flash";
        modelBadge.textContent = `Gemini · ${modelName}`;
        modelBadge.style.color = "#a78bfa";
      }
    }
  }
})();
