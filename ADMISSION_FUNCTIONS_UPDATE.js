// ==========================================
// ADMISSIONS FUNCTIONS - UPDATED
// ==========================================

// Populate education level dropdown when modal opens
function populateAdmissionEducationLevels() {
    const levelSelect = document.getElementById('admissionEducationLevel');
    if (!levelSelect) return;

    const levels = window.levelsData || [];
    let html = '<option value="">Choose Education Level...</option>';

    levels.forEach(level => {
        html += `<option value="${level.name}">${level.name}</option>`;
    });

    levelSelect.innerHTML = html;
}

// Update universities based on selected education level
function updateAdmissionUniversities() {
    const levelSelect = document.getElementById('admissionEducationLevel');
    const universitySelect = document.getElementById('admissionUniversity');

    if (!levelSelect || !universitySelect) return;

    const selectedLevel = levelSelect.value;
    universitySelect.innerHTML = '<option value="">Choose University...</option>';

    if (!selectedLevel) return;

    const universities = getUniversitiesForLevel(selectedLevel);
    universities.forEach(uni => {
        universitySelect.innerHTML += `<option value="${uni}">${uni}</option>`;
    });
}

// Generate round date pickers based on selected number of rounds
function generateRoundDatePickers() {
    const roundsCount = parseInt(document.getElementById('admissionRounds').value);
    const container = document.getElementById('roundsContainer');

    if (!roundsCount || !container) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    for (let i = 1; i <= roundsCount; i++) {
        html += `
            <div class="round-section mb-4 p-3" style="background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
                <h6 class="fw-bold mb-3"><i class="bi bi-circle-fill me-2" style="font-size: 0.5rem;"></i>Round ${i}</h6>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label for="round${i}OnlineApp" class="form-label">Online Application</label>
                        <input type="date" class="form-control ios-input" id="round${i}OnlineApp">
                    </div>
                    <div class="col-md-6">
                        <label for="round${i}DocSubmission" class="form-label">Document Submission</label>
                        <input type="date" class="form-control ios-input" id="round${i}DocSubmission">
                    </div>
                    <div class="col-md-6">
                        <label for="round${i}Interview" class="form-label">Interview</label>
                        <input type="date" class="form-control ios-input" id="round${i}Interview">
                    </div>
                    <div class="col-md-6">
                        <label for="round${i}Announcement" class="form-label">Announcement</label>
                        <input type="date" class="form-control ios-input" id="round${i}Announcement">
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderAdmissions() {
    const admissionsList = document.getElementById('admissionsList');
    const admissionsCounter = document.getElementById('admissionsCounter');
    const admissions = window.admissionsData || [];

    if (admissions.length === 0) {
        admissionsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox icon-empty-state"></i>
                <p class="text-secondary mt-3">No admissions yet. Click "Add Admission" to get started.</p>
            </div>
        `;
        admissionsCounter.textContent = 'No admissions';
        return;
    }

    admissionsCounter.textContent = `${admissions.length} admission${admissions.length > 1 ? 's' : ''}`;

    let html = '';
    admissions.forEach((admission, index) => {
        const roundsText = admission.rounds && admission.rounds.length > 0 ?
            `${admission.rounds.length} Round${admission.rounds.length > 1 ? 's' : ''}` :
            'No rounds';

        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card-apple p-3 h-100 cursor-pointer hover-lift" onclick="viewAdmissionDetails(${index})">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0 fw-bold text-truncate" style="max-width: 70%;">${admission.universityName}</h6>
                        <span class="badge bg-info">${roundsText}</span>
                    </div>
                    <p class="text-secondary small mb-1">
                        <i class="bi bi-mortarboard me-1"></i>${admission.educationLevel || '-'}
                    </p>
                    ${admission.rounds && admission.rounds.length > 0 ? `
                        <p class="text-secondary small mb-0">
                            <i class="bi bi-calendar me-1"></i>Latest: ${formatDisplayDate(getLatestDate(admission.rounds))}
                        </p>
                    ` : ''}
                </div>
            </div>
        `;
    });

    admissionsList.innerHTML = html;
}

// Helper function to get the latest date from rounds
function getLatestDate(rounds) {
    let latestDate = null;
    rounds.forEach(round => {
        const dates = [round.onlineApplication, round.documentSubmission, round.interview, round.announcement];
        dates.forEach(date => {
            if (date && (!latestDate || new Date(date) > new Date(latestDate))) {
                latestDate = date;
            }
        });
    });
    return latestDate;
}

function saveAdmission() {
    const educationLevel = document.getElementById('admissionEducationLevel').value;
    const university = document.getElementById('admissionUniversity').value;
    const roundsCount = parseInt(document.getElementById('admissionRounds').value);
    const editId = document.getElementById('admissionEditId').value;

    // Validate required fields
    if (!educationLevel || !university || !roundsCount) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    // Collect round data
    const rounds = [];
    for (let i = 1; i <= roundsCount; i++) {
        const onlineAppEl = document.getElementById(`round${i}OnlineApp`);
        const docSubmissionEl = document.getElementById(`round${i}DocSubmission`);
        const interviewEl = document.getElementById(`round${i}Interview`);
        const announcementEl = document.getElementById(`round${i}Announcement`);

        const onlineApp = onlineAppEl ? onlineAppEl.value : '';
        const docSubmission = docSubmissionEl ? docSubmissionEl.value : '';
        const interview = interviewEl ? interviewEl.value : '';
        const announcement = announcementEl ? announcementEl.value : '';

        rounds.push({
            roundNumber: i,
            onlineApplication: onlineApp,
            documentSubmission: docSubmission,
            interview: interview,
            announcement: announcement
        });
    }

    const admissionData = {
        educationLevel: educationLevel,
        universityName: university,
        roundsCount: roundsCount,
        rounds: rounds,
        createdAt: new Date().toISOString()
    };

    if (editId) {
        // Edit existing admission
        const index = parseInt(editId);
        const admissionRecord = window.admissionsData[index];
        const firestoreId = admissionRecord ? admissionRecord.firestoreId : null;
        window.admissionsData[index] = {
            ...window.admissionsData[index],
            ...admissionData
        };

        if (typeof updateAdmissionInFirestore === 'function' && firestoreId) {
            updateAdmissionInFirestore(firestoreId, admissionData);
        } else {
            localStorage.setItem('admissionsData', JSON.stringify(window.admissionsData));
        }
        showNotification('Admission updated successfully!', 'success');
    } else {
        // Add new admission
        if (typeof saveAdmissionToFirestore === 'function') {
            saveAdmissionToFirestore(admissionData);
        } else {
            window.admissionsData.push(admissionData);
            localStorage.setItem('admissionsData', JSON.stringify(window.admissionsData));
            showNotification('Admission saved successfully!', 'success');
        }
    }

    renderAdmissions();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addAdmissionModal'));
    modal.hide();
    document.getElementById('addAdmissionForm').reset();
    document.getElementById('admissionEditId').value = '';
    document.getElementById('admissionModalTitle').textContent = 'Add Admission Record';
    document.getElementById('roundsContainer').innerHTML = '';
}

function viewAdmissionDetails(index) {
    const admission = window.admissionsData[index];
    if (!admission) return;

    currentAdmissionId = index;

    let detailsHtml = `
        <div class="mb-3">
            <label class="detail-label">Education Level</label>
            <p class="mb-0"><span class="badge badge-level fs-6">${admission.educationLevel}</span></p>
        </div>
        <div class="mb-3">
            <label class="detail-label">University Name</label>
            <p class="mb-0 fw-bold fs-5">${admission.universityName}</p>
        </div>
        <div class="mb-3">
            <label class="detail-label">Number of Rounds</label>
            <p class="mb-0"><span class="badge bg-info fs-6">${admission.roundsCount} Round${admission.roundsCount > 1 ? 's' : ''}</span></p>
        </div>
    `;

    // Display each round
    if (admission.rounds && admission.rounds.length > 0) {
        admission.rounds.forEach((round, idx) => {
            detailsHtml += `
                <div class="mb-4 p-3" style="background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
                    <h6 class="fw-bold mb-3"><i class="bi bi-circle-fill me-2" style="font-size: 0.5rem;"></i>Round ${round.roundNumber}</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="detail-label small">Online Application</label>
                            <p class="mb-0">${round.onlineApplication ? formatDisplayDate(round.onlineApplication) : '-'}</p>
                        </div>
                        <div class="col-md-6">
                            <label class="detail-label small">Document Submission</label>
                            <p class="mb-0">${round.documentSubmission ? formatDisplayDate(round.documentSubmission) : '-'}</p>
                        </div>
                        <div class="col-md-6">
                            <label class="detail-label small">Interview</label>
                            <p class="mb-0">${round.interview ? formatDisplayDate(round.interview) : '-'}</p>
                        </div>
                        <div class="col-md-6">
                            <label class="detail-label small">Announcement</label>
                            <p class="mb-0">${round.announcement ? formatDisplayDate(round.announcement) : '-'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('admissionDetailsContent').innerHTML = detailsHtml;
    const modal = new bootstrap.Modal(document.getElementById('viewAdmissionModal'));
    modal.show();
}

function editAdmission() {
    if (currentAdmissionId === null) return;

    const admission = window.admissionsData[currentAdmissionId];
    if (!admission) return;

    // Close view modal
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewAdmissionModal'));
    viewModal.hide();

    // Populate education levels first
    populateAdmissionEducationLevels();

    // Small delay to ensure dropdown is populated
    setTimeout(() => {
        // Populate edit form
        document.getElementById('admissionEducationLevel').value = admission.educationLevel;
        updateAdmissionUniversities();

        setTimeout(() => {
            document.getElementById('admissionUniversity').value = admission.universityName;
            document.getElementById('admissionRounds').value = admission.roundsCount;
            generateRoundDatePickers();

            // Populate round dates
            setTimeout(() => {
                if (admission.rounds) {
                    admission.rounds.forEach(round => {
                        const i = round.roundNumber;
                        if (document.getElementById(`round${i}OnlineApp`)) {
                            document.getElementById(`round${i}OnlineApp`).value = round.onlineApplication || '';
                            document.getElementById(`round${i}DocSubmission`).value = round.documentSubmission || '';
                            document.getElementById(`round${i}Interview`).value = round.interview || '';
                            document.getElementById(`round${i}Announcement`).value = round.announcement || '';
                        }
                    });
                }
            }, 100);
        }, 100);

        document.getElementById('admissionEditId').value = currentAdmissionId;
        document.getElementById('admissionModalTitle').textContent = 'Edit Admission Record';

        // Open add/edit modal
        const addModal = new bootstrap.Modal(document.getElementById('addAdmissionModal'));
        addModal.show();
    }, 100);
}

function deleteAdmission() {
    if (currentAdmissionId === null) return;

    const admission = window.admissionsData[currentAdmissionId];
    if (!admission) return;

    if (!confirm(`Are you sure you want to delete this admission record for "${admission.universityName}"?`)) {
        return;
    }

    if (typeof deleteAdmissionFromFirestore === 'function' && admission.firestoreId) {
        deleteAdmissionFromFirestore(admission.firestoreId);
    } else {
        window.admissionsData.splice(currentAdmissionId, 1);
        localStorage.setItem('admissionsData', JSON.stringify(window.admissionsData));
    }

    renderAdmissions();
    showNotification('Admission deleted successfully!', 'success');

    const modal = bootstrap.Modal.getInstance(document.getElementById('viewAdmissionModal'));
    modal.hide();
    currentAdmissionId = null;
}

// Setup modal event listeners to populate dropdowns when opened
document.addEventListener('DOMContentLoaded', function () {
    const admissionModal = document.getElementById('addAdmissionModal');
    if (admissionModal) {
        admissionModal.addEventListener('show.bs.modal', function () {
            // Only populate if not editing (editId is empty)
            if (!document.getElementById('admissionEditId').value) {
                populateAdmissionEducationLevels();
            }
        });
    }
});

// Expose new functions to window
window.populateAdmissionEducationLevels = populateAdmissionEducationLevels;
window.updateAdmissionUniversities = updateAdmissionUniversities;
window.generateRoundDatePickers = generateRoundDatePickers;
window.getLatestDate = getLatestDate;