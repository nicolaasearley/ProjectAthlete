// Check-In System
let checkInStatus = null;

document.addEventListener('DOMContentLoaded', function() {
    const checkinButton = document.getElementById('checkinButton');
    if (checkinButton) {
        checkinButton.addEventListener('click', function() {
            openCheckInModal();
        });
        
        // Load check-in status on page load
        loadCheckInStatus();
    }
});

function loadCheckInStatus() {
    fetch('/api/checkin')
        .then(response => {
            if (response.status === 401) {
                // Not logged in, hide button
                const checkinButton = document.getElementById('checkinButton');
                if (checkinButton) {
                    checkinButton.style.display = 'none';
                }
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            
            checkInStatus = data;
            updateCheckInButton(data);
        })
        .catch(error => {
            console.error('Error loading check-in status:', error);
        });
}

function updateCheckInButton(status) {
    const checkinButton = document.getElementById('checkinButton');
    const checkinButtonText = document.getElementById('checkinButtonText');
    
    if (!checkinButton || !checkinButtonText) return;
    
    if (status.checked_in) {
        checkinButton.classList.add('checked');
        checkinButton.disabled = true;
        // Hide text, show only icon when checked in
        checkinButtonText.style.display = 'none';
        checkinButton.style.width = '42px';
    } else {
        checkinButton.classList.remove('checked');
        checkinButton.disabled = false;
        // Hide text to match other buttons (icon only)
        checkinButtonText.style.display = 'none';
        checkinButton.style.width = '42px';
    }
}

function openCheckInModal() {
    // Check if already checked in
    if (checkInStatus && checkInStatus.checked_in) {
        alert('You have already checked in today!');
        return;
    }
    
    const modal = document.getElementById('checkinModal');
    const errorDiv = document.getElementById('checkinError');
    const successDiv = document.getElementById('checkinSuccess');
    const notesTextarea = document.getElementById('checkinNotes');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    if (notesTextarea) notesTextarea.value = '';
    
    if (modal) {
        modal.classList.add('show');
    }
}

function closeCheckInModal() {
    const modal = document.getElementById('checkinModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function submitCheckIn() {
    const notesTextarea = document.getElementById('checkinNotes');
    const errorDiv = document.getElementById('checkinError');
    const successDiv = document.getElementById('checkinSuccess');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    
    const notes = notesTextarea ? notesTextarea.value.trim() : '';
    
    fetch('/api/checkin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            notes: notes || null
        })
    })
    .then(response => {
        if (response.status === 401) {
            window.location.href = '/admin/login?redirect=' + encodeURIComponent(window.location.pathname);
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (!data) return;
        
        if (data.error) {
            if (errorDiv) {
                errorDiv.textContent = data.error;
                errorDiv.style.display = 'block';
            }
        } else {
            if (successDiv) {
                successDiv.textContent = data.message || 'Check-in successful!';
                successDiv.style.display = 'block';
            }
            
            // Reload check-in status
            loadCheckInStatus();
            
            // Close modal after a short delay
            setTimeout(() => {
                closeCheckInModal();
            }, 1500);
        }
    })
    .catch(error => {
        console.error('Error submitting check-in:', error);
        if (errorDiv) {
            errorDiv.textContent = 'Failed to check in. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const checkinModal = document.getElementById('checkinModal');
    if (event.target === checkinModal) {
        closeCheckInModal();
    }
}

// Make functions available globally
window.openCheckInModal = openCheckInModal;
window.closeCheckInModal = closeCheckInModal;
window.submitCheckIn = submitCheckIn;

