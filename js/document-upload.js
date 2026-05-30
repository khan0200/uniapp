// Document Upload & Processing Module for AI Extractor
(function () {
  let fileInput, uploadZone, processingOverlay, previewWrapper, previewImage;

  document.addEventListener("DOMContentLoaded", () => {
    fileInput = document.getElementById("fileInput");
    uploadZone = document.getElementById("uploadZone");
    processingOverlay = document.getElementById("processingOverlay");
    previewWrapper = document.getElementById("previewWrapper");
    previewImage = document.getElementById("previewImage");

    if (uploadZone) {
      // Drag & Drop event listeners
      ["dragenter", "dragover"].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          uploadZone.classList.add("dragover");
        }, false);
      });

      ["dragleave", "drop"].forEach((eventName) => {
        uploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          uploadZone.classList.remove("dragover");
        }, false);
      });

      uploadZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          handleUploadedFile(files[0]);
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          handleUploadedFile(e.target.files[0]);
        }
      });
    }

    // Global Clipboard paste (Ctrl+V) listener
    document.addEventListener("paste", (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") === 0) {
          const file = items[i].getAsFile();
          handleUploadedFile(file);
          window.showToast("Screenshot detected and uploaded from clipboard!", "success");
          break;
        }
      }
    });
  });

  // Handle file parsing and processing
  async function handleUploadedFile(file) {
    if (!file.type.match("image.*")) {
      window.showToast("Error: Only image files (JPG, PNG, WEBP) are supported.", "danger");
      return;
    }

    // Load image preview immediately
    const reader = new FileReader();
    reader.onload = function (e) {
      if (previewImage && previewWrapper) {
        previewImage.src = e.target.result;
        previewWrapper.style.display = "block";
      }

      // Start processing task
      const base64Data = e.target.result.split(",")[1];
      processDocumentWithAI(base64Data, file.type, file.name);
    };
    reader.readAsDataURL(file);
  }

  // Clear uploaded image
  window.clearUploadedImage = function() {
    if (previewImage && previewWrapper && fileInput) {
      previewImage.src = "";
      previewWrapper.style.display = "none";
      fileInput.value = "";
      // Reset details panels
      document.getElementById("noResultsText").style.display = "block";
      document.getElementById("fieldsContainer").style.display = "none";
      document.getElementById("quickCopyPanel").style.display = "none";
      document.getElementById("ocrPanel").style.display = "none";
      document.getElementById("docTypeBadge").style.display = "none";
    }
  };

  // Call the serverless function to execute extraction using Gemini
  async function processDocumentWithAI(base64Image, mimeType, filename) {
    if (processingOverlay) {
      processingOverlay.classList.add("show");
    }

    // Fetch AI config settings from localStorage
    let aiSettings = {};
    try {
      const stored = localStorage.getItem("ai_settings");
      if (stored) aiSettings = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load stored AI config settings:", e);
    }

    const payload = {
      image: base64Image,
      mimeType: mimeType,
      apiKey: aiSettings.apiKey || "",
      model: aiSettings.model || "gemini-2.5-flash",
      settings: {
        normalizeDates: aiSettings.normalizeDates !== false,
        mergeNames: aiSettings.mergeNames !== false,
        extractStructured: aiSettings.extractStructured !== false,
        includeOcr: aiSettings.includeOcr !== false
      }
    };

    try {
      const response = await fetch("/api/extract-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract document information.");
      }

      // Successfully processed!
      if (processingOverlay) {
        processingOverlay.classList.remove("show");
      }

      window.showToast("Document analyzed successfully!", "success");

      // Log history in Firestore if enabled
      if (aiSettings.saveHistory !== false) {
        window.logExtractionHistory(data.document_type || "Unknown", data.fields || {}, filename);
      }

      // Display results
      window.displayExtractionResults(data);

    } catch (error) {
      console.error("Extraction error:", error);
      if (processingOverlay) {
        processingOverlay.classList.remove("show");
      }
      window.showToast(`Extraction failed: ${error.message}`, "danger");
    }
  }
})();
