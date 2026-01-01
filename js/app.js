// ==========================================
// UNIBRIDGE CRM - MAIN APPLICATION LOGIC
// ==========================================

// Global Data Storage (use window.studentsData set by firebase-config.js)
if (!window.studentsData) {
    window.studentsData = [];
}
let currentStudentId = null;

// Dynamic University Data Function - returns universities for a given level from Firestore
function getUniversitiesForLevel(level) {
    if (!window.universitiesData || !level) return [];
    return window.universitiesData
        .filter(u => u.levelName === level)
        .map(u => u.name);
}

// Legacy compatibility: uniData object that dynamically fetches from Firestore
const uniData = new Proxy({}, {
    get: function (target, prop) {
        return getUniversitiesForLevel(prop);
    }
});

// Tariff Mapping
const tariffValues = {
    'STANDART': '13,000,000 UZS',
    'PREMIUM': '32,500,000 UZS',
    'VISA PLUS': '65,000,000 UZS',
    'E-VISA': '2,000,000 UZS',
    'REGIONAL VISA': '2,000,000 UZS'
};

// Tariff Amounts (numeric values for balance calculation)
const tariffAmounts = {
    'STANDART': 13000000,
    'PREMIUM': 32500000,
    'VISA PLUS': 65000000,
    'E-VISA': 2000000,
    'REGIONAL VISA': 2000000
};

function showTab(tabName) {
    document.getElementById('students-tab').style.display = 'none';
    document.getElementById('payments-tab').style.display = 'none';
    document.getElementById('settings-tab').style.display = 'none';
    document.querySelectorAll('.nav-link-apple').forEach(link => link.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).style.display = 'block';
    document.getElementById(`nav-${tabName}`).classList.add('active');

    // Render payment students when payments tab is activated
    if (tabName === 'payments' && typeof renderPaymentStudents === 'function') {
        renderPaymentStudents();
    }

    // Render settings lists when settings tab is activated
    if (tabName === 'settings') {
        if (typeof renderTariffsList === 'function') renderTariffsList();
        if (typeof renderLevelsList === 'function') renderLevelsList();
        if (typeof renderUniversitiesList === 'function') renderUniversitiesList();
    }
}

function saveStudent() {
    const tariff = document.getElementById('tariff').value;

    // Calculate initial balance (negative of tariff amount = what student owes)
    const initialBalance = tariff && tariffAmounts[tariff] ? -tariffAmounts[tariff] : 0;

    const studentData = {
        id: document.getElementById('studentId').value.trim(),
        fullName: document.getElementById('fullName').value.trim().toUpperCase(),
        phone1: document.getElementById('phone1').value.trim(),
        phone2: '', // Can be added later
        email: '', // Can be added later
        birthday: '', // Can be added later
        passport: '', // Can be added later
        tariff: tariff,
        level: document.getElementById('levelSelect').value,
        languageCertificate: 'TOPIK', // Default, can be changed later
        certificateScore: '', // Can be added later
        university1: document.getElementById('uni1').value,
        university2: '', // Can be added later
        address: document.getElementById('address').value.trim().toUpperCase(),
        notes: '', // Can be added later
        balance: initialBalance, // Initial balance = negative tariff (debt)
        discount: 0, // Initial discount
        createdAt: new Date().toISOString()
    };

    // Validate required fields
    if (!studentData.id || !studentData.fullName || !studentData.phone1 || !studentData.level || !studentData.tariff) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }


    if (typeof saveStudentToFirestore === 'function') {
        saveStudentToFirestore(studentData);
    } else {
        studentsData.push(studentData);
        localStorage.setItem('studentsData', JSON.stringify(studentsData));
        showNotification('Student saved successfully!', 'success');
        renderStudents();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
        modal.hide();
        document.getElementById('addStudentForm').reset();
    }
}


function renderStudents() {
    const container = document.getElementById('studentsList');

    // Check if we're in deleted students view
    const levelDropdown = document.getElementById('filterLevel');
    const isShowingDeleted = levelDropdown && levelDropdown.value === 'DELETED';

    // Filter the data based on deleted status
    const displayData = window.studentsData.filter(s => {
        if (isShowingDeleted) {
            return s.deleted === true;
        } else {
            return !s.deleted;
        }
    });

    if (displayData.length === 0) {
        if (isShowingDeleted) {
            container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-trash" style="font-size: 4rem; opacity: 0.3;"></i><p class="text-secondary mt-3">No deleted students.</p></div>';
        } else {
            container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-inbox" style="font-size: 4rem; opacity: 0.3;"></i><p class="text-secondary mt-3">No students yet. Click "Add Student" to get started.</p></div>';
        }
        return;
    }

    // Ultra-compact card - use unique student ID for identification
    container.innerHTML = displayData.map((s) => {
        // Use firestoreId if available, otherwise use student id as unique identifier
        const uniqueId = s.firestoreId || s.id;

        // Get importance color
        const importanceColors = {
            'GREEN': '#28a745',
            'YELLOW': '#ffc107',
            'RED': '#dc3545'
        };
        const importanceColor = s.noteImportance ? importanceColors[s.noteImportance] : null;

        return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="student-card ${s.deleted ? 'deleted-student' : ''}" onclick="viewStudentDetails('${uniqueId}')">
                ${importanceColor ? `<div class="importance-indicator" style="background: ${importanceColor};"></div>` : ''}
                <div class="student-card-body">
                    <div class="student-name mb-2">${s.deleted ? '<i class="bi bi-trash text-danger me-2"></i>' : ''}${s.fullName}</div>
                    <div class="student-pills">
                        <span class="pill pill-id">${s.id}</span>
                        <span class="pill pill-level">${s.level}</span>
                        <span class="pill pill-tariff">${s.tariff}</span>
                    </div>
                    ${s.notes ? `<div class="student-notes">${s.notes}</div>` : ''}
                </div>
            </div>
        </div>
    `
    }).join('');
}

// View student details in modal - now uses unique ID instead of array index
function viewStudentDetails(uniqueId) {
    // Find student by firestoreId or student id
    const index = window.studentsData.findIndex(student =>
        student.firestoreId === uniqueId || student.id === uniqueId
    );

    if (index === -1) {
        showNotification('Student not found!', 'error');
        return;
    }

    const s = window.studentsData[index];
    currentStudentId = index;

    // Generate university options based on level using dynamic data
    const uniOptions = getUniversitiesForLevel(s.level)
        .map(u => `<option value="${u}">${u}</option>`)
        .join('');

    // Generate tariff options from dynamic data
    const tariffOptions = (window.tariffsData || [])
        .map(t => `<option value="${t.name}" ${s.tariff === t.name ? 'selected' : ''}>${t.name}</option>`)
        .join('');

    // Generate education level options from dynamic data
    const levelOptions = (window.levelsData || [])
        .map(l => `<option value="${l.name}" ${s.level === l.name ? 'selected' : ''}>${l.name}</option>`)
        .join('');

    const detailsHtml = `
        <div class="row g-2">
            <div class="col-md-6">
                <div class="detail-group editable" data-field="id">
                    <label class="detail-label">Student ID</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.id}</span>
                        <button class="edit-btn" onclick="startEdit('id', 'text'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <input type="text" class="form-control ios-input form-control-sm" value="${s.id}" id="edit-id">
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('id')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('id')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="fullName">
                    <label class="detail-label">Full Name</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.fullName}</span>
                        <div class="action-btns">
                            <button class="copy-btn" onclick="copyToClipboard('${s.fullName.replace(/'/g, "\\'")}', this); event.stopPropagation();"><i class="bi bi-clipboard"></i></button>
                            <button class="edit-btn" onclick="startEdit('fullName', 'text'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                        </div>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <input type="text" class="form-control ios-input form-control-sm" value="${s.fullName}" id="edit-fullName" style="text-transform:uppercase;">
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('fullName')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('fullName')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="phone1">
                    <label class="detail-label">Phone 1</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.phone1}</span>
                        <div class="action-btns">
                            <button class="copy-btn" onclick="copyToClipboard('${s.phone1}', this); event.stopPropagation();"><i class="bi bi-clipboard"></i></button>
                            <button class="edit-btn" onclick="startEdit('phone1', 'text'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                        </div>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <input type="text" class="form-control ios-input form-control-sm" value="${s.phone1}" id="edit-phone1" placeholder="00-000-00-00">
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('phone1')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('phone1')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="phone2">
                    <label class="detail-label">Phone 2</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.phone2 || '-'}</span>
                        <div class="action-btns">
                            ${s.phone2 ? `<button class="copy-btn" onclick="copyToClipboard('${s.phone2}', this); event.stopPropagation();"><i class="bi bi-clipboard"></i></button>` : ''}
                            <button class="edit-btn" onclick="startEdit('phone2', 'text'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                        </div>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <input type="text" class="form-control ios-input form-control-sm" value="${s.phone2 || ''}" id="edit-phone2" placeholder="00-000-00-00">
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('phone2')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('phone2')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="email">
                    <label class="detail-label">Email</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.email || '-'}</span>
                        <div class="action-btns">
                            ${s.email ? `<button class="copy-btn" onclick="copyToClipboard('${s.email}', this); event.stopPropagation();"><i class="bi bi-clipboard"></i></button>` : ''}
                            <button class="edit-btn" onclick="startEdit('email', 'text'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                        </div>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <input type="email" class="form-control ios-input form-control-sm" value="${s.email || ''}" id="edit-email" placeholder="student@email.com">
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('email')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('email')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="birthday">
                    <label class="detail-label">Birthday</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.birthday || '-'}</span>
                        <div class="action-btns">
                            ${s.birthday ? `<button class="copy-btn" onclick="copyToClipboard('${s.birthday}', this); event.stopPropagation();"><i class="bi bi-clipboard"></i></button>` : ''}
                            <button class="edit-btn" onclick="startEdit('birthday', 'date'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                        </div>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <input type="date" class="form-control ios-input form-control-sm" value="${s.birthday || ''}" id="edit-birthday" min="1980-01-01" max="2010-12-31">
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('birthday')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('birthday')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="passport">
                    <label class="detail-label">Passport Number</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.passport || '-'}</span>
                        <div class="action-btns">
                            ${s.passport ? `<button class="copy-btn" onclick="copyToClipboard('${s.passport}', this); event.stopPropagation();"><i class="bi bi-clipboard"></i></button>` : ''}
                            <button class="edit-btn" onclick="startEdit('passport', 'text'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                        </div>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <input type="text" class="form-control ios-input form-control-sm" value="${s.passport || ''}" id="edit-passport" placeholder="AA0000000" style="text-transform:uppercase;">
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('passport')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('passport')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="level">
                    <label class="detail-label">Education Level</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value"><span class="badge badge-level">${s.level}</span></span>
                        <button class="edit-btn" onclick="startEdit('level', 'select'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <select class="form-select ios-input form-control-sm" id="edit-level">
                            ${levelOptions}
                        </select>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('level')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('level')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="tariff">
                    <label class="detail-label">Tariff</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value"><span class="badge badge-tariff">${s.tariff}</span></span>
                        <button class="edit-btn" onclick="startEdit('tariff', 'select'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <select class="form-select ios-input form-control-sm" id="edit-tariff">
                            ${tariffOptions}
                        </select>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('tariff')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('tariff')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="languageCertificate">
                    <label class="detail-label">Language Certificate</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value"><span class="badge badge-language">${s.languageCertificate}</span>${s.certificateScore ? ` <span class="score-text">Score: ${s.certificateScore}</span>` : ''}</span>
                        <button class="edit-btn" onclick="startEdit('languageCertificate', 'select'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <div class="d-flex gap-2">
                            <select class="form-select ios-input form-control-sm" id="edit-languageCertificate" style="flex:1;">
                                <option value="TOPIK" ${s.languageCertificate === 'TOPIK' ? 'selected' : ''}>TOPIK</option>
                                <option value="SKA" ${s.languageCertificate === 'SKA' ? 'selected' : ''}>SKA</option>
                                <option value="IELTS" ${s.languageCertificate === 'IELTS' ? 'selected' : ''}>IELTS</option>
                                <option value="TOEFL" ${s.languageCertificate === 'TOEFL' ? 'selected' : ''}>TOEFL</option>
                            </select>
                            <input type="text" class="form-control ios-input form-control-sm" value="${s.certificateScore || ''}" id="edit-certificateScore" placeholder="Score" style="width:80px;">
                        </div>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('languageCertificate')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('languageCertificate')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="university1">
                    <label class="detail-label">University 1</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.university1 || '-'}</span>
                        <button class="edit-btn" onclick="startEdit('university1', 'select'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <select class="form-select ios-input form-control-sm" id="edit-university1">
                            <option value="">Choose University</option>
                            ${uniOptions}
                        </select>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('university1')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('university1')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="detail-group editable" data-field="university2">
                    <label class="detail-label">University 2</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.university2 || '-'}</span>
                        <button class="edit-btn" onclick="startEdit('university2', 'select'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <select class="form-select ios-input form-control-sm" id="edit-university2">
                            <option value="">Choose University</option>
                            ${uniOptions}
                        </select>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('university2')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('university2')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="detail-group editable" data-field="address">
                    <label class="detail-label">Address</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.address || '-'}</span>
                        <div class="action-btns">
                            ${s.address ? `<button class="copy-btn" onclick="copyToClipboard(\`${(s.address || '').replace(/`/g, '\\`').replace(/'/g, "\\'")}\`, this); event.stopPropagation();"><i class="bi bi-clipboard"></i></button>` : ''}
                            <button class="edit-btn" onclick="startEdit('address', 'textarea'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                        </div>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <textarea class="form-control ios-input form-control-sm" id="edit-address" rows="2" style="text-transform:uppercase;">${s.address || ''}</textarea>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('address')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('address')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="detail-group editable" data-field="notes">
                    <label class="detail-label">Notes ${s.noteImportance ? `<span class="badge rounded-pill ms-2" style="background: ${s.noteImportance === 'GREEN' ? '#28a745' : s.noteImportance === 'YELLOW' ? '#ffc107' : '#dc3545'}; color: white; font-size: 0.7rem;">${s.noteImportance}</span>` : ''}</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value">${s.notes || '-'}</span>
                        <button class="edit-btn" onclick="startEdit('notes', 'textarea'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <textarea class="form-control ios-input form-control-sm mb-2" id="edit-notes" rows="2">${s.notes || ''}</textarea>
                        <select class="form-select ios-input form-control-sm mb-2" id="edit-noteImportance">
                            <option value="">No Priority</option>
                            <option value="GREEN" ${s.noteImportance === 'GREEN' ? 'selected' : ''}>🟢 GREEN (Low)</option>
                            <option value="YELLOW" ${s.noteImportance === 'YELLOW' ? 'selected' : ''}>🟡 YELLOW (Medium)</option>
                            <option value="RED" ${s.noteImportance === 'RED' ? 'selected' : ''}>🔴 RED (High)</option>
                        </select>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('notes')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('notes')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('studentDetailsContent').innerHTML = detailsHtml;

    // Set selected values for university dropdowns
    if (s.university1) document.getElementById('edit-university1').value = s.university1;
    if (s.university2) document.getElementById('edit-university2').value = s.university2;

    // Add listener to update university dropdowns when level changes
    const editLevelSelect = document.getElementById('edit-level');
    if (editLevelSelect) {
        editLevelSelect.addEventListener('change', function () {
            const newLevel = this.value;
            const editUni1 = document.getElementById('edit-university1');
            const editUni2 = document.getElementById('edit-university2');

            // Get universities for the new level
            const universities = getUniversitiesForLevel(newLevel);

            // Update both university dropdowns
            [editUni1, editUni2].forEach(select => {
                if (select) {
                    select.innerHTML = '<option value="">Choose University</option>';
                    universities.forEach(uniName => {
                        select.innerHTML += `<option value="${uniName}">${uniName}</option>`;
                    });
                }
            });
        });
    }

    // Show/hide actions based on deleted status
    const deleteBtn = document.getElementById('deleteStudentBtn');
    const deletedActions = document.getElementById('deletedStudentActions');
    const activeActions = document.getElementById('activeStudentActions');

    if (s.deleted) {
        deleteBtn.style.display = 'none';
        deletedActions.style.display = 'flex';
        activeActions.style.display = 'none';
    } else {
        deleteBtn.style.display = 'inline-flex';
        deletedActions.style.display = 'none';
        activeActions.style.display = 'block';
    }

    // Use getOrCreateInstance to avoid creating multiple modal instances
    const modalElement = document.getElementById('viewStudentModal');
    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
        modal = new bootstrap.Modal(modalElement);
    }
    modal.show();
}

// Start inline edit
function startEdit(field, type) {
    const group = document.querySelector(`[data-field="${field}"]`);
    group.querySelector('.detail-value-wrap').style.display = 'none';
    group.querySelector('.edit-field').style.display = 'block';
    const input = document.getElementById(`edit-${field}`);
    if (input) input.focus();
}

// Cancel inline edit
function cancelEdit(field) {
    const group = document.querySelector(`[data-field="${field}"]`);
    group.querySelector('.detail-value-wrap').style.display = 'flex';
    group.querySelector('.edit-field').style.display = 'none';
}

// Save inline edit
function saveEdit(field) {
    const input = document.getElementById(`edit-${field}`);
    let newValue = input.value;

    // Handle uppercase fields
    if (['fullName', 'passport', 'address'].includes(field)) {
        newValue = newValue.toUpperCase();
    }

    // Update student data
    const s = window.studentsData[currentStudentId];
    s[field] = newValue;

    // Handle certificate score separately
    if (field === 'languageCertificate') {
        const scoreInput = document.getElementById('edit-certificateScore');
        s.certificateScore = scoreInput.value;
    }

    // Handle note importance separately
    if (field === 'notes') {
        const importanceInput = document.getElementById('edit-noteImportance');
        s.noteImportance = importanceInput.value;
    }

    // Save to localStorage and Firestore
    localStorage.setItem('studentsData', JSON.stringify(window.studentsData));
    if (typeof updateStudentInFirestore === 'function' && s.firestoreId) {
        updateStudentInFirestore(s.firestoreId, s);
    }

    // Hide edit field and show value (cancel edit mode)
    cancelEdit(field);

    // Update the displayed value
    const group = document.querySelector(`[data-field="${field}"]`);
    const valueSpan = group.querySelector('.detail-value');
    if (valueSpan) {
        valueSpan.textContent = newValue || '-';
    }

    // Refresh the student list
    applyFilters();
    showNotification('Field updated!', 'success');
}

// Confirm delete student (soft delete)
function confirmDeleteStudent() {
    const s = window.studentsData[currentStudentId];
    if (confirm(`Are you sure you want to delete "${s.fullName}"?\n\nThis student will be moved to the "Deleted students" section and can be restored later.`)) {
        deleteStudent();
    }
}

// Soft delete - mark student as deleted
function deleteStudent() {
    const s = window.studentsData[currentStudentId];
    s.deleted = true;
    s.deletedAt = new Date().toISOString();

    // Save to localStorage and Firestore
    localStorage.setItem('studentsData', JSON.stringify(window.studentsData));
    if (typeof updateStudentInFirestore === 'function' && s.firestoreId) {
        updateStudentInFirestore(s.firestoreId, s);
    }

    // Close modal and refresh
    const modalElement = document.getElementById('viewStudentModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();

    renderStudents();
    showNotification('Student moved to deleted!', 'success');
}

// Restore deleted student
function restoreStudent() {
    const s = window.studentsData[currentStudentId];
    s.deleted = false;
    delete s.deletedAt;

    // Save to localStorage and Firestore
    localStorage.setItem('studentsData', JSON.stringify(window.studentsData));
    if (typeof updateStudentInFirestore === 'function' && s.firestoreId) {
        updateStudentInFirestore(s.firestoreId, s);
    }

    // Close modal and refresh
    const modalElement = document.getElementById('viewStudentModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();

    renderStudents();
    showNotification('Student restored successfully!', 'success');
}

// Permanently delete student
function permanentlyDeleteStudent() {
    const s = window.studentsData[currentStudentId];
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${s.fullName}"?\n\n⚠️ This action cannot be undone!`)) {
        return;
    }

    // Delete from Firestore
    if (typeof deleteStudentFromFirestore === 'function' && s.firestoreId) {
        deleteStudentFromFirestore(s.firestoreId);
    }

    // Remove from local array
    window.studentsData.splice(currentStudentId, 1);
    localStorage.setItem('studentsData', JSON.stringify(window.studentsData));

    // Close modal and refresh
    const modalElement = document.getElementById('viewStudentModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();

    renderStudents();
    showNotification('Student permanently deleted!', 'success');
}

function toggleStudentCard(index) {
    document.getElementById(`student-${index}`).classList.toggle('expanded');
}

function downloadStudentExcel(index) {
    if (typeof XLSX === 'undefined') {
        showNotification('Excel library not loaded.', 'error');
        return;
    }
    const s = window.studentsData[index];
    const data = [
        ['Field', 'Value'],
        ['ID', s.id],
        ['Name', s.fullName],
        ['Phone 1', s.phone1],
        ['Tariff', s.tariff]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student');
    XLSX.writeFile(wb, `${s.fullName}_${s.id}.xlsx`);
    showNotification('Excel downloaded!', 'success');
}

function showNotification(message, type = 'success') {
    const n = document.createElement('div');
    n.className = 'toast-notification';
    n.innerHTML = `<div class="d-flex align-items-center"><i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill'} me-2 ${type}-state"></i><span>${message}</span></div>`;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// Copy to clipboard function
function copyToClipboard(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        // Show visual feedback - change icon to checkmark
        const icon = btnElement.querySelector('i');
        icon.className = 'bi bi-check';
        btnElement.classList.add('copied');

        // Reset after animation
        setTimeout(() => {
            icon.className = 'bi bi-clipboard';
            btnElement.classList.remove('copied');
        }, 1500);
    }).catch(err => {
        showNotification('Failed to copy!', 'error');
    });
}

// Filter and search functionality
function applyFilters() {
    const container = document.getElementById('studentsList');
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

    const tariffDropdown = document.getElementById('filterTariff');
    const tariffFilter = tariffDropdown ? tariffDropdown.value : '';

    const levelDropdown = document.getElementById('filterLevel');
    const levelFilter = levelDropdown ? levelDropdown.value : '';

    const filtered = window.studentsData.filter(s => {
        // Handle deleted students filter
        if (levelFilter === 'DELETED') {
            // Only show deleted students
            return s.deleted === true;
        } else {
            // Hide deleted students from normal filters
            if (s.deleted) return false;
        }

        // Search filter (name, ID, phone, email)
        const matchesSearch = !searchQuery ||
            s.fullName.toLowerCase().includes(searchQuery) ||
            s.id.toLowerCase().includes(searchQuery) ||
            s.phone1.toLowerCase().includes(searchQuery) ||
            (s.phone2 && s.phone2.toLowerCase().includes(searchQuery)) ||
            (s.email && s.email.toLowerCase().includes(searchQuery));

        // Tariff filter
        const matchesTariff = !tariffFilter || s.tariff === tariffFilter;

        // Level filter
        const matchesLevel = !levelFilter || s.level === levelFilter;

        return matchesSearch && matchesTariff && matchesLevel;
    });

    // Render filtered data directly (don't replace window.studentsData)
    if (filtered.length === 0) {
        if (levelFilter === 'DELETED') {
            container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-trash" style="font-size: 4rem; opacity: 0.3;"></i><p class="text-secondary mt-3">No deleted students.</p></div>';
        } else {
            container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-search" style="font-size: 4rem; opacity: 0.3;"></i><p class="text-secondary mt-3">No students match your filters.</p></div>';
        }
        return;
    }

    container.innerHTML = filtered.map((s) => {
        const uniqueId = s.firestoreId || s.id;
        return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="student-card ${s.deleted ? 'deleted-student' : ''}" onclick="viewStudentDetails('${uniqueId}')">
                <div class="student-card-body">
                    <div class="student-name mb-2">${s.deleted ? '<i class="bi bi-trash text-danger me-2"></i>' : ''}${s.fullName}</div>
                    <div class="student-pills">
                        <span class="pill pill-id">${s.id}</span>
                        <span class="pill pill-level">${s.level}</span>
                        <span class="pill pill-tariff">${s.tariff}</span>
                    </div>
                </div>
            </div>
        </div>
    `
    }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
    const saved = localStorage.getItem('studentsData');
    if (saved) {
        window.studentsData = JSON.parse(saved);
        renderStudents();
    }

    // Search input listener
    const search = document.getElementById('searchInput');
    if (search) {
        search.addEventListener('input', applyFilters);
    }

    // Tariff filter listener
    const tariffFilter = document.getElementById('filterTariff');
    if (tariffFilter) {
        tariffFilter.addEventListener('change', applyFilters);
    }

    // Level filter listener
    const levelFilter = document.getElementById('filterLevel');
    if (levelFilter) {
        levelFilter.addEventListener('change', applyFilters);
    }

    // Initialize Excel modal when opened
    const excelModal = document.getElementById('downloadExcelModal');
    if (excelModal) {
        excelModal.addEventListener('show.bs.modal', function () {
            populateExcelModal();
        });
    }
});

// ==========================================
// EXCEL EXPORT FUNCTIONALITY
// ==========================================

// Populate the Excel modal with students
function populateExcelModal() {
    const filter = document.getElementById('excelLevelFilter').value;
    const container = document.getElementById('excelStudentList');

    // Filter students (exclude deleted)
    let students = window.studentsData.filter(s => !s.deleted);

    // Apply level filter if selected
    if (filter) {
        students = students.filter(s => s.level === filter);
    }

    // Sort by ID
    students.sort((a, b) => a.id.localeCompare(b.id));

    if (students.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-secondary"><i class="bi bi-inbox" style="font-size: 2rem;"></i><p class="mt-2">No students found</p></div>';
        document.getElementById('selectAllStudents').checked = false;
        updateSelectedCount();
        return;
    }

    // Render student checkboxes
    container.innerHTML = students.map((s, index) => {
        const uniqueId = s.firestoreId || s.id;
        return `
        <label class="student-checkbox-item" for="student-${uniqueId}">
            <input class="form-check-input" type="checkbox" id="student-${uniqueId}" 
                   data-student-id="${uniqueId}" onchange="updateSelectedCount()">
            <div class="student-info">
                <span class="student-id">${s.id}</span>
                <span class="student-name">${s.fullName}</span>
                <span class="student-level">${s.level}</span>
            </div>
        </label>
    `
    }).join('');

    // Reset select all checkbox
    document.getElementById('selectAllStudents').checked = false;
    updateSelectedCount();
}

// Filter students in Excel modal by level
function filterExcelStudents() {
    populateExcelModal();
}

// Toggle select all students
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAllStudents').checked;
    const checkboxes = document.querySelectorAll('#excelStudentList .form-check-input');

    checkboxes.forEach(cb => {
        cb.checked = selectAll;
        // Toggle selected class on parent
        const parent = cb.closest('.student-checkbox-item');
        if (parent) {
            parent.classList.toggle('selected', selectAll);
        }
    });

    updateSelectedCount();
}

// Update selected count badge
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('#excelStudentList .form-check-input:checked');
    const countBadge = document.getElementById('selectedCount');
    countBadge.textContent = `${checkboxes.length} selected`;

    // Update item selection styling
    document.querySelectorAll('#excelStudentList .form-check-input').forEach(cb => {
        const parent = cb.closest('.student-checkbox-item');
        if (parent) {
            parent.classList.toggle('selected', cb.checked);
        }
    });

    // Update select all checkbox state
    const allCheckboxes = document.querySelectorAll('#excelStudentList .form-check-input');
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    if (allCheckboxes.length > 0) {
        selectAllCheckbox.checked = checkboxes.length === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
    }
}

// Download selected students as Excel
function downloadSelectedAsExcel() {
    const selectedCheckboxes = document.querySelectorAll('#excelStudentList .form-check-input:checked');

    if (selectedCheckboxes.length === 0) {
        showNotification('Please select at least one student!', 'error');
        return;
    }

    // Get selected student IDs
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.studentId);

    // Get student data for selected IDs
    const selectedStudents = window.studentsData.filter(s => {
        const uniqueId = s.firestoreId || s.id;
        return selectedIds.includes(uniqueId);
    });

    // Prepare data for Excel
    const excelData = selectedStudents.map((s, index) => ({
        'No': index + 1,
        'Student ID': s.id,
        'Full Name': s.fullName,
        'Phone 1': s.phone1 || '',
        'Phone 2': s.phone2 || '',
        'Email': s.email || '',
        'Education Level': s.level || '',
        'Tariff': s.tariff || '',
        'University 1': s.university1 || '',
        'University 2': s.university2 || '',
        'Language Certificate': s.languageCertificate || '',
        'Score': s.certificateScore || '',
        'Passport': s.passport || '',
        'Birthday': s.birthday || '',
        'Address': s.address || '',
        'Notes': s.notes || ''
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Set column widths
    ws['!cols'] = [{
            wch: 5
        }, // No
        {
            wch: 12
        }, // ID
        {
            wch: 35
        }, // Full Name
        {
            wch: 15
        }, // Phone 1
        {
            wch: 15
        }, // Phone 2
        {
            wch: 25
        }, // Email
        {
            wch: 20
        }, // Level
        {
            wch: 15
        }, // Tariff
        {
            wch: 30
        }, // University 1
        {
            wch: 30
        }, // University 2
        {
            wch: 18
        }, // Language Certificate
        {
            wch: 8
        }, // Score
        {
            wch: 12
        }, // Passport
        {
            wch: 12
        }, // Birthday
        {
            wch: 40
        }, // Address
        {
            wch: 30
        } // Notes
    ];

    // Generate filename with date and filter info
    const levelFilter = document.getElementById('excelLevelFilter').value;
    const dateStr = new Date().toISOString().split('T')[0];
    const levelStr = levelFilter ? `_${levelFilter.replace(/\s+/g, '_')}` : '_All';
    const filename = `Students${levelStr}_${dateStr}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    // Close modal and show success
    const modal = bootstrap.Modal.getInstance(document.getElementById('downloadExcelModal'));
    modal.hide();

    showNotification(`Downloaded ${selectedStudents.length} students to Excel!`, 'success');
}

// Download all payment history as Excel
function downloadPaymentHistoryAsExcel() {
    const payments = window.paymentsData || [];

    if (payments.length === 0) {
        showNotification('No payment history to download!', 'error');
        return;
    }

    // Prepare data for Excel
    const excelData = payments.map((p, index) => {
        // Format timestamp
        let timestamp = '';
        if (p.timestamp) {
            const date = p.timestamp.toDate ? p.timestamp.toDate() : new Date(p.timestamp);
            timestamp = date.toLocaleString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        return {
            'No': index + 1,
            'Date & Time': timestamp,
            'Student ID': p.studentId || 'N/A',
            'Student Name': p.studentName || 'General Payment',
            'Amount (UZS)': p.amount || 0,
            'Payment Method': p.paymentMethod || '',
            'Received By': p.receivedBy || '',
            'Notes': p.notes || ''
        };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment History');

    // Set column widths
    ws['!cols'] = [{
            wch: 5
        }, // No
        {
            wch: 18
        }, // Date & Time
        {
            wch: 12
        }, // Student ID
        {
            wch: 30
        }, // Student Name
        {
            wch: 18
        }, // Amount
        {
            wch: 15
        }, // Payment Method
        {
            wch: 15
        }, // Received By
        {
            wch: 35
        } // Notes
    ];

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Payment_History_${dateStr}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    showNotification(`Downloaded ${payments.length} payment records to Excel!`, 'success');
}

// ==========================================
// PAYMENTS SECTION FUNCTIONS
// ==========================================

// Show payment sub-tab (Students or History)
function showPaymentTab(tab) {
    const studentsSubtab = document.getElementById('payment-students-subtab');
    const historySubtab = document.getElementById('payment-history-subtab');
    const studentsBtn = document.getElementById('paymentStudentsTabBtn');
    const historyBtn = document.getElementById('paymentHistoryTabBtn');

    if (tab === 'students') {
        studentsSubtab.style.display = 'block';
        historySubtab.style.display = 'none';
        studentsBtn.classList.add('active');
        historyBtn.classList.remove('active');
        renderPaymentStudents();
    } else {
        studentsSubtab.style.display = 'none';
        historySubtab.style.display = 'block';
        studentsBtn.classList.remove('active');
        historyBtn.classList.add('active');
        renderPaymentHistory();
    }
}

// Render students for payments section
function renderPaymentStudents(filteredData = null) {
    const container = document.getElementById('paymentStudentsList');
    if (!container) return;

    const students = filteredData || window.studentsData.filter(s => !s.deleted);

    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-wallet2" style="font-size: 4rem; opacity: 0.3;"></i>
                <p class="text-secondary mt-3">No students found.</p>
            </div>
        `;
        return;
    }

    // Sort by ID
    students.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    container.innerHTML = students.map(s => {
        const balance = parseFloat(s.balance) || 0;
        const discount = parseFloat(s.discount) || 0;
        const balanceClass = balance > 0 ? 'bal-positive' : (balance < 0 ? 'bal-negative' : '');
        const formattedBalance = formatAmount(Math.abs(balance));
        const balancePrefix = balance < 0 ? '-' : (balance > 0 ? '+' : '');

        return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="payment-student-card-compact" onclick="selectStudentForPayment('${s.firestoreId || s.id}', '${s.id}', '${s.fullName.replace(/'/g, "\\'")}')">
                <div class="student-name-compact">${s.fullName}</div>
                <div class="payment-pills">
                    <span class="pill pill-id">${s.id}</span>
                    <span class="pill pill-tariff">${s.tariff || 'N/A'}</span>
                    <span class="pill pill-balance ${balanceClass}">${balancePrefix}${formattedBalance}</span>
                    <span class="pill pill-discount">${formatAmount(discount)}</span>
                </div>
            </div>
        </div>
    `
    }).join('');
}

// Render payment history
function renderPaymentHistory(filteredData = null) {
    const container = document.getElementById('paymentHistoryList');
    if (!container) return;

    const payments = filteredData || window.paymentsData || [];

    if (!payments || payments.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-clock-history" style="font-size: 4rem; opacity: 0.3;"></i>
                <p class="text-secondary mt-3">No payments recorded yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = payments.map(p => {
        const timestamp = p.createdAt ? new Date(p.createdAt).toLocaleString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Unknown';

        const studentInfo = p.studentId && p.studentName ?
            `<span class="payment-badge payment-student-info">${p.studentId} - ${p.studentName}</span>` :
            '';

        return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="payment-history-card">
                <div class="payment-header">
                    <span class="payment-amount">+${formatAmount(p.amount)} UZS</span>
                    <span class="payment-timestamp">${timestamp}</span>
                </div>
                <div class="payment-details">
                    <span class="payment-badge payment-method">${p.method}</span>
                    <span class="payment-badge payment-receiver">${p.receivedBy}</span>
                    ${studentInfo}
                </div>
                ${p.notes ? `<div class="payment-notes">${p.notes}</div>` : ''}
                <div class="payment-actions mt-2 d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="event.stopPropagation(); editPayment('${p.firestoreId}')">
                        <i class="bi bi-pencil me-1"></i>Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="event.stopPropagation(); deletePayment('${p.firestoreId}')">
                        <i class="bi bi-trash me-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `
    }).join('');
}

// Filter payment students
function filterPaymentStudents() {
    const searchTerm = document.getElementById('paymentSearchInput').value.toLowerCase();
    const tariffFilter = document.getElementById('paymentTariffFilter').value;

    let filtered = window.studentsData.filter(s => !s.deleted);

    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(s =>
            s.fullName.toLowerCase().includes(searchTerm) ||
            s.id.toLowerCase().includes(searchTerm)
        );
    }

    // Apply tariff filter
    if (tariffFilter) {
        filtered = filtered.filter(s => s.tariff === tariffFilter);
    }

    renderPaymentStudents(filtered);
}

// Filter payment history
function filterPaymentHistory() {
    const searchTerm = document.getElementById('paymentHistorySearch').value.toLowerCase();
    const methodFilter = document.getElementById('paymentMethodFilter').value;
    const receiverFilter = document.getElementById('receivedByFilter').value;

    let filtered = [...window.paymentsData];

    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.studentName && p.studentName.toLowerCase().includes(searchTerm)) ||
            (p.studentId && p.studentId.toLowerCase().includes(searchTerm)) ||
            (p.notes && p.notes.toLowerCase().includes(searchTerm))
        );
    }

    // Apply method filter
    if (methodFilter) {
        filtered = filtered.filter(p => p.method === methodFilter);
    }

    // Apply receiver filter
    if (receiverFilter) {
        filtered = filtered.filter(p => p.receivedBy === receiverFilter);
    }

    renderPaymentHistory(filtered);
}

// Populate student dropdown in Add Payment modal
function populateStudentDropdown() {
    const dropdown = document.getElementById('paymentStudent');
    if (!dropdown) return;

    const students = window.studentsData.filter(s => !s.deleted);
    students.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    dropdown.innerHTML = '<option value="">No student (General payment)</option>' +
        students.map(s => `<option value="${s.firestoreId || s.id}" data-student-id="${s.id}" data-student-name="${s.fullName}">${s.id} - ${s.fullName}</option>`).join('');
}

// Select student for payment (from card click)
function selectStudentForPayment(firestoreId, studentId, studentName) {
    // Open modal and pre-select the student
    const modal = new bootstrap.Modal(document.getElementById('addPaymentModal'));
    modal.show();

    // Wait for modal to render, then set the student
    setTimeout(() => {
        const dropdown = document.getElementById('paymentStudent');
        if (dropdown) {
            dropdown.value = firestoreId || studentId;
        }
    }, 200);
}

// Format amount with thousand separators
function formatAmount(amount) {
    if (!amount && amount !== 0) return '0';
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Parse amount (remove thousand separators)
function parseAmount(amountStr) {
    if (!amountStr) return 0;
    return parseFloat(amountStr.replace(/,/g, '')) || 0;
}

// Add quick note
function addQuickNote(note) {
    const textarea = document.getElementById('paymentNotes');
    if (textarea.value) {
        textarea.value += ', ' + note;
    } else {
        textarea.value = note;
    }
}

// Format amount input with thousand separator
function setupAmountInput() {
    const amountInput = document.getElementById('paymentAmount');
    if (amountInput) {
        amountInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value)) {
                e.target.value = formatAmount(value);
            }
        });
    }
}

// Submit payment
function submitPayment() {
    const amountInput = document.getElementById('paymentAmount');
    const methodInput = document.getElementById('paymentMethod');
    const receiverInput = document.getElementById('receivedBy');
    const studentInput = document.getElementById('paymentStudent');
    const notesInput = document.getElementById('paymentNotes');

    // Validate required fields
    const amount = parseAmount(amountInput.value);
    const method = methodInput.value;
    const receivedBy = receiverInput.value;
    const notes = notesInput.value.trim();

    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount!', 'error');
        amountInput.focus();
        return;
    }

    if (!method) {
        showNotification('Please select a payment method!', 'error');
        methodInput.focus();
        return;
    }

    if (!receivedBy) {
        showNotification('Please select who received the payment!', 'error');
        receiverInput.focus();
        return;
    }

    // Check if this is a DISCOUNT payment
    const isDiscount = notes.toUpperCase().includes('DISCOUNT');

    // If DISCOUNT, require student selection
    if (isDiscount && !studentInput.value) {
        showNotification('Please select a student for the discount!', 'error');
        studentInput.focus();
        return;
    }

    // Build payment data
    const paymentData = {
        amount: amount,
        method: method,
        receivedBy: receivedBy,
        notes: notes,
        isDiscount: isDiscount,
        studentFirestoreId: null,
        studentId: null,
        studentName: null
    };

    // Get student info if selected
    if (studentInput.value) {
        const selectedOption = studentInput.options[studentInput.selectedIndex];
        paymentData.studentFirestoreId = studentInput.value;
        paymentData.studentId = selectedOption.dataset.studentId;
        paymentData.studentName = selectedOption.dataset.studentName;
    }

    // Save to Firestore
    if (typeof savePaymentToFirestore === 'function') {
        savePaymentToFirestore(paymentData);
    }

    // If DISCOUNT, also update the student's discount field
    if (isDiscount && paymentData.studentFirestoreId) {
        if (typeof updateStudentDiscount === 'function') {
            updateStudentDiscount(paymentData.studentFirestoreId, amount);
        }
    }

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPaymentModal'));
    if (modal) {
        modal.hide();
    }
    document.getElementById('addPaymentForm').reset();

    // Refresh payment students view
    setTimeout(() => {
        renderPaymentStudents();
    }, 500);
}

// Initialize payment modal when opened
document.addEventListener('DOMContentLoaded', function () {
    const paymentModal = document.getElementById('addPaymentModal');
    if (paymentModal) {
        paymentModal.addEventListener('show.bs.modal', function () {
            populateStudentDropdown();
        });
    }

    // Setup amount input formatting
    setupAmountInput();
});

// Edit payment - open modal with pre-filled data
function editPayment(paymentFirestoreId) {
    const payment = window.paymentsData.find(p => p.firestoreId === paymentFirestoreId);
    if (!payment) {
        showNotification('Payment not found!', 'error');
        return;
    }

    // Fill the edit form
    document.getElementById('editPaymentId').value = paymentFirestoreId;
    document.getElementById('editPaymentOriginalAmount').value = payment.amount;
    document.getElementById('editPaymentStudentFirestoreId').value = payment.studentFirestoreId || '';
    document.getElementById('editPaymentAmount').value = formatAmount(payment.amount);
    document.getElementById('editPaymentMethod').value = payment.method || '';
    document.getElementById('editReceivedBy').value = payment.receivedBy || '';
    document.getElementById('editPaymentNotes').value = payment.notes || '';

    // Display student info (read-only)
    if (payment.studentId && payment.studentName) {
        document.getElementById('editPaymentStudentDisplay').value = `${payment.studentId} - ${payment.studentName}`;
    } else {
        document.getElementById('editPaymentStudentDisplay').value = 'No student (General payment)';
    }

    // Open the modal
    const modal = new bootstrap.Modal(document.getElementById('editPaymentModal'));
    modal.show();
}

// Save payment edit
function savePaymentEdit() {
    const paymentFirestoreId = document.getElementById('editPaymentId').value;
    const originalAmount = parseFloat(document.getElementById('editPaymentOriginalAmount').value) || 0;
    const studentFirestoreId = document.getElementById('editPaymentStudentFirestoreId').value;
    const newAmount = parseAmount(document.getElementById('editPaymentAmount').value);
    const method = document.getElementById('editPaymentMethod').value;
    const receivedBy = document.getElementById('editReceivedBy').value;
    const notes = document.getElementById('editPaymentNotes').value.trim();

    // Validate
    if (!newAmount || newAmount <= 0) {
        showNotification('Please enter a valid amount!', 'error');
        return;
    }
    if (!method) {
        showNotification('Please select a payment method!', 'error');
        return;
    }
    if (!receivedBy) {
        showNotification('Please select who received the payment!', 'error');
        return;
    }

    // Update in Firestore
    if (typeof updatePaymentInFirestore === 'function') {
        updatePaymentInFirestore(paymentFirestoreId, {
            amount: newAmount,
            method: method,
            receivedBy: receivedBy,
            notes: notes
        }, originalAmount, studentFirestoreId);
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editPaymentModal'));
    if (modal) {
        modal.hide();
    }
}

// Delete payment with confirmation
function deletePayment(paymentFirestoreId) {
    const payment = window.paymentsData.find(p => p.firestoreId === paymentFirestoreId);
    if (!payment) {
        showNotification('Payment not found!', 'error');
        return;
    }

    const confirmMsg = payment.studentName ?
        `Are you sure you want to delete this payment of ${formatAmount(payment.amount)} UZS for ${payment.studentName}?` :
        `Are you sure you want to delete this payment of ${formatAmount(payment.amount)} UZS?`;

    if (confirm(confirmMsg)) {
        if (typeof deletePaymentFromFirestore === 'function') {
            deletePaymentFromFirestore(paymentFirestoreId, payment.amount, payment.studentFirestoreId, payment.isDiscount);
        }
    }
}

// ==========================================
// SETTINGS MODULE - Theme, Tariffs, Levels, Universities
// ==========================================

// Global settings data
window.tariffsData = [];
window.levelsData = [];
window.universitiesData = [];

// Pending delete state for settings confirmation
let pendingSettingsDelete = null;

// ==========================================
// THEME TOGGLE FUNCTIONS
// ==========================================

function toggleTheme() {
    const html = document.documentElement;
    const toggle = document.getElementById('themeToggle');
    const isLight = toggle.checked;

    html.setAttribute('data-bs-theme', isLight ? 'light' : 'dark');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const html = document.documentElement;
    html.setAttribute('data-bs-theme', savedTheme);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.checked = savedTheme === 'light';
    }
}

// ==========================================
// TARIFFS MANAGEMENT
// ==========================================

function renderTariffsList() {
    const container = document.getElementById('tariffsListContainer');
    if (!container) return;

    if (window.tariffsData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-secondary">
                <i class="bi bi-tag" style="font-size: 2rem; opacity: 0.5;"></i>
                <p class="mt-2 mb-0">No tariffs configured. Add your first tariff.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = window.tariffsData.map(t => `
        <div class="settings-item">
            <div class="settings-item-info">
                <span class="settings-item-name">${t.name}</span>
                <span class="settings-item-meta">${formatAmount(t.price)} UZS</span>
            </div>
            <div class="settings-item-actions">
                <button class="settings-item-btn edit-btn" onclick="editTariff('${t.firestoreId}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="settings-item-btn delete-btn" onclick="confirmDeleteTariff('${t.firestoreId}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openTariffModal(tariffId = null) {
    const modal = new bootstrap.Modal(document.getElementById('tariffModal'));
    const form = document.getElementById('tariffForm');
    const title = document.getElementById('tariffModalTitle');

    form.reset();
    document.getElementById('tariffEditId').value = '';

    if (tariffId) {
        const tariff = window.tariffsData.find(t => t.firestoreId === tariffId);
        if (tariff) {
            title.innerHTML = '<i class="bi bi-tag-fill me-2"></i>Edit Tariff';
            document.getElementById('tariffEditId').value = tariffId;
            document.getElementById('tariffName').value = tariff.name;
            document.getElementById('tariffPrice').value = tariff.price;
        }
    } else {
        title.innerHTML = '<i class="bi bi-tag-fill me-2"></i>Add Tariff';
    }

    modal.show();
}

function editTariff(tariffId) {
    openTariffModal(tariffId);
}

function saveTariff() {
    const name = document.getElementById('tariffName').value.trim().toUpperCase();
    const price = parseInt(document.getElementById('tariffPrice').value.replace(/\D/g, ''), 10);
    const editId = document.getElementById('tariffEditId').value;

    if (!name || !price) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    const tariffData = {
        name,
        price
    };

    if (editId) {
        if (typeof updateTariffInFirestore === 'function') {
            updateTariffInFirestore(editId, tariffData);
        }
    } else {
        if (typeof saveTariffToFirestore === 'function') {
            saveTariffToFirestore(tariffData);
        }
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('tariffModal'));
    if (modal) modal.hide();
}

function confirmDeleteTariff(tariffId) {
    const tariff = window.tariffsData.find(t => t.firestoreId === tariffId);
    if (!tariff) return;

    pendingSettingsDelete = {
        type: 'tariff',
        id: tariffId
    };

    document.getElementById('confirmSettingsDeleteTitle').textContent = 'Delete Tariff';
    document.getElementById('confirmSettingsDeleteMessage').textContent =
        `Are you sure you want to delete "${tariff.name}"? This will not affect existing students.`;

    const modal = new bootstrap.Modal(document.getElementById('confirmSettingsDeleteModal'));
    modal.show();
}

// ==========================================
// EDUCATION LEVELS MANAGEMENT
// ==========================================

function renderLevelsList() {
    const container = document.getElementById('levelsListContainer');
    if (!container) return;

    if (window.levelsData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-secondary">
                <i class="bi bi-mortarboard" style="font-size: 2rem; opacity: 0.5;"></i>
                <p class="mt-2 mb-0">No education levels configured. Add your first level.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = window.levelsData.map(l => `
        <div class="settings-item">
            <div class="settings-item-info">
                <span class="settings-item-name">${l.name}</span>
            </div>
            <div class="settings-item-actions">
                <button class="settings-item-btn edit-btn" onclick="editLevel('${l.firestoreId}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="settings-item-btn delete-btn" onclick="confirmDeleteLevel('${l.firestoreId}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openLevelModal(levelId = null) {
    const modal = new bootstrap.Modal(document.getElementById('levelModal'));
    const form = document.getElementById('levelForm');
    const title = document.getElementById('levelModalTitle');

    form.reset();
    document.getElementById('levelEditId').value = '';

    if (levelId) {
        const level = window.levelsData.find(l => l.firestoreId === levelId);
        if (level) {
            title.innerHTML = '<i class="bi bi-mortarboard-fill me-2"></i>Edit Education Level';
            document.getElementById('levelEditId').value = levelId;
            document.getElementById('levelName').value = level.name;
        }
    } else {
        title.innerHTML = '<i class="bi bi-mortarboard-fill me-2"></i>Add Education Level';
    }

    modal.show();
}

function editLevel(levelId) {
    openLevelModal(levelId);
}

function saveLevel() {
    const name = document.getElementById('levelName').value.trim().toUpperCase();
    const editId = document.getElementById('levelEditId').value;

    if (!name) {
        showNotification('Please enter a level name!', 'error');
        return;
    }

    const levelData = {
        name
    };

    if (editId) {
        if (typeof updateLevelInFirestore === 'function') {
            updateLevelInFirestore(editId, levelData);
        }
    } else {
        if (typeof saveLevelToFirestore === 'function') {
            saveLevelToFirestore(levelData);
        }
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('levelModal'));
    if (modal) modal.hide();
}

function confirmDeleteLevel(levelId) {
    const level = window.levelsData.find(l => l.firestoreId === levelId);
    if (!level) return;

    pendingSettingsDelete = {
        type: 'level',
        id: levelId
    };

    document.getElementById('confirmSettingsDeleteTitle').textContent = 'Delete Education Level';
    document.getElementById('confirmSettingsDeleteMessage').textContent =
        `Are you sure you want to delete "${level.name}"? Universities linked to this level will also be removed.`;

    const modal = new bootstrap.Modal(document.getElementById('confirmSettingsDeleteModal'));
    modal.show();
}

// ==========================================
// UNIVERSITIES MANAGEMENT
// ==========================================

function renderUniversitiesList() {
    const container = document.getElementById('universitiesListContainer');
    if (!container) return;

    if (window.universitiesData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-secondary">
                <i class="bi bi-building" style="font-size: 2rem; opacity: 0.5;"></i>
                <p class="mt-2 mb-0">No universities configured. Add your first university.</p>
            </div>
        `;
        return;
    }

    // Group universities by level
    const grouped = {};
    window.universitiesData.forEach(u => {
        const levelName = u.levelName || 'Unknown Level';
        if (!grouped[levelName]) {
            grouped[levelName] = [];
        }
        grouped[levelName].push(u);
    });

    // Create Bootstrap accordion
    let html = '<div class="accordion" id="universitiesAccordion">';

    Object.keys(grouped).sort().forEach((levelName, index) => {
        const levelId = levelName.replace(/\s+/g, ''); // Remove spaces for ID
        const universities = grouped[levelName];

        html += `
            <div class="accordion-item" style="background: var(--bg-card); border: 1px solid var(--border-subtle); margin-bottom: 0.5rem; border-radius: var(--radius-md); overflow: hidden;">
                <h2 class="accordion-header" id="heading${levelId}">
                    <button class="accordion-button collapsed" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse${levelId}" 
                            aria-expanded="false" aria-controls="collapse${levelId}"
                            style="background: var(--bg-card); color: var(--text-primary); border: none; font-weight: 600; padding: 0.75rem 1rem;">
                        <i class="bi bi-mortarboard-fill me-2" style="color: var(--accent-primary);"></i>
                        ${levelName}
                        <span class="badge rounded-pill ms-2" style="background: var(--accent-primary); color: white; font-size: 0.75rem;">${universities.length}</span>
                    </button>
                </h2>
                <div id="collapse${levelId}" class="accordion-collapse collapse" 
                     aria-labelledby="heading${levelId}" data-bs-parent="#universitiesAccordion">
                    <div class="accordion-body p-2">
        `;


        // Add universities for this level (sorted alphabetically)
        universities.sort((a, b) => a.name.localeCompare(b.name)).forEach(u => {
            html += `
                <div class="settings-item" style="margin-bottom: 0.25rem;">
                    <div class="settings-item-info">
                        <span class="settings-item-name">${u.name}</span>
                    </div>
                    <div class="settings-item-actions">
                        <button class="settings-item-btn edit-btn" onclick="editUniversity('${u.firestoreId}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="settings-item-btn delete-btn" onclick="confirmDeleteUniversity('${u.firestoreId}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function openUniversityModal(universityId = null) {
    const modal = new bootstrap.Modal(document.getElementById('universityModal'));
    const form = document.getElementById('universityForm');
    const title = document.getElementById('universityModalTitle');
    const levelSelect = document.getElementById('universityLevel');

    form.reset();
    document.getElementById('universityEditId').value = '';

    // Populate level dropdown
    levelSelect.innerHTML = '<option value="">Choose Level...</option>';
    window.levelsData.forEach(l => {
        levelSelect.innerHTML += `<option value="${l.firestoreId}">${l.name}</option>`;
    });

    if (universityId) {
        const uni = window.universitiesData.find(u => u.firestoreId === universityId);
        if (uni) {
            title.innerHTML = '<i class="bi bi-building me-2"></i>Edit University';
            document.getElementById('universityEditId').value = universityId;
            document.getElementById('universityName').value = uni.name;
            document.getElementById('universityLevel').value = uni.levelId;
        }
    } else {
        title.innerHTML = '<i class="bi bi-building me-2"></i>Add University';
    }

    modal.show();
}

function editUniversity(universityId) {
    openUniversityModal(universityId);
}

function saveUniversity() {
    const name = document.getElementById('universityName').value.trim();
    const levelId = document.getElementById('universityLevel').value;
    const editId = document.getElementById('universityEditId').value;

    if (!name || !levelId) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    // Get level name for display
    const level = window.levelsData.find(l => l.firestoreId === levelId);
    const levelName = level ? level.name : '';

    const universityData = {
        name,
        levelId,
        levelName
    };

    if (editId) {
        if (typeof updateUniversityInFirestore === 'function') {
            updateUniversityInFirestore(editId, universityData);
        }
    } else {
        if (typeof saveUniversityToFirestore === 'function') {
            saveUniversityToFirestore(universityData);
        }
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('universityModal'));
    if (modal) modal.hide();
}

function confirmDeleteUniversity(universityId) {
    const uni = window.universitiesData.find(u => u.firestoreId === universityId);
    if (!uni) return;

    pendingSettingsDelete = {
        type: 'university',
        id: universityId
    };

    document.getElementById('confirmSettingsDeleteTitle').textContent = 'Delete University';
    document.getElementById('confirmSettingsDeleteMessage').textContent =
        `Are you sure you want to delete "${uni.name}"?`;

    const modal = new bootstrap.Modal(document.getElementById('confirmSettingsDeleteModal'));
    modal.show();
}

// Execute confirmed delete
function executeSettingsDelete() {
    if (!pendingSettingsDelete) return;

    const {
        type,
        id
    } = pendingSettingsDelete;

    switch (type) {
        case 'tariff':
            if (typeof deleteTariffFromFirestore === 'function') {
                deleteTariffFromFirestore(id);
            }
            break;
        case 'level':
            if (typeof deleteLevelFromFirestore === 'function') {
                deleteLevelFromFirestore(id);
            }
            break;
        case 'university':
            if (typeof deleteUniversityFromFirestore === 'function') {
                deleteUniversityFromFirestore(id);
            }
            break;
    }

    pendingSettingsDelete = null;

    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmSettingsDeleteModal'));
    if (modal) modal.hide();
}

// ==========================================
// UPDATE DROPDOWNS WITH DYNAMIC DATA
// ==========================================

function updateTariffDropdowns() {
    const tariffSelects = document.querySelectorAll('#tariff, #filterTariff, #paymentTariffFilter');

    tariffSelects.forEach(select => {
        const currentValue = select.value;
        const isFilter = select.id.includes('filter') || select.id.includes('Filter');

        select.innerHTML = isFilter ?
            '<option value="">All Tariffs</option>' :
            '<option value="">Choose Tariff</option>';

        window.tariffsData.forEach(t => {
            const priceDisplay = isFilter ? '' : ` - ${formatAmount(t.price)} UZS`;
            select.innerHTML += `<option value="${t.name}">${t.name}${priceDisplay}</option>`;
        });

        select.value = currentValue;
    });
}

function updateLevelDropdowns() {
    const levelSelects = document.querySelectorAll('#levelSelect, #filterLevel, #excelLevelFilter');

    levelSelects.forEach(select => {
        const currentValue = select.value;
        const isFilter = select.id.includes('filter') || select.id.includes('Filter');

        let baseOptions = isFilter ?
            '<option value="">All Levels</option>' :
            '<option value="">Choose Level</option>';

        select.innerHTML = baseOptions;

        window.levelsData.forEach(l => {
            select.innerHTML += `<option value="${l.name}">${l.name}</option>`;
        });

        // Add deleted students option for filterLevel
        if (select.id === 'filterLevel') {
            select.innerHTML += '<option value="DELETED" style="font-style: italic; color: #e53e3e;">Deleted students</option>';
        }

        select.value = currentValue;
    });
}

function updateUniversityDropdowns(selectedLevel) {
    const uniSelects = document.querySelectorAll('#uni1, #uni2, #edit-university1, #edit-university2');

    const filteredUnis = selectedLevel ?
        window.universitiesData.filter(u => u.levelName === selectedLevel) : [];

    // Remove duplicates by name using Set
    const uniqueUnis = Array.from(new Map(filteredUnis.map(u => [u.name, u])).values());

    uniSelects.forEach(select => {
        // Only update if the select exists in the DOM
        if (!select) return;

        const currentValue = select.value;

        // Clear all options first
        select.innerHTML = '<option value="">Choose University</option>';

        // Add unique universities
        uniqueUnis.forEach(u => {
            select.innerHTML += `<option value="${u.name}">${u.name}</option>`;
        });

        // Restore value if still valid
        if (uniqueUnis.some(u => u.name === currentValue)) {
            select.value = currentValue;
        }
    });
}

// Initialize settings event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Load saved theme
    loadTheme();

    // Add level change listener for university dropdown
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
        levelSelect.addEventListener('change', function () {
            updateUniversityDropdowns(this.value);
        });
    }

    // Settings delete confirmation button
    const confirmDeleteBtn = document.getElementById('confirmSettingsDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', executeSettingsDelete);
    }
});

// Export settings functions
window.toggleTheme = toggleTheme;
window.loadTheme = loadTheme;
window.openTariffModal = openTariffModal;
window.editTariff = editTariff;
window.saveTariff = saveTariff;
window.confirmDeleteTariff = confirmDeleteTariff;
window.renderTariffsList = renderTariffsList;
window.openLevelModal = openLevelModal;
window.editLevel = editLevel;
window.saveLevel = saveLevel;
window.confirmDeleteLevel = confirmDeleteLevel;
window.renderLevelsList = renderLevelsList;
window.openUniversityModal = openUniversityModal;
window.editUniversity = editUniversity;
window.saveUniversity = saveUniversity;
window.confirmDeleteUniversity = confirmDeleteUniversity;
window.renderUniversitiesList = renderUniversitiesList;
window.executeSettingsDelete = executeSettingsDelete;
window.updateTariffDropdowns = updateTariffDropdowns;
window.updateLevelDropdowns = updateLevelDropdowns;
window.updateUniversityDropdowns = updateUniversityDropdowns;

window.showTab = showTab;
window.saveStudent = saveStudent;
window.viewStudentDetails = viewStudentDetails;
window.downloadStudentExcel = downloadStudentExcel;
window.renderStudents = renderStudents;
window.copyToClipboard = copyToClipboard;
window.startEdit = startEdit;
window.cancelEdit = cancelEdit;
window.saveEdit = saveEdit;
window.confirmDeleteStudent = confirmDeleteStudent;
window.restoreStudent = restoreStudent;
window.permanentlyDeleteStudent = permanentlyDeleteStudent;
window.uniData = uniData;
window.filterExcelStudents = filterExcelStudents;
window.toggleSelectAll = toggleSelectAll;
window.updateSelectedCount = updateSelectedCount;
window.downloadSelectedAsExcel = downloadSelectedAsExcel;
window.showPaymentTab = showPaymentTab;
window.renderPaymentStudents = renderPaymentStudents;
window.renderPaymentHistory = renderPaymentHistory;
window.filterPaymentStudents = filterPaymentStudents;
window.filterPaymentHistory = filterPaymentHistory;
window.populateStudentDropdown = populateStudentDropdown;
window.selectStudentForPayment = selectStudentForPayment;
window.addQuickNote = addQuickNote;
window.submitPayment = submitPayment;
window.tariffAmounts = tariffAmounts;
window.downloadPaymentHistoryAsExcel = downloadPaymentHistoryAsExcel;
window.editPayment = editPayment;
window.savePaymentEdit = savePaymentEdit;
window.deletePayment = deletePayment;