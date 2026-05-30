// Document Fields Save, Edit, and Auto-Fill module
(function () {
  let fieldsContainer, quickCopyPanel, quickCopyChips, docTypeBadge, noResultsText;
  let ocrPanel, ocrTextarea;
  let currentExtractedFields = []; // Local cached list of extracted fields: {key, value}

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

  // Display all results extracted by Gemini
  window.displayExtractionResults = function (data) {
    if (noResultsText) noResultsText.style.display = "none";
    if (fieldsContainer) fieldsContainer.style.display = "block";

    // Set Document Type Badge
    if (docTypeBadge && data.document_type) {
      docTypeBadge.textContent = `Type: ${data.document_type}`;
      docTypeBadge.style.display = "inline-block";
    }

    // Load extracted fields
    currentExtractedFields = [];
    if (data.fields) {
      Object.keys(data.fields).forEach((key) => {
        // Only include non-empty values
        if (data.fields[key]) {
          currentExtractedFields.push({
            key: key,
            value: data.fields[key]
          });
        }
      });
    }

    // Render panels
    renderFieldsList();

    // Load OCR panel if text exists
    if (data.ocr_text && ocrPanel && ocrTextarea) {
      ocrTextarea.innerText = data.ocr_text;
      ocrPanel.style.display = "block";
    } else if (ocrPanel) {
      ocrPanel.style.display = "none";
    }
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
        return `
          <div class="field-item">
            <div>
              <div class="field-name">${formattedKey}</div>
              <div class="field-value" id="field-value-${index}">${field.value}</div>
            </div>
            <div class="action-btn-group">
              <button class="action-btn copy" onclick="copyValue('${field.value.replace(/'/g, "\\'")}')" title="Copy to clipboard">
                <i class="bi bi-clipboard"></i>
              </button>
              <button class="action-btn edit" onclick="openEditFieldModal(${index})" title="Edit value">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="action-btn delete" onclick="confirmDeleteField(${index})" title="Delete field">
                <i class="bi bi-trash"></i>
              </button>
              <button class="action-btn save-to" onclick="openSaveToModal(${index})" title="Save to student profile">
                <i class="bi bi-cloud-arrow-down"></i> Save To &gt;&gt;
              </button>
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

  // Save to Student Profile modal & handler
  let activeSaveIndex = null;
  window.openSaveToModal = function (index) {
    activeSaveIndex = index;
    const field = currentExtractedFields[index];

    const valDisplay = document.getElementById("saveToModalValue");
    if (valDisplay) valDisplay.textContent = field.value;

    // Smart auto-suggest
    const selectEl = document.getElementById("saveToFieldSelect");
    const suggestText = document.getElementById("smartSuggestText");

    if (selectEl) {
      const suggestField = suggestDestinationField(field.key);
      if (suggestField) {
        selectEl.value = suggestField;
        if (suggestText) {
          suggestText.innerHTML = `<i class="bi bi-lightbulb-fill"></i> Suggested match: <strong>${selectEl.options[selectEl.selectedIndex].text}</strong>`;
          suggestText.style.display = "block";
        }
      } else {
        if (suggestText) suggestText.style.display = "none";
      }
    }

    const modal = new bootstrap.Modal(document.getElementById("saveToModal"));
    modal.show();
  };

  // Smart suggestions mapping helper
  function suggestDestinationField(geminiKey) {
    const key = geminiKey.toUpperCase();
    if (key.includes("FULL_NAME") || key === "NAME") return "fullName";
    if (key.includes("PASSPORT_NUMBER") || key === "PASSPORT") return "passport";
    if (key.includes("DATE_OF_BIRTH") || key === "DOB" || key.includes("BIRTHDATE") || key.includes("DATE_OF_BIRTH")) return "birthday";
    if (key.includes("DATE_OF_ISSUE") || key.includes("ISSUE_DATE")) return "passportIssueDate";
    if (key.includes("DATE_OF_EXPIRATION") || key.includes("EXPIRE_DATE") || key.includes("EXPIRY_DATE")) return "passportExpireDate";
    if (key.includes("NATIONALITY")) return "nationality";
    if (key.includes("PHONE") || key.includes("MOBILE") || key.includes("NUMBER")) return "phone1";
    if (key.includes("EMAIL")) return "email";
    if (key.includes("ADDRESS")) return "address";
    if (key.includes("EDUCATIONAL") || key.includes("BACKGROUND") || key.includes("EDUCATION")) return "educationalBackground";
    if (key.includes("LEAD")) return "leadBy";
    return null;
  }

  // Update field selection suggest label on selection changes
  document.addEventListener("DOMContentLoaded", () => {
    const selectEl = document.getElementById("saveToFieldSelect");
    if (selectEl) {
      selectEl.addEventListener("change", () => {
        const suggestText = document.getElementById("smartSuggestText");
        if (suggestText) suggestText.style.display = "none"; // Hide suggestion info once changed manually
      });
    }
  });

  // Execute actual Firestore update
  window.executeFieldSave = async function () {
    if (activeSaveIndex === null) return;

    const selectEl = document.getElementById("saveToFieldSelect");
    const fieldName = selectEl.value;
    const fieldText = selectEl.options[selectEl.selectedIndex].text;
    const value = currentExtractedFields[activeSaveIndex].value;

    const studentId = window.currentStudentId; // Set in document-extractor.js
    if (!studentId) {
      window.showToast("Error: No student profile loaded!", "danger");
      return;
    }

    try {
      if (typeof db !== "undefined") {
        const updateData = {};
        
        // Handle special values / formatting
        if (fieldName === "fullName" || fieldName === "passport" || fieldName === "address") {
          updateData[fieldName] = value.toUpperCase();
        } else {
          updateData[fieldName] = value;
        }

        // Run update query in Firebase Firestore
        await db.collection("students").doc(studentId).update(updateData);

        // Hide modal
        const modalEl = document.getElementById("saveToModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        window.showToast(`${fieldText} updated successfully!`, "success");

        // Sync header details if matching
        if (fieldName === "fullName") {
          document.getElementById("studentHeaderName").textContent = value.toUpperCase();
        } else if (fieldName === "passport") {
          document.getElementById("studentHeaderPassport").textContent = `Passport: ${value.toUpperCase()}`;
        }
      }
    } catch (error) {
      console.error("Firestore update error:", error);
      window.showToast("Failed to save to student profile.", "danger");
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
