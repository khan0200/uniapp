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

  // Compress and resize image client-side to speed up network transmission and AI processing time
  function compressImage(file, maxDimension = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG data URL
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = function (err) {
          reject(err);
        };
        img.src = e.target.result;
      };
      reader.onerror = function (err) {
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle file parsing and processing
  async function handleUploadedFile(file) {
    if (!file.type.match("image.*")) {
      window.showToast("Error: Only image files (JPG, PNG, WEBP) are supported.", "danger");
      return;
    }

    try {
      // Compress and resize the image client-side for extremely fast uploads and processing
      const compressedDataUrl = await compressImage(file, 1200, 0.8);
      
      if (previewImage && previewWrapper) {
        previewImage.src = compressedDataUrl;
        previewWrapper.style.display = "block";
      }

      // Hide the Drag & Drop area since 1 document is uploaded
      if (uploadZone) {
        uploadZone.style.display = "none";
      }

      // Store base64 data for manual extraction
      const base64Data = compressedDataUrl.split(",")[1];
      window.uploadedFileData = {
        base64Data: base64Data,
        mimeType: "image/jpeg", // Converted to JPEG
        filename: file.name
      };
    } catch (err) {
      console.warn("Client-side compression failed, falling back to raw image:", err);
      
      // Fallback: load raw image preview and base64
      const reader = new FileReader();
      reader.onload = function (e) {
        if (previewImage && previewWrapper) {
          previewImage.src = e.target.result;
          previewWrapper.style.display = "block";
        }

        if (uploadZone) {
          uploadZone.style.display = "none";
        }

        const base64Data = e.target.result.split(",")[1];
        window.uploadedFileData = {
          base64Data: base64Data,
          mimeType: file.type,
          filename: file.name
        };
      };
      reader.readAsDataURL(file);
    }
  }

  // Clear uploaded image
  window.clearUploadedImage = function() {
    window.uploadedFileData = null;
    if (previewImage && previewWrapper && fileInput) {
      previewImage.src = "";
      previewWrapper.style.display = "none";
      fileInput.value = "";
      // Show the Drag & Drop area again
      if (uploadZone) {
        uploadZone.style.display = "flex";
      }
      // Reset details panels
      document.getElementById("noResultsText").style.display = "block";
      document.getElementById("fieldsContainer").style.display = "none";
      const qcp = document.getElementById("quickCopyPanel");
      const ocr = document.getElementById("ocrPanel");
      if (qcp) qcp.style.display = "none";
      if (ocr) ocr.style.display = "none";
      document.getElementById("docTypeBadge").style.display = "none";
    }
  };

  // Expose manual trigger function
  window.triggerExtraction = function() {
    if (!window.uploadedFileData) {
      window.showToast("Please upload or paste a document first.", "warning");
      return;
    }
    const { base64Data, mimeType, filename } = window.uploadedFileData;
    processDocumentWithAI(base64Data, mimeType, filename);
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
      model: aiSettings.model || "gemini-3.5-flash",
      settings: {
        normalizeDates: aiSettings.normalizeDates !== false,
        mergeNames: aiSettings.mergeNames !== false,
        extractStructured: aiSettings.extractStructured !== false,
        includeOcr: aiSettings.includeOcr !== false
      }
    };

    try {
      let data;
      // Skip local proxy API call if running on a static server port or local file protocol to prevent 405 Method Not Allowed red console errors
      const isStaticDevServer = window.location.protocol === "file:" || ["5500", "5501", "5502", "8000", "8080", "8081"].includes(window.location.port);
      let callDirectly = isStaticDevServer;

      if (!callDirectly) {
        try {
          const response = await fetch("/api/extract-document", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          if (response.status === 405 || response.status === 404) {
            callDirectly = true;
          } else {
            const text = await response.text();
            try {
              data = JSON.parse(text);
            } catch (e) {
              // HTML error page returned (e.g. 405 method not allowed HTML body)
              callDirectly = true;
            }

            if (!callDirectly && !response.ok) {
              throw new Error(data?.error || "Failed to extract document information.");
            }
          }
        } catch (err) {
          console.warn("Local API proxy returned an error. Falling back to direct browser connection...", err);
          callDirectly = true;
        }
      }

      if (callDirectly) {
        console.log("Calling Gemini API directly from browser fallback...");
        data = await callGeminiDirectlyFromBrowser(payload);
      }

      // Successfully processed!
      if (processingOverlay) {
        processingOverlay.classList.remove("show");
      }

      window.showToast("Document analyzed successfully!", "success");


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

  // Call Gemini API directly from browser if the serverless function is not running (e.g. static dev server)
  async function callGeminiDirectlyFromBrowser(payload) {
    const { image, mimeType, apiKey, model, settings } = payload;
    if (!apiKey) {
      throw new Error("Gemini API Key is not configured. Please configure it in AI Settings.");
    }

    let extraInstructions = "";
    if (settings) {
      if (settings.normalizeDates) {
        extraInstructions += "- Normalize all extracted dates to YYYY-MM-DD format (e.g. '12 April 2006' -> '2006-04-12').\n";
      }
      if (settings.mergeNames) {
        extraInstructions += "- Merge names (first name, given name, family name) into a single FULL NAME field where applicable.\n";
      }
    }

    const promptText = `You are an OCR and document extraction assistant.
Analyze the uploaded document.
Extract all readable information.

Specific instructions:
${extraInstructions}
- Identify the document type automatically (e.g. Passport, ID Card, Diploma, Certificate, Visa, Transcript).
- The "FULL_NAME" field MUST be constructed as the concatenation of: Surname + Given Names + Father's Name (patronymic / Otasining ismi) if present on the document, in that exact order (e.g., combining Surname + Given Names + Otasining ismi like "ISAKJONOV MUKHAMMADIYOR NAVRUZBEK UGLI" or "ABDUKHOSHIMOV DONIYORBEK SIROJIDDIN UGLI"). Ensure no part of the name (like Father's name / Otasining ismi) is omitted.
- Extract the sex/gender field as "SEX" (value must be exactly "M" or "F").
- Extract only meaningful fields (e.g. FULL NAME, PASSPORT NUMBER, DATE OF BIRTH, DATE OF ISSUE, DATE OF EXPIRATION, SEX, etc.).
- Ignore watermarks, decorative branding, or irrelevant numbers.
- Provide a full raw OCR text in the "ocr_text" property.

Return JSON only. Do not explain anything. Output must be exactly in this JSON format:
{
  "document_type": "...",
  "ocr_text": "...",
  "fields": {
    "FULL_NAME": "...",
    "PASSPORT_NUMBER": "...",
    "DATE_OF_BIRTH": "...",
    "DATE_OF_ISSUE": "...",
    "DATE_OF_EXPIRATION": "...",
    "SEX": "..."
  }
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.error?.message || "Error communicating with Gemini API";
      throw new Error(errMsg);
    }

    const candidates = data.candidates || [];
    if (candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
      throw new Error("No content returned from Gemini");
    }

    const resultText = candidates[0].content.parts[0].text;
    try {
      return JSON.parse(resultText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON output:", resultText);
      throw new Error("Gemini output was not valid JSON");
    }
  }
})();
