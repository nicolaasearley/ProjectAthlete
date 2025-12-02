document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    const currentPath = window.location.pathname;
    const isLoggedLiftsPage = currentPath.includes('/logged-lifts');
    const isCheckinsPage = currentPath.includes('/checkins');
    
    if (isLoggedLiftsPage) {
        loadLoggedWeights();
    } else if (isCheckinsPage) {
        loadCheckInHistory();
    } else {
        loadUserProfile();
        
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                updateProfile();
            });
        }
    }
});

function loadUserProfile() {
    fetch('/api/user/profile')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
            } else {
                const usernameDisplay = document.getElementById('usernameDisplay');
                const firstNameInput = document.getElementById('firstNameInput');
                const lastNameInput = document.getElementById('lastNameInput');
                
                if (usernameDisplay) usernameDisplay.textContent = data.username || '';
                if (firstNameInput) firstNameInput.value = data.first_name || '';
                if (lastNameInput) lastNameInput.value = data.last_name || '';
            }
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            showError('Failed to load profile');
        });
}

let allLoggedWeightsData = null;

function loadLoggedWeights() {
    fetch('/api/user/logged-weights')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading logged weights:', data.error);
                const list = document.getElementById('loggedWeightsList');
                if (list) {
                    list.innerHTML = '<div class="logged-weights-empty">Error loading logged weights.</div>';
                }
                return;
            }
            
            const list = document.getElementById('loggedWeightsList');
            const filterSelect = document.getElementById('exerciseFilter');
            
            if (!list) return;
            
            // Store data globally for filtering
            allLoggedWeightsData = data.logged_weights || [];
            
            if (allLoggedWeightsData.length > 0) {
                // Populate filter dropdown
                const exerciseNames = [...new Set(allLoggedWeightsData.map(item => item.exercise_name))].sort();
                if (filterSelect) {
                    exerciseNames.forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        filterSelect.appendChild(option);
                    });
                    
                    // Add filter event listener
                    filterSelect.addEventListener('change', function() {
                        filterLoggedWeights(this.value);
                    });
                }
                
                // Display all logged weights
                displayLoggedWeights(allLoggedWeightsData);
            } else {
                list.innerHTML = '<div class="logged-weights-empty">No weights logged yet.</div>';
            }
        })
        .catch(error => {
            console.error('Error loading logged weights:', error);
            const list = document.getElementById('loggedWeightsList');
            if (list) {
                list.innerHTML = '<div class="logged-weights-empty">Error loading logged weights.</div>';
            }
        });
}

function displayLoggedWeights(loggedWeights, filterExercise = '') {
    const list = document.getElementById('loggedWeightsList');
    if (!list) return;
    
    // Filter by exercise if specified
    const filtered = filterExercise 
        ? loggedWeights.filter(item => item.exercise_name === filterExercise)
        : loggedWeights;
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="logged-weights-empty">No weights found for this filter.</div>';
        return;
    }
    
    let html = '';
    filtered.forEach((item, index) => {
        const entryId = `logged-weight-entry-${index}`;
        const date = new Date(item.highest_date);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        html += `
            <div class="logged-weight-entry" id="${entryId}">
                <div class="logged-weight-entry-header" onclick="toggleLoggedWeightEntry('${entryId}')">
                    <div class="logged-weight-entry-main">
                        <div class="logged-weight-entry-exercise">${escapeHtml(item.exercise_name)}</div>
                        <div class="logged-weight-entry-details">
                            <div class="logged-weight-entry-detail">
                                <span class="logged-weight-entry-detail-label">Highest Weight</span>
                                <span class="logged-weight-entry-detail-value">${item.highest_weight} lbs</span>
                            </div>
                            <div class="logged-weight-entry-detail">
                                <span class="logged-weight-entry-detail-label">Reps</span>
                                <span class="logged-weight-entry-detail-value">${item.highest_reps || 'N/A'}</span>
                            </div>
                            <div class="logged-weight-entry-detail">
                                <span class="logged-weight-entry-detail-label">Date</span>
                                <span class="logged-weight-entry-detail-value">${formattedDate}</span>
                            </div>
                        </div>
                    </div>
                    <button class="logged-weight-entry-toggle" aria-label="Toggle details">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
                <div class="logged-weight-entry-workout-details">
                    ${renderWorkoutDetails(item.workouts)}
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

function renderWorkoutDetails(workouts) {
    if (!workouts || workouts.length === 0) {
        return '<div style="padding: 12px; color: var(--text-secondary);">No workout details available.</div>';
    }
    
    let html = '';
    workouts.forEach(workout => {
        const date = new Date(workout.date);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        html += `
            <div class="logged-weight-workout-date">${formattedDate}</div>
            <div class="logged-weight-workout-sets">
        `;
        
        if (workout.sets && workout.sets.length > 0) {
            workout.sets.forEach((set, setIndex) => {
                html += `
                    <div class="logged-weight-workout-set">
                        <span class="logged-weight-workout-set-weight">${set.weight} lbs</span>
                        <span class="logged-weight-workout-set-reps">${set.reps || 'N/A'} reps</span>
                        ${set.sets ? `<span style="color: var(--text-secondary);">(${set.sets} sets)</span>` : ''}
                    </div>
                `;
            });
        }
        
        html += `
            </div>
        `;
    });
    
    return html;
}

function toggleLoggedWeightEntry(entryId) {
    const entry = document.getElementById(entryId);
    if (!entry) return;
    
    entry.classList.toggle('expanded');
    const toggleIcon = entry.querySelector('.logged-weight-entry-toggle i');
    if (toggleIcon) {
        if (entry.classList.contains('expanded')) {
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-up');
        } else {
            toggleIcon.classList.remove('fa-chevron-up');
            toggleIcon.classList.add('fa-chevron-down');
        }
    }
}

function filterLoggedWeights(filterExercise) {
    if (!allLoggedWeightsData) return;
    displayLoggedWeights(allLoggedWeightsData, filterExercise);
}

// Make toggleLoggedWeightEntry available globally
window.toggleLoggedWeightEntry = toggleLoggedWeightEntry;

function loadCheckInHistory() {
    fetch('/api/checkin/history')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error loading check-in history:', data.error);
                const list = document.getElementById('checkinsList');
                if (list) {
                    list.innerHTML = '<div class="checkins-empty">Error loading check-ins.</div>';
                }
                return;
            }
            
            const list = document.getElementById('checkinsList');
            const streakValue = document.getElementById('streakValue');
            
            if (!list) return;
            
            // Update streak
            if (streakValue) {
                streakValue.textContent = `${data.current_streak || 0} days`;
            }
            
            if (data.checkins && data.checkins.length > 0) {
                let html = '';
                data.checkins.forEach(checkin => {
                    // Parse date and time properly, handling timezone
                    const date = new Date(checkin.date + 'T00:00:00');
                    const checkInTime = new Date(checkin.check_in_time);
                    
                    const formattedDate = date.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                    const formattedTime = checkInTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                    
                    html += `
                        <div class="checkin-item">
                            <div class="checkin-item-header">
                                <div class="checkin-item-date">${formattedDate}</div>
                                <div class="checkin-item-time">${formattedTime}</div>
                            </div>
                            ${checkin.notes ? `<div class="checkin-item-notes">${escapeHtml(checkin.notes)}</div>` : ''}
                        </div>
                    `;
                });
                list.innerHTML = html;
            } else {
                list.innerHTML = '<div class="checkins-empty">No check-ins yet. Start your streak today!</div>';
            }
        })
        .catch(error => {
            console.error('Error loading check-in history:', error);
            const list = document.getElementById('checkinsList');
            if (list) {
                list.innerHTML = '<div class="checkins-empty">Error loading check-ins.</div>';
            }
        });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateProfile() {
    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;
    const first_name = document.getElementById('firstNameInput').value;
    const last_name = document.getElementById('lastNameInput').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        showError('New passwords do not match');
        return;
    }
    
    if (newPassword && !currentPassword) {
        showError('Current password is required to change password');
        return;
    }
    
    const profileData = {
        first_name: first_name,
        last_name: last_name
    };
    
    if (newPassword) {
        profileData.current_password = currentPassword;
        profileData.new_password = newPassword;
    }
    
    fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError(data.error);
        } else {
            showSuccess('Profile updated successfully');
            // Clear password fields
            document.getElementById('currentPasswordInput').value = '';
            document.getElementById('newPasswordInput').value = '';
            document.getElementById('confirmPasswordInput').value = '';
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
    });
}

function showError(message) {
    const errorDiv = document.getElementById('editorError');
    const successDiv = document.getElementById('editorSuccess');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('editorError');
    const successDiv = document.getElementById('editorSuccess');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
}

