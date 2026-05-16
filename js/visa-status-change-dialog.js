// Show visa status change dialog with move button
function showVisaStatusChangeDialog(studentId, oldStatus, newStatus, newStatusData, targetTab, targetTabName) {
    // Create a custom notification with action button
    const notificationHtml = `
        <div class="visa-status-change-notification" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            background: var(--bg-card);
            border: 2px solid var(--accent-primary);
            border-radius: var(--radius-xl);
            padding: 2rem;
            box-shadow: var(--shadow-xl);
            max-width: 500px;
            width: 90%;
        ">
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">
                    ${newStatus === 'APPROVED' ? '✅' : newStatus.includes('CANCEL') || newStatus.includes('REJECT') ? '❌' : '📋'}
                </div>
                <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Status Changed!</h3>
                <div style="margin-bottom: 1.5rem;">
                    <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">
                        <strong>${newStatusData.studentName}</strong>
                    </p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem;">
                        <span style="
                            padding: 0.5rem 1rem;
                            background: var(--accent-danger-bg);
                            color: var(--accent-danger);
                            border-radius: var(--radius-md);
                            font-weight: 600;
                            text-decoration: line-through;
                        ">${oldStatus}</span>
                        <i class="bi bi-arrow-right" style="font-size: 1.5rem; color: var(--accent-primary);"></i>
                        <span style="
                            padding: 0.5rem 1rem;
                            background: ${newStatus === 'APPROVED' ? 'var(--accent-success-bg)' : 
                                        newStatus.includes('CANCEL') || newStatus.includes('REJECT') ? 'var(--accent-danger-bg)' : 
                                        'var(--accent-warning-bg)'};
                            color: ${newStatus === 'APPROVED' ? 'var(--accent-success)' : 
                                    newStatus.includes('CANCEL') || newStatus.includes('REJECT') ? 'var(--accent-danger)' : 
                                    'var(--accent-warning)'};
                            border-radius: var(--radius-md);
                            font-weight: 600;
                        ">${newStatus}</span>
                    </div>
                </div>
                <p style="color: var(--text-tertiary); font-size: 0.875rem; margin-bottom: 1.5rem;">
                    Do you want to move this student to the <strong>${targetTabName}</strong> tab?
                </p>
                <div style="display: flex; gap: 0.75rem; justify-content: center;">
                    <button 
                        class="btn btn-secondary" 
                        onclick="closeVisaStatusChangeDialog()"
                        style="padding: 0.625rem 1.5rem; border-radius: var(--radius-md);">
                        <i class="bi bi-x-circle me-1"></i>Keep in Current Tab
                    </button>
                    <button 
                        class="btn btn-primary" 
                        onclick="confirmMoveVisaStatus('${studentId}', '${targetTab}', ${JSON.stringify(newStatusData).replace(/"/g, '&quot;')})"
                        style="padding: 0.625rem 1.5rem; border-radius: var(--radius-md);">
                        <i class="bi bi-arrow-right-circle me-1"></i>Move to ${targetTabName}
                    </button>
                </div>
            </div>
        </div>
        <div class="visa-status-change-backdrop" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 9999;
        " onclick="closeVisaStatusChangeDialog()"></div>
    `;

    // Remove any existing dialog
    const existing = document.querySelector('.visa-status-change-notification');
    if (existing) {
        existing.parentElement.remove();
    }

    // Add to body
    const container = document.createElement('div');
    container.id = 'visaStatusChangeContainer';
    container.innerHTML = notificationHtml;
    document.body.appendChild(container);
}

// Close the status change dialog
function closeVisaStatusChangeDialog() {
    const container = document.getElementById('visaStatusChangeContainer');
    if (container) {
        container.remove();
    }
}

// Confirm and move visa status to new tab
async function confirmMoveVisaStatus(studentId, targetTab, newStatusData) {
    try {
        // Save the new status
        await saveVisaStatusToFirestore(studentId, newStatusData);

        // Close dialog
        closeVisaStatusChangeDialog();

        // Show success notification
        showNotification(`Student moved to ${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)} tab!`, 'success');

        // Switch to the target tab
        showVisaSubTab(targetTab);

        // Re-render all lists
        renderVisaStatusLists();
        renderVisaAllStudentsList();
        updateVisaTabCounts();

    } catch (error) {
        console.error('Error moving visa status:', error);
        showNotification('Error updating status', 'error');
    }
}