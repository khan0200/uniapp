// Document Extraction Logging & History module
(function () {
  // Logs successful document extractions to Firestore collection 'document_extractions'
  window.logExtractionHistory = async function (documentType, extractedFields, filename) {
    const studentId = window.currentStudentId; // Set globally in document-extractor.js
    if (!studentId) {
      console.warn("Could not log history: student ID not loaded.");
      return;
    }

    const logData = {
      studentId: studentId,
      documentType: documentType,
      extractedFields: extractedFields,
      uploadedFileName: filename || "uploaded_image.png",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (typeof db !== "undefined") {
        await db.collection("document_extractions").add(logData);
        console.log("✅ Document extraction successfully logged to Firestore.");
      }
    } catch (error) {
      console.error("❌ Failed to log document extraction history:", error);
    }
  };
})();
