// ==========================================
// UNIBRIDGE CRM - MAIN APPLICATION LOGIC
// ==========================================

// ==========================================
// LOGIN SYSTEM - SECURE ACCESS
// ==========================================
var loginChallengeNumber = 0;
var isAuthenticated = false;

// Initialize login system on page load
function initLoginSystem() {
    // Check if already authenticated in this session
    if (sessionStorage.getItem('crm_authenticated') === 'true') {
        isAuthenticated = true;
        hideLoginOverlay();
        return;
    }

    // Generate random 3-digit number
    loginChallengeNumber = Math.floor(500 + Math.random() * 900);

    // Display the challenge number
    var challengeElement = document.getElementById('challengeNumber');
    if (challengeElement) {
        challengeElement.textContent = loginChallengeNumber;
    }

    // Focus on password input
    setTimeout(function () {
        var passwordInput = document.getElementById('loginPassword');
        if (passwordInput) {
            passwordInput.focus();
        }
    }, 600);
}

// Verify login attempt
function verifyLogin() {
    var passwordInput = document.getElementById('loginPassword');
    var errorElement = document.getElementById('loginError');

    if (!passwordInput) return;

    var enteredPassword = parseInt(passwordInput.value, 10);
    var correctPassword = loginChallengeNumber * 2;

    if (enteredPassword === correctPassword) {
        // Success - hide login overlay
        isAuthenticated = true;
        sessionStorage.setItem('crm_authenticated', 'true');

        // Hide error if showing
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        hideLoginOverlay();
    } else {
        // Failed - show error and generate new challenge
        if (errorElement) {
            errorElement.style.display = 'block';
        }

        // Clear input
        passwordInput.value = '';

        // Generate new challenge after failed attempt
        setTimeout(function () {
            loginChallengeNumber = Math.floor(100 + Math.random() * 900);
            var challengeElement = document.getElementById('challengeNumber');
            if (challengeElement) {
                challengeElement.textContent = loginChallengeNumber;
            }
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            passwordInput.focus();
        }, 2000);
    }
}

// Hide login overlay with animation
function hideLoginOverlay() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        // Remove from DOM after animation
        setTimeout(function () {
            overlay.style.display = 'none';
        }, 500);
    }
}

// Logout function (for future use)
function logout() {
    sessionStorage.removeItem('crm_authenticated');
    isAuthenticated = false;
    location.reload();
}

// Initialize login when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initLoginSystem();
});

// Expose login functions to window
window.verifyLogin = verifyLogin;
window.logout = logout;

// Global Data Storage (use window.studentsData set by firebase-config.js)
if (!window.studentsData) {
    window.studentsData = [];
}
let currentStudentId = null;

// Pagination State
const ITEMS_PER_PAGE = 15;
let studentsPage = 1;
let paymentStudentsPage = 1;
let paymentHistoryPage = 1;

// Helper: Render Pagination Controls
function renderPaginationControls(containerId, currentPage, totalItems, limit, onPageChangeName) {
    const totalPages = Math.ceil(totalItems / limit);
    const container = document.getElementById(containerId);

    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';

    container.innerHTML = `
        <button class="btn btn-outline-secondary rounded-pill px-3" ${prevDisabled} onclick="${onPageChangeName}(${currentPage - 1})">
            <i class="bi bi-chevron-left me-1"></i> Prev
        </button>
        <span class="text-secondary fw-500">Page ${currentPage} of ${totalPages}</span>
        <button class="btn btn-outline-secondary rounded-pill px-3" ${nextDisabled} onclick="${onPageChangeName}(${currentPage + 1})">
            Next <i class="bi bi-chevron-right ms-1"></i>
        </button>
    `;
}

// Helper: Change Page Wrappers
function changeStudentsPage(page) {
    studentsPage = page;
    renderStudents(); // or applyFilters() if filters are active
}

function changePaymentStudentsPage(page) {
    paymentStudentsPage = page;
    filterPaymentStudents(false); // Pass false to prevent resetting to page 1
}

function changePaymentHistoryPage(page) {
    paymentHistoryPage = page;
    filterPaymentHistory(false); // Pass false to prevent resetting to page 1
}


// Dynamic University Data Function - returns universities for a given level from Firestore
function getUniversitiesForLevel(level) {
    if (!window.universitiesData || !level) return [];
    const normalizedLevel = level.trim().toUpperCase();
    const universities = window.universitiesData
        .filter(u => u.levelName && u.levelName.trim().toUpperCase() === normalizedLevel)
        .map(u => u.name);

    if (universities.length === 0) {
        console.log(`ℹ️ No universities found for level "${level}". Please add universities for this level in Settings → Universities.`);
    }
    return universities;
}

// Legacy compatibility: uniData object that dynamically fetches from Firestore
const uniData = new Proxy({}, {
    get: function (target, prop) {
        return getUniversitiesForLevel(prop);
    }
});

// Dynamic Tariff Price Lookup from Firestore
function getTariffPrice(tariffName) {
    const tariff = (window.tariffsData || []).find(t => t.name === tariffName);
    return tariff ? (tariff.price || 0) : 0;
}

// Dynamic Tariff Display Value (formatted string)
function getTariffDisplayValue(tariffName) {
    const price = getTariffPrice(tariffName);
    if (!price) return '0 UZS';
    return price.toLocaleString('en-US') + ' UZS';
}

function showTab(tabName) {
    document.getElementById('students-tab').style.display = 'none';
    document.getElementById('payments-tab').style.display = 'none';
    document.getElementById('admissions-tab').style.display = 'none';

    document.getElementById('notifications-tab').style.display = 'none';
    document.getElementById('settings-tab').style.display = 'none';
    document.querySelectorAll('.nav-link-apple').forEach(link => link.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).style.display = 'block';
    document.getElementById(`nav-${tabName}`).classList.add('active');

    // Render payment students when payments tab is activated
    if (tabName === 'payments' && typeof renderPaymentStudents === 'function') {
        renderPaymentStudents();
    }

    // Render admissions when admissions tab is activated
    if (tabName === 'admissions') {
        renderAdmissions();
    }



    // Render notifications when notifications tab is activated
    if (tabName === 'notifications') {
        renderNotifications();
    }

    // Render settings lists when settings tab is activated
    if (tabName === 'settings') {
        if (typeof renderTariffsList === 'function') renderTariffsList();
        if (typeof renderLevelsList === 'function') renderLevelsList();
        if (typeof renderUniversitiesList === 'function') renderUniversitiesList();
        if (typeof renderGroupsList === 'function') renderGroupsList();
    }
}

function saveStudent() {
    const tariff = document.getElementById('tariff').value;

    // Calculate initial balance (negative of tariff amount = what student owes)
    const initialBalance = tariff ? -getTariffPrice(tariff) : 0;

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
        languageCertificate: 'NO CERTIFICATE', // Default, can be changed later
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


// Main render function - delegates to applyFilters for consistency
function renderStudents() {
    // If this is called directly (e.g. after add/delete), we maintain current filters
    // Passing false to avoid resetting to page 1
    applyFilters(false);
}

// View student details in modal - now uses unique ID instead of array index
function viewStudentDetails(uniqueId) {
    // Find student by firestoreId FIRST (more reliable), then fall back to student id
    // This prevents matching the wrong student when multiple students might have overlapping IDs
    let index = window.studentsData.findIndex(student => student.firestoreId === uniqueId);

    // If not found by firestoreId, try by student id field
    if (index === -1) {
        index = window.studentsData.findIndex(student => student.id === uniqueId);
    }

    if (index === -1) {
        showNotification('Student not found!', 'error');
        return;
    }

    const s = window.studentsData[index];
    // Store the firestoreId for reliable identification in saveEdit and other functions
    currentStudentId = index;
    // Also store the firestoreId separately for direct reference
    window.currentStudentFirestoreId = s.firestoreId;

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

    // Generate group options from dynamic data
    const groupOptions = (window.groupsData || [])
        .map(g => `<option value="${g.name}" ${s.group === g.name ? 'selected' : ''}>${g.name}</option>`)
        .join('');

    const detailsHtml = `
        <div class="row g-2">
            <!-- Row: Student ID (30%) and Full Name (70%) -->
            <div class="col-md-4">
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
            <div class="col-md-8">
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

            <!-- Row: Phone 1, Phone 2, Email -->
            <div class="col-md-4">
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
            <div class="col-md-4">
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
            <div class="col-md-4">
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

            <!-- Row: Birthday, Passport Number, Tariff -->
            <div class="col-md-4">
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
            <div class="col-md-4">
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
            <div class="col-md-4">
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

            <!-- Row: Group, Education Level, Language Certificate -->
            <div class="col-md-4">
                <div class="detail-group editable" data-field="group">
                    <label class="detail-label">Group</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value"><span class="badge badge-group">${s.group || 'No Group'}</span></span>
                        <button class="edit-btn" onclick="startEdit('group', 'select'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <select class="form-select ios-input form-control-sm" id="edit-group">
                            <option value="">No Group</option>
                            ${groupOptions}
                        </select>
                        <div class="edit-actions"><button class="save-btn" onclick="saveEdit('group')"><i class="bi bi-check"></i></button><button class="cancel-btn" onclick="cancelEdit('group')"><i class="bi bi-x"></i></button></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
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
            <div class="col-md-4">
                <div class="detail-group editable" data-field="languageCertificate">
                    <label class="detail-label">Language Certificate</label>
                    <div class="detail-value-wrap">
                        <span class="detail-value"><span class="badge badge-language">${s.languageCertificate}</span>${s.certificateScore ? ` <span class="score-text">Score: ${s.certificateScore}</span>` : ''}</span>
                        <button class="edit-btn" onclick="startEdit('languageCertificate', 'select'); event.stopPropagation();"><i class="bi bi-pencil"></i></button>
                    </div>
                    <div class="edit-field" style="display:none;">
                        <div class="d-flex gap-2">
                            <select class="form-select ios-input form-control-sm" id="edit-languageCertificate" style="flex:1;">
                                <option value="NO CERTIFICATE" ${s.languageCertificate === 'NO CERTIFICATE' ? 'selected' : ''}>NO CERTIFICATE</option>
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

            <!-- Row: University 1, University 2 -->
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

            <!-- Address - Full Width -->
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

            <!-- Notes - Full Width -->
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
                            <option value="GREEN" ${s.noteImportance === 'GREEN' ? 'selected' : ''}>ðŸŸ¢ GREEN (Low)</option>
                            <option value="YELLOW" ${s.noteImportance === 'YELLOW' ? 'selected' : ''}>ðŸŸ¡ YELLOW (Medium)</option>
                            <option value="RED" ${s.noteImportance === 'RED' ? 'selected' : ''}>ðŸ”´ RED (High)</option>
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

    // Find student by firestoreId for reliable identification
    // This prevents editing the wrong student when array indices change
    let s;
    if (window.currentStudentFirestoreId) {
        s = window.studentsData.find(student => student.firestoreId === window.currentStudentFirestoreId);
    }
    // Fallback to array index if firestoreId lookup fails
    if (!s) {
        s = window.studentsData[currentStudentId];
    }

    if (!s) {
        showNotification('Error: Student not found!', 'error');
        return;
    }

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
        if (field === 'languageCertificate') {
            // Reconstruct the full HTML for language certificate + score
            valueSpan.innerHTML = `<span class="badge badge-language">${newValue}</span>${s.certificateScore ? ` <span class="score-text">Score: ${s.certificateScore}</span>` : ''}`;
        } else if (field === 'level' || field === 'group') {
            // Handle other badges if necessary (though they don't have secondary fields like score)
            const badgeClass = field === 'level' ? 'badge-level' : 'badge-group';
            valueSpan.innerHTML = `<span class="badge ${badgeClass}">${newValue || (field === 'group' ? 'No Group' : '-')}</span>`;
        } else if (field === 'tariff') {
            valueSpan.innerHTML = `<span class="badge badge-tariff">${newValue}</span>`;
        } else {
            valueSpan.textContent = newValue || '-';
        }
    }

    // Refresh the student list
    applyFilters();
    showNotification('Field updated!', 'success');
}

// Toggle Student ID edit mode in modal header
function toggleIdEdit() {
    const idBadge = document.querySelector('.student-id-badge');
    const idEditGroup = document.querySelector('[data-field="id"]');

    if (idBadge && idEditGroup) {
        if (idEditGroup.style.display === 'none') {
            // Show edit field
            idBadge.style.display = 'none';
            idEditGroup.style.display = 'block';
            document.getElementById('edit-id').focus();
        } else {
            // Hide edit field and save
            const newId = document.getElementById('edit-id').value.trim();
            if (newId) {
                saveEdit('id');
                idBadge.textContent = newId;
            }
            idBadge.style.display = 'inline-flex';
            idEditGroup.style.display = 'none';
        }
    }
}

// Confirm delete student (soft delete)
function confirmDeleteStudent() {
    // Find student by firestoreId for reliable identification
    let s;
    if (window.currentStudentFirestoreId) {
        s = window.studentsData.find(student => student.firestoreId === window.currentStudentFirestoreId);
    }
    if (!s) {
        s = window.studentsData[currentStudentId];
    }
    if (!s) {
        showNotification('Error: Student not found!', 'error');
        return;
    }
    if (confirm(`Are you sure you want to delete "${s.fullName}"?\n\nThis student will be moved to the "Deleted students" section and can be restored later.`)) {
        deleteStudent();
    }
}

// Soft delete - mark student as deleted
function deleteStudent() {
    // Find student by firestoreId for reliable identification
    let s;
    if (window.currentStudentFirestoreId) {
        s = window.studentsData.find(student => student.firestoreId === window.currentStudentFirestoreId);
    }
    if (!s) {
        s = window.studentsData[currentStudentId];
    }
    if (!s) {
        showNotification('Error: Student not found!', 'error');
        return;
    }

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
    // Find student by firestoreId for reliable identification
    let s;
    if (window.currentStudentFirestoreId) {
        s = window.studentsData.find(student => student.firestoreId === window.currentStudentFirestoreId);
    }
    if (!s) {
        s = window.studentsData[currentStudentId];
    }
    if (!s) {
        showNotification('Error: Student not found!', 'error');
        return;
    }

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
    // Find student by firestoreId for reliable identification
    let s;
    let studentIndex = -1;
    if (window.currentStudentFirestoreId) {
        studentIndex = window.studentsData.findIndex(student => student.firestoreId === window.currentStudentFirestoreId);
        if (studentIndex !== -1) {
            s = window.studentsData[studentIndex];
        }
    }
    if (!s) {
        studentIndex = currentStudentId;
        s = window.studentsData[currentStudentId];
    }
    if (!s) {
        showNotification('Error: Student not found!', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to PERMANENTLY delete "${s.fullName}"?\n\nâš ï¸ This action cannot be undone!`)) {
        return;
    }

    // Delete from Firestore
    if (typeof deleteStudentFromFirestore === 'function' && s.firestoreId) {
        deleteStudentFromFirestore(s.firestoreId);
    }

    // Remove from local array using the correct index
    if (studentIndex !== -1) {
        window.studentsData.splice(studentIndex, 1);
    }
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
function applyFilters(resetPage = true) {
    // If called from an event listener, resetPage is the event object (truthy), so we reset page
    if (resetPage) {
        studentsPage = 1;
    }

    const container = document.getElementById('studentsList');
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

    const tariffDropdown = document.getElementById('filterTariff');
    const tariffFilter = tariffDropdown ? tariffDropdown.value : '';

    const levelDropdown = document.getElementById('filterLevel');
    const levelFilter = levelDropdown ? levelDropdown.value : '';

    const groupDropdown = document.getElementById('filterGroup');
    const groupFilter = groupDropdown ? groupDropdown.value : '';

    const filtered = window.studentsData.filter(s => {
        // Handle deleted students filter
        if (levelFilter === 'DELETED') {
            // Only show deleted students
            return s.deleted === true;
        } else {
            // Hide deleted students from normal filters
            if (s.deleted) return false;
        }

        // Search filter (name, ID, phone, email, university)
        const matchesSearch = !searchQuery ||
            s.fullName.toLowerCase().includes(searchQuery) ||
            s.id.toLowerCase().includes(searchQuery) ||
            s.phone1.toLowerCase().includes(searchQuery) ||
            (s.phone2 && s.phone2.toLowerCase().includes(searchQuery)) ||
            (s.email && s.email.toLowerCase().includes(searchQuery)) ||
            (s.university1 && s.university1.toLowerCase().includes(searchQuery)) ||
            (s.university2 && s.university2.toLowerCase().includes(searchQuery));

        // Tariff filter
        const matchesTariff = !tariffFilter || s.tariff === tariffFilter;

        // Level filter
        const matchesLevel = !levelFilter || s.level === levelFilter;

        // Group filter - handle "No Group" special case
        let matchesGroup;
        if (!groupFilter) {
            // No filter selected - show all
            matchesGroup = true;
        } else if (groupFilter === 'NO_GROUP') {
            // Show students with no group (undefined, null, or empty string)
            matchesGroup = !s.group || s.group === '';
        } else {
            // Show students matching the selected group
            matchesGroup = s.group === groupFilter;
        }

        return matchesSearch && matchesTariff && matchesLevel && matchesGroup;
    });

    // Update Counter
    const counterEl = document.getElementById('studentsCounter');
    if (counterEl) {
        if (searchQuery || tariffFilter || levelFilter || groupFilter) {
            counterEl.textContent = `Found ${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;
        } else {
            counterEl.textContent = `Total ${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;
        }
    }

    // Pagination Logic
    const totalItems = filtered.length;
    const startIndex = (studentsPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Render paginated data
    if (paginatedData.length === 0) {
        renderPaginationControls('studentsPagination', 1, 0, ITEMS_PER_PAGE, 'changeStudentsPage');
        if (levelFilter === 'DELETED') {
            container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-trash" style="font-size: 4rem; opacity: 0.3;"></i><p class="text-secondary mt-3">No deleted students.</p></div>';
        } else {
            container.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-search" style="font-size: 4rem; opacity: 0.3;"></i><p class="text-secondary mt-3">No students match your filters.</p></div>';
        }
        return;
    }

    container.innerHTML = paginatedData.map((s) => {
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
                    <div class="student-card-header">
                        <div class="student-name">${s.deleted ? '<i class="bi bi-trash text-danger me-2"></i>' : ''}${s.fullName}</div>
                        <span class="student-id-pill">${s.id}</span>
                    </div>
                    <div class="student-pills">
                        <span class="pill pill-tariff"><i class="bi bi-tag-fill"></i> ${s.tariff}</span>
                        <span class="pill pill-level"><i class="bi bi-mortarboard-fill"></i> ${s.level}</span>
                        ${s.languageCertificate && s.languageCertificate !== 'NO CERTIFICATE' ? `<span class="pill pill-certificate"><i class="bi bi-award-fill"></i> ${s.languageCertificate}${s.certificateScore ? ': ' + s.certificateScore : ''}</span>` : ''}
                    </div>
                    ${s.university1 ? `<div class="student-university"><i class="bi bi-building"></i> ${s.university1}</div>` : ''}
                </div>
            </div>
        </div>
    `
    }).join('');

    // Render Pagination Controls
    renderPaginationControls('studentsPagination', studentsPage, totalItems, ITEMS_PER_PAGE, 'changeStudentsPage');
}

document.addEventListener('DOMContentLoaded', function () {
    const saved = localStorage.getItem('studentsData');
    if (saved) {
        window.studentsData = JSON.parse(saved);
        renderStudents();
    }

    // Debounce utility for search input
    let searchDebounceTimer = null;
    function debouncedApplyFilters() {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => applyFilters(), 300);
    }

    // Search input listener (debounced)
    const search = document.getElementById('searchInput');
    if (search) {
        search.addEventListener('input', debouncedApplyFilters);
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

    // Group filter listener
    const groupFilter = document.getElementById('filterGroup');
    if (groupFilter) {
        groupFilter.addEventListener('change', applyFilters);
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
        // Format timestamp - use createdAt instead of timestamp
        let timestamp = '';
        if (p.createdAt) {
            const date = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
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
            'Payment Method': p.method || '', // Changed from p.paymentMethod to p.method
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

    // Update Counter
    const counterEl = document.getElementById('paymentStudentsCounter');
    if (counterEl) {
        // Check if filters are active by checking input values
        const searchTerm = document.getElementById('paymentSearchInput') ? document.getElementById('paymentSearchInput').value : '';
        const tariffFilter = document.getElementById('paymentTariffFilter') ? document.getElementById('paymentTariffFilter').value : '';
        const balanceFilter = document.getElementById('paymentBalanceFilter') ? document.getElementById('paymentBalanceFilter').value : '';

        if (searchTerm || tariffFilter || balanceFilter) {
            counterEl.textContent = `Found ${students.length} student${students.length !== 1 ? 's' : ''}`;
        } else {
            counterEl.textContent = `Total ${students.length} student${students.length !== 1 ? 's' : ''}`;
        }
    }

    // Sort by ID
    students.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    // Pagination Logic
    const totalItems = students.length;
    const startIndex = (paymentStudentsPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = students.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (!students || students.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-wallet2" style="font-size: 4rem; opacity: 0.3;"></i>
                <p class="text-secondary mt-3">No students found.</p>
            </div>
        `;
        renderPaginationControls('paymentStudentsPagination', 1, 0, ITEMS_PER_PAGE, 'changePaymentStudentsPage');
        return;
    }

    container.innerHTML = paginatedData.map(s => {
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

    renderPaginationControls('paymentStudentsPagination', paymentStudentsPage, totalItems, ITEMS_PER_PAGE, 'changePaymentStudentsPage');
}

// Render payment history
function renderPaymentHistory(filteredData = null) {
    const container = document.getElementById('paymentHistoryList');
    if (!container) return;

    const payments = filteredData || window.paymentsData || [];

    // Update Counter
    const counterEl = document.getElementById('paymentHistoryCounter');
    if (counterEl) {
        // Check if filters are active
        const searchTerm = document.getElementById('paymentHistorySearch') ? document.getElementById('paymentHistorySearch').value : '';
        const methodFilter = document.getElementById('paymentMethodFilter') ? document.getElementById('paymentMethodFilter').value : '';
        const receiverFilter = document.getElementById('receivedByFilter') ? document.getElementById('receivedByFilter').value : '';

        if (searchTerm || methodFilter || receiverFilter) {
            counterEl.textContent = `Found ${payments.length} payment${payments.length !== 1 ? 's' : ''}`;
        } else {
            counterEl.textContent = `Total ${payments.length} payment${payments.length !== 1 ? 's' : ''}`;
        }
    }

    // Pagination Logic
    const totalItems = payments.length;
    const startIndex = (paymentHistoryPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = payments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (!payments || payments.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-clock-history" style="font-size: 4rem; opacity: 0.3;"></i>
                <p class="text-secondary mt-3">No payments recorded yet.</p>
            </div>
        `;
        renderPaginationControls('paymentHistoryPagination', 1, 0, ITEMS_PER_PAGE, 'changePaymentHistoryPage');
        return;
    }

    container.innerHTML = paginatedData.map(p => {
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

        // Check if amount is negative (withdrawal)
        const amount = parseFloat(p.amount) || 0;
        const isWithdrawal = amount < 0;
        const amountPrefix = isWithdrawal ? '-' : '+';
        const amountClass = isWithdrawal ? 'text-danger' : 'text-success';
        const displayAmount = formatAmount(Math.abs(amount));

        return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="payment-history-card">
                <div class="payment-header">
                    <span class="payment-amount ${amountClass}">${amountPrefix}${displayAmount} UZS</span>
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

    renderPaginationControls('paymentHistoryPagination', paymentHistoryPage, totalItems, ITEMS_PER_PAGE, 'changePaymentHistoryPage');
}

// Filter payment students
function filterPaymentStudents(resetPage = true) {
    if (resetPage) paymentStudentsPage = 1;

    const searchTerm = document.getElementById('paymentSearchInput').value.toLowerCase();
    const tariffFilter = document.getElementById('paymentTariffFilter').value;
    const balanceFilter = document.getElementById('paymentBalanceFilter') ? document.getElementById('paymentBalanceFilter').value : '';

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

    // Apply balance filter
    if (balanceFilter) {
        filtered = filtered.filter(s => {
            const balance = parseFloat(s.balance) || 0;

            switch (balanceFilter) {
                case 'NEGATIVE':
                    return balance < 0;
                case 'ZERO':
                    return balance === 0;
                case 'GT_500K':
                    return balance > 500000;
                case 'GT_1M':
                    return balance > 1000000;
                case 'GT_2M':
                    return balance > 2000000;
                case 'GT_5M':
                    return balance > 5000000;
                case 'GT_10M':
                    return balance > 10000000;
                default:
                    return true;
            }
        });
    }

    renderPaymentStudents(filtered);
}

// Filter payment history
function filterPaymentHistory(resetPage = true) {
    if (resetPage) paymentHistoryPage = 1;

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

    // If DISCOUNT is selected, automatically set Payment Method and Received By to "Discount"
    if (note === 'DISCOUNT') {
        const paymentMethodDropdown = document.getElementById('paymentMethod');
        const receivedByDropdown = document.getElementById('receivedBy');

        if (paymentMethodDropdown) {
            paymentMethodDropdown.value = 'Discount';
        }

        if (receivedByDropdown) {
            receivedByDropdown.value = 'Discount';
        }
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

// Submit withdrawal
function submitWithdrawal() {
    const amountInput = document.getElementById('withdrawAmount');
    const reasonInput = document.getElementById('withdrawReason');
    const studentInput = document.getElementById('withdrawStudent');

    // Validate required fields
    const amount = parseAmount(amountInput.value);
    const reason = reasonInput.value.trim().toUpperCase();

    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount!', 'error');
        amountInput.focus();
        return;
    }

    if (!reason) {
        showNotification('Please enter a reason for withdrawal!', 'error');
        reasonInput.focus();
        return;
    }

    // Build withdrawal data as a negative payment
    const withdrawalData = {
        amount: -amount, // Negative amount for withdrawal
        method: 'Withdrawal',
        receivedBy: 'System',
        notes: `WITHDRAWAL: ${reason}`,
        isDiscount: false,
        isWithdrawal: true, // Flag to identify withdrawals
        studentFirestoreId: null,
        studentId: null,
        studentName: null
    };

    // Get student info if selected
    if (studentInput.value) {
        const selectedOption = studentInput.options[studentInput.selectedIndex];
        withdrawalData.studentFirestoreId = studentInput.value;
        withdrawalData.studentId = selectedOption.dataset.studentId;
        withdrawalData.studentName = selectedOption.dataset.studentName;
    }

    // Save to Firestore
    if (typeof savePaymentToFirestore === 'function') {
        savePaymentToFirestore(withdrawalData);
    }

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('withdrawPaymentModal'));
    if (modal) {
        modal.hide();
    }
    document.getElementById('withdrawPaymentForm').reset();

    // Refresh payment history and students view
    setTimeout(() => {
        renderPaymentHistory();
        if (withdrawalData.studentFirestoreId) {
            renderPaymentStudents();
        }
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

    // Initialize withdraw payment modal when opened
    const withdrawModal = document.getElementById('withdrawPaymentModal');
    if (withdrawModal) {
        withdrawModal.addEventListener('show.bs.modal', function () {
            populateWithdrawStudentDropdown();
        });
    }

    // Setup amount input formatting
    setupAmountInput();

    // Setup withdraw amount input formatting
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    if (withdrawAmountInput) {
        withdrawAmountInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value)) {
                e.target.value = formatAmount(value);
            }
        });
    }
});

// Populate student dropdown in Withdraw Payment modal
function populateWithdrawStudentDropdown() {
    const dropdown = document.getElementById('withdrawStudent');
    if (!dropdown) return;

    const students = window.studentsData.filter(s => !s.deleted);
    students.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    dropdown.innerHTML = '<option value="">No student (General withdrawal)</option>' +
        students.map(s => `<option value="${s.firestoreId || s.id}" data-student-id="${s.id}" data-student-name="${s.fullName}">${s.id} - ${s.fullName}</option>`).join('');
}

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
let isDeleting = false; // Flag to prevent multiple simultaneous deletes

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
// GROUPS MANAGEMENT
// ==========================================

// Global groups data
window.groupsData = [];

function renderGroupsList() {
    const container = document.getElementById('groupsListContainer');
    if (!container) return;

    if (window.groupsData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-secondary">
                <i class="bi bi-people" style="font-size: 2rem; opacity: 0.5;"></i>
                <p class="mt-2 mb-0">No groups configured. Add your first group.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = window.groupsData.map(g => `
        <div class="settings-item">
            <div class="settings-item-info">
                <span class="settings-item-name">${g.name}</span>
            </div>
            <div class="settings-item-actions">
                <button class="settings-item-btn edit-btn" onclick="editGroup('${g.firestoreId}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="settings-item-btn delete-btn" onclick="confirmDeleteGroup('${g.firestoreId}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openGroupModal(groupId = null) {
    const modal = new bootstrap.Modal(document.getElementById('groupModal'));
    const form = document.getElementById('groupForm');
    const title = document.getElementById('groupModalTitle');

    form.reset();
    document.getElementById('groupEditId').value = '';

    if (groupId) {
        const group = window.groupsData.find(g => g.firestoreId === groupId);
        if (group) {
            title.innerHTML = '<i class="bi bi-people-fill me-2"></i>Edit Group';
            document.getElementById('groupEditId').value = groupId;
            document.getElementById('groupName').value = group.name;
        }
    } else {
        title.innerHTML = '<i class="bi bi-people-fill me-2"></i>Add Group';
    }

    modal.show();
}

function editGroup(groupId) {
    openGroupModal(groupId);
}

function saveGroup() {
    const name = document.getElementById('groupName').value.trim().toUpperCase();
    const editId = document.getElementById('groupEditId').value;

    if (!name) {
        showNotification('Please enter a group name!', 'error');
        return;
    }

    const groupData = {
        name
    };

    if (editId) {
        if (typeof updateGroupInFirestore === 'function') {
            updateGroupInFirestore(editId, groupData);
        }
    } else {
        if (typeof saveGroupToFirestore === 'function') {
            saveGroupToFirestore(groupData);
        }
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('groupModal'));
    if (modal) modal.hide();
}

function confirmDeleteGroup(groupId) {
    const group = window.groupsData.find(g => g.firestoreId === groupId);
    if (!group) return;

    pendingSettingsDelete = {
        type: 'group',
        id: groupId
    };

    document.getElementById('confirmSettingsDeleteTitle').textContent = 'Delete Group';
    document.getElementById('confirmSettingsDeleteMessage').textContent =
        `Are you sure you want to delete "${group.name}"?`;

    const modal = new bootstrap.Modal(document.getElementById('confirmSettingsDeleteModal'));
    modal.show();
}

// Update group filter dropdown
function updateGroupDropdowns() {
    const groupSelects = document.querySelectorAll('#filterGroup');

    groupSelects.forEach(select => {
        const currentValue = select.value;

        select.innerHTML = '<option value="">All Groups</option>';

        // Add "No Group" option for filtering students without a group
        const noGroupOption = document.createElement('option');
        noGroupOption.value = 'NO_GROUP';
        noGroupOption.textContent = 'No Group';
        select.appendChild(noGroupOption);

        (window.groupsData || []).forEach(g => {
            const option = document.createElement('option');
            option.value = g.name;
            option.textContent = g.name;
            select.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// ==========================================
// UNIVERSITIES MANAGEMENT
// ==========================================

function renderUniversitiesList() {
    const container = document.getElementById('universitiesListContainer');
    if (!container) return;

    // Debug: Log all universities and their level names
    console.log('📚 Universities Data:', window.universitiesData);
    console.log('📚 Unique levelNames:', [...new Set(window.universitiesData.map(u => u.levelName))]);

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

    // 🛡️ PROTECTION: Prevent multiple simultaneous deletes
    if (isDeleting) {
        console.warn('⚠️ Delete operation already in progress, please wait...');
        return;
    }

    isDeleting = true;

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
        case 'group':
            if (typeof deleteGroupFromFirestore === 'function') {
                deleteGroupFromFirestore(id);
            }
            break;
        case 'video':
            if (typeof deleteVideoFromFirestore === 'function') {
                deleteVideoFromFirestore(id);
            }
            break;
    }

    pendingSettingsDelete = null;

    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmSettingsDeleteModal'));
    if (modal) modal.hide();

    // Reset deletion flag after a short delay to allow Firestore operation to complete
    setTimeout(() => {
        isDeleting = false;
    }, 1000);
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

    const normalizedLevel = selectedLevel ? selectedLevel.trim().toUpperCase() : '';
    const filteredUnis = normalizedLevel ?
        window.universitiesData.filter(u => u.levelName && u.levelName.trim().toUpperCase() === normalizedLevel) : [];

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
window.openGroupModal = openGroupModal;
window.editGroup = editGroup;
window.saveGroup = saveGroup;
window.confirmDeleteGroup = confirmDeleteGroup;
window.renderGroupsList = renderGroupsList;
window.updateGroupDropdowns = updateGroupDropdowns;

// ==========================================
// VIDEO TUTORIALS MANAGEMENT
// ==========================================

// Global videos data
window.videosData = [];

function renderVideosList() {
    const container = document.getElementById('videosListContainer');
    if (!container) return;

    if (!window.videosData || window.videosData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-secondary">
                <i class="bi bi-play-circle" style="font-size: 2rem; opacity: 0.5;"></i>
                <p class="mt-2 mb-0">No videos configured. Add your first video tutorial.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = window.videosData.map(v => `
        <div class="settings-item">
            <div class="settings-item-info">
                <span class="settings-item-name">${v.name}</span>
                <span class="settings-item-meta" style="font-size: 0.7rem; word-break: break-all;">${v.url}</span>
            </div>
            <div class="settings-item-actions">
                <a href="${v.url}" target="_blank" class="settings-item-btn" title="Preview" style="color: #ef4444;">
                    <i class="bi bi-play-fill"></i>
                </a>
                <button class="settings-item-btn edit-btn" onclick="editVideo('${v.firestoreId}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="settings-item-btn delete-btn" onclick="confirmDeleteVideo('${v.firestoreId}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openVideoModal(videoId = null) {
    const modal = new bootstrap.Modal(document.getElementById('videoModal'));
    const form = document.getElementById('videoForm');
    const title = document.getElementById('videoModalTitle');

    form.reset();
    document.getElementById('videoEditId').value = '';

    if (videoId) {
        const video = window.videosData.find(v => v.firestoreId === videoId);
        if (video) {
            title.innerHTML = '<i class="bi bi-play-circle-fill me-2" style="color: #ef4444;"></i>Edit Video';
            document.getElementById('videoEditId').value = videoId;
            document.getElementById('videoName').value = video.name;
            document.getElementById('videoUrl').value = video.url;
        }
    } else {
        title.innerHTML = '<i class="bi bi-play-circle-fill me-2" style="color: #ef4444;"></i>Add Video';
    }

    modal.show();
}

function editVideo(videoId) {
    openVideoModal(videoId);
}

function saveVideo() {
    const name = document.getElementById('videoName').value.trim();
    const url = document.getElementById('videoUrl').value.trim();
    const editId = document.getElementById('videoEditId').value;

    if (!name || !url) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        showNotification('Please enter a valid URL!', 'error');
        return;
    }

    const videoData = {
        name,
        url
    };

    if (editId) {
        if (typeof updateVideoInFirestore === 'function') {
            updateVideoInFirestore(editId, videoData);
        }
    } else {
        if (typeof saveVideoToFirestore === 'function') {
            saveVideoToFirestore(videoData);
        }
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('videoModal'));
    if (modal) modal.hide();
}

function confirmDeleteVideo(videoId) {
    const video = window.videosData.find(v => v.firestoreId === videoId);
    if (!video) return;

    pendingSettingsDelete = {
        type: 'video',
        id: videoId
    };

    document.getElementById('confirmSettingsDeleteTitle').textContent = 'Delete Video';
    document.getElementById('confirmSettingsDeleteMessage').textContent =
        `Are you sure you want to delete "${video.name}"?`;

    const modal = new bootstrap.Modal(document.getElementById('confirmSettingsDeleteModal'));
    modal.show();
}

// Export video functions
window.renderVideosList = renderVideosList;
window.openVideoModal = openVideoModal;
window.editVideo = editVideo;
window.saveVideo = saveVideo;
window.confirmDeleteVideo = confirmDeleteVideo;

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
window.getTariffPrice = getTariffPrice;
window.getTariffDisplayValue = getTariffDisplayValue;
window.downloadPaymentHistoryAsExcel = downloadPaymentHistoryAsExcel;
window.editPayment = editPayment;
window.savePaymentEdit = savePaymentEdit;
window.deletePayment = deletePayment;
window.toggleIdEdit = toggleIdEdit;

// ==========================================
// ADMISSIONS & NOTIFICATIONS MANAGEMENT
// ==========================================

// Global data storage
if (!window.admissionsData) {
    window.admissionsData = [];
}
if (!window.notificationsData) {
    window.notificationsData = [];
}

let currentAdmissionId = null;
let currentNotificationId = null;

// Format date for display (DD.MM.YYYY)
function formatDisplayDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// ==========================================
// ADMISSIONS FUNCTIONS
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
            <div class="round-card-elite">
                <div class="round-header">
                    <span class="round-badge">${i}</span>
                    <span class="round-title">Round ${i}</span>
                </div>
                <div class="round-dates">
                    <div class="date-field date-field-range">
                        <label class="date-label">Online Application Period</label>
                        <div class="date-range-inputs">
                            <div class="date-range-item">
                                <label class="date-sublabel">From</label>
                                <input type="date" class="date-input" id="round${i}OnlineAppFrom">
                            </div>
                            <div class="date-range-item">
                                <label class="date-sublabel">To</label>
                                <input type="date" class="date-input" id="round${i}OnlineAppTo">
                            </div>
                        </div>
                    </div>
                    <div class="date-field">
                        <label class="date-label">Document Submission</label>
                        <input type="date" class="date-input" id="round${i}DocSubmission">
                    </div>
                    <div class="date-field">
                        <label class="date-label">Interview</label>
                        <input type="date" class="date-input" id="round${i}Interview">
                    </div>
                    <div class="date-field">
                        <label class="date-label">Announcement</label>
                        <input type="date" class="date-input" id="round${i}Announcement">
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
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
        const roundsCount = admission.rounds && admission.rounds.length > 0 ? admission.rounds.length : 0;

        // Build application periods display
        let roundsHtml = '';
        if (admission.rounds && admission.rounds.length > 0) {
            roundsHtml = admission.rounds.map(round => {
                const fromDate = round.onlineApplicationFrom ? formatDisplayDate(round.onlineApplicationFrom) :
                    (round.onlineApplication ? formatDisplayDate(round.onlineApplication) : '?');
                const toDate = round.onlineApplicationTo ? formatDisplayDate(round.onlineApplicationTo) : '?';

                if (round.onlineApplicationFrom || round.onlineApplicationTo) {
                    return `
                        <div class="d-flex align-items-center justify-content-between py-2 px-3 mb-2 rounded-2" style="background: rgba(var(--bs-primary-rgb), 0.05); border-left: 3px solid var(--bs-primary);">
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1" style="font-size: 0.7rem;">R${round.roundNumber}</span>
                                <span class="text-body fw-medium" style="font-size: 0.85rem;">${fromDate}</span>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-arrow-right text-primary" style="font-size: 0.75rem;"></i>
                                <span class="text-body fw-medium" style="font-size: 0.85rem;">${toDate}</span>
                            </div>
                        </div>
                    `;
                } else if (round.onlineApplication) {
                    return `
                        <div class="d-flex align-items-center gap-2 py-2 px-3 mb-2 rounded-2" style="background: rgba(var(--bs-primary-rgb), 0.05); border-left: 3px solid var(--bs-primary);">
                            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1" style="font-size: 0.7rem;">R${round.roundNumber}</span>
                            <span class="text-body fw-medium" style="font-size: 0.85rem;">${fromDate}</span>
                        </div>
                    `;
                }
                return '';
            }).join('');
        }

        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card-apple h-100 cursor-pointer hover-lift" onclick="viewAdmissionDetails(${index})" style="padding: 0; overflow: hidden;">
                    <!-- Header Section -->
                    <div class="p-3 pb-2" style="background: linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.08) 0%, rgba(var(--bs-info-rgb), 0.05) 100%); border-bottom: 1px solid rgba(var(--bs-border-color-rgb), 0.1);">
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="d-flex align-items-center gap-2">
                                <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; min-width: 36px;">
                                    <i class="bi bi-building text-primary" style="font-size: 1rem;"></i>
                                </div>
                                <div>
                                    <h6 class="mb-0 fw-bold text-body" style="font-size: 0.95rem; line-height: 1.3;">${admission.universityName}</h6>
                                </div>
                            </div>
                            <span class="badge rounded-pill px-2 py-1" style="background: var(--bs-info); color: white; font-size: 0.7rem;">${roundsCount} ${roundsCount === 1 ? 'Round' : 'Rounds'}</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-2">
                            <i class="bi bi-mortarboard text-secondary" style="font-size: 0.85rem;"></i>
                            <span class="text-secondary" style="font-size: 0.85rem;">${admission.educationLevel || '-'}</span>
                        </div>
                    </div>
                    
                    <!-- Rounds Section -->
                    ${roundsHtml ? `
                        <div class="p-3" style="max-height: 200px; overflow-y: auto;">
                            ${roundsHtml}
                        </div>
                    ` : `
                        <div class="p-3 text-center">
                            <span class="text-secondary fst-italic" style="font-size: 0.85rem;">No application periods set</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    });

    admissionsList.innerHTML = html;

    // Populate education level filter dropdown
    populateAdmissionsLevelFilter();
}

function populateAdmissionsLevelFilter() {
    var levelFilter = document.getElementById('admissionsLevelFilter');

    // Only populate if the dropdown exists and only has the default option
    if (levelFilter && levelFilter.options.length === 1 && window.levelsData) {
        window.levelsData.forEach(function (level) {
            var option = document.createElement('option');
            option.value = level.name;
            option.textContent = level.name;
            levelFilter.appendChild(option);
        });
    }
}

function filterAdmissions() {
    var searchInput = document.getElementById('admissionsSearchInput');
    var levelFilter = document.getElementById('admissionsLevelFilter');
    var searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var selectedLevel = levelFilter ? levelFilter.value : '';
    var admissionsList = document.getElementById('admissionsList');
    var admissionsCounter = document.getElementById('admissionsCounter');
    var admissions = window.admissionsData || [];

    if (admissions.length === 0) {
        admissionsList.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-inbox icon-empty-state"></i><p class="text-secondary mt-3">No admissions yet. Click "Add Admission" to get started.</p></div>';
        admissionsCounter.textContent = 'No admissions';
        return;
    }

    // Filter admissions based on search term and education level
    var filteredAdmissions = admissions.filter(function (admission, index) {
        admission._originalIndex = index;

        // Search filter
        var matchesSearch = true;
        if (searchTerm) {
            var universityName = (admission.universityName || '').toLowerCase();
            var educationLevel = (admission.educationLevel || '').toLowerCase();
            matchesSearch = universityName.includes(searchTerm) || educationLevel.includes(searchTerm);
        }

        // Level filter
        var matchesLevel = true;
        if (selectedLevel) {
            matchesLevel = admission.educationLevel === selectedLevel;
        }

        return matchesSearch && matchesLevel;
    });

    if (filteredAdmissions.length === 0) {
        var message = 'No admissions found';
        if (searchTerm && selectedLevel) {
            message += ' matching "' + searchTerm + '" in ' + selectedLevel;
        } else if (searchTerm) {
            message += ' matching "' + searchTerm + '"';
        } else if (selectedLevel) {
            message += ' for ' + selectedLevel;
        }
        admissionsList.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-search icon-empty-state" style="font-size: 3rem; opacity: 0.5;"></i><p class="text-secondary mt-3">' + message + '</p></div>';
        admissionsCounter.textContent = '0 results';
        return;
    }

    if (searchTerm || selectedLevel) {
        admissionsCounter.textContent = filteredAdmissions.length + ' of ' + admissions.length + ' admission' + (admissions.length > 1 ? 's' : '');
    } else {
        admissionsCounter.textContent = admissions.length + ' admission' + (admissions.length > 1 ? 's' : '');
    }

    var html = '';
    filteredAdmissions.forEach(function (admission) {
        var index = admission._originalIndex;
        var roundsCount = admission.rounds && admission.rounds.length > 0 ? admission.rounds.length : 0;

        var roundsHtml = '';
        if (admission.rounds && admission.rounds.length > 0) {
            admission.rounds.forEach(function (round) {
                var fromDate = round.onlineApplicationFrom ? formatDisplayDate(round.onlineApplicationFrom) :
                    (round.onlineApplication ? formatDisplayDate(round.onlineApplication) : '?');
                var toDate = round.onlineApplicationTo ? formatDisplayDate(round.onlineApplicationTo) : '?';

                if (round.onlineApplicationFrom || round.onlineApplicationTo) {
                    roundsHtml += '<div class="d-flex align-items-center justify-content-between py-2 px-3 mb-2 rounded-2" style="background: rgba(var(--bs-primary-rgb), 0.05); border-left: 3px solid var(--bs-primary);"><div class="d-flex align-items-center gap-2"><span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1" style="font-size: 0.7rem;">R' + round.roundNumber + '</span><span class="text-body fw-medium" style="font-size: 0.85rem;">' + fromDate + '</span></div><div class="d-flex align-items-center gap-2"><i class="bi bi-arrow-right text-primary" style="font-size: 0.75rem;"></i><span class="text-body fw-medium" style="font-size: 0.85rem;">' + toDate + '</span></div></div>';
                } else if (round.onlineApplication) {
                    roundsHtml += '<div class="d-flex align-items-center gap-2 py-2 px-3 mb-2 rounded-2" style="background: rgba(var(--bs-primary-rgb), 0.05); border-left: 3px solid var(--bs-primary);"><span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1" style="font-size: 0.7rem;">R' + round.roundNumber + '</span><span class="text-body fw-medium" style="font-size: 0.85rem;">' + fromDate + '</span></div>';
                }
            });
        }

        html += '<div class="col-md-6 col-lg-4 mb-3"><div class="card-apple h-100 cursor-pointer hover-lift" onclick="viewAdmissionDetails(' + index + ')" style="padding: 0; overflow: hidden;"><div class="p-3 pb-2" style="background: linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.08) 0%, rgba(var(--bs-info-rgb), 0.05) 100%); border-bottom: 1px solid rgba(var(--bs-border-color-rgb), 0.1);"><div class="d-flex align-items-start justify-content-between mb-2"><div class="d-flex align-items-center gap-2"><div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; min-width: 36px;"><i class="bi bi-building text-primary" style="font-size: 1rem;"></i></div><div><h6 class="mb-0 fw-bold text-body" style="font-size: 0.95rem; line-height: 1.3;">' + admission.universityName + '</h6></div></div><span class="badge rounded-pill px-2 py-1" style="background: var(--bs-info); color: white; font-size: 0.7rem;">' + roundsCount + ' ' + (roundsCount === 1 ? 'Round' : 'Rounds') + '</span></div><div class="d-flex align-items-center gap-2 mt-2"><i class="bi bi-mortarboard text-secondary" style="font-size: 0.85rem;"></i><span class="text-secondary" style="font-size: 0.85rem;">' + (admission.educationLevel || '-') + '</span></div></div>' + (roundsHtml ? '<div class="p-3" style="max-height: 200px; overflow-y: auto;">' + roundsHtml + '</div>' : '<div class="p-3 text-center"><span class="text-secondary fst-italic" style="font-size: 0.85rem;">No application periods set</span></div>') + '</div></div>';
    });

    admissionsList.innerHTML = html;
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
        const onlineAppFromEl = document.getElementById(`round${i}OnlineAppFrom`);
        const onlineAppToEl = document.getElementById(`round${i}OnlineAppTo`);
        const docSubmissionEl = document.getElementById(`round${i}DocSubmission`);
        const interviewEl = document.getElementById(`round${i}Interview`);
        const announcementEl = document.getElementById(`round${i}Announcement`);

        const onlineAppFrom = onlineAppFromEl ? onlineAppFromEl.value : '';
        const onlineAppTo = onlineAppToEl ? onlineAppToEl.value : '';
        const docSubmission = docSubmissionEl ? docSubmissionEl.value : '';
        const interview = interviewEl ? interviewEl.value : '';
        const announcement = announcementEl ? announcementEl.value : '';

        rounds.push({
            roundNumber: i,
            onlineApplicationFrom: onlineAppFrom,
            onlineApplicationTo: onlineAppTo,
            documentSubmission: docSubmission,
            interview: interview,
            announcement: announcement
        });
    }

    const information = document.getElementById('admissionInformation').value.trim();
    const majors = document.getElementById('admissionMajors').value.trim();
    const scholarships = document.getElementById('admissionScholarships').value.trim();

    const admissionData = {
        educationLevel: educationLevel,
        universityName: university,
        roundsCount: roundsCount,
        rounds: rounds,
        information: information,
        majors: majors,
        scholarships: scholarships,
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
    let detailsHtml = '<div class="d-flex align-items-center mb-4 ps-1"><div class="bg-primary bg-opacity-10 p-3 rounded-4 me-3 d-flex align-items-center justify-content-center shadow-sm" style="width: 56px; height: 56px; min-width: 56px;"><i class="bi bi-building text-primary fs-3"></i></div><div><h4 class="mb-1 fw-bold text-body tracking-wide">' + admission.universityName + '</h4><div class="d-flex align-items-center gap-2"><span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10 fw-medium px-2 py-1">' + admission.educationLevel + '</span></div></div></div>';
    if (admission.rounds && admission.rounds.length > 0) {
        detailsHtml += '<div class="card border border-light-subtle mb-4 overflow-hidden rounded-3 shadow-sm"><div class="table-responsive"><table class="table table-hover align-middle mb-0" style="font-size: 0.9rem;"><thead class="bg-body-secondary text-secondary text-uppercase small"><tr><th class="ps-4 py-3 fw-bold" style="width: 80px;">Round</th><th class="py-3 fw-bold" style="min-width: 140px;">Application</th><th class="py-3 fw-bold" style="min-width: 110px;">Docs</th><th class="py-3 fw-bold" style="min-width: 110px;">Interview</th><th class="pe-4 py-3 fw-bold" style="min-width: 110px;">Result</th></tr></thead><tbody>';
        admission.rounds.forEach(function (round) {
            var onlineAppDisplay = '<span class="text-secondary opacity-50">-</span>';
            if (round.onlineApplicationFrom || round.onlineApplicationTo) {
                var fromDate = round.onlineApplicationFrom ? formatDisplayDate(round.onlineApplicationFrom) : '?';
                var toDate = round.onlineApplicationTo ? formatDisplayDate(round.onlineApplicationTo) : '?';
                onlineAppDisplay = '<div class="d-flex flex-column" style="line-height: 1.2;"><span class="fw-medium text-body">' + fromDate + '</span><span class="text-secondary small" style="font-size: 0.75em; margin-top: 2px;">to ' + toDate + '</span></div>';
            } else if (round.onlineApplication) {
                onlineAppDisplay = '<span class="fw-medium text-body">' + formatDisplayDate(round.onlineApplication) + '</span>';
            }
            var docDisplay = round.documentSubmission ? formatDisplayDate(round.documentSubmission) : '<span class="text-secondary opacity-50">-</span>';
            var interviewDisplay = round.interview ? formatDisplayDate(round.interview) : '<span class="text-secondary opacity-50">-</span>';
            var resultDisplay = round.announcement ? formatDisplayDate(round.announcement) : '<span class="text-secondary opacity-50">-</span>';
            detailsHtml += '<tr><td class="ps-4 py-3"><span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 border border-primary border-opacity-10">R' + round.roundNumber + '</span></td><td class="py-3">' + onlineAppDisplay + '</td><td class="py-3 text-body opacity-75">' + docDisplay + '</td><td class="py-3 text-body opacity-75">' + interviewDisplay + '</td><td class="pe-4 py-3 text-body opacity-75">' + resultDisplay + '</td></tr>';
        });
        detailsHtml += '</tbody></table></div></div>';
    } else {
        detailsHtml += '<div class="text-center py-4 text-secondary fst-italic border border-dashed border-light-subtle rounded-3 mb-4">No rounds configured</div>';
    }
    // Added Premium Accordions for Information, Majors, and Scholarships
    if (admission.information) {
        detailsHtml += `
            <div class="accordion-item-premium accordion-item-info mb-3" id="accordion-info-${index}">
                <div class="accordion-header-premium" onclick="togglePremiumAccordion('info-${index}')">
                    <div class="d-flex align-items-center gap-3">
                        <i class="bi bi-info-circle text-info fs-5"></i>
                        <span class="fw-bold text-uppercase small tracking-wider text-info">Information</span>
                    </div>
                    <i class="bi bi-chevron-down chevron-icon"></i>
                </div>
                <div class="accordion-content-premium">
                    <div class="px-4 pb-4">
                        <p class="mb-0 text-body opacity-90" style="white-space: pre-wrap; line-height: 1.6; font-size: 0.9em;">${admission.information}</p>
                    </div>
                </div>
            </div>`;
    }
    if (admission.majors) {
        detailsHtml += `
            <div class="accordion-item-premium accordion-item-majors mb-3" id="accordion-majors-${index}">
                <div class="accordion-header-premium" onclick="togglePremiumAccordion('majors-${index}')">
                    <div class="d-flex align-items-center gap-3">
                        <i class="bi bi-book text-primary fs-5"></i>
                        <span class="fw-bold text-uppercase small tracking-wider text-primary">Majors</span>
                    </div>
                    <i class="bi bi-chevron-down chevron-icon"></i>
                </div>
                <div class="accordion-content-premium">
                    <div class="px-4 pb-4">
                        <p class="mb-0 text-body opacity-90" style="white-space: pre-wrap; line-height: 1.6; font-size: 0.9em;">${admission.majors}</p>
                    </div>
                </div>
            </div>`;
    }
    if (admission.scholarships) {
        detailsHtml += `
            <div class="accordion-item-premium accordion-item-scholarships mb-3" id="accordion-scholarships-${index}">
                <div class="accordion-header-premium" onclick="togglePremiumAccordion('scholarships-${index}')">
                    <div class="d-flex align-items-center gap-3">
                        <i class="bi bi-award text-success fs-5"></i>
                        <span class="fw-bold text-uppercase small tracking-wider text-success">Scholarships Opportunities</span>
                    </div>
                    <i class="bi bi-chevron-down chevron-icon"></i>
                </div>
                <div class="accordion-content-premium">
                    <div class="px-4 pb-4">
                        <p class="mb-0 text-body opacity-90" style="white-space: pre-wrap; line-height: 1.6; font-size: 0.9em;">${admission.scholarships}</p>
                    </div>
                </div>
            </div>`;
    }
    document.getElementById('admissionDetailsContent').innerHTML = detailsHtml;
    var modal = new bootstrap.Modal(document.getElementById('viewAdmissionModal'));
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
                        if (document.getElementById(`round${i}OnlineAppFrom`)) {
                            document.getElementById(`round${i}OnlineAppFrom`).value = round.onlineApplicationFrom || round.onlineApplication || '';
                            document.getElementById(`round${i}OnlineAppTo`).value = round.onlineApplicationTo || '';
                            document.getElementById(`round${i}DocSubmission`).value = round.documentSubmission || '';
                            document.getElementById(`round${i}Interview`).value = round.interview || '';
                            document.getElementById(`round${i}Announcement`).value = round.announcement || '';
                        }
                    });
                }
            }, 100);
        }, 100);

        document.getElementById('admissionEditId').value = currentAdmissionId;
        document.getElementById('admissionInformation').value = admission.information || '';
        document.getElementById('admissionMajors').value = admission.majors || '';
        document.getElementById('admissionScholarships').value = admission.scholarships || '';
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

// ==========================================
// NOTIFICATIONS FUNCTIONS
// ==========================================

function renderNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    const notificationsCounter = document.getElementById('notificationsCounter');
    const notifications = window.notificationsData || [];

    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-inbox icon-empty-state"></i>
                <p class="text-secondary mt-3">No notifications yet. Click "Add Notification" to get started.</p>
            </div>
        `;
        notificationsCounter.textContent = 'No notifications';

        // Update badge
        const badge = document.getElementById('notificationsBadge');
        if (badge) {
            badge.style.display = 'none';
        }
        return;
    }

    notificationsCounter.textContent = `${notifications.length} notification${notifications.length > 1 ? 's' : ''}`;

    // Update badge
    const badge = document.getElementById('notificationsBadge');
    if (badge) {
        badge.textContent = notifications.length;
        badge.style.display = 'inline-block';
    }

    let html = '';
    notifications.forEach((notification, index) => {
        const hasDuration = notification.durationFrom || notification.durationTo;

        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card-apple p-3 h-100 cursor-pointer hover-lift" onclick="viewNotificationDetails(${index})">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <i class="bi bi-bell-fill text-primary fs-5 me-2"></i>
                        <span class="badge bg-info">${formatDisplayDate(notification.date)}</span>
                    </div>
                    <p class="mb-2 fw-500" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${notification.text}
                    </p>
                    ${hasDuration ? `
                        <p class="text-secondary small mb-0">
                            <i class="bi bi-clock me-1"></i>Duration: ${formatDisplayDate(notification.durationFrom)} - ${formatDisplayDate(notification.durationTo)}
                        </p>
                    ` : ''}
                </div>
            </div>
        `;
    });

    notificationsList.innerHTML = html;
}

function saveNotification() {
    const text = document.getElementById('notificationText').value.trim();
    const date = document.getElementById('notificationDate').value;
    const durationFrom = document.getElementById('notificationDurationFrom').value;
    const durationTo = document.getElementById('notificationDurationTo').value;
    const editId = document.getElementById('notificationEditId').value;

    // Validate required fields
    if (!text || !date) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    const notificationData = {
        text: text,
        date: date,
        durationFrom: durationFrom,
        durationTo: durationTo,
        createdAt: new Date().toISOString()
    };

    if (editId) {
        // Edit existing notification
        const index = parseInt(editId);
        window.notificationsData[index] = {
            ...window.notificationsData[index],
            ...notificationData
        };
        showNotification('Notification updated successfully!', 'success');
    } else {
        // Add new notification
        if (typeof saveNotificationToFirestore === 'function') {
            saveNotificationToFirestore(notificationData);
        } else {
            window.notificationsData.push(notificationData);
            localStorage.setItem('notificationsData', JSON.stringify(window.notificationsData));
            showNotification('Notification saved successfully!', 'success');
        }
    }

    renderNotifications();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addNotificationModal'));
    modal.hide();
    document.getElementById('addNotificationForm').reset();
    document.getElementById('notificationEditId').value = '';
    document.getElementById('notificationModalTitle').textContent = 'Add Notification';
}

function viewNotificationDetails(index) {
    const notification = window.notificationsData[index];
    if (!notification) return;

    currentNotificationId = index;

    const hasDuration = notification.durationFrom || notification.durationTo;

    const detailsHtml = `
        <div class="mb-3">
            <label class="detail-label">Notification</label>
            <p class="mb-0 fs-5" style="white-space: pre-wrap;">${notification.text}</p>
        </div>
        <div class="mb-3">
            <label class="detail-label">Date</label>
            <p class="mb-0"><i class="bi bi-calendar me-2"></i><span class="fs-6 fw-bold">${formatDisplayDate(notification.date)}</span></p>
        </div>
        ${hasDuration ? `
        <div class="mb-3">
            <label class="detail-label">Notification Duration Period</label>
            <p class="mb-0">
                <i class="bi bi-clock me-2"></i>
                ${notification.durationFrom ? `From: ${formatDisplayDate(notification.durationFrom)}` : ''} 
                ${notification.durationTo ? `To: ${formatDisplayDate(notification.durationTo)}` : ''}
            </p>
        </div>
        ` : `
        <div class="mb-3">
            <label class="detail-label">Notification Duration Period</label>
            <p class="mb-0 text-secondary">-</p>
        </div>
        `}
    `;

    document.getElementById('notificationDetailsContent').innerHTML = detailsHtml;
    const modal = new bootstrap.Modal(document.getElementById('viewNotificationModal'));
    modal.show();
}

function editNotification() {
    if (currentNotificationId === null) return;

    const notification = window.notificationsData[currentNotificationId];
    if (!notification) return;

    // Close view modal
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewNotificationModal'));
    viewModal.hide();

    // Populate edit form
    document.getElementById('notificationText').value = notification.text;
    document.getElementById('notificationDate').value = notification.date;
    document.getElementById('notificationDurationFrom').value = notification.durationFrom || '';
    document.getElementById('notificationDurationTo').value = notification.durationTo || '';
    document.getElementById('notificationEditId').value = currentNotificationId;
    document.getElementById('notificationModalTitle').textContent = 'Edit Notification';

    // Open add/edit modal
    const addModal = new bootstrap.Modal(document.getElementById('addNotificationModal'));
    addModal.show();
}

function deleteNotification() {
    if (currentNotificationId === null) return;

    const notification = window.notificationsData[currentNotificationId];
    if (!notification) return;

    if (!confirm(`Are you sure you want to delete this notification?`)) {
        return;
    }

    if (typeof deleteNotificationFromFirestore === 'function' && notification.firestoreId) {
        deleteNotificationFromFirestore(notification.firestoreId);
    } else {
        window.notificationsData.splice(currentNotificationId, 1);
        localStorage.setItem('notificationsData', JSON.stringify(window.notificationsData));
    }

    renderNotifications();
    showNotification('Notification deleted successfully!', 'success');

    const modal = bootstrap.Modal.getInstance(document.getElementById('viewNotificationModal'));
    modal.hide();
    currentNotificationId = null;
}

// Expose core functions to window for global access
window.showTab = showTab;
window.saveStudent = saveStudent;
window.viewStudentDetails = viewStudentDetails;
window.downloadStudentExcel = downloadStudentExcel;
window.renderStudents = renderStudents;
window.applyFilters = applyFilters;
window.copyToClipboard = copyToClipboard;
window.startEdit = startEdit;
window.cancelEdit = cancelEdit;
window.saveEdit = saveEdit;
window.confirmDeleteStudent = confirmDeleteStudent;
window.restoreStudent = restoreStudent;
window.permanentlyDeleteStudent = permanentlyDeleteStudent;
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
window.downloadPaymentHistoryAsExcel = downloadPaymentHistoryAsExcel;
window.editPayment = editPayment;
window.savePaymentEdit = savePaymentEdit;
window.deletePayment = deletePayment;
window.toggleIdEdit = toggleIdEdit;

// Expose functions to window
window.renderAdmissions = renderAdmissions;
window.saveAdmission = saveAdmission;
window.viewAdmissionDetails = viewAdmissionDetails;
window.editAdmission = editAdmission;
window.deleteAdmission = deleteAdmission;

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
window.filterAdmissions = filterAdmissions;
window.populateAdmissionsLevelFilter = populateAdmissionsLevelFilter;


window.renderNotifications = renderNotifications;
window.saveNotification = saveNotification;
window.viewNotificationDetails = viewNotificationDetails;
window.editNotification = editNotification;
window.deleteNotification = deleteNotification;

// Premium Accordion Toggle Function
function togglePremiumAccordion(id) {
    const item = document.getElementById(`accordion-${id}`);
    if (!item) return;

    const isActive = item.classList.contains('active');

    // Close other accordions in the same container to ensure only one is open
    const allItems = item.parentElement.querySelectorAll('.accordion-item-premium');
    allItems.forEach(i => {
        if (i !== item) i.classList.remove('active');
    });

    if (isActive) {
        item.classList.remove('active');
    } else {
        item.classList.add('active');
    }
}

window.togglePremiumAccordion = togglePremiumAccordion;

// ==========================================
// VISA STATUS TRACKER FUNCTIONS (REDESIGNED)
// ==========================================

// Use visaStatusData from window (defined in firebase-config.js)
// let visaStatusData = {}; -- Now using window.visaStatusData

// Current visa sub-tab
let currentVisaSubTab = 'processing';

// Show visa sub-tab
function showVisaSubTab(tabName) {
    currentVisaSubTab = tabName;

    // Hide all sub-tabs
    document.querySelectorAll('.visa-subtab').forEach(tab => {
        tab.classList.add('section-hidden');
    });

    // Show selected sub-tab
    const selectedTab = document.getElementById(`visa-${tabName}-subtab`);
    if (selectedTab) {
        selectedTab.classList.remove('section-hidden');
    }

    // Update button states
    document.querySelectorAll('#visastatus-tab .btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`visa${tabName.charAt(0).toUpperCase() + tabName.slice(1)}TabBtn`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Load visa status data from Firestore (wrapper for firebase-config function)
function loadVisaStatusFromFirestore() {
    if (typeof loadVisaStatusFromFirestoreConfig === 'function') {
        loadVisaStatusFromFirestoreConfig();
    } else {
        console.warn('loadVisaStatusFromFirestoreConfig not available');
        // Fallback to localStorage
        const stored = localStorage.getItem('visaStatusData');
        if (stored) {
            window.visaStatusData = JSON.parse(stored);
        }
        renderVisaAllStudentsList();
        renderVisaStatusLists();
        updateVisaTabCounts();
    }
}

// Save visa status to Firestore (wrapper for firebase-config function)
async function saveVisaStatusToFirestore(studentId, statusData) {
    if (typeof saveVisaStatusToFirestoreConfig === 'function') {
        await saveVisaStatusToFirestoreConfig(studentId, statusData);
    } else {
        console.warn('saveVisaStatusToFirestoreConfig not available');
        // Fallback to localStorage
        window.visaStatusData[studentId] = statusData;
        localStorage.setItem('visaStatusData', JSON.stringify(window.visaStatusData));
        renderVisaStatusLists();
        updateVisaTabCounts();
    }
}

// Delete visa status from Firestore (wrapper for firebase-config function)
async function deleteVisaStatusFromFirestore(studentId) {
    if (typeof deleteVisaStatusFromFirestoreConfig === 'function') {
        await deleteVisaStatusFromFirestoreConfig(studentId);
    } else {
        console.warn('deleteVisaStatusFromFirestoreConfig not available');
        // Fallback to localStorage
        delete window.visaStatusData[studentId];
        localStorage.setItem('visaStatusData', JSON.stringify(window.visaStatusData));
        renderVisaStatusLists();
        updateVisaTabCounts();
        showNotification('Visa status removed (student data preserved)', 'success');
    }
}


// Render all students list (left column in Processing tab)
// Only shows students WITHOUT any visa status and NOT Masters degree
function renderVisaAllStudentsList() {
    const container = document.getElementById('visaAllStudentsList');
    if (!container) return;

    // Filter students:
    // 1. Not deleted
    // 2. Don't have any visa status already
    // 3. Not Masters degree (only show Bachelor/Language students)
    console.log('🔍 Starting student filter for visa status...');
    const students = (window.studentsData || []).filter(s => {
        // Log every student being checked
        console.log(`\n👤 Checking: ${s.fullName} (${s.id})`);
        console.log(`   Education Level: "${s.level}"`);

        if (s.isDeleted) {
            console.log(`   ❌ EXCLUDED - Deleted`);
            return false;
        }

        // Exclude students who already have visa status (case-insensitive ID check)
        // EXCEPTION: Include students with UNKNOWN status (they should be rechecked)
        const studentId = (s.id || '').toUpperCase();
        const visaStatusEntry = Object.entries(window.visaStatusData || {}).find(
            ([key, value]) => key.toUpperCase() === studentId
        );

        if (visaStatusEntry) {
            const [, statusData] = visaStatusEntry;
            // If status is UNKNOWN, include the student (they need to be checked again)
            if (statusData.status === 'UNKNOWN') {
                console.log(`   ⚠️ INCLUDED - Has UNKNOWN status, needs recheck`);
                return true;
            }
            // Otherwise, exclude students with known visa status
            console.log(`   ❌ EXCLUDED - Already has visa status: ${statusData.status}`);
            return false;
        }

        // Exclude Masters degree students (including "Master no Certificate")
        const eduLevel = (s.level || '').toLowerCase().trim();
        console.log(`   Checking eduLevel: "${eduLevel}" (length: ${eduLevel.length})`);
        console.log(`   Contains 'master': ${eduLevel.includes('master')}`);
        console.log(`   Contains 'магистр': ${eduLevel.includes('магистр')}`);

        if (eduLevel.includes('master') || eduLevel.includes('магистр')) {
            console.log(`   ❌ EXCLUDED - Masters level: "${s.level}"`);
            return false;
        }

        console.log(`   ✅ INCLUDED`);
        return true;
    });

    // Debug log
    const totalStudents = (window.studentsData || []).filter(s => !s.isDeleted).length;
    console.log(`📊 Visa Students Filter: ${students.length}/${totalStudents} students shown (${Object.keys(window.visaStatusData || {}).length} have visa status)`);

    if (students.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-secondary"><i class="bi bi-check-circle me-2"></i>All students have been checked or are Masters level</div>';
        return;
    }

    // Update count
    const countElement = document.getElementById('visaStudentsCount');
    if (countElement) countElement.textContent = students.length;

    let html = '';
    students.forEach(student => {
        // Format birthday
        let displayBirthday = '-';
        if (student.birthday) {
            const parts = student.birthday.split('-');
            if (parts.length === 3) {
                displayBirthday = `${parts[2]}.${parts[1]}.${parts[0]}`;
            } else {
                displayBirthday = student.birthday;
            }
        }

        // Check if student has required data
        const hasRequiredData = student.passport && student.fullName && student.birthday;

        // Check if this student has UNKNOWN status
        const studentId = (student.id || '').toUpperCase();
        const visaStatusEntry = Object.entries(window.visaStatusData || {}).find(
            ([key, value]) => key.toUpperCase() === studentId
        );
        const hasUnknownStatus = visaStatusEntry && visaStatusEntry[1].status === 'UNKNOWN';

        html += `
            <div class="visa-student-check-card ${hasUnknownStatus ? 'has-unknown-status' : ''}" data-student-id="${student.id}" 
                 data-search-text="${(student.fullName || '').toLowerCase()} ${(student.id || '').toLowerCase()}">
                <div class="student-info">
                    <div class="student-name">
                        ${student.fullName || 'Unknown'}
                    </div>
                    <div class="student-details">
                        <span><i class="bi bi-passport"></i>${student.passport || '-'}</span>
                        <span><i class="bi bi-calendar"></i>${displayBirthday}</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary-apple rounded-pill check-btn" 
                        data-student-id="${student.id}"
                        onclick="checkSingleStudentVisa('${student.id}')"
                        ${!hasRequiredData ? 'disabled title="Missing passport, name, or birthday"' : ''}>
                    <i class="bi bi-${hasUnknownStatus ? 'arrow-clockwise' : 'search'} me-1"></i>${hasUnknownStatus ? 'Recheck' : 'Check'}
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Get badge color based on status
function getVisaStatusBadgeColor(status) {
    switch (status) {
        case 'APPROVED':
            return 'success';
        case 'CANCELLED':
            return 'danger';
        case 'APP/RECEIVED':
            return 'warning text-dark';
        case 'UNDER REVIEW':
            return 'info';
        default:
            return 'secondary';
    }
}

// Filter all students list
function filterVisaAllStudents() {
    const searchInput = document.getElementById('visaAllStudentsSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = document.querySelectorAll('#visaAllStudentsList .visa-student-check-card');

    cards.forEach(card => {
        const searchText = card.getAttribute('data-search-text') || '';
        card.style.display = searchText.includes(searchTerm) ? 'block' : 'none';
    });
}

// Check visa status for a single student
async function checkSingleStudentVisa(studentId) {
    const students = window.studentsData || [];
    const student = students.find(s => s.id === studentId);

    if (!student) {
        showNotification('Student not found!', 'error');
        return;
    }

    // Check if student has required data
    if (!student.passport || !student.fullName || !student.birthday) {
        showNotification('Missing required data (passport, name, or birthday)', 'error');
        return;
    }

    // Get existing status if any
    const existingStatus = window.visaStatusData ? window.visaStatusData[studentId] : null;
    const previousStatus = existingStatus ? existingStatus.status : null;

    // Find the button and show loading state with animation
    let card = document.querySelector(`.visa-student-check-card[data-student-id="${studentId}"] .check-btn`);
    if (!card) {
        card = document.querySelector(`.visa-tracker-card .recheck[onclick*="${studentId}"]`);
    }
    let originalButtonContent = '';
    if (card) {
        originalButtonContent = card.innerHTML;
        card.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        card.disabled = true;
        card.classList.add('checking-animation');
    }

    try {
        const visaResult = await fetchVisaStatus(student);
        const checkedAt = new Date().toISOString();

        const statusData = {
            studentId: student.id,
            studentName: student.fullName,
            passport: student.passport,
            birthday: student.birthday,
            status: visaResult.status,
            message: visaResult.message || '',
            applicationDate: visaResult.applicationDate || '',
            checkedAt: checkedAt
        };

        // Check if status changed
        const statusChanged = previousStatus && previousStatus !== visaResult.status;

        if (statusChanged) {
            // Status changed - DO NOT SAVE YET, just show Move button
            console.log(`🔄 Status changed: ${previousStatus} → ${visaResult.status}`);

            // Determine target tab and color
            let targetTab = '';
            let targetTabName = '';
            let moveButtonColor = '';

            if (visaResult.status === 'APPROVED') {
                targetTab = 'approved';
                targetTabName = 'Approved';
                moveButtonColor = 'success'; // Green
            } else if (visaResult.status === 'CANCELLED' || visaResult.status === 'REJECTED') {
                targetTab = 'cancelled';
                targetTabName = 'Cancelled';
                moveButtonColor = 'danger'; // Red
            } else if (visaResult.status === 'UNKNOWN') {
                // If changed to UNKNOWN, keep in Students tab
                targetTab = 'students';
                targetTabName = 'Students';
                moveButtonColor = 'secondary'; // Gray
            } else {
                targetTab = 'received';
                targetTabName = 'App/Received';
                moveButtonColor = 'warning'; // Yellow
            }

            // Find the card element
            const cardElement = document.querySelector(`.visa-tracker-card [onclick*="recheckStudentVisa('${studentId}')"]`)?.closest('.visa-tracker-card');
            if (cardElement) {
                // Store pending data on the card
                cardElement.dataset.pendingMove = 'true';
                cardElement.dataset.newStatus = visaResult.status;
                cardElement.dataset.targetTab = targetTab;
                cardElement.dataset.targetTabName = targetTabName;
                cardElement.dataset.moveButtonColor = moveButtonColor;

                // Store the new status data for later save
                cardElement.dataset.newStatusData = JSON.stringify(statusData);

                // Add Move button to the card actions
                const actionsDiv = cardElement.querySelector('.card-actions');
                if (actionsDiv) {
                    // Remove existing move button if any
                    const existingMoveBtn = actionsDiv.querySelector('.move-btn');
                    if (existingMoveBtn) existingMoveBtn.remove();

                    // Create and insert move button before delete button
                    const moveBtn = document.createElement('button');
                    moveBtn.className = `visa-action-btn move-btn move-${moveButtonColor}`;
                    moveBtn.title = `Move to ${targetTabName}`;
                    moveBtn.innerHTML = '<i class="bi bi-arrow-right"></i>';
                    moveBtn.onclick = () => confirmAndMoveVisaCard(studentId, targetTab, statusData);

                    const deleteBtn = actionsDiv.querySelector('.delete');
                    actionsDiv.insertBefore(moveBtn, deleteBtn);
                }

                // Update status badge to show new status with visual indicator
                const statusBadge = cardElement.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.innerHTML = `${visaResult.status} <span style="font-size: 0.7em;">→ New!</span>`;
                    statusBadge.classList.add('status-changed-badge');
                    // Add pulsing animation
                    statusBadge.style.animation = 'pulse 2s infinite';
                }
            }

            showNotification(`Status changed: ${previousStatus} → ${visaResult.status}. Click the arrow button to move the card.`, 'info');

        } else {

            // No status change - but need to differentiate:
            // 1. First time check (no previousStatus)
            // 2. Recheck with no change (has previousStatus)

            const isFirstTimeCheck = !previousStatus;
            const needsManualMove = isFirstTimeCheck && (visaResult.status === 'APPROVED' || visaResult.status === 'CANCELLED' || visaResult.status === 'REJECTED');

            if (needsManualMove) {
                // First time check with APPROVED/CANCELLED - Save as APP/RECEIVED but show move button
                console.log(`🆕 First check with ${visaResult.status} status - saving to App/Received with move option`);

                // Temporarily save as APP/RECEIVED
                const tempStatusData = {
                    ...statusData,
                    status: 'APP/RECEIVED',
                    originalStatus: visaResult.status // Store the real status
                };

                await saveVisaStatusToFirestore(student.id, tempStatusData);
                showNotification(`Visa status: ${visaResult.status}. Review and move to appropriate tab.`, 'info');

                // Re-render to show in App/Received tab
                renderVisaAllStudentsList();
                renderVisaStatusLists();
                updateVisaTabCounts();

                // Switch to Processing tab to show the App/Received list
                showVisaSubTab('processing');

                // Wait for render, then add move button
                setTimeout(() => {
                    const cardElement = document.querySelector(`.visa-tracker-card [onclick*="recheckStudentVisa('${studentId}')"]`)?.closest('.visa-tracker-card');
                    if (cardElement) {
                        // Determine target tab
                        let targetTab = '';
                        let targetTabName = '';
                        let moveButtonColor = '';

                        if (visaResult.status === 'APPROVED') {
                            targetTab = 'approved';
                            targetTabName = 'Approved';
                            moveButtonColor = 'success';
                        } else {
                            targetTab = 'cancelled';
                            targetTabName = 'Cancelled';
                            moveButtonColor = 'danger';
                        }

                        // Add Move button
                        const actionsDiv = cardElement.querySelector('.card-actions');
                        if (actionsDiv) {
                            const existingMoveBtn = actionsDiv.querySelector('.move-btn');
                            if (existingMoveBtn) existingMoveBtn.remove();

                            const moveBtn = document.createElement('button');
                            moveBtn.className = `visa-action-btn move-btn move-${moveButtonColor}`;
                            moveBtn.title = `Move to ${targetTabName}`;
                            moveBtn.innerHTML = '<i class="bi bi-arrow-right"></i>';
                            // Use the original APPROVED/CANCELLED status when moving
                            const finalStatusData = {
                                ...statusData,
                                status: visaResult.status
                            };
                            moveBtn.onclick = () => confirmAndMoveVisaCard(studentId, targetTab, finalStatusData);

                            const deleteBtn = actionsDiv.querySelector('.delete');
                            actionsDiv.insertBefore(moveBtn, deleteBtn);
                        }

                        // Update status badge with correct color
                        const statusBadge = cardElement.querySelector('.status-badge');
                        if (statusBadge) {
                            // Remove old badge classes
                            statusBadge.classList.remove('badge-received', 'badge-approved', 'badge-cancelled', 'badge-under-review');
                            // Add correct badge class
                            if (visaResult.status === 'APPROVED') {
                                statusBadge.classList.add('badge-approved');
                            } else if (visaResult.status === 'CANCELLED' || visaResult.status === 'REJECTED') {
                                statusBadge.classList.add('badge-cancelled');
                            }
                            statusBadge.innerHTML = `${visaResult.status} <span style="font-size: 0.7em;">→ Move?</span>`;
                            statusBadge.classList.add('status-changed-badge');
                            statusBadge.style.animation = 'pulse 2s infinite';
                        }
                    }
                }, 300);

            } else if (visaResult.status !== 'UNKNOWN') {
                // Normal case: Recheck with no change OR first check with APP/RECEIVED/PENDING
                await saveVisaStatusToFirestore(student.id, statusData);
                showNotification(`Visa status: ${visaResult.status}`, visaResult.status === 'APPROVED' ? 'success' : 'info');
                // Re-render the students list only when successfully saved
                renderVisaAllStudentsList();
                renderVisaStatusLists();

                updateVisaTabCounts();
            } else {
                // UNKNOWN status - just show notification, don't save or remove
                showNotification('Visa status: UNKNOWN - Student will remain in the list', 'warning');
            }
        }

    } catch (error) {
        console.error('Error checking visa status:', error);

        // Show error with manual check option
        const manualCheckUrl = `visa-checker.html?passport=${encodeURIComponent(student.passport || '')}&name=${encodeURIComponent(student.fullName || '')}&birthday=${encodeURIComponent(student.birthday || '')}`;

        showNotification('API error. Click the button again or check manually on visa.go.kr', 'error');

        // Update button to offer manual check
        if (card) {
            card.innerHTML = '<i class="bi bi-box-arrow-up-right"></i>';
            card.title = 'Check manually on visa.go.kr';
            card.onclick = () => window.open(manualCheckUrl, '_blank');
        }
        return; // Exit early to keep the manual check button
    }

    // Restore button
    if (card) {
        card.innerHTML = originalButtonContent || '<i class="bi bi-arrow-clockwise"></i>';
        card.disabled = false;
        card.classList.remove('checking-animation');
    }
}

// Render visa status lists (Received, Cancelled, Approved)
function renderVisaStatusLists() {
    const receivedList = document.getElementById('visaReceivedList');
    const cancelledList = document.getElementById('visaCancelledList');
    const approvedList = document.getElementById('visaApprovedList');

    const statusEntries = Object.values(window.visaStatusData || {});

    // Filter by status
    const receivedStudents = statusEntries.filter(s => s.status === 'APP/RECEIVED' || s.status === 'UNDER REVIEW' || s.status === 'PENDING');
    const cancelledStudents = statusEntries.filter(s => s.status === 'CANCELLED' || s.status === 'REJECTED');
    const approvedStudents = statusEntries.filter(s => s.status === 'APPROVED');

    // Sort receivedStudents by applicationDate (oldest first - earlier apps more likely to change)
    receivedStudents.sort((a, b) => {
        const dateA = a.applicationDate || '';
        const dateB = b.applicationDate || '';
        return dateA.localeCompare(dateB); // Ascending order (oldest first)
    });

    // Render received/processing list
    if (receivedList) {
        if (receivedStudents.length === 0) {
            receivedList.innerHTML = '<div class="text-center py-4 text-secondary"><i class="bi bi-inbox"></i> No students with App/Received status yet</div>';
        } else {
            receivedList.innerHTML = receivedStudents.map(s => renderVisaTrackerCard(s, 'status-received')).join('');
        }

        const countElement = document.getElementById('visaReceivedCount');
        if (countElement) countElement.textContent = receivedStudents.length;
    }

    // Render cancelled list
    if (cancelledList) {
        if (cancelledStudents.length === 0) {
            cancelledList.innerHTML = `
                <div class="col-12 text-center py-4 text-secondary">
                    <i class="bi bi-x-circle" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">No cancelled applications found</p>
                </div>`;
        } else {
            cancelledList.innerHTML = cancelledStudents.map(s => `
                <div class="col-md-6 col-lg-4 visa-status-card-wrapper" data-search-text="${(s.studentName || '').toLowerCase()} ${(s.studentId || '').toLowerCase()}">
                    ${renderVisaTrackerCard(s, 'status-cancelled')}
                </div>
            `).join('');
        }

        const countElement = document.getElementById('visaCancelledListCount');
        if (countElement) countElement.textContent = cancelledStudents.length;
    }

    // Render approved list
    if (approvedList) {
        if (approvedStudents.length === 0) {
            approvedList.innerHTML = `
                <div class="col-12 text-center py-4 text-secondary">
                    <i class="bi bi-check-circle" style="font-size: 2rem;"></i>
                    <p class="mt-2 mb-0">No approved visas found</p>
                </div>`;
        } else {
            approvedList.innerHTML = approvedStudents.map(s => `
                <div class="col-md-6 col-lg-4 visa-status-card-wrapper" data-search-text="${(s.studentName || '').toLowerCase()} ${(s.studentId || '').toLowerCase()}">
                    ${renderVisaTrackerCard(s, 'status-approved')}
                </div>
            `).join('');
        }

        const countElement = document.getElementById('visaApprovedListCount');
        if (countElement) countElement.textContent = approvedStudents.length;
    }
}

// Render a visa tracker card - ENHANCED DESIGN
function renderVisaTrackerCard(statusData, statusClass) {
    // Format checked time (last update)
    let checkedTimeDisplay = '';
    if (statusData.checkedAt) {
        const checkedDate = new Date(statusData.checkedAt);
        const day = String(checkedDate.getDate()).padStart(2, '0');
        const month = String(checkedDate.getMonth() + 1).padStart(2, '0');
        const year = checkedDate.getFullYear();
        const hours = String(checkedDate.getHours()).padStart(2, '0');
        const minutes = String(checkedDate.getMinutes()).padStart(2, '0');
        checkedTimeDisplay = `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    // Format application date
    let appDateDisplay = '';
    if (statusData.applicationDate) {
        appDateDisplay = statusData.applicationDate;
    }

    // Format birthday
    let birthdayDisplay = '-';
    if (statusData.birthday) {
        const parts = statusData.birthday.split('-');
        if (parts.length === 3) {
            birthdayDisplay = `${parts[2]}.${parts[1]}.${parts[0]}`;
        } else {
            birthdayDisplay = statusData.birthday;
        }
    }

    // Determine badge color class based on actual status (or originalStatus)
    const actualStatus = statusData.originalStatus || statusData.status;
    let badgeClass = 'badge-received'; // Default: orange

    if (actualStatus === 'APPROVED') {
        badgeClass = 'badge-approved';
    } else if (actualStatus === 'CANCELLED' || actualStatus === 'REJECTED') {
        badgeClass = 'badge-cancelled';
    } else if (actualStatus === 'UNDER REVIEW' || actualStatus === 'PENDING') {
        badgeClass = 'badge-under-review';
    }

    // Display status text (use originalStatus if available for clarity)
    const displayStatus = statusData.originalStatus || statusData.status;

    // Check if we need to show a Move button (has originalStatus that differs from status)
    let moveButtonHtml = '';
    let statusSuffix = '';
    if (statusData.originalStatus && statusData.status === 'APP/RECEIVED') {
        // This student has a pending move
        let targetTab = '';
        let targetTabName = '';
        let moveButtonColor = '';

        if (statusData.originalStatus === 'APPROVED') {
            targetTab = 'approved';
            targetTabName = 'Approved';
            moveButtonColor = 'success';
        } else if (statusData.originalStatus === 'CANCELLED' || statusData.originalStatus === 'REJECTED') {
            targetTab = 'cancelled';
            targetTabName = 'Cancelled';
            moveButtonColor = 'danger';
        }

        if (targetTab) {
            // Prepare the finalStatusData for the move
            const finalStatusData = {
                studentId: statusData.studentId,
                studentName: statusData.studentName,
                passport: statusData.passport,
                birthday: statusData.birthday,
                status: statusData.originalStatus,
                message: statusData.message || '',
                applicationDate: statusData.applicationDate || '',
                checkedAt: statusData.checkedAt
            };
            const encodedStatusData = encodeURIComponent(JSON.stringify(finalStatusData));

            moveButtonHtml = `
                <button class="visa-action-btn move-btn move-${moveButtonColor}" 
                        onclick="confirmAndMoveVisaCard('${statusData.studentId}', '${targetTab}', JSON.parse(decodeURIComponent('${encodedStatusData}')))" 
                        title="Move to ${targetTabName}">
                    <i class="bi bi-arrow-right"></i>
                </button>
            `;
            statusSuffix = ' <span style="font-size: 0.7em;">→ Move?</span>';
        }
    }

    return `
        <div class="visa-tracker-card ${statusClass}">
            <div class="card-header">
                <div class="student-info">
                    <div class="student-name">${statusData.studentName || 'Unknown'}</div>
                    <div class="student-details-grid">
                        <span class="student-passport"><i class="bi bi-passport"></i>${statusData.passport || '-'}</span>
                        <span class="student-birthday"><i class="bi bi-calendar"></i>${birthdayDisplay}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="visa-action-btn recheck" 
                            onclick="recheckStudentVisa('${statusData.studentId}')" 
                            title="Recheck status">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                    ${moveButtonHtml}
                    <button class="visa-action-btn delete" 
                            onclick="removeVisaStatus('${statusData.studentId}')" 
                            title="Remove from list">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>
            <div class="card-body-compact">
                <div class="status-info">
                    <div class="status-badge ${badgeClass}" ${statusSuffix ? 'style="animation: pulse 2s infinite;"' : ''}>${displayStatus}${statusSuffix}</div>
                    ${appDateDisplay ? `<span class="app-date"><i class="bi bi-box-arrow-in-right"></i>App: ${appDateDisplay}</span>` : ''}
                </div>
                ${checkedTimeDisplay ? `<span class="check-time"><i class="bi bi-clock"></i>Updated: ${checkedTimeDisplay}</span>` : ''}
            </div>
        </div>
    `;
}

// Recheck visa status for a student
async function recheckStudentVisa(studentId) {
    await checkSingleStudentVisa(studentId);
}

// Remove visa status (does NOT delete student data)
function removeVisaStatus(studentId) {
    if (!confirm('Remove this visa status from the list? (Student data will NOT be deleted)')) {
        return;
    }
    deleteVisaStatusFromFirestore(studentId);
}

// Confirm and move visa card (saves status then moves to target tab)
async function confirmAndMoveVisaCard(studentId, targetTab, statusData) {
    try {
        console.log(`📦 Saving and moving ${studentId} to ${targetTab} tab`);

        // If moving to Students tab (UNKNOWN status), delete the visa status
        if (targetTab === 'students') {
            await deleteVisaStatusFromFirestore(studentId);
            showNotification('Student moved back to Students tab', 'success');
            renderVisaAllStudentsList();
            renderVisaStatusLists();
            updateVisaTabCounts();
            showVisaSubTab('processing'); // Show the Processing/Students tab
            return;
        }

        // Save the new status to Firestore
        await saveVisaStatusToFirestore(studentId, statusData);

        // Show success notification
        showNotification(`Student moved to ${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)} tab!`, 'success');

        // Re-render all lists
        renderVisaStatusLists();
        renderVisaAllStudentsList();
        updateVisaTabCounts();

        // Switch to the target tab to show the moved card
        if (targetTab === 'approved') {
            showVisaSubTab('approved');
        } else if (targetTab === 'cancelled') {
            showVisaSubTab('cancelled');
        } else if (targetTab === 'received') {
            showVisaSubTab('processing'); // The Processing tab contains the received list
        }

    } catch (error) {
        console.error('Error moving visa card:', error);
        showNotification('Error moving student card', 'error');
    }
}

// Move visa card to another tab (kept for backward compatibility)

function moveVisaCard(studentId, targetTab) {
    console.log(`Moving ${studentId} to ${targetTab} tab`);

    // Simply re-render all lists - the card will appear in the correct tab based on its status
    renderVisaStatusLists();
    updateVisaTabCounts();

    // Switch to the target tab to show the moved card
    if (targetTab === 'approved') {
        showVisaSubTab('approved');
    } else if (targetTab === 'cancelled') {
        showVisaSubTab('cancelled');
    } else if (targetTab === 'received') {
        showVisaSubTab('processing'); // The Processing tab contains the received list
    }

    showNotification(`Card moved to ${targetTab} tab successfully!`, 'success');
}

// Update tab counts
function updateVisaTabCounts() {
    const statusEntries = Object.values(window.visaStatusData || {});

    const receivedCount = statusEntries.filter(s => s.status === 'APP/RECEIVED' || s.status === 'UNDER REVIEW' || s.status === 'PENDING').length;
    const cancelledCount = statusEntries.filter(s => s.status === 'CANCELLED' || s.status === 'REJECTED').length;
    const approvedCount = statusEntries.filter(s => s.status === 'APPROVED').length;

    // Update tab badge counts
    const processingBadge = document.getElementById('visaProcessingCount');
    const cancelledBadge = document.getElementById('visaCancelledCount');
    const approvedBadge = document.getElementById('visaApprovedCount');

    if (processingBadge) processingBadge.textContent = receivedCount;
    if (cancelledBadge) cancelledBadge.textContent = cancelledCount;
    if (approvedBadge) approvedBadge.textContent = approvedCount;
}

// Filter functions for each list
function filterVisaReceivedStudents() {
    const searchInput = document.getElementById('visaReceivedSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = document.querySelectorAll('#visaReceivedList .visa-tracker-card');

    cards.forEach(card => {
        const name = card.querySelector('.student-name') ? card.querySelector('.student-name').textContent.toLowerCase() : '';
        const passport = card.querySelector('.student-passport') ? card.querySelector('.student-passport').textContent.toLowerCase() : '';
        card.style.display = (name.includes(searchTerm) || passport.includes(searchTerm)) ? 'block' : 'none';
    });
}

function filterVisaCancelledStudents() {
    const searchInput = document.getElementById('visaCancelledSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const wrappers = document.querySelectorAll('#visaCancelledList .visa-status-card-wrapper');

    wrappers.forEach(wrapper => {
        const searchText = wrapper.getAttribute('data-search-text') || '';
        wrapper.style.display = searchText.includes(searchTerm) ? '' : 'none';
    });
}

function filterVisaApprovedStudents() {
    const searchInput = document.getElementById('visaApprovedSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const wrappers = document.querySelectorAll('#visaApprovedList .visa-status-card-wrapper');

    wrappers.forEach(wrapper => {
        const searchText = wrapper.getAttribute('data-search-text') || '';
        wrapper.style.display = searchText.includes(searchTerm) ? '' : 'none';
    });
}

// Fetch visa status from API with multiple CORS proxy fallbacks
async function fetchVisaStatus(student) {
    // Format birth date - keep as YYYY-MM-DD (API expects this format)
    let birthDate = student.birthday || '';

    // If birthday is in a different format, convert it
    if (birthDate && birthDate.includes('.')) {
        // Convert DD.MM.YYYY to YYYY-MM-DD
        const parts = birthDate.split('.');
        if (parts.length === 3) {
            birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }

    // Extract English name (uppercase) and truncate if too long
    let englishName = (student.fullName || '').toUpperCase().trim();
    const NAME_MAX_LENGTH = 38;

    if (englishName.length > NAME_MAX_LENGTH) {
        let truncated = englishName.substring(0, NAME_MAX_LENGTH);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > NAME_MAX_LENGTH - 10) {
            truncated = truncated.substring(0, lastSpace + 2);
        }
        englishName = truncated.trim();
    }

    const requestData = {
        passport_number: (student.passport || '').toUpperCase(),
        english_name: englishName,
        birth_date: birthDate,
        website: "",
        _form_start_time: Math.floor(Date.now() / 1000)
    };

    console.log('Visa check request:', requestData);

    const API_BASE = 'https://visadoctors.uz/api/uz/visas/v2/check-status/';

    // Multiple CORS proxy options - will try each one in order
    const CORS_PROXIES = [{
        name: 'allorigins',
        url: 'https://api.allorigins.win/raw?url=',
        headers: {}
    },
    {
        name: 'corsproxy.io',
        url: 'https://corsproxy.io/?',
        headers: {}
    },
    {
        name: 'cors-proxy.org',
        url: 'https://cors-proxy.org/',
        headers: {}
    },
    {
        name: 'cors-anywhere-alt',
        url: 'https://proxy.cors.sh/',
        headers: {
            'x-cors-api-key': 'temp_' + Date.now()
        }
    }
    ];

    let lastError = null;

    // Try each CORS proxy until one works
    for (const proxy of CORS_PROXIES) {
        try {
            console.log(`Trying CORS proxy: ${proxy.name}...`);

            const proxyUrl = proxy.url + encodeURIComponent(API_BASE);
            const fetchHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...proxy.headers
            };

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: fetchHeaders,
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let data = await response.json();
            console.log(`✅ ${proxy.name} worked! Initial response:`, data);

            // Poll for result if status is PENDING
            const taskId = data.id;
            let retryCount = 0;
            const maxRetries = 10;

            while (data.status === 'PENDING' && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                retryCount++;

                try {
                    const pollUrl = `${API_BASE}${taskId}/`;
                    const pollProxyUrl = proxy.url + encodeURIComponent(pollUrl);
                    const pollHeaders = {
                        'Accept': 'application/json',
                        ...proxy.headers
                    };

                    const pollResponse = await fetch(pollProxyUrl, {
                        method: 'GET',
                        headers: pollHeaders
                    });

                    if (pollResponse.ok) {
                        data = await pollResponse.json();
                        console.log(`Poll attempt ${retryCount}:`, data);
                    }
                } catch (pollError) {
                    console.error('Poll error:', pollError);
                }
            }

            if (!data.response_data) {
                return {
                    status: 'UNKNOWN',
                    message: 'No response data received'
                };
            }

            const responseData = data.response_data;

            if (responseData.status === 'error') {
                return {
                    status: 'UNKNOWN',
                    message: responseData.message || 'API error'
                };
            }

            if (!responseData.visa_data) {
                return {
                    status: 'UNKNOWN',
                    message: 'No visa data found'
                };
            }

            const visaData = responseData.visa_data;
            const uzStatus = visaData.status || '';
            const applicationDate = visaData.application_date || '';

            console.log('Visa status (Uzbek):', uzStatus);

            const englishStatus = translateVisaStatus(uzStatus);

            return {
                status: englishStatus,
                message: applicationDate ? `Application: ${applicationDate}` : '',
                applicationDate: applicationDate
            };

        } catch (error) {
            console.warn(`❌ ${proxy.name} failed:`, error.message);
            lastError = error;
            // Continue to next proxy
        }
    }

    // All proxies failed
    console.error('All CORS proxies failed. Last error:', lastError);
    throw new Error('All CORS proxies failed. Please try again later or check your internet connection.');
}

// Translate Uzbek visa status to English
function translateVisaStatus(status) {
    const statusUpper = (status || '').toUpperCase();

    const translations = {
        "Tasdiqlangan": "APPROVED",
        "Qabul qilingan": "APP/RECEIVED",
        "Viza tayyorlanish bosqichida": "UNDER REVIEW",
        "Rad etilgan": "CANCELLED"
    };

    if (translations[status]) {
        return translations[status];
    }

    if (statusUpper.includes('APPROVED') || statusUpper.includes('TASDIQLANGAN')) {
        return 'APPROVED';
    }
    if (statusUpper.includes('CANCEL') || statusUpper.includes('REJECT') || statusUpper.includes('RAD')) {
        return 'CANCELLED';
    }
    if (statusUpper.includes('PENDING') || statusUpper.includes('REVIEW') || statusUpper.includes('BOSQICH')) {
        return 'UNDER REVIEW';
    }
    if (statusUpper.includes('RECEIVED') || statusUpper.includes('QABUL')) {
        return 'APP/RECEIVED';
    }

    return 'UNKNOWN';
}

// Initialize visa status when tab is shown
function initializeVisaStatusTab() {
    loadVisaStatusFromFirestore();
}

// Expose visa status functions to window
window.showVisaSubTab = showVisaSubTab;
window.loadVisaStatusFromFirestore = loadVisaStatusFromFirestore;
window.checkSingleStudentVisa = checkSingleStudentVisa;
window.recheckStudentVisa = recheckStudentVisa;
window.removeVisaStatus = removeVisaStatus;
window.confirmAndMoveVisaCard = confirmAndMoveVisaCard;
window.moveVisaCard = moveVisaCard;
window.filterVisaAllStudents = filterVisaAllStudents;
window.filterVisaReceivedStudents = filterVisaReceivedStudents;
window.filterVisaCancelledStudents = filterVisaCancelledStudents;
window.filterVisaApprovedStudents = filterVisaApprovedStudents;
window.renderVisaAllStudentsList = renderVisaAllStudentsList;
window.initializeVisaStatusTab = initializeVisaStatusTab;