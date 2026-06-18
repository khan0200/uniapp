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

  // Call the serverless function to execute extraction using Gemini or OpenAI
  async function processDocumentWithAI(base64Image, mimeType, filename) {
    if (processingOverlay) {
      processingOverlay.classList.add("show");
    }

    // Show skeletons immediately on start
    if (window.showSkeletonFields) {
      window.showSkeletonFields(5);
    }

    // Fetch AI config settings from localStorage
    let aiSettings = {};
    try {
      const stored = localStorage.getItem("ai_settings");
      if (stored) aiSettings = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load stored AI config settings:", e);
    }

    const provider = aiSettings.provider || "gemini";

    const payload = {
      image: base64Image,
      mimeType: mimeType,
      provider: provider,
      apiKey: provider === "openai" ? (aiSettings.openaiApiKey || "") : (aiSettings.apiKey || ""),
      model: provider === "openai" ? (aiSettings.openaiModel || "gpt-4o") : (aiSettings.model || "gemini-3.5-flash"),
      settings: {
        normalizeDates: aiSettings.normalizeDates !== false,
        mergeNames: aiSettings.mergeNames !== false,
        extractStructured: aiSettings.extractStructured !== false,
        includeOcr: aiSettings.includeOcr !== false
      }
    };

    try {
      let data;
      // Skip local proxy API call if running on a static server port or local file protocol
      const isStaticDevServer = window.location.protocol === "file:" || ["5500", "5501", "5502", "8000", "8080", "8081"].includes(window.location.port);
      let callDirectly = isStaticDevServer;

      if (!callDirectly) {
        try {
          const response = await fetch("/api/extract-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (response.status === 405 || response.status === 404) {
            callDirectly = true;
          } else {
            const text = await response.text();
            try { data = JSON.parse(text); } catch (e) { callDirectly = true; }
            if (!callDirectly && !response.ok) {
              throw new Error(data?.error || "Failed to extract document information.");
            }
          }
        } catch (err) {
          console.warn("Local API proxy error, falling back to direct call...", err);
          callDirectly = true;
        }
      }

      if (callDirectly) {
        if (provider === "openai") {
          console.log("Calling OpenAI API directly from browser...");
          data = await callOpenAIDirectlyFromBrowser(payload);
        } else {
          console.log("Calling Gemini API directly from browser...");
          data = await callGeminiDirectlyFromBrowser(payload);
        }
      }

      // Successfully processed!
      if (processingOverlay) processingOverlay.classList.remove("show");
      window.showToast("Document analyzed successfully!", "success");

      if (window.displayExtractionResultsProgressively) {
        window.displayExtractionResultsProgressively(data, callDirectly);
      } else {
        window.displayExtractionResults(data);
      }

    } catch (error) {
      console.error("Extraction error:", error);
      if (processingOverlay) processingOverlay.classList.remove("show");
      if (window.clearRemainingSkeletons) window.clearRemainingSkeletons();
      window.showToast(`Extraction failed: ${error.message}`, "danger");
    }
  }

  // ─── OpenAI Vision Extractor ────────────────────────────────────────────────
  async function callOpenAIDirectlyFromBrowser(payload) {
    const { image, mimeType, apiKey, model, settings } = payload;
    if (!apiKey) {
      throw new Error("OpenAI API Key is not configured. Please configure it in AI Settings.");
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
Analyze the uploaded document image.

Specific instructions:
${extraInstructions}- Identify the document type automatically (e.g. Passport, ID Card, Diploma, Certificate, Visa, Transcript, Contact Info).
- Generate ONLY necessary structured fields that are meaningful for the identified document type. Do not perform a general OCR of every text block, and do not extract design markings, watermarks, signatures, or noisy metadata.
- If the document is a Passport or ID Card, extract ONLY these fields:
  - "FULL_NAME": Concatenation of Surname + Given Names + Father's Name (patronymic / Otasining ismi) in that exact order (e.g. "ISAKJONOV MUKHAMMADIYOR NAVRUZBEK UGLI").
  - "PASSPORT_NUMBER"
  - "DATE_OF_BIRTH"
  - "DATE_OF_ISSUE"
  - "DATE_OF_EXPIRATION"
  - "SEX" (value must be exactly "M" or "F")
- If the document is a graduation/educational document (e.g. Shahodatnoma, Diploma, Certificate, Transcript):
  - Generate ONLY the primary educational fields available on the document, such as: "GRADUATION_DATE", "YEAR_OF_ISSUE", "NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION", "MAJOR_OR_SPECIALTY", "DEPARTMENT".
  - The "NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION" field MUST be translated into English and formatted in all UPPERCASE.
- If the document contains contact information (e.g. a screenshot of a chat, message, or Telegram conversation showing an email, phone numbers, or address):
  - Set document_type to "CONTACT INFO".
  - Extract ONLY these fields if present: "EMAIL", "PHONE_NUMBER_1", "PHONE_NUMBER_2", "ADDRESS" (translated to English, ALL UPPERCASE).
- If the document is of another type:
  - Automatically detect and generate ONLY the key fields (maximum 5-6 core identifiers or dates).
- Ignore watermarks, decorative branding, or irrelevant numbers.
- Provide a full raw OCR text in the "ocr_text" property.

Return JSON only. No explanation. Output must be exactly in this JSON format:
{
  "document_type": "...",
  "fields": {
    "FIELD_NAME": "value"
  },
  "ocr_text": "..."
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        stream: true,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                  detail: "high"
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Error communicating with OpenAI API");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";
    let buffer = "";
    const revealedFields = new Set();

    function processOpenAIChunk(text) {
      const fieldsIdx = text.indexOf('"fields"');
      if (fieldsIdx === -1) return;
      const fieldsSub = text.substring(fieldsIdx);
      const regex = /"([^"\\]+(?:\\.[^"\\]*)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let match;
      while ((match = regex.exec(fieldsSub)) !== null) {
        const key = match[1].trim();
        const val = match[2];
        if (key === "document_type" || key === "ocr_text" || key === "fields") continue;
        if (!revealedFields.has(key)) {
          revealedFields.add(key);
          if (window.revealExtractedField) window.revealExtractedField(key, val);
        }
      }
      const docTypeMatch = text.match(/"document_type"\s*:\s*"([^"\\]+(?:\\.[^"\\]*)*)"/);
      if (docTypeMatch?.[1] && window.revealDocumentType) window.revealDocumentType(docTypeMatch[1]);
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (let line of lines) {
        line = line.trim();
        if (!line || !line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const chunk = JSON.parse(jsonStr);
          const delta = chunk.choices?.[0]?.delta?.content || "";
          accumulatedText += delta;
          processOpenAIChunk(accumulatedText);
        } catch (e) { /* partial chunk, ignore */ }
      }
    }

    // Clean markdown fences if present
    let cleanJson = accumulatedText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    try {
      return JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse OpenAI JSON output:", cleanJson);
      throw new Error("OpenAI output was not valid JSON");
    }
  }

  // ─── Gemini Vision Extractor ─────────────────────────────────────────────────
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

Specific instructions:
${extraInstructions}
- Identify the document type automatically (e.g. Passport, ID Card, Diploma, Certificate, Visa, Transcript, Contact Info).
- Generate ONLY necessary structured fields that are meaningful for the identified document type. Do not perform a general OCR of every text block, and do not extract design markings, watermarks, signatures, or noisy metadata.
- If the document is a Passport or ID Card, extract ONLY these fields:
  - "FULL_NAME": Concatenation of Surname + Given Names + Father's Name (patronymic / Otasining ismi) in that exact order (e.g. "ISAKJONOV MUKHAMMADIYOR NAVRUZBEK UGLI").
  - "PASSPORT_NUMBER"
  - "DATE_OF_BIRTH"
  - "DATE_OF_ISSUE"
  - "DATE_OF_EXPIRATION"
  - "SEX" (value must be exactly "M" or "F")
- If the document is a graduation/educational document (e.g. Shahodatnoma, Diploma, Certificate, Transcript):
  - Generate ONLY the primary educational fields available on the document, such as: "GRADUATION_DATE", "YEAR_OF_ISSUE", "NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION", "MAJOR_OR_SPECIALTY", "DEPARTMENT".
  - The "NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION" field MUST be translated into English and formatted in all UPPERCASE (e.g. "SPECIALIZED SCHOOL NO. 72 OF MARHAMAT DISTRICT" or "TASHKENT STATE UNIVERSITY").
- If the document contains contact information (e.g. a screenshot of a chat, message, or Telegram conversation showing an email, phone numbers, or address):
  - Set document_type to "CONTACT INFO".
  - Extract ONLY these fields if present:
    - "EMAIL": The email address exactly as written (preserve original case).
    - "PHONE_NUMBER_1": The first phone number found.
    - "PHONE_NUMBER_2": The second phone number found (if any).
    - "ADDRESS": The physical/home address. MUST be translated into English and formatted in ALL UPPERCASE (e.g. "SURKHANDARYA REGION, QIZIRIQ DISTRICT, QORASUV MAHALLA").
  - Only include fields that are actually present in the document. Do not hallucinate fields.
- If the document is of another type:
  - Automatically detect and generate ONLY the key fields (maximum 5-6 core identifiers or dates) necessary to describe that document. Do not perform a general OCR of every text block.
- Ignore watermarks, decorative branding, or irrelevant numbers.
- Provide a full raw OCR text in the "ocr_text" property.

Return JSON only. Do not explain anything. Output must be exactly in this JSON format:
{
  "document_type": "...",
  "fields": {
    // Generate appropriate fields here dynamically depending on document type.
    // For Passports: FULL_NAME, PASSPORT_NUMBER, DATE_OF_BIRTH, DATE_OF_ISSUE, DATE_OF_EXPIRATION, SEX.
    // For Diplomas/Certificates: NAME_OF_SCHOOL_OR_EDUCATIONAL_INSTITUTION, GRADUATION_DATE, YEAR_OF_ISSUE, MAJOR_OR_SPECIALTY, DEPARTMENT.
    // For Contact Info: EMAIL, PHONE_NUMBER_1, PHONE_NUMBER_2, ADDRESS.
  },
  "ocr_text": "..."
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

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

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errMsg = data.error?.message || "Error communicating with Gemini API";
      throw new Error(errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";
    let buffer = "";
    const revealedFields = new Set();

    function processProgressiveFields(text) {
      const fieldsIdx = text.indexOf('"fields"');
      if (fieldsIdx === -1) return;

      const fieldsSub = text.substring(fieldsIdx);
      const regex = /"([^"\\]+(?:\\.[^"\\]*)*)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      let match;
      while ((match = regex.exec(fieldsSub)) !== null) {
        const key = match[1];
        const val = match[2];
        const cleanKey = key.trim();
        if (cleanKey === "document_type" || cleanKey === "ocr_text" || cleanKey === "fields") continue;

        if (!revealedFields.has(cleanKey)) {
          revealedFields.add(cleanKey);
          if (window.revealExtractedField) {
            window.revealExtractedField(cleanKey, val);
          }
        }
      }

      // Extract document type as soon as it appears
      const docTypeMatch = text.match(/"document_type"\s*:\s*"([^"\\]+(?:\\.[^"\\]*)*)"/);
      if (docTypeMatch && docTypeMatch[1] && window.revealDocumentType) {
        window.revealDocumentType(docTypeMatch[1]);
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep partial line in buffer

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const chunkData = JSON.parse(jsonStr);
            const chunkText = chunkData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            accumulatedText += chunkText;
            processProgressiveFields(accumulatedText);
          } catch (e) {
            console.warn("Failed to parse SSE JSON chunk:", e, jsonStr);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer) {
      let line = buffer.trim();
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        try {
          const chunkData = JSON.parse(jsonStr);
          const chunkText = chunkData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          accumulatedText += chunkText;
          processProgressiveFields(accumulatedText);
        } catch (e) {}
      }
    }

    // Clean up markdown block format in case Gemini returned it enclosed in ```json
    let cleanJson = accumulatedText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }

    try {
      return JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse accumulated Gemini JSON output:", cleanJson);
      throw new Error("Gemini output was not valid JSON");
    }
  }
})();
