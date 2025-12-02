// Weight Logging Modal Functions
let currentWeightLoggingExercise = null;
let currentWeightLoggingWorkoutId = null;
let currentWeightLoggingDate = null;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openWeightLoggingModal(exerciseId, exerciseName, workoutId, workoutDate, setsValue, repsValue) {
    // Check if user is logged in
    fetch('/api/user/profile')
        .then(response => {
            if (!response.ok) {
                // User not logged in, redirect to login
                window.location.href = '/admin/login?redirect=' + encodeURIComponent(window.location.pathname);
                return;
            }
            return response.json();
        })
        .then(userData => {
            if (!userData) return; // Already redirected
            
            currentWeightLoggingExercise = {
                id: exerciseId,
                name: exerciseName,
                workoutId: workoutId,
                workoutDate: workoutDate,
                setsValue: setsValue,
                repsValue: repsValue
            };
            currentWeightLoggingWorkoutId = workoutId;
            currentWeightLoggingDate = workoutDate;
            
            // Parse sets value to determine number of inputs
            let numSets = 1;
            if (setsValue) {
                // Try to extract number from sets string (e.g., "3", "3x5", "3 sets")
                const match = setsValue.match(/\d+/);
                if (match) {
                    numSets = parseInt(match[0]);
                }
            }
            
            // Parse reps value to auto-fill reps inputs
            let defaultReps = null;
            if (repsValue) {
                // Try to extract number from reps string (e.g., "5", "5 reps", "3x5" -> extract first number)
                const repsMatch = repsValue.match(/\d+/);
                if (repsMatch) {
                    defaultReps = parseInt(repsMatch[0]);
                }
            }
            
            // Create modal HTML
            const modal = document.getElementById('weightLoggingModal');
            const modalBody = modal.querySelector('.modal-weight-logging-body');
            
            let setsHTML = '';
            for (let i = 1; i <= numSets; i++) {
                setsHTML += `
                    <div class="weight-logging-set">
                        <div class="set-number">Set ${i}</div>
                        <div class="set-inputs">
                            <div class="set-input-group">
                                <label>Weight (lbs)</label>
                                <input type="number" id="weight_${i}" placeholder="0" min="0" step="0.5" class="weight-input">
                            </div>
                            <div class="set-input-group">
                                <label>Reps</label>
                                <input type="number" id="reps_${i}" placeholder="0" min="0" step="1" class="reps-input" ${defaultReps ? `value="${defaultReps}"` : ''}>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            modal.querySelector('.modal-weight-logging-title').textContent = `Log Weight: ${exerciseName}`;
            modalBody.innerHTML = `
                <div class="weight-logging-sets-container">
                    ${setsHTML}
                </div>
                <div id="weightLoggingError" class="error-message" style="display: none;"></div>
                <div id="weightLoggingSuccess" class="success-message" style="display: none;"></div>
                <div class="weight-logging-actions">
                    <button class="btn btn-primary" onclick="submitWeightLog()">Save</button>
                    <button class="btn btn-secondary" onclick="closeWeightLoggingModal()">Cancel</button>
                </div>
            `;
            
            modal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error checking authentication:', error);
            window.location.href = '/admin/login?redirect=' + encodeURIComponent(window.location.pathname);
        });
}

function closeWeightLoggingModal() {
    const modal = document.getElementById('weightLoggingModal');
    modal.style.display = 'none';
    currentWeightLoggingExercise = null;
    currentWeightLoggingWorkoutId = null;
    currentWeightLoggingDate = null;
}

function submitWeightLog() {
    if (!currentWeightLoggingExercise) return;
    
    const errorDiv = document.getElementById('weightLoggingError');
    const successDiv = document.getElementById('weightLoggingSuccess');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Collect all sets data
    const sets = [];
    const setsContainer = document.querySelector('.weight-logging-sets-container');
    const setDivs = setsContainer.querySelectorAll('.weight-logging-set');
    
    let hasData = false;
    setDivs.forEach((setDiv, index) => {
        const weightInput = setDiv.querySelector(`#weight_${index + 1}`);
        const repsInput = setDiv.querySelector(`#reps_${index + 1}`);
        const weight = parseFloat(weightInput.value) || 0;
        const reps = parseInt(repsInput.value) || 0;
        
        if (weight > 0 || reps > 0) {
            hasData = true;
        }
        
        sets.push({
            weight: weight,
            reps: reps
        });
    });
    
    if (!hasData) {
        errorDiv.textContent = 'Please enter at least one weight or rep value';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Submit to API
    fetch(`/api/exercises/${currentWeightLoggingExercise.id}/log-weight`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            workout_id: currentWeightLoggingExercise.workoutId,
            date: currentWeightLoggingExercise.workoutDate,
            sets: sets
        })
    })
    .then(response => {
        if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = '/admin/login?redirect=' + encodeURIComponent(window.location.pathname);
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (!data) return; // Already redirected
        
        if (data.error) {
            errorDiv.textContent = data.error;
            errorDiv.style.display = 'block';
        } else {
            successDiv.textContent = data.message || 'Weight logged successfully!';
            successDiv.style.display = 'block';
            setTimeout(() => {
                closeWeightLoggingModal();
            }, 1500);
        }
    })
    .catch(error => {
        console.error('Error logging weight:', error);
        errorDiv.textContent = 'Failed to log weight. Please try again.';
        errorDiv.style.display = 'block';
    });
}

// Leaderboard Modal Functions
function openLeaderboardModal(exerciseId, exerciseName, workoutId, workoutDate) {
    const modal = document.getElementById('leaderboardModal');
    const modalBody = modal.querySelector('.modal-leaderboard-body');
    
    modal.querySelector('.modal-leaderboard-title').textContent = `Leaderboard: ${exerciseName}`;
    modalBody.innerHTML = '<div class="loading">Loading leaderboard...</div>';
    modal.style.display = 'flex';
    
    // Fetch leaderboard data
    fetch(`/api/exercises/${exerciseId}/leaderboard?workout_id=${workoutId}&date=${workoutDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                modalBody.innerHTML = `<div class="error-message">${data.error}</div>`;
            } else {
                if (data.leaderboard && data.leaderboard.length > 0) {
                    let leaderboardHTML = '<div class="leaderboard-list">';
                    data.leaderboard.forEach((entry, index) => {
                        const rank = index + 1;
                        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                        leaderboardHTML += `
                            <div class="leaderboard-entry ${rank <= 3 ? 'podium' : ''}">
                                <div class="leaderboard-rank">${medal} ${rank}</div>
                                <div class="leaderboard-user">
                                    <div class="profile-icon-small" data-initials="${entry.initials}">${entry.initials}</div>
                                    <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
                                </div>
                                <div class="leaderboard-weight">${entry.weight} lbs</div>
                                ${entry.reps ? `<div class="leaderboard-reps">${entry.reps} reps</div>` : ''}
                            </div>
                        `;
                    });
                    leaderboardHTML += '</div>';
                    modalBody.innerHTML = leaderboardHTML;
                } else {
                    modalBody.innerHTML = '<div class="empty-leaderboard">No weights logged yet for this exercise.</div>';
                }
            }
        })
        .catch(error => {
            console.error('Error loading leaderboard:', error);
            modalBody.innerHTML = '<div class="error-message">Failed to load leaderboard. Please try again.</div>';
        });
}

function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    modal.style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const weightModal = document.getElementById('weightLoggingModal');
    const leaderboardModal = document.getElementById('leaderboardModal');
    
    if (event.target === weightModal) {
        closeWeightLoggingModal();
    }
    if (event.target === leaderboardModal) {
        closeLeaderboardModal();
    }
}

