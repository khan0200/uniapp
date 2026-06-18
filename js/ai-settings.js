// JS Logic for AI Settings Management in UNIAPP
// Supports Gemini and OpenAI providers
(function() {
  // Default configurations
  const defaultSettings = {
    provider: "gemini",
    apiKey: "",
    openaiApiKey: "",
    model: "gemini-3.5-flash",
    openaiModel: "gpt-4o-mini",
    normalizeDates: true,
    mergeNames: true,
    extractStructured: true,
    includeOcr: true,
    saveHistory: true
  };

  // Load settings on initialization
  document.addEventListener("DOMContentLoaded", () => {
    loadAiSettings();
    initModelCustomToggle();
    initProviderToggle();
  });

  // Initialize AI Provider radio toggle
  function initProviderToggle() {
    const radios = document.querySelectorAll('input[name="aiProvider"]');
    radios.forEach(radio => {
      radio.addEventListener("change", () => {
        switchProvider(radio.value);
      });
    });
  }

  // Switch UI based on selected provider
  function switchProvider(provider) {
    const isGemini = provider === "gemini";

    // Show/hide API key fields
    const geminiKeyGroup = document.getElementById("geminiApiKeyGroup");
    const openaiKeyGroup = document.getElementById("openaiApiKeyGroup");
    if (geminiKeyGroup) geminiKeyGroup.style.display = isGemini ? "" : "none";
    if (openaiKeyGroup) openaiKeyGroup.style.display = isGemini ? "none" : "";

    // Show/hide model selection fields
    const geminiModelGroup = document.getElementById("geminiModelGroup");
    const openaiModelGroup = document.getElementById("openaiModelGroup");
    if (geminiModelGroup) geminiModelGroup.style.display = isGemini ? "" : "none";
    if (openaiModelGroup) openaiModelGroup.style.display = isGemini ? "none" : "";

    // Update title/description
    const titleEl = document.getElementById("aiSettingsTitle");
    const descEl = document.getElementById("aiSettingsDesc");
    if (titleEl) {
      titleEl.innerHTML = isGemini
        ? '<i class="bi bi-cpu-fill me-2" style="color:#a78bfa;"></i>AI Settings (Gemini)'
        : '<i class="bi bi-cpu-fill me-2" style="color:#10a37f;"></i>AI Settings (OpenAI)';
    }
    if (descEl) {
      descEl.textContent = isGemini
        ? "Configure Gemini API key and document extraction settings"
        : "Configure OpenAI API key and document extraction settings";
    }
  }

  // Toggle custom model input visibility based on select dropdown value
  function initModelCustomToggle() {
    const modelEl = document.getElementById("geminiModel");
    const customModelEl = document.getElementById("geminiModelCustom");
    if (modelEl && customModelEl) {
      modelEl.addEventListener("change", () => {
        customModelEl.style.display = modelEl.value === "custom" ? "block" : "none";
      });
    }
  }

  // Toggle show/hide Gemini API key
  window.toggleApiKeyVisibility = function() {
    const keyInput = document.getElementById("geminiApiKey");
    const icon = document.getElementById("toggleApiKeyIcon");
    if (!keyInput || !icon) return;
    if (keyInput.type === "password") {
      keyInput.type = "text";
      icon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
      keyInput.type = "password";
      icon.classList.replace("bi-eye-slash", "bi-eye");
    }
  };

  // Toggle show/hide OpenAI API key
  window.toggleOpenAIKeyVisibility = function() {
    const keyInput = document.getElementById("openaiApiKey");
    const icon = document.getElementById("toggleOpenAIKeyIcon");
    if (!keyInput || !icon) return;
    if (keyInput.type === "password") {
      keyInput.type = "text";
      icon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
      keyInput.type = "password";
      icon.classList.replace("bi-eye-slash", "bi-eye");
    }
  };

  // Fetch settings from Firestore and LocalStorage
  window.loadAiSettings = async function() {
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

    try {
      if (typeof db !== "undefined") {
        const doc = await db.collection("settings").doc("ai_settings").get();
        if (doc.exists) {
          const remoteSettings = doc.data();
          const merged = { ...defaultSettings, ...remoteSettings };
          localStorage.setItem("ai_settings", JSON.stringify(merged));
          applySettingsToUI(merged);
        } else if (!localSettings) {
          applySettingsToUI(defaultSettings);
        }
      }
    } catch (error) {
      console.error("Error loading AI settings from Firestore:", error);
      if (!localSettings) applySettingsToUI(defaultSettings);
    }
  };

  // Update UI values
  function applySettingsToUI(settings) {
    const provider = settings.provider || "gemini";

    // Set provider radio
    const radio = document.querySelector(`input[name="aiProvider"][value="${provider}"]`);
    if (radio) {
      radio.checked = true;
      switchProvider(provider);
    }

    // Gemini key
    const geminiKeyEl = document.getElementById("geminiApiKey");
    if (geminiKeyEl) geminiKeyEl.value = settings.apiKey || "";

    // OpenAI key
    const openaiKeyEl = document.getElementById("openaiApiKey");
    if (openaiKeyEl) openaiKeyEl.value = settings.openaiApiKey || "";

    // Gemini model
    const modelEl = document.getElementById("geminiModel");
    const customModelEl = document.getElementById("geminiModelCustom");
    if (modelEl) {
      const knownModels = [
        "gemini-3.5-flash", "gemini-3.1-pro", "gemini-3.1-flash-lite",
        "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash",
        "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.5-flash-lite"
      ];
      const modelVal = settings.model || "gemini-3.5-flash";
      if (knownModels.includes(modelVal)) {
        modelEl.value = modelVal;
        if (customModelEl) { customModelEl.style.display = "none"; customModelEl.value = ""; }
      } else {
        modelEl.value = "custom";
        if (customModelEl) { customModelEl.style.display = "block"; customModelEl.value = modelVal; }
      }
    }

    // OpenAI model
    const openaiModelEl = document.getElementById("openaiModel");
    if (openaiModelEl) openaiModelEl.value = settings.openaiModel || "gpt-4o";

    // Extraction settings
    const checks = { aiNormalizeDates: "normalizeDates", aiMergeNames: "mergeNames",
      aiExtractStructured: "extractStructured", aiIncludeOcr: "includeOcr", aiSaveHistory: "saveHistory" };
    for (const [id, key] of Object.entries(checks)) {
      const el = document.getElementById(id);
      if (el) el.checked = settings[key] !== false;
    }
  }

  // Save Settings to Firestore & LocalStorage
  window.saveAiSettings = async function() {
    const provider = document.querySelector('input[name="aiProvider"]:checked')?.value || "gemini";
    const apiKey = document.getElementById("geminiApiKey")?.value.trim() || "";
    const openaiApiKey = document.getElementById("openaiApiKey")?.value.trim() || "";
    const modelEl = document.getElementById("geminiModel");
    const customModelEl = document.getElementById("geminiModelCustom");
    const openaiModel = document.getElementById("openaiModel")?.value || "gpt-4o";
    const normalizeDates = document.getElementById("aiNormalizeDates")?.checked ?? true;
    const mergeNames = document.getElementById("aiMergeNames")?.checked ?? true;
    const extractStructured = document.getElementById("aiExtractStructured")?.checked ?? true;
    const includeOcr = document.getElementById("aiIncludeOcr")?.checked ?? true;
    const saveHistory = document.getElementById("aiSaveHistory")?.checked ?? true;

    let model = "gemini-3.5-flash";
    if (modelEl) {
      model = modelEl.value === "custom" ? (customModelEl?.value.trim() || "gemini-3.5-flash") : modelEl.value;
    }

    const newSettings = {
      provider, apiKey, openaiApiKey, model, openaiModel,
      normalizeDates, mergeNames, extractStructured, includeOcr, saveHistory,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem("ai_settings", JSON.stringify(newSettings));

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

  // Unified validate — dispatches to the active provider
  window.validateAiKey = async function() {
    const provider = document.querySelector('input[name="aiProvider"]:checked')?.value || "gemini";
    if (provider === "openai") {
      await validateOpenAIKey();
    } else {
      await validateGeminiKey();
    }
  };

  // Validate Gemini API Key
  window.validateGeminiKey = async function() {
    const apiKey = document.getElementById("geminiApiKey")?.value.trim();
    if (!apiKey) {
      _notify("Please enter a Gemini API key first!", "error"); return;
    }
    _notify("Validating Gemini API key...", "info");
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(testUrl);
      const data = await response.json();
      if (response.ok) {
        _notify("Gemini API Key is valid! ✓", "success");
      } else {
        _notify(`Validation failed: ${data.error?.message || "Invalid key"}`, "error");
      }
    } catch (error) {
      console.error("Validation error:", error);
      _notify("Network error validating Gemini key. Check connection.", "error");
    }
  };

  // Validate OpenAI API Key
  async function validateOpenAIKey() {
    const apiKey = document.getElementById("openaiApiKey")?.value.trim();
    if (!apiKey) {
      _notify("Please enter an OpenAI API key first!", "error"); return;
    }
    _notify("Validating OpenAI API key...", "info");
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const data = await response.json();
      if (response.ok) {
        _notify("OpenAI API Key is valid! ✓", "success");
      } else {
        _notify(`Validation failed: ${data.error?.message || "Invalid key"}`, "error");
      }
    } catch (error) {
      console.error("OpenAI validation error:", error);
      _notify("Network error validating OpenAI key. Check connection.", "error");
    }
  }

  // Helper: show notification or alert
  function _notify(msg, type) {
    if (typeof showNotification === "function") {
      showNotification(msg, type);
    } else {
      alert(msg);
    }
  }

  // Expose getActiveAiSettings for document extractor and other modules
  window.getActiveAiSettings = function() {
    try {
      const stored = localStorage.getItem("ai_settings");
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch(e) {}
    return { ...defaultSettings };
  };
})();
