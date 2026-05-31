// Document Fields Save, Edit, and Auto-Fill module
(function () {
  let fieldsContainer, quickCopyPanel, quickCopyChips, docTypeBadge, noResultsText;
  let ocrPanel, ocrTextarea;
  let currentExtractedFields = []; // Local cached list of extracted fields: {key, value}

  const FIELD_MAPPING = {
    "FULL NAME": "fullName",
    "PASSPORT NUMBER": "passport",
    "DATE OF BIRTH": "birthday",
    "DATE OF ISSUE": "dateOfIssue",
    "DATE OF EXPIRATION": "dateOfExpiration",
    "SEX": "gender",
    "NAME OF SCHOOL / EDUCATIONAL INSTITUTION": "educationalBackground",
    "NAME OF SCHOOL OR EDUCATIONAL INSTITUTION": "educationalBackground",
    "NAME OF SCHOOL": "educationalBackground",
    "EDUCATIONAL INSTITUTION": "educationalBackground",
    "SCHOOL NAME": "educationalBackground",
    // Contact Info fields
    "EMAIL": "email",
    "PHONE NUMBER 1": "phone1",
    "PHONE NUMBER 2": "phone2",
    "PHONE 1": "phone1",
    "PHONE 2": "phone2",
    "ADDRESS": "address"
  };

  document.addEventListener("DOMContentLoaded", () => {
    fieldsContainer = document.getElementById("fieldsContainer");
    quickCopyPanel = document.getElementById("quickCopyPanel");
    quickCopyChips = document.getElementById("quickCopyChips");
    docTypeBadge = document.getElementById("docTypeBadge");
    noResultsText = document.getElementById("noResultsText");
    ocrPanel = document.getElementById("ocrPanel");
    ocrTextarea = document.getElementById("ocrTextarea");
  });

  // Toast notification helper
  window.showToast = function(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toastEl = document.createElement("div");
    // Bootstrap bg mapping
    const bgClass = type === "danger" || type === "error" ? "bg-danger" : 
                    type === "warning" ? "bg-warning" : 
                    type === "info" ? "bg-info" : "bg-success";

    toastEl.className = `toast align-items-center text-white ${bgClass} border-0 show mb-2`;
    toastEl.role = "alert";
    toastEl.ariaLive = "assertive";
    toastEl.ariaAtomic = "true";

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${
            type === "success" ? "bi-check-circle-fill" : 
            type === "danger" || type === "error" ? "bi-exclamation-triangle-fill" : 
            "bi-info-circle-fill"
          }"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toastEl);

    // Auto-remove toast
    setTimeout(() => {
      toastEl.classList.remove("show");
      setTimeout(() => toastEl.remove(), 300);
    }, 4000);
  };

  // Show skeleton shimmer placeholders
  window.showSkeletonFields = function (count = 5) {
    currentExtractedFields = []; // Reset locally
    if (noResultsText) noResultsText.style.display = "none";
    if (fieldsContainer) {
      fieldsContainer.style.display = "block";
      let skeletonHtml = "";
      for (let i = 0; i < count; i++) {
        skeletonHtml += `
          <div class="field-item skeleton-field">
            <div>
              <div class="skeleton-name"></div>
              <div class="skeleton-value"></div>
            </div>
            <div class="skeleton-btn-group">
              <div class="skeleton-btn"></div>
              <div class="skeleton-btn"></div>
              <div class="skeleton-btn"></div>
              <div class="skeleton-btn save-to"></div>
            </div>
          </div>
        `;
      }
      fieldsContainer.innerHTML = skeletonHtml;
    }

    if (quickCopyPanel) quickCopyPanel.style.display = "none";
    if (ocrPanel) ocrPanel.style.display = "none";
    if (docTypeBadge) docTypeBadge.style.display = "none";
  };

  // Reveal a single extracted field in the UI
  window.revealExtractedField = function (key, value) {
    // Check if this field is already revealed to avoid duplicates
    const cleanKey = key.trim();
    const existingIndex = currentExtractedFields.findIndex(f => f.key === cleanKey);
    if (existingIndex !== -1) {
      // Just update value if it has changed
      if (currentExtractedFields[existingIndex].value !== value) {
        currentExtractedFields[existingIndex].value = value;
        const valEl = document.getElementById(`field-value-${existingIndex}`);
        if (valEl) valEl.textContent = value;
      }
      return;
    }

    currentExtractedFields.push({ key: cleanKey, value: value });
    const index = currentExtractedFields.length - 1;

    const formattedKey = cleanKey.replace(/_/g, " ");
    const cleanLabel = formattedKey.toUpperCase().trim();
    const firestoreField = FIELD_MAPPING[cleanLabel] || "";
    const titleText = firestoreField 
      ? `Save To >>\nUpdates: ${firestoreField}` 
      : `Save To >>\nUpdates: (not mapped)`;
    
    let disabledAttr = firestoreField ? "" : "disabled style='opacity: 0.5; cursor: not-allowed;'";
    let buttonText = `<i class="bi bi-cloud-arrow-down"></i> Save To &gt;&gt;`;
    let buttonClass = "action-btn save-to";

    // Pre-render as Saved if current student data already matches this field's value
    if (firestoreField && window.currentStudentData) {
      const dbValue = window.currentStudentData[firestoreField] || "";
      const dbSexValue = (firestoreField === "gender") ? (window.currentStudentData["sex"] || "") : "";
      const dbIssueValue = (firestoreField === "dateOfIssue") ? (window.currentStudentData["passportIssueDate"] || "") : "";
      const dbExpireValue = (firestoreField === "dateOfExpiration") ? (window.currentStudentData["passportExpireDate"] || "") : "";
      
      const cleanDbValue = dbValue.toString().trim().toUpperCase();
      const cleanDbSexValue = dbSexValue.toString().trim().toUpperCase();
      const cleanDbIssueValue = dbIssueValue.toString().trim().toUpperCase();
      const cleanDbExpireValue = dbExpireValue.toString().trim().toUpperCase();
      const cleanNewValue = value.toString().trim().toUpperCase();

      let isSaved = false;
      if (firestoreField === "gender") {
        isSaved = (cleanDbValue === cleanNewValue) && (cleanDbSexValue === cleanNewValue);
      } else if (firestoreField === "dateOfIssue") {
        isSaved = (cleanDbValue === cleanNewValue) && (cleanDbIssueValue === cleanNewValue);
      } else if (firestoreField === "dateOfExpiration") {
        isSaved = (cleanDbValue === cleanNewValue) && (cleanDbExpireValue === cleanNewValue);
      } else {
        isSaved = (cleanDbValue === cleanNewValue);
      }

      if (isSaved) {
        buttonText = `Saved ✓`;
        buttonClass = "action-btn save-to success-saved-btn";
        disabledAttr = "disabled";
      }
    }
    
    // Escape quotes to prevent breaks in HTML attributes/JSON onclick params
    const escapedKey = formattedKey.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const escapedValue = value.replace(/'/g, "\\'").replace(/"/g, "&quot;");

    let saveButtonHtml = "";
    if (firestoreField) {
      saveButtonHtml = `
        <button class="${buttonClass}" onclick="saveFieldToStudent(this, '${escapedKey}', '${escapedValue}')" title="${titleText}" ${disabledAttr}>
          ${buttonText}
        </button>
      `;
    }

    const fieldHtml = `
      <div class="field-item">
        <div>
          <div class="field-name">${formattedKey}</div>
          <div class="field-value" id="field-value-${index}">${value}</div>
        </div>
        <div class="action-btn-group">
          <button class="action-btn copy" onclick="copyValue('${escapedValue}')" title="Copy to clipboard">
            <i class="bi bi-clipboard"></i>
          </button>
          <button class="action-btn edit" onclick="openEditFieldModal(${index})" title="Edit value">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="action-btn delete" onclick="confirmDeleteField(${index})" title="Delete field">
            <i class="bi bi-trash"></i>
          </button>
          ${saveButtonHtml}
        </div>
      </div>
    `;

    if (fieldsContainer) {
      // Find the first skeleton field
      const firstSkeleton = fieldsContainer.querySelector(".skeleton-field");
      if (firstSkeleton) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = fieldHtml.trim();
        fieldsContainer.replaceChild(tempDiv.firstChild, firstSkeleton);
      } else {
        fieldsContainer.insertAdjacentHTML("beforeend", fieldHtml);
      }
    }

    // Add to quick copy chips
    if (quickCopyPanel && quickCopyChips) {
      const chipHtml = `
        <button class="chip-button" onclick="copyValue('${escapedValue}')">
          <i class="bi bi-clipboard me-1"></i>
          <strong>${formattedKey}:</strong> ${value}
        </button>
      `;
      if (quickCopyPanel.style.display === "none") {
        quickCopyChips.innerHTML = chipHtml;
        quickCopyPanel.style.display = "block";
      } else {
        quickCopyChips.insertAdjacentHTML("beforeend", chipHtml);
      }
    }
  };

  // Reveal document type badge in real-time
  window.revealDocumentType = function (docType) {
    if (docTypeBadge) {
      docTypeBadge.textContent = `Type: ${docType}`;
      docTypeBadge.style.display = "inline-block";
    }
  };

  // Remove any remaining skeletons when stream ends
  window.clearRemainingSkeletons = function () {
    if (fieldsContainer) {
      const skeletons = fieldsContainer.querySelectorAll(".skeleton-field");
      skeletons.forEach(s => s.remove());

      if (currentExtractedFields.length === 0) {
        fieldsContainer.innerHTML = `<div class="text-center py-4 text-secondary">No fields extracted.</div>`;
        if (quickCopyPanel) quickCopyPanel.style.display = "none";
      }
    }
  };

  // Display results progressively (either directly or via simulated staggered timeout)
  window.displayExtractionResultsProgressively = function (data, isAlreadyStreamed = false) {
    window.currentExtractionData = data;
    window.hasLoggedExtraction = false;

    if (noResultsText) noResultsText.style.display = "none";
    if (fieldsContainer) fieldsContainer.style.display = "block";

    // Set Document Type Badge
    if (docTypeBadge && data.document_type) {
      window.revealDocumentType(data.document_type);
    }

    const fieldsToReveal = [];
    if (data.fields) {
      Object.keys(data.fields).forEach((key) => {
        if (data.fields[key]) {
          fieldsToReveal.push({
            key: key,
            value: data.fields[key]
          });
        }
      });
    }

    if (isAlreadyStreamed) {
      // Direct stream has already called window.revealExtractedField for all fields.
      // But make sure everything is in currentExtractedFields just in case
      fieldsToReveal.forEach((field) => {
        window.revealExtractedField(field.key, field.value);
      });
      completeExtraction(data);
    } else {
      // Simulated progressive reveal
      let delay = 0;
      if (fieldsToReveal.length === 0) {
        completeExtraction(data);
      } else {
        fieldsToReveal.forEach((field, idx) => {
          setTimeout(() => {
            window.revealExtractedField(field.key, field.value);
            if (idx === fieldsToReveal.length - 1) {
              completeExtraction(data);
            }
          }, delay);
          delay += 150; // Stagger by 150ms
        });
      }
    }
  };

  function completeExtraction(data) {
    window.clearRemainingSkeletons();

    // Load OCR panel if text exists
    if (data.ocr_text && ocrPanel && ocrTextarea) {
      ocrTextarea.innerText = data.ocr_text;
      ocrPanel.style.display = "block";
    } else if (ocrPanel) {
      ocrPanel.style.display = "none";
    }
  }

  // Display all results extracted by Gemini (Legacy entry point fallback)
  window.displayExtractionResults = function (data) {
    window.displayExtractionResultsProgressively(data, false);
  };

  // Render the extracted fields list and quick copy chips
  function renderFieldsList() {
    if (!fieldsContainer) return;

    if (currentExtractedFields.length === 0) {
      fieldsContainer.innerHTML = `<div class="text-center py-4 text-secondary">No fields extracted.</div>`;
      if (quickCopyPanel) quickCopyPanel.style.display = "none";
      return;
    }

    // Render list items
    fieldsContainer.innerHTML = currentExtractedFields
      .map((field, index) => {
        const formattedKey = field.key.replace(/_/g, " ");
        const cleanLabel = formattedKey.toUpperCase().trim();
        const firestoreField = FIELD_MAPPING[cleanLabel] || "";
        const titleText = firestoreField 
          ? `Save To >>\nUpdates: ${firestoreField}` 
          : `Save To >>\nUpdates: (not mapped)`;
        
        let disabledAttr = firestoreField ? "" : "disabled style='opacity: 0.5; cursor: not-allowed;'";
        let buttonText = `<i class="bi bi-cloud-arrow-down"></i> Save To &gt;&gt;`;
        let buttonClass = "action-btn save-to";

        // Pre-render as Saved if current student data already matches this field's value
        if (firestoreField && window.currentStudentData) {
          const dbValue = window.currentStudentData[firestoreField] || "";
          const dbSexValue = (firestoreField === "gender") ? (window.currentStudentData["sex"] || "") : "";
          const dbIssueValue = (firestoreField === "dateOfIssue") ? (window.currentStudentData["passportIssueDate"] || "") : "";
          const dbExpireValue = (firestoreField === "dateOfExpiration") ? (window.currentStudentData["passportExpireDate"] || "") : "";
          
          const cleanDbValue = dbValue.toString().trim().toUpperCase();
          const cleanDbSexValue = dbSexValue.toString().trim().toUpperCase();
          const cleanDbIssueValue = dbIssueValue.toString().trim().toUpperCase();
          const cleanDbExpireValue = dbExpireValue.toString().trim().toUpperCase();
          const cleanNewValue = field.value.toString().trim().toUpperCase();

          let isSaved = false;
          if (firestoreField === "gender") {
            isSaved = (cleanDbValue === cleanNewValue) && (cleanDbSexValue === cleanNewValue);
          } else if (firestoreField === "dateOfIssue") {
            isSaved = (cleanDbValue === cleanNewValue) && (cleanDbIssueValue === cleanNewValue);
          } else if (firestoreField === "dateOfExpiration") {
            isSaved = (cleanDbValue === cleanNewValue) && (cleanDbExpireValue === cleanNewValue);
          } else {
            isSaved = (cleanDbValue === cleanNewValue);
          }

          if (isSaved) {
            buttonText = `Saved ✓`;
            buttonClass = "action-btn save-to success-saved-btn";
            disabledAttr = "disabled";
          }
        }
        
        // Escape quotes to prevent breaks in HTML attributes/JSON onclick params
        const escapedKey = formattedKey.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const escapedValue = field.value.replace(/'/g, "\\'").replace(/"/g, "&quot;");

        let saveButtonHtml = "";
        if (firestoreField) {
          saveButtonHtml = `
            <button class="${buttonClass}" onclick="saveFieldToStudent(this, '${escapedKey}', '${escapedValue}')" title="${titleText}" ${disabledAttr}>
              ${buttonText}
            </button>
          `;
        }

        return `
          <div class="field-item">
            <div>
              <div class="field-name">${formattedKey}</div>
              <div class="field-value" id="field-value-${index}">${field.value}</div>
            </div>
            <div class="action-btn-group">
              <button class="action-btn copy" onclick="copyValue('${escapedValue}')" title="Copy to clipboard">
                <i class="bi bi-clipboard"></i>
              </button>
              <button class="action-btn edit" onclick="openEditFieldModal(${index})" title="Edit value">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="action-btn delete" onclick="confirmDeleteField(${index})" title="Delete field">
                <i class="bi bi-trash"></i>
              </button>
              ${saveButtonHtml}
            </div>
          </div>
        `;
      })
      .join("");

    // Render quick copy chips
    if (quickCopyPanel && quickCopyChips) {
      quickCopyChips.innerHTML = currentExtractedFields
        .map((field) => {
          const formattedKey = field.key.replace(/_/g, " ");
          return `
            <button class="chip-button" onclick="copyValue('${field.value.replace(/'/g, "\\'")}')">
              <i class="bi bi-clipboard me-1"></i>
              <strong>${formattedKey}:</strong> ${field.value}
            </button>
          `;
        })
        .join("");
      quickCopyPanel.style.display = "block";
    }
  }

  // Copy helper
  window.copyValue = function (value) {
    navigator.clipboard.writeText(value)
      .then(() => {
        window.showToast("Copied successfully!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        window.showToast("Copy failed", "danger");
      });
  };

  // Edit extracted fields
  let activeEditIndex = null;
  window.openEditFieldModal = function (index) {
    activeEditIndex = index;
    const field = currentExtractedFields[index];
    const formattedKey = field.key.replace(/_/g, " ");

    const labelEl = document.getElementById("editFieldLabel");
    const valInput = document.getElementById("editFieldValueInput");

    if (labelEl) labelEl.textContent = `Edit value for: ${formattedKey}`;
    if (valInput) valInput.value = field.value;

    const modal = new bootstrap.Modal(document.getElementById("editValueModal"));
    modal.show();
  };

  window.executeFieldEdit = function () {
    if (activeEditIndex === null) return;

    const valInput = document.getElementById("editFieldValueInput");
    if (!valInput) return;

    const newValue = valInput.value.trim();
    if (!newValue) {
      window.showToast("Value cannot be empty!", "warning");
      return;
    }

    // Save locally
    currentExtractedFields[activeEditIndex].value = newValue;

    // Close modal
    const modalEl = document.getElementById("editValueModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Re-render
    renderFieldsList();
    window.showToast("Field updated locally.", "success");
  };

  // Delete extracted fields
  window.confirmDeleteField = function (index) {
    const field = currentExtractedFields[index];
    const formattedKey = field.key.replace(/_/g, " ");

    if (confirm(`Are you sure you want to remove the field "${formattedKey}"?`)) {
      currentExtractedFields.splice(index, 1);
      renderFieldsList();
      window.showToast("Field removed.", "info");
    }
  };

  // Save Field directly to Student Profile in Firestore
  window.saveFieldToStudent = async function (btn, fieldLabel, value) {
    const cleanLabel = fieldLabel.replace(/_/g, " ").toUpperCase().trim();
    const firestoreField = FIELD_MAPPING[cleanLabel];

    if (!firestoreField) {
      window.showToast(`No mapping found for field: ${fieldLabel}`, "warning");
      return;
    }

    const studentId = new URLSearchParams(window.location.search).get("studentId");
    if (!studentId) {
      window.showToast("Student ID not found in URL", "danger");
      return;
    }    // Check if value already matches current student data in Firestore
    if (window.currentStudentData) {
      const dbValue = window.currentStudentData[firestoreField] || "";
      const dbSexValue = (firestoreField === "gender") ? (window.currentStudentData["sex"] || "") : "";
      const dbIssueValue = (firestoreField === "dateOfIssue") ? (window.currentStudentData["passportIssueDate"] || "") : "";
      const dbExpireValue = (firestoreField === "dateOfExpiration") ? (window.currentStudentData["passportExpireDate"] || "") : "";
      
      const cleanDbValue = dbValue.toString().trim().toUpperCase();
      const cleanDbSexValue = dbSexValue.toString().trim().toUpperCase();
      const cleanDbIssueValue = dbIssueValue.toString().trim().toUpperCase();
      const cleanDbExpireValue = dbExpireValue.toString().trim().toUpperCase();
      const cleanNewValue = value.toString().trim().toUpperCase();

      let isSaved = false;
      if (firestoreField === "gender") {
        isSaved = (cleanDbValue === cleanNewValue) && (cleanDbSexValue === cleanNewValue);
      } else if (firestoreField === "dateOfIssue") {
        isSaved = (cleanDbValue === cleanNewValue) && (cleanDbIssueValue === cleanNewValue);
      } else if (firestoreField === "dateOfExpiration") {
        isSaved = (cleanDbValue === cleanNewValue) && (cleanDbExpireValue === cleanNewValue);
      } else {
        isSaved = (cleanDbValue === cleanNewValue);
      }

      if (isSaved) {
        window.showToast(`${cleanLabel} is already up to date`, "info");
        btn.innerHTML = `Saved ✓`;
        btn.className = "action-btn save-to success-saved-btn"; 
        btn.disabled = true;
        return;
      }
    }

    const originalHtml = btn.innerHTML;
    
    // Set saving state: button text becomes "Saving...", disable, show spinner
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Saving...`;

    try {
      if (typeof db !== "undefined") {
        let finalValue = value;
        // Uppercase these fields (email is intentionally excluded to preserve case)
        if (["fullName", "passport", "address", "educationalBackground", "phone1", "phone2"].includes(firestoreField)) {
          finalValue = value.toUpperCase();
        }

        const updateData = {
          [firestoreField]: finalValue,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // If field is gender, write to sex as well to support existing DB schema
        if (firestoreField === "gender") {
          updateData["sex"] = finalValue;
        }

        // If field is dateOfIssue, write to passportIssueDate as well to support existing DB schema
        if (firestoreField === "dateOfIssue") {
          updateData["passportIssueDate"] = finalValue;
        }

        // If field is dateOfExpiration, write to passportExpireDate as well to support existing DB schema
        if (firestoreField === "dateOfExpiration") {
          updateData["passportExpireDate"] = finalValue;
        }

        // Run update query in Firebase Firestore
        await db.collection("students").doc(studentId).update(updateData);

        // Success state: show success toast, button changes to "Saved ✓", disable button, green success styling
        window.showToast(`${cleanLabel} saved successfully`, "success");
        btn.innerHTML = `Saved ✓`;
        btn.className = "action-btn save-to success-saved-btn"; 
        btn.disabled = true;

        // Sync header details if matching
        if (firestoreField === "fullName") {
          const nameHeader = document.getElementById("studentHeaderName");
          if (nameHeader) nameHeader.textContent = value.toUpperCase();
        } else if (firestoreField === "passport") {
          const passportHeader = document.getElementById("studentHeaderPassport");
          if (passportHeader) passportHeader.textContent = `Passport: ${value.toUpperCase()}`;
        }

        // Log history in Firestore if enabled and not already logged for this extraction session
        let aiSettings = {};
        try {
          const stored = localStorage.getItem("ai_settings");
          if (stored) aiSettings = JSON.parse(stored);
        } catch (e) {
          console.warn("Failed to load stored AI config settings:", e);
        }

        if (aiSettings.saveHistory !== false && !window.hasLoggedExtraction && window.currentExtractionData) {
          const filename = window.uploadedFileData ? window.uploadedFileData.filename : "uploaded_image.png";
          window.logExtractionHistory(
            window.currentExtractionData.document_type || "Unknown",
            window.currentExtractionData.fields || {},
            filename
          );
          window.hasLoggedExtraction = true;
        }
      } else {
        throw new Error("Firestore DB reference not found");
      }
    } catch (error) {
      console.error("Firestore update error:", error);
      window.showToast("Failed to save field", "danger");
      
      // Restore button state on error to allow retry
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  };

  // Full OCR search functionality
  window.searchOcrText = function (query) {
    const ocrTextarea = document.getElementById("ocrTextarea");
    if (!ocrTextarea) return;

    const rawText = ocrTextarea.innerText;
    if (!query) {
      ocrTextarea.innerText = rawText; // Reset highlighting
      return;
    }

    // Highlight queries using spans
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const highlighted = rawText.replace(regex, `<mark style="background: rgba(251, 191, 36, 0.4); color: white;">$1</mark>`);
    ocrTextarea.innerHTML = highlighted;
  };

  window.copyFullOcrText = function () {
    const ocrTextarea = document.getElementById("ocrTextarea");
    if (ocrTextarea) {
      window.copyValue(ocrTextarea.innerText);
    }
  };
})();
