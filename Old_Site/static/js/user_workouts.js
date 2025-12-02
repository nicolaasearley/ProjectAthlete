// User Workout Management
let currentUserWorkoutId = null;
let exerciseCounter = 0;
let groupCounter = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the my-workouts page
    const myWorkoutsPage = document.getElementById('myWorkoutsPageContent');
    if (myWorkoutsPage && myWorkoutsPage.style.display !== 'none') {
        loadUserWorkouts();
    }
    
    // Listen for navigation changes
    const profileNavItems = document.querySelectorAll('.profile-nav-item');
    profileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '/user/profile/my-workouts') {
                setTimeout(() => {
                    loadUserWorkouts();
                }, 100);
            }
        });
    });
});

function loadUserWorkouts() {
    fetch('/api/user/workouts')
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
                console.error('Error loading workouts:', data.error);
                return;
            }
            displayUserWorkouts(data);
        })
        .catch(error => {
            console.error('Error loading user workouts:', error);
        });
}

function displayUserWorkouts(workouts) {
    const container = document.getElementById('userWorkoutsList');
    if (!container) return;
    
    if (workouts.length === 0) {
        container.innerHTML = `
            <div class="user-workouts-empty">
                <p>No workouts created yet. Click "Create New Workout" to get started!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = workouts.map(workout => {
        const date = new Date(workout.date + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        return `
            <div class="user-workout-item">
                <div class="user-workout-header">
                    <div>
                        <h3>${escapeHtml(workout.workout_name)}</h3>
                        <p class="user-workout-date">${formattedDate}</p>
                    </div>
                    <div class="user-workout-actions">
                        <button class="btn btn-secondary" onclick="openUserWorkoutEditor(${workout.id})">
                            <i class="fa-solid fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="deleteUserWorkout(${workout.id})">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openUserWorkoutEditor(workoutId) {
    // For now, redirect to admin dashboard style editor
    // In a full implementation, we'd create a modal or inline editor
    // For simplicity, we'll create a modal similar to admin dashboard
    currentUserWorkoutId = workoutId;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('userWorkoutEditorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'userWorkoutEditorModal';
        modal.className = 'user-workout-editor-modal';
        modal.innerHTML = `
            <div class="user-workout-editor-content">
                <div class="editor-header">
                    <h2 id="userEditorTitle">New Workout</h2>
                    <button class="btn btn-secondary" onclick="closeUserWorkoutEditor()">Close</button>
                </div>
                <form id="userWorkoutForm">
                    <div class="form-group">
                        <label for="userWorkoutDate">Date</label>
                        <input type="date" id="userWorkoutDate" name="date" required>
                    </div>
                    <div class="form-group">
                        <label for="userWorkoutNameInput">Workout Name</label>
                        <input type="text" id="userWorkoutNameInput" name="workout_name" placeholder="Enter workout name" required>
                    </div>
                    <div class="form-group">
                        <label>Workout Structure</label>
                        <div id="userWorkoutStructure" class="workout-structure"></div>
                        <div style="margin-top: 12px; display: flex; gap: 8px;">
                            <button type="button" class="btn btn-secondary" onclick="addUserExercise(null)">+ Add Exercise</button>
                            <button type="button" class="btn btn-secondary" onclick="addUserExerciseGroup()">+ Add Exercise Group</button>
                        </div>
                    </div>
                    <div id="userEditorError" class="error-message" style="display: none;"></div>
                    <button type="submit" class="btn btn-primary">Save Workout</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('userWorkoutForm').addEventListener('submit', function(e) {
            e.preventDefault();
            saveUserWorkout();
        });
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('userWorkoutDate').value = today;
    }
    
    if (workoutId) {
        document.getElementById('userEditorTitle').textContent = 'Edit Workout';
        loadUserWorkoutForEdit(workoutId);
    } else {
        document.getElementById('userEditorTitle').textContent = 'New Workout';
        document.getElementById('userWorkoutForm').reset();
        document.getElementById('userWorkoutStructure').innerHTML = '';
        exerciseCounter = 0;
        groupCounter = 0;
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('userWorkoutDate').value = today;
        addUserExerciseGroup();
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeUserWorkoutEditor() {
    const modal = document.getElementById('userWorkoutEditorModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function loadUserWorkoutForEdit(workoutId) {
    fetch(`/api/user/workouts`)
        .then(response => response.json())
        .then(data => {
            const workout = data.find(w => w.id === workoutId);
            if (!workout) {
                showUserError('Workout not found');
                return;
            }
            
            document.getElementById('userWorkoutDate').value = workout.date;
            document.getElementById('userWorkoutNameInput').value = workout.workout_name;
            
            document.getElementById('userWorkoutStructure').innerHTML = '';
            exerciseCounter = 0;
            groupCounter = 0;
            
            // Add standalone exercises
            if (workout.exercises && workout.exercises.length > 0) {
                workout.exercises.forEach(ex => {
                    addUserExercise(ex);
                });
            }
            
            // Add exercise groups
            if (workout.exercise_groups && workout.exercise_groups.length > 0) {
                workout.exercise_groups.forEach(group => {
                    addUserExerciseGroup(group);
                });
            }
        })
        .catch(error => {
            console.error('Error loading workout:', error);
            showUserError('Failed to load workout');
        });
}

function addUserExercise(exerciseData = null, groupId = null) {
    const container = groupId !== null ? document.getElementById(`user-group-exercises-${groupId}`) : document.getElementById('userWorkoutStructure');
    if (!container) return;
    
    const exerciseId = exerciseCounter++;
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-editor-item';
    exerciseDiv.id = `user-exercise-${exerciseId}`;
    exerciseDiv.dataset.exerciseId = exerciseId;
    exerciseDiv.dataset.groupId = groupId !== null ? groupId.toString() : 'null';
    
    exerciseDiv.innerHTML = `
        <div class="exercise-editor-header">
            <strong>Exercise ${exerciseId + 1}</strong>
            <button type="button" class="btn btn-danger" style="padding: 4px 12px; font-size: 14px;" onclick="removeUserExercise(${exerciseId})">Remove</button>
        </div>
        <div class="exercise-editor-fields">
            <input type="text" placeholder="Exercise Name" name="exercise_name_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.exercise_name || '') : ''}" required>
            <input type="text" placeholder="Sets" name="sets_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.sets || '') : ''}">
            <input type="text" placeholder="Reps" name="reps_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.reps || '') : ''}">
            <input type="text" placeholder="Weight" name="weight_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.weight || '') : ''}">
            <input type="text" placeholder="Tempo" name="tempo_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.tempo || '') : ''}">
            <input type="text" placeholder="Rest" name="rest_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.rest || '') : ''}">
            <textarea placeholder="Notes" name="notes_${exerciseId}">${exerciseData ? escapeHtml(exerciseData.notes || '') : ''}</textarea>
            <div style="display: flex; gap: 12px; align-items: center;">
                <label style="display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" name="has_1rm_${exerciseId}" ${exerciseData && exerciseData.has_1rm_calculator ? 'checked' : ''}>
                    <span>1RM Calculator</span>
                </label>
                <label style="display: flex; align-items: center; gap: 6px;">
                    <input type="checkbox" name="has_weight_logging_${exerciseId}" ${exerciseData && exerciseData.has_weight_logging ? 'checked' : ''}>
                    <span>Weight Logging</span>
                </label>
            </div>
        </div>
    `;
    
    container.appendChild(exerciseDiv);
}

function addUserExerciseGroup(groupData = null) {
    const container = document.getElementById('userWorkoutStructure');
    if (!container) return;
    
    const groupId = groupCounter++;
    const groupDiv = document.createElement('div');
    groupDiv.className = 'exercise-group-editor';
    groupDiv.id = `user-group-${groupId}`;
    groupDiv.dataset.groupId = groupId;
    
    groupDiv.innerHTML = `
        <div class="exercise-group-editor-header">
            <strong>Exercise Group ${groupId + 1}</strong>
            <button type="button" class="btn btn-danger" style="padding: 4px 12px; font-size: 14px;" onclick="removeUserExerciseGroup(${groupId})">Remove Group</button>
        </div>
        <div class="exercise-group-editor-fields">
            <input type="text" placeholder="Group Name" name="group_name_${groupId}" value="${groupData ? escapeHtml(groupData.group_name || '') : ''}">
            <input type="text" placeholder="Rounds" name="rounds_${groupId}" value="${groupData ? escapeHtml(groupData.rounds || '') : ''}">
            <input type="text" placeholder="Rep Scheme" name="rep_scheme_${groupId}" value="${groupData ? escapeHtml(groupData.rep_scheme || '') : ''}">
            <textarea placeholder="Group Notes" name="group_notes_${groupId}">${groupData ? escapeHtml(groupData.notes || '') : ''}</textarea>
        </div>
        <div id="user-group-exercises-${groupId}" class="group-exercises-container">
            ${groupData && groupData.exercises ? groupData.exercises.map(ex => {
                const exId = exerciseCounter++;
                return `<div class="exercise-editor-item" id="user-exercise-${exId}" data-exercise-id="${exId}" data-group-id="${groupId}">
                    <div class="exercise-editor-header">
                        <strong>Exercise ${exId + 1}</strong>
                        <button type="button" class="btn btn-danger" style="padding: 4px 12px; font-size: 14px;" onclick="removeUserExercise(${exId})">Remove</button>
                    </div>
                    <div class="exercise-editor-fields">
                        <input type="text" placeholder="Exercise Name" name="exercise_name_${exId}" value="${escapeHtml(ex.exercise_name || '')}" required>
                        <input type="text" placeholder="Sets" name="sets_${exId}" value="${escapeHtml(ex.sets || '')}">
                        <input type="text" placeholder="Reps" name="reps_${exId}" value="${escapeHtml(ex.reps || '')}">
                        <input type="text" placeholder="Weight" name="weight_${exId}" value="${escapeHtml(ex.weight || '')}">
                        <input type="text" placeholder="Tempo" name="tempo_${exId}" value="${escapeHtml(ex.tempo || '')}">
                        <input type="text" placeholder="Rest" name="rest_${exId}" value="${escapeHtml(ex.rest || '')}">
                        <textarea placeholder="Notes" name="notes_${exId}">${escapeHtml(ex.notes || '')}</textarea>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <label style="display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" name="has_1rm_${exId}" ${ex.has_1rm_calculator ? 'checked' : ''}>
                                <span>1RM Calculator</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" name="has_weight_logging_${exId}" ${ex.has_weight_logging ? 'checked' : ''}>
                                <span>Weight Logging</span>
                            </label>
                        </div>
                    </div>
                </div>`;
            }).join('') : ''}
        </div>
        <button type="button" class="btn btn-secondary" onclick="addUserExercise(null, ${groupId})" style="margin-top: 8px;">+ Add Exercise to Group</button>
    `;
    
    container.appendChild(groupDiv);
    
    // Update exercise counter if we added exercises from group data
    if (groupData && groupData.exercises) {
        exerciseCounter += groupData.exercises.length;
    }
}

function removeUserExercise(exerciseId) {
    const exercise = document.getElementById(`user-exercise-${exerciseId}`);
    if (exercise) {
        exercise.remove();
    }
}

function removeUserExerciseGroup(groupId) {
    const group = document.getElementById(`user-group-${groupId}`);
    if (group) {
        group.remove();
    }
}

function saveUserWorkout() {
    const form = document.getElementById('userWorkoutForm');
    const formData = new FormData(form);
    
    const exercises = [];
    const exerciseGroups = [];
    
    // Collect standalone exercises
    document.querySelectorAll('#userWorkoutStructure > .exercise-editor-item').forEach(item => {
        const exerciseId = item.dataset.exerciseId;
        const exercise = {
            exercise_name: formData.get(`exercise_name_${exerciseId}`),
            sets: formData.get(`sets_${exerciseId}`),
            reps: formData.get(`reps_${exerciseId}`),
            weight: formData.get(`weight_${exerciseId}`),
            tempo: formData.get(`tempo_${exerciseId}`),
            rest: formData.get(`rest_${exerciseId}`),
            notes: formData.get(`notes_${exerciseId}`),
            has_1rm_calculator: formData.get(`has_1rm_${exerciseId}`) === 'on',
            has_weight_logging: formData.get(`has_weight_logging_${exerciseId}`) === 'on'
        };
        if (exercise.exercise_name) {
            exercises.push(exercise);
        }
    });
    
    // Collect exercise groups
    document.querySelectorAll('.exercise-group-editor').forEach(groupItem => {
        const groupId = groupItem.dataset.groupId;
        const group = {
            group_name: formData.get(`group_name_${groupId}`),
            rounds: formData.get(`rounds_${groupId}`),
            rep_scheme: formData.get(`rep_scheme_${groupId}`),
            notes: formData.get(`group_notes_${groupId}`),
            exercises: []
        };
        
        // Collect exercises in this group
        groupItem.querySelectorAll(`#user-group-exercises-${groupId} > .exercise-editor-item`).forEach(item => {
            const exerciseId = item.dataset.exerciseId;
            const exercise = {
                order: parseInt(exerciseId),
                exercise_name: formData.get(`exercise_name_${exerciseId}`),
                sets: formData.get(`sets_${exerciseId}`),
                reps: formData.get(`reps_${exerciseId}`),
                weight: formData.get(`weight_${exerciseId}`),
                tempo: formData.get(`tempo_${exerciseId}`),
                rest: formData.get(`rest_${exerciseId}`),
                notes: formData.get(`notes_${exerciseId}`),
                has_1rm_calculator: formData.get(`has_1rm_${exerciseId}`) === 'on',
                has_weight_logging: formData.get(`has_weight_logging_${exerciseId}`) === 'on'
            };
            if (exercise.exercise_name) {
                group.exercises.push(exercise);
            }
        });
        
        exerciseGroups.push(group);
    });
    
    const workoutData = {
        date: document.getElementById('userWorkoutDate').value,
        workout_name: document.getElementById('userWorkoutNameInput').value,
        exercises: exercises,
        exercise_groups: exerciseGroups
    };
    
    const url = currentUserWorkoutId ? `/api/user/workouts/${currentUserWorkoutId}` : '/api/user/workouts';
    const method = currentUserWorkoutId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showUserError(data.error);
        } else {
            closeUserWorkoutEditor();
            loadUserWorkouts();
        }
    })
    .catch(error => {
        console.error('Error saving workout:', error);
        showUserError('Failed to save workout: ' + error.message);
    });
}

function deleteUserWorkout(workoutId) {
    if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
        return;
    }
    
    fetch(`/api/user/workouts/${workoutId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            loadUserWorkouts();
        }
    })
    .catch(error => {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout');
    });
}

function showUserError(message) {
    const errorDiv = document.getElementById('userEditorError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible
window.openUserWorkoutEditor = openUserWorkoutEditor;
window.closeUserWorkoutEditor = closeUserWorkoutEditor;
window.addUserExercise = addUserExercise;
window.addUserExerciseGroup = addUserExerciseGroup;
window.removeUserExercise = removeUserExercise;
window.removeUserExerciseGroup = removeUserExerciseGroup;
window.deleteUserWorkout = deleteUserWorkout;

