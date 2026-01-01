// ==========================================
// FORM VALIDATION & INPUT MASKING
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // INPUT MASKING with Cleave.js
    // ==========================================

    // Phone Number Masking (00-000-00-00)
    if (document.getElementById('phone1')) {
        new Cleave('#phone1', {
            delimiter: '-',
            blocks: [2, 3, 2, 2],
            numericOnly: true
        });
    }

    if (document.getElementById('phone2')) {
        new Cleave('#phone2', {
            delimiter: '-',
            blocks: [2, 3, 2, 2],
            numericOnly: true
        });
    }

    // Passport Number Masking (AA0000000 - 2 letters, 7 digits)
    const passportInput = document.getElementById('passport');
    if (passportInput) {
        passportInput.addEventListener('input', function (e) {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

            // Ensure first 2 characters are letters
            if (value.length > 0) {
                let letters = value.substring(0, 2).replace(/[^A-Z]/g, '');
                let numbers = value.substring(2).replace(/[^0-9]/g, '').substring(0, 7);
                value = letters + numbers;
            }

            e.target.value = value;
        });
    }

    // ==========================================
    // UPPERCASE ENFORCEMENT
    // ==========================================

    // Full Name - Always Uppercase
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Address - Always Uppercase
    const addressInput = document.getElementById('address');
    if (addressInput) {
        addressInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // ==========================================
    // CONDITIONAL LOGIC - University Dropdown
    // ==========================================

    const levelSelect = document.getElementById('levelSelect');
    const uni1Select = document.getElementById('uni1');
    const uni2Select = document.getElementById('uni2');

    if (levelSelect && uni1Select) {
        levelSelect.addEventListener('change', function () {
            const selectedLevel = this.value;
            const universities = window.uniData[selectedLevel] || [];

            // Update uni1 dropdown
            uni1Select.innerHTML = '<option value="">Choose University</option>';
            universities.forEach(uni => {
                const option = document.createElement('option');
                option.value = uni;
                option.textContent = uni;
                uni1Select.appendChild(option);
            });

            // Update uni2 dropdown if it exists
            if (uni2Select) {
                uni2Select.innerHTML = '<option value="">Choose University</option>';
                universities.forEach(uni => {
                    const option = document.createElement('option');
                    option.value = uni;
                    option.textContent = uni;
                    uni2Select.appendChild(option);
                });
            }
        });
    }

    // ==========================================
    // BIRTHDAY DATE RANGE (1980-2010)
    // ==========================================

    const birthdayInput = document.getElementById('birthday');
    if (birthdayInput) {
        // Already set in HTML, but ensure it's applied
        birthdayInput.setAttribute('min', '1980-01-01');
        birthdayInput.setAttribute('max', '2010-12-31');
    }

    // ==========================================
    // FORM RESET ON MODAL CLOSE
    // ==========================================

    const addStudentModal = document.getElementById('addStudentModal');
    if (addStudentModal) {
        addStudentModal.addEventListener('hidden.bs.modal', function () {
            const form = document.getElementById('addStudentForm');
            if (form) {
                form.reset();

                // Reset university dropdowns
                if (uni1Select) {
                    uni1Select.innerHTML = '<option value="">Choose University</option>';
                }
                if (uni2Select) {
                    uni2Select.innerHTML = '<option value="">Choose University</option>';
                }
            }
        });
    }

    // ==========================================
    // FORM VALIDATION FEEDBACK
    // ==========================================

    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Check required fields
            const requiredFields = [{
                    id: 'studentId',
                    name: 'Student ID'
                },
                {
                    id: 'fullName',
                    name: 'Full Name'
                },
                {
                    id: 'phone1',
                    name: 'Phone 1'
                },
                {
                    id: 'levelSelect',
                    name: 'Education Level'
                },
                {
                    id: 'tariff',
                    name: 'Tariff'
                }
            ];

            let isValid = true;
            let missingFields = [];

            requiredFields.forEach(field => {
                const input = document.getElementById(field.id);
                if (input && !input.value.trim()) {
                    isValid = false;
                    missingFields.push(field.name);
                    input.classList.add('is-invalid');
                } else if (input) {
                    input.classList.remove('is-invalid');
                }
            });

            if (!isValid) {
                if (typeof showNotification === 'function') {
                    showNotification(`Please fill in: ${missingFields.join(', ')}`, 'error');
                }
                return false;
            }

            // If validation passes, call saveStudent
            if (typeof saveStudent === 'function') {
                saveStudent();
            }
        });

        // Remove invalid class on input
        addStudentForm.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', function () {
                this.classList.remove('is-invalid');
            });
        });
    }

    // ==========================================
    // EMAIL VALIDATION
    // ==========================================

    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            const email = this.value.trim();
            if (email && !isValidEmail(email)) {
                this.classList.add('is-invalid');
                if (typeof showNotification === 'function') {
                    showNotification('Please enter a valid email address', 'error');
                }
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // ==========================================
    // TARIFF DISPLAY WITH PRICE
    // ==========================================

    const tariffSelect = document.getElementById('tariff');
    if (tariffSelect) {
        // Already has prices in the HTML options, so this is just a placeholder
        // for any additional tariff-related logic
        tariffSelect.addEventListener('change', function () {
            // Could add visual feedback or calculations here
            console.log('Selected tariff:', this.value);
        });
    }

    console.log('Form validation and masking initialized successfully');
});