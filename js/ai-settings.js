// JS Logic for AI Settings Management in UNIAPP
(function() {
  // Default configurations
  const defaultSettings = {
    apiKey: "",
    model: "gemini-2.5-flash",
    normalizeDates: true,
    mergeNames: true,
    extractStructured: true,
    includeOcr: true,
    saveHistory: true
  };

  // Load settings on initialization
  document.addEventListener("DOMContentLoaded", () => {
    loadAiSettings();
  });

  // Toggle show/hide API key
  window.toggleApiKeyVisibility = function() {
    const keyInput = document.getElementById("geminiApiKey");
    const icon = document.getElementById("toggleApiKeyIcon");
    if (!keyInput || !icon) return;

    if (keyInput.type === "password") {
      keyInput.type = "text";
      icon.classList.remove("bi-eye");
      icon.classList.add("bi-eye-slash");
    } else {
      keyInput.type = "password";
      icon.classList.remove("bi-eye-slash");
      icon.classList.add("bi-eye");
    }
  };

  // Fetch settings from Firestore and LocalStorage
  window.loadAiSettings = async function() {
    // 1. Try to load from localStorage first for immediate rendering
    let localSettings = null;
    try {
      const stored = localStorage.getItem("ai_settings");
      if (stored) {
        localSettings = JSON.parse(stored);
        applySettingsToUI(localSettings);
      }
    } catch (e) {
      console.warn("Failed to parse local AI settings:", e);
    }

    // 2. Fetch from Firestore to ensure synchronization
    try {
      if (typeof db !== "undefined") {
        const doc = await db.collection("settings").doc("ai_settings").get();
        if (doc.exists) {
          const remoteSettings = doc.data();
          // Merge with defaults to ensure all fields exist
          const merged = { ...defaultSettings, ...remoteSettings };
          localStorage.setItem("ai_settings", JSON.stringify(merged));
          applySettingsToUI(merged);
        } else if (!localSettings) {
          // If no doc and no local settings, apply defaults
          applySettingsToUI(defaultSettings);
        }
      }
    } catch (error) {
      console.error("Error loading AI settings from Firestore:", error);
      if (!localSettings) {
        applySettingsToUI(defaultSettings);
      }
    }
  };

  // Update UI values
  function applySettingsToUI(settings) {
    const apiKeyEl = document.getElementById("geminiApiKey");
    const modelEl = document.getElementById("geminiModel");
    const normalizeDatesEl = document.getElementById("aiNormalizeDates");
    const mergeNamesEl = document.getElementById("aiMergeNames");
    const extractStructuredEl = document.getElementById("aiExtractStructured");
    const includeOcrEl = document.getElementById("aiIncludeOcr");
    const saveHistoryEl = document.getElementById("aiSaveHistory");

    if (apiKeyEl) apiKeyEl.value = settings.apiKey || "";
    if (modelEl) modelEl.value = settings.model || "gemini-2.5-flash";
    if (normalizeDatesEl) normalizeDatesEl.checked = settings.normalizeDates !== false;
    if (mergeNamesEl) mergeNamesEl.checked = settings.mergeNames !== false;
    if (extractStructuredEl) extractStructuredEl.checked = settings.extractStructured !== false;
    if (includeOcrEl) includeOcrEl.checked = settings.includeOcr !== false;
    if (saveHistoryEl) saveHistoryEl.checked = settings.saveHistory !== false;
  }

  // Save Settings to Firestore & LocalStorage
  window.saveAiSettings = async function() {
    const apiKey = document.getElementById("geminiApiKey")?.value.trim() || "";
    const model = document.getElementById("geminiModel")?.value || "gemini-2.5-flash";
    const normalizeDates = document.getElementById("aiNormalizeDates")?.checked ?? true;
    const mergeNames = document.getElementById("aiMergeNames")?.checked ?? true;
    const extractStructured = document.getElementById("aiExtractStructured")?.checked ?? true;
    const includeOcr = document.getElementById("aiIncludeOcr")?.checked ?? true;
    const saveHistory = document.getElementById("aiSaveHistory")?.checked ?? true;

    const newSettings = {
      apiKey,
      model,
      normalizeDates,
      mergeNames,
      extractStructured,
      includeOcr,
      saveHistory,
      updatedAt: new Date().toISOString()
    };

    // Save to LocalStorage
    localStorage.setItem("ai_settings", JSON.stringify(newSettings));

    // Save to Firestore
    try {
      if (typeof db !== "undefined") {
        await db.collection("settings").doc("ai_settings").set(newSettings);
        if (typeof showNotification === "function") {
          showNotification("AI Settings saved successfully!", "success");
        } else {
          alert("AI Settings saved successfully!");
        }
      }
    } catch (error) {
      console.error("Error saving AI settings to Firestore:", error);
      if (typeof showNotification === "function") {
        showNotification("Local settings saved, but failed to sync online.", "warning");
      }
    }
  };

  // Validate the Gemini API Key
  window.validateGeminiKey = async function() {
    const apiKey = document.getElementById("geminiApiKey")?.value.trim();
    if (!apiKey) {
      if (typeof showNotification === "function") {
        showNotification("Please enter an API key first!", "error");
      } else {
        alert("Please enter an API key first!");
      }
      return;
    }

    // Show loading notification/alert
    if (typeof showNotification === "function") {
      showNotification("Validating API key...", "info");
    }

    try {
      // Validate key by fetching the list of models
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      if (response.ok) {
        if (typeof showNotification === "function") {
          showNotification("API Key is valid!", "success");
        } else {
          alert("API Key is valid!");
        }
      } else {
        const errorMsg = data.error?.message || "Invalid API key";
        if (typeof showNotification === "function") {
          showNotification(`Validation failed: ${errorMsg}`, "error");
        } else {
          alert(`Validation failed: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
      if (typeof showNotification === "function") {
        showNotification("Network error validating key. Please check connection.", "error");
      } else {
        alert("Network error validating key.");
      }
    }
  };
})();
