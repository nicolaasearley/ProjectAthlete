let currentWorkoutId = null;
let exerciseCounter = 0;
let groupCounter = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadWorkouts();
    initializeDragAndDrop();
    
    document.getElementById('newWorkoutBtn').addEventListener('click', function() {
        openWorkoutEditor();
    });
    
    document.getElementById('closeEditorBtn').addEventListener('click', function() {
        closeWorkoutEditor();
    });
    
    document.getElementById('addExerciseBtn').addEventListener('click', function() {
        addExerciseEditor(null, null);
    });
    
    document.getElementById('addGroupBtn').addEventListener('click', function() {
        addExerciseGroupEditor();
    });
    
    document.getElementById('workoutForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveWorkout();
    });
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('workoutDate');
    dateInput.value = today;
    updateDateDisplay();
    
    // Update date display when date changes
    dateInput.addEventListener('change', updateDateDisplay);
    
    function updateDateDisplay() {
        const dateInput = document.getElementById('workoutDate');
        const dateDisplay = document.getElementById('dateDisplay');
        if (dateInput && dateDisplay && dateInput.value) {
            const date = new Date(dateInput.value + 'T00:00:00');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = date.toLocaleDateString('en-US', options);
        }
    }
    
    window.updateDateDisplay = updateDateDisplay;
    
    // Generate Week from Template handlers
    const generateWeekBtn = document.getElementById('generateWeekBtn');
    const generateWeekModal = document.getElementById('generateWeekModal');
    const closeGenerateWeekModalBtn = document.getElementById('closeGenerateWeekModal');
    const cancelGenerateWeekBtn = document.getElementById('cancelGenerateWeekBtn');
    const generateWeekSubmitBtn = document.getElementById('generateWeekSubmitBtn');
    
    if (generateWeekBtn) {
        generateWeekBtn.addEventListener('click', openGenerateWeekModal);
    }
    
    if (closeGenerateWeekModalBtn) {
        closeGenerateWeekModalBtn.addEventListener('click', closeGenerateWeekModal);
    }
    
    if (cancelGenerateWeekBtn) {
        cancelGenerateWeekBtn.addEventListener('click', closeGenerateWeekModal);
    }
    
    if (generateWeekSubmitBtn) {
        generateWeekSubmitBtn.addEventListener('click', generateWeekFromTemplate);
    }
    
    // Close modal when clicking outside
    if (generateWeekModal) {
        generateWeekModal.addEventListener('click', function(e) {
            if (e.target === generateWeekModal) {
                closeGenerateWeekModal();
            }
        });
    }
});

function loadWorkouts() {
    // Fetch ALL workouts (no date restrictions)
    fetch(`/api/workouts`)
        .then(response => response.json())
        .then(workouts => {
            displayWorkouts(workouts);
        })
        .catch(error => {
            console.error('Error loading workouts:', error);
        });
}

function displayWorkouts(workouts) {
    const container = document.getElementById('workoutsList');
    
    if (workouts.length === 0) {
        container.innerHTML = '<p>No workouts scheduled. Click "New Workout" to create one.</p>';
        return;
    }
    
    // Parse dates correctly and sort by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const workoutsWithDates = workouts.map(workout => {
        // Parse date correctly to avoid timezone issues
        const dateParts = workout.date.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        date.setHours(0, 0, 0, 0);
        
        return {
            ...workout,
            dateObj: date
        };
    });
    
    // Sort by date
    workoutsWithDates.sort((a, b) => a.dateObj - b.dateObj);
    
    // Categorize workouts
    const pastWorkouts = workoutsWithDates.filter(w => w.dateObj < today);
    const todayWorkouts = workoutsWithDates.filter(w => {
        return w.dateObj.getTime() === today.getTime();
    });
    const tomorrowWorkouts = workoutsWithDates.filter(w => {
        return w.dateObj.getTime() === tomorrow.getTime();
    });
    const futureWorkouts = workoutsWithDates.filter(w => w.dateObj > tomorrow);
    
    // Build HTML with sections
    let html = '';
    
    // Today and Tomorrow section
    if (todayWorkouts.length > 0 || tomorrowWorkouts.length > 0) {
        html += '<div class="workout-section">';
        html += '<h2 class="workout-section-title">Today & Tomorrow</h2>';
        html += '<div class="workout-grid">';
        
        [...todayWorkouts, ...tomorrowWorkouts].forEach(workout => {
            html += createWorkoutCard(workout);
        });
        
        html += '</div></div>';
    }
    
    // Future workouts section
    if (futureWorkouts.length > 0) {
        html += '<div class="workout-section">';
        html += '<h2 class="workout-section-title">Upcoming Workouts</h2>';
        html += '<div class="workout-grid">';
        
        futureWorkouts.forEach(workout => {
            html += createWorkoutCard(workout);
        });
        
        html += '</div></div>';
    }
    
    // Past workouts section (limit to 5 most recent)
    if (pastWorkouts.length > 0) {
        html += '<div class="workout-section">';
        html += '<h2 class="workout-section-title">Previous Workouts</h2>';
        html += '<div class="workout-grid">';
        
        // Show only the 5 most recent past workouts
        const recentPastWorkouts = pastWorkouts.reverse().slice(0, 5);
        recentPastWorkouts.forEach(workout => {
            html += createWorkoutCard(workout);
        });
        
        html += '</div>';
        
        // Add "View All" link if there are more than 5 past workouts
        if (pastWorkouts.length > 5) {
            html += `<div style="text-align: center; margin-top: 20px;">
                <a href="/admin/workouts/all" class="btn btn-secondary" style="display: inline-block;">
                    View All ${pastWorkouts.length} Previous Workouts
                </a>
            </div>`;
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html || '<p>No workouts scheduled. Click "New Workout" to create one.</p>';
}

function createWorkoutCard(workout) {
    const formattedDate = workout.dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const exerciseCount = (workout.exercises ? workout.exercises.length : 0) + 
                          (workout.exercise_groups ? workout.exercise_groups.reduce((sum, g) => sum + (g.exercises ? g.exercises.length : 0), 0) : 0);
    
    const creatorDisplay = workout.creator_name 
        ? `<div class="workout-creator"><div class="profile-icon-small" data-initials="${workout.creator_initials || '?'}">${workout.creator_initials || '?'}</div><span>${escapeHtml(workout.creator_name)}</span></div>`
        : '';
    
    return `
        <div class="workout-card" onclick="showWorkoutPreview(${workout.id})">
            <div class="workout-card-title">${escapeHtml(workout.workout_name)}</div>
            <div class="workout-card-date">${formattedDate}</div>
            ${creatorDisplay}
            <div style="color: #666; font-size: 14px; margin-bottom: 12px;">${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</div>
            <div class="workout-card-actions">
                <button class="btn btn-secondary" onclick="event.stopPropagation(); editWorkout(${workout.id})">Edit</button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteWorkout(${workout.id})">Delete</button>
            </div>
        </div>
    `;
}

function showWorkoutPreview(workoutId) {
    fetch(`/api/workouts/${workoutId}`)
        .then(response => response.json())
        .then(workout => {
            const modal = document.getElementById('workoutPreviewModal');
            if (!modal) {
                createWorkoutPreviewModal();
            }
            
            const dateParts = workout.date.split('-');
            const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            let exercisesHTML = '<div class="exercise-list">';
            
            // Display standalone exercises
            if (workout.exercises && workout.exercises.length > 0) {
                workout.exercises.forEach(exercise => {
                    exercisesHTML += createPreviewExerciseHTML(exercise);
                });
            }
            
            // Display exercise groups
            if (workout.exercise_groups && workout.exercise_groups.length > 0) {
                workout.exercise_groups.forEach(group => {
                    exercisesHTML += `<div class="exercise-group">`;
                    
                    let groupHeader = '';
                    if (group.group_name) groupHeader = escapeHtml(group.group_name);
                    if (group.rounds) groupHeader += (groupHeader ? ': ' : '') + escapeHtml(group.rounds);
                    if (group.rep_scheme) groupHeader += (groupHeader ? ' - ' : '') + escapeHtml(group.rep_scheme);
                    
                    if (groupHeader) {
                        exercisesHTML += `<div class="exercise-group-header">${groupHeader}</div>`;
                    }
                    
                    if (group.exercises && group.exercises.length > 0) {
                        group.exercises.forEach(exercise => {
                            exercisesHTML += createPreviewExerciseHTML(exercise);
                        });
                    }
                    
                    if (group.notes) {
                        exercisesHTML += `<div class="exercise-group-notes">${escapeHtml(group.notes)}</div>`;
                    }
                    
                    exercisesHTML += `</div>`;
                });
            }
            
            exercisesHTML += '</div>';
            
            document.getElementById('previewWorkoutTitle').textContent = workout.workout_name;
            document.getElementById('previewWorkoutDate').textContent = formattedDate;
            
            // Add creator info if available
            const creatorHTML = workout.creator_name 
                ? `<div class="workout-creator" style="margin-top: 8px;"><div class="profile-icon-small" data-initials="${workout.creator_initials || '?'}">${workout.creator_initials || '?'}</div><span>Created by ${escapeHtml(workout.creator_name)}</span></div>`
                : '';
            
            document.getElementById('previewWorkoutContent').innerHTML = creatorHTML + exercisesHTML;
            
            document.getElementById('workoutPreviewModal').style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Lock scroll
        })
        .catch(error => {
            console.error('Error loading workout preview:', error);
        });
}

function createPreviewExerciseHTML(exercise) {
    return `
        <div class="exercise-item">
            <div class="exercise-name">${escapeHtml(exercise.exercise_name || 'Exercise')}</div>
            <div class="exercise-details">
                ${exercise.sets ? `<div class="exercise-detail"><span class="exercise-detail-label">Sets</span><span class="exercise-detail-value">${escapeHtml(exercise.sets)}</span></div>` : ''}
                ${exercise.reps ? `<div class="exercise-detail"><span class="exercise-detail-label">Reps</span><span class="exercise-detail-value">${escapeHtml(exercise.reps)}</span></div>` : ''}
                ${exercise.weight ? `<div class="exercise-detail"><span class="exercise-detail-label">Weight</span><span class="exercise-detail-value">${escapeHtml(exercise.weight)}</span></div>` : ''}
                ${exercise.tempo ? `<div class="exercise-detail"><span class="exercise-detail-label">Tempo</span><span class="exercise-detail-value">${escapeHtml(exercise.tempo)}</span></div>` : ''}
                ${exercise.rest ? `<div class="exercise-detail"><span class="exercise-detail-label">Rest</span><span class="exercise-detail-value">${escapeHtml(exercise.rest)}</span></div>` : ''}
            </div>
            ${exercise.notes ? `<div class="exercise-notes">${escapeHtml(exercise.notes)}</div>` : ''}
        </div>
    `;
}

function createWorkoutPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'workoutPreviewModal';
    modal.className = 'workout-preview-modal';
    modal.innerHTML = `
        <div class="workout-preview-content">
            <div class="workout-preview-header">
                <div>
                    <h2 id="previewWorkoutTitle"></h2>
                    <div id="previewWorkoutDate" style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;"></div>
                </div>
                <button class="workout-preview-close" onclick="closeWorkoutPreview()" aria-label="Close">&times;</button>
            </div>
            <div class="workout-preview-body" id="previewWorkoutContent"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeWorkoutPreview();
        }
    });
}

function closeWorkoutPreview() {
    const modal = document.getElementById('workoutPreviewModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Unlock scroll
    }
}

function openWorkoutEditor(workoutId = null) {
    currentWorkoutId = workoutId;
    const editor = document.getElementById('workoutEditor');
    const title = document.getElementById('editorTitle');
    const form = document.getElementById('workoutForm');
    
    // Load users/coaches for creator selector
    loadUsersForCreator();
    
    if (workoutId) {
        title.textContent = 'Edit Workout';
        loadWorkoutForEdit(workoutId);
    } else {
        title.textContent = 'New Workout';
        form.reset();
        document.getElementById('workoutStructure').innerHTML = '';
        exerciseCounter = 0;
        groupCounter = 0;
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('workoutDate').value = today;
        // Creator will be set automatically by loadUsersForCreator()
        // Add default exercise group with an exercise
        addExerciseGroupEditor(null);
    }
    
    editor.style.display = 'block';
    editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function loadUsersForCreator() {
    fetch('/api/users')
        .then(response => response.json())
        .then(users => {
            const creatorSelect = document.getElementById('workoutCreatorSelect');
            if (!creatorSelect) return;
            
            // Get current user info from meta tags
            const currentUserIdMeta = document.querySelector('meta[name="current-user-id"]');
            const currentUserTypeMeta = document.querySelector('meta[name="current-user-type"]');
            const currentUserId = currentUserIdMeta ? parseInt(currentUserIdMeta.content) : null;
            const currentUserType = currentUserTypeMeta ? currentUserTypeMeta.content : null;
            
            // Sort users: coaches/admins first, then users
            users.sort((a, b) => {
                const roleOrder = { 'admin': 0, 'coach': 1, 'user': 2 };
                const aOrder = roleOrder[a.role] || 3;
                const bOrder = roleOrder[b.role] || 3;
                if (aOrder !== bOrder) return aOrder - bOrder;
                // Then sort by name
                const aName = (a.first_name && a.last_name) ? `${a.first_name} ${a.last_name}` : a.username;
                const bName = (b.first_name && b.last_name) ? `${b.first_name} ${b.last_name}` : b.username;
                return aName.localeCompare(bName);
            });
            
            creatorSelect.innerHTML = '';
            users.forEach(user => {
                const displayName = user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name} (${user.username})`
                    : user.username;
                const option = document.createElement('option');
                option.value = `${user.type}_${user.id}`;
                option.textContent = displayName;
                creatorSelect.appendChild(option);
            });
            
            // If creating a new workout, set to current logged in user
            if (!currentWorkoutId && currentUserId && currentUserType) {
                const currentUserOption = `${currentUserType}_${currentUserId}`;
                if (creatorSelect.querySelector(`option[value="${currentUserOption}"]`)) {
                    creatorSelect.value = currentUserOption;
                } else {
                    // Fallback to first coach/admin if current user not found
                    const firstCoach = users.find(u => u.role === 'admin' || u.role === 'coach');
                    if (firstCoach) {
                        creatorSelect.value = `${firstCoach.type}_${firstCoach.id}`;
                    }
                }
            } else if (!currentWorkoutId && !creatorSelect.value) {
                // Fallback: set to first coach/admin if no current user info
                const firstCoach = users.find(u => u.role === 'admin' || u.role === 'coach');
                if (firstCoach) {
                    creatorSelect.value = `${firstCoach.type}_${firstCoach.id}`;
                }
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
            const creatorSelect = document.getElementById('workoutCreatorSelect');
            if (creatorSelect) {
                creatorSelect.innerHTML = '<option value="">Error loading users</option>';
            }
        });
}

function closeWorkoutEditor() {
    document.getElementById('workoutEditor').style.display = 'none';
    currentWorkoutId = null;
    document.getElementById('editorError').style.display = 'none';
}

function loadWorkoutForEdit(workoutId) {
    fetch(`/api/workouts/${workoutId}`)
        .then(response => response.json())
        .then(workout => {
        document.getElementById('workoutDate').value = workout.date;
        document.getElementById('workoutNameInput').value = workout.workout_name;
        
        // Set creator - wait for users to load first
        setTimeout(() => {
            const creatorSelect = document.getElementById('workoutCreatorSelect');
            if (creatorSelect && workout.created_by) {
                // Try to find matching user/coach
                // Format is "type_id" (e.g., "coach_1" or "user_2")
                let found = false;
                for (let option of creatorSelect.options) {
                    if (option.value) {
                        const [type, id] = option.value.split('_');
                        if (parseInt(id) === workout.created_by) {
                            creatorSelect.value = option.value;
                            found = true;
                            break;
                        }
                    }
                }
                // If not found but we have created_by_type, use that
                if (!found && workout.created_by_type) {
                    creatorSelect.value = `${workout.created_by_type}_${workout.created_by}`;
                } else if (!found) {
                    // Try coach first, then user
                    creatorSelect.value = `coach_${workout.created_by}`;
                }
            }
        }, 200);
        
        // Update date display
        if (window.updateDateDisplay) {
            window.updateDateDisplay();
        }
            
            const workoutStructure = document.getElementById('workoutStructure');
            workoutStructure.innerHTML = '';
            exerciseCounter = 0;
            groupCounter = 0;
            
            if (workout.exercises && workout.exercises.length > 0) {
                workout.exercises.forEach(exercise => {
                    addExerciseEditor(exercise, null);
                });
            }
            
            if (workout.exercise_groups && workout.exercise_groups.length > 0) {
                workout.exercise_groups.forEach(group => {
                    addExerciseGroupEditor(group);
                });
            }
            
            if ((!workout.exercises || workout.exercises.length === 0) && 
                (!workout.exercise_groups || workout.exercise_groups.length === 0)) {
                // Add default exercise group with an exercise
                const defaultGroup = addExerciseGroupEditor(null);
                if (defaultGroup) {
                    const groupId = defaultGroup.id || groupCounter - 1;
                    addExerciseEditor(null, groupId);
                }
            }
        })
        .catch(error => {
            console.error('Error loading workout:', error);
            showError('Failed to load workout');
        });
}

function addExerciseEditor(exerciseData = null, groupId = null) {
    const container = groupId !== null ? document.getElementById(`group-exercises-${groupId}`) : document.getElementById('workoutStructure');
    if (!container) {
        console.error('Container not found for exercise editor');
        return;
    }
    
    const exerciseId = exerciseCounter++;
    
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-editor-item';
    exerciseDiv.id = `exercise-${exerciseId}`;
    exerciseDiv.draggable = true;
    exerciseDiv.dataset.exerciseId = exerciseId;
    if (groupId !== null) {
        exerciseDiv.dataset.groupId = groupId.toString();
    } else {
        exerciseDiv.dataset.groupId = 'null';
    }
    
    exerciseDiv.innerHTML = `
        <div class="exercise-editor-header">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="drag-handle" style="cursor: move; font-size: 18px; color: var(--text-secondary); user-select: none;">☰</span>
                <strong>Exercise ${exerciseId + 1}</strong>
            </div>
            <button type="button" class="btn btn-danger" style="padding: 4px 12px; font-size: 14px;" onclick="removeExercise(${exerciseId})">Remove</button>
        </div>
        <div class="exercise-editor-fields">
            <input type="text" placeholder="Exercise Name" name="exercise_name_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.exercise_name || '') : ''}" required draggable="false">
            <input type="text" placeholder="Sets" name="sets_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.sets || '') : ''}" draggable="false">
            <input type="text" placeholder="Reps" name="reps_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.reps || '') : ''}" draggable="false">
            <input type="text" placeholder="Weight" name="weight_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.weight || '') : ''}" draggable="false">
            <input type="text" placeholder="Tempo" name="tempo_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.tempo || '') : ''}" draggable="false">
            <input type="text" placeholder="Rest" name="rest_${exerciseId}" value="${exerciseData ? escapeHtml(exerciseData.rest || '') : ''}" draggable="false">
            <textarea placeholder="Notes" name="notes_${exerciseId}" draggable="false">${exerciseData ? escapeHtml(exerciseData.notes || '') : ''}</textarea>
            <div class="exercise-1rm-checkbox">
                <input type="checkbox" id="has_1rm_${exerciseId}" name="has_1rm_${exerciseId}" ${exerciseData && exerciseData.has_1rm_calculator ? 'checked' : ''} draggable="false">
                <label for="has_1rm_${exerciseId}">Enable 1RM Calculator</label>
            </div>
            <div class="exercise-1rm-checkbox">
                <input type="checkbox" id="has_weight_logging_${exerciseId}" name="has_weight_logging_${exerciseId}" ${exerciseData && exerciseData.has_weight_logging ? 'checked' : ''} draggable="false">
                <label for="has_weight_logging_${exerciseId}">Enable Weight Logging</label>
            </div>
        </div>
    `;
    
    // Add drag event listeners AFTER setting innerHTML
    exerciseDiv.addEventListener('dragstart', handleDragStart);
    exerciseDiv.addEventListener('dragover', handleDragOver);
    exerciseDiv.addEventListener('drop', handleDrop);
    exerciseDiv.addEventListener('dragend', handleDragEnd);
    
    // Stop drag events from bubbling to parent group
    exerciseDiv.addEventListener('dragstart', function(e) {
        e.stopPropagation();
    });
    exerciseDiv.addEventListener('dragover', function(e) {
        e.stopPropagation();
    });
    exerciseDiv.addEventListener('drop', function(e) {
        e.stopPropagation();
    });
    
    // Prevent inputs from interfering with drag
    exerciseDiv.querySelectorAll('input, textarea, button').forEach(el => {
        el.setAttribute('draggable', 'false');
        el.addEventListener('dragstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    });
    
    container.appendChild(exerciseDiv);
    updateExerciseNumbers();
}

function addExerciseGroupEditor(groupData = null) {
    const workoutStructure = document.getElementById('workoutStructure');
    // Use database group ID if available, otherwise use groupCounter
    const groupId = (groupData && groupData.id !== undefined) ? groupData.id : groupCounter++;
    
    // Update groupCounter if we used a database ID
    if (groupData && groupData.id !== undefined && groupData.id >= groupCounter) {
        groupCounter = groupData.id + 1;
    }
    
    // Count existing groups for display number
    const existingGroups = workoutStructure.querySelectorAll('.exercise-group-editor');
    const displayNumber = existingGroups.length + 1;
    
    const groupDiv = document.createElement('div');
    groupDiv.className = 'exercise-group-editor';
    groupDiv.id = `group-${groupId}`;
    groupDiv.draggable = false; // Don't make entire group draggable
    groupDiv.dataset.groupId = groupId;
    
    groupDiv.innerHTML = `
        <div class="group-editor-header" style="cursor: move;" draggable="true">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="drag-handle" style="cursor: move; font-size: 18px; color: var(--text-secondary);">☰</span>
                <strong>Exercise Group ${displayNumber}</strong>
            </div>
            <button type="button" class="btn btn-danger" style="padding: 4px 12px; font-size: 14px;" onclick="removeGroup(${groupId})">Remove Group</button>
        </div>
        <div class="group-editor-header-fields">
            <input type="text" placeholder="Group Name (e.g., Superset, WOD)" name="group_name_${groupId}" value="${groupData ? escapeHtml(groupData.group_name || '') : ''}">
            <input type="text" placeholder="Rounds (e.g., 3 rounds, 2-3 rounds)" name="group_rounds_${groupId}" value="${groupData ? escapeHtml(groupData.rounds || '') : ''}">
            <input type="text" placeholder="Rep Scheme (e.g., 5-10-15-20-15-10-5)" name="group_rep_scheme_${groupId}" value="${groupData ? escapeHtml(groupData.rep_scheme || '') : ''}">
        </div>
        <textarea placeholder="Group Notes" name="group_notes_${groupId}" style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid var(--border-color); border-radius: 4px; min-height: 60px;">${groupData ? escapeHtml(groupData.notes || '') : ''}</textarea>
        <div class="group-exercises-container">
            <div id="group-exercises-${groupId}" class="exercise-editor-list"></div>
            <button type="button" class="btn btn-secondary" style="margin-top: 8px;" onclick="addExerciseToGroup(${groupId})">+ Add Exercise to Group</button>
        </div>
    `;
    
    workoutStructure.appendChild(groupDiv);
    updateExerciseNumbers();
    
    // Make only the group header draggable, not the entire group
    const groupHeader = groupDiv.querySelector('.group-editor-header');
    if (groupHeader) {
        groupHeader.addEventListener('dragstart', function(e) {
            // Set the group as the dragged element
            draggedElement = groupDiv;
            draggedElementType = 'group';
            groupDiv.style.opacity = '0.5';
            groupDiv.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', groupDiv.innerHTML);
            e.stopPropagation();
            
            // Create drop indicator if needed
            if (!dropIndicator) {
                dropIndicator = document.createElement('div');
                dropIndicator.className = 'drop-indicator';
                dropIndicator.style.height = '4px';
                dropIndicator.style.backgroundColor = 'var(--selected-day)';
                dropIndicator.style.borderRadius = '2px';
                dropIndicator.style.margin = '8px 0';
                dropIndicator.style.opacity = '0';
                dropIndicator.style.transition = 'opacity 0.2s ease';
            }
        });
        
        groupHeader.addEventListener('dragover', function(e) {
            if (draggedElementType === 'group') {
                e.preventDefault();
                e.stopPropagation();
                handleDragOver.call(groupDiv, e);
            }
        });
        
        groupHeader.addEventListener('drop', function(e) {
            if (draggedElementType === 'group') {
                e.preventDefault();
                e.stopPropagation();
                handleDrop.call(groupDiv, e);
            }
        });
        
        groupHeader.addEventListener('dragend', function(e) {
            groupDiv.style.opacity = '1';
            groupDiv.classList.remove('dragging');
            
            if (dropIndicator) {
                dropIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (dropIndicator && dropIndicator.parentNode) {
                        dropIndicator.parentNode.removeChild(dropIndicator);
                    }
                }, 200);
            }
            
            updateExerciseNumbers();
            draggedElement = null;
            draggedElementType = null;
        });
    }
    
    // Remove the old group drag handlers since we're handling it on the header
    // (The group div itself is no longer draggable)
    
    // Add dragover handler to the group exercises container for empty space drops
    const groupExercisesContainer = document.getElementById(`group-exercises-${groupId}`);
    if (groupExercisesContainer && !groupExercisesContainer.dataset.dragHandlersAttached) {
        groupExercisesContainer.addEventListener('dragover', function(e) {
            if (draggedElementType === 'exercise') {
                const draggedGroupId = draggedElement ? (draggedElement.dataset.groupId || 'null') : 'null';
                const draggedGroupIdStr = String(draggedGroupId);
                const groupIdStr = String(groupId);
                
                if (draggedGroupIdStr === groupIdStr) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    
                    // If dragging over empty space in container, show indicator at end
                    if (e.target === groupExercisesContainer || (!e.target.closest('.exercise-editor-item') && e.target.closest('.exercise-editor-list'))) {
                        const existingIndicator = groupExercisesContainer.querySelector('.drop-indicator');
                        if (existingIndicator && existingIndicator !== dropIndicator) {
                            existingIndicator.remove();
                        }
                        if (!groupExercisesContainer.contains(dropIndicator)) {
                            groupExercisesContainer.appendChild(dropIndicator);
                        }
                        dropIndicator.style.opacity = '1';
                    }
                }
            }
        });
        
        groupExercisesContainer.addEventListener('drop', function(e) {
            if (draggedElementType === 'exercise') {
                const draggedGroupId = draggedElement ? (draggedElement.dataset.groupId || 'null') : 'null';
                const draggedGroupIdStr = String(draggedGroupId);
                const groupIdStr = String(groupId);
                
                if (draggedGroupIdStr === groupIdStr) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // If dropping on empty container space, append to end
                    if (e.target === groupExercisesContainer || (!e.target.closest('.exercise-editor-item') && e.target.closest('.exercise-editor-list'))) {
                        groupExercisesContainer.appendChild(draggedElement);
                        updateExerciseNumbers();
                    }
                    
                    if (dropIndicator) {
                        dropIndicator.style.opacity = '0';
                        setTimeout(() => {
                            if (dropIndicator && dropIndicator.parentNode) {
                                dropIndicator.parentNode.removeChild(dropIndicator);
                            }
                        }, 200);
                    }
                }
            }
        });
        
        groupExercisesContainer.dataset.dragHandlersAttached = 'true';
    }
    
    if (groupData && groupData.exercises && groupData.exercises.length > 0) {
        groupData.exercises.forEach(exercise => {
            addExerciseEditor(exercise, groupId);
        });
    } else {
        addExerciseEditor(null, groupId);
    }
    
    return groupDiv;
}

function addExerciseToGroup(groupId) {
    addExerciseEditor(null, groupId);
}

function removeExercise(exerciseId) {
    const exerciseDiv = document.getElementById(`exercise-${exerciseId}`);
    if (exerciseDiv) {
        exerciseDiv.remove();
        updateExerciseNumbers();
    }
}

function removeGroup(groupId) {
    const groupDiv = document.getElementById(`group-${groupId}`);
    if (groupDiv) {
        groupDiv.remove();
        updateExerciseNumbers();
    }
}

function saveWorkout() {
    const form = document.getElementById('workoutForm');
    const errorDiv = document.getElementById('editorError');
    errorDiv.style.display = 'none';
    
    // First collect all exercise groups with their exercises
    const exerciseGroups = [];
    const groupItems = document.querySelectorAll('.exercise-group-editor');
    
    groupItems.forEach(groupDiv => {
        const groupId = groupDiv.id.replace('group-', '');
        const groupExercises = [];
        
        // Only look for exercises within this specific group's container
        const groupExercisesContainer = groupDiv.querySelector(`#group-exercises-${groupId}`);
        if (groupExercisesContainer) {
            const groupExerciseItems = groupExercisesContainer.querySelectorAll('.exercise-editor-item');
            groupExerciseItems.forEach(item => {
                const id = item.id.replace('exercise-', '');
                const nameField = item.querySelector(`[name="exercise_name_${id}"]`);
                if (nameField && nameField.value.trim()) {
                    groupExercises.push({
                        exercise_name: item.querySelector(`[name="exercise_name_${id}"]`).value,
                        sets: item.querySelector(`[name="sets_${id}"]`).value,
                        reps: item.querySelector(`[name="reps_${id}"]`).value,
                        weight: item.querySelector(`[name="weight_${id}"]`).value,
                        tempo: item.querySelector(`[name="tempo_${id}"]`).value,
                        rest: item.querySelector(`[name="rest_${id}"]`).value,
                        notes: item.querySelector(`[name="notes_${id}"]`).value,
                        has_1rm_calculator: item.querySelector(`[name="has_1rm_${id}"]`).checked,
                        has_weight_logging: item.querySelector(`[name="has_weight_logging_${id}"]`).checked
                    });
                }
            });
        }
        
        exerciseGroups.push({
            group_name: groupDiv.querySelector(`[name="group_name_${groupId}"]`).value,
            rounds: groupDiv.querySelector(`[name="group_rounds_${groupId}"]`).value,
            rep_scheme: groupDiv.querySelector(`[name="group_rep_scheme_${groupId}"]`).value,
            notes: groupDiv.querySelector(`[name="group_notes_${groupId}"]`).value,
            exercises: groupExercises
        });
    });
    
    // Now collect standalone exercises (not in any group)
    const exercises = [];
    const workoutStructure = document.getElementById('workoutStructure');
    const standaloneExerciseItems = workoutStructure.querySelectorAll('.exercise-editor-item');
    
    standaloneExerciseItems.forEach(item => {
        // Only include if it's not inside any group container
        const isInGroup = item.closest('.exercise-group-editor') !== null;
        if (!isInGroup) {
            const id = item.id.replace('exercise-', '');
            const nameField = item.querySelector(`[name="exercise_name_${id}"]`);
            if (nameField && nameField.value.trim()) {
                exercises.push({
                    exercise_name: nameField.value,
                    sets: item.querySelector(`[name="sets_${id}"]`).value,
                    reps: item.querySelector(`[name="reps_${id}"]`).value,
                    weight: item.querySelector(`[name="weight_${id}"]`).value,
                    tempo: item.querySelector(`[name="tempo_${id}"]`).value,
                    rest: item.querySelector(`[name="rest_${id}"]`).value,
                    notes: item.querySelector(`[name="notes_${id}"]`).value,
                    has_1rm_calculator: item.querySelector(`[name="has_1rm_${id}"]`).checked,
                    has_weight_logging: item.querySelector(`[name="has_weight_logging_${id}"]`).checked
            });
            }
        }
    });
    
    const workoutData = {
        date: document.getElementById('workoutDate').value,
        workout_name: document.getElementById('workoutNameInput').value,
        exercises: exercises,
        exercise_groups: exerciseGroups
    };
    
    // Add creator if specified
    const creatorSelect = document.getElementById('workoutCreatorSelect');
    if (creatorSelect && creatorSelect.value) {
        const [type, id] = creatorSelect.value.split('_');
        workoutData.created_by = parseInt(id);
        workoutData.created_by_type = type;
    }
    
    const url = currentWorkoutId ? `/api/workouts/${currentWorkoutId}` : '/api/workouts';
    const method = currentWorkoutId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData)
    })
    .then(async response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 500));
            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
        }
    })
    .then(data => {
        if (data.error) {
            console.error('Server error:', data.error);
            showError(data.error);
        } else {
            closeWorkoutEditor();
            loadWorkouts();
        }
    })
    .catch(error => {
        console.error('Error saving workout:', error);
        console.error('Full error:', error.stack || error);
        showError('Failed to save workout: ' + error.message);
    });
}

function editWorkout(workoutId) {
    openWorkoutEditor(workoutId);
}

function deleteWorkout(workoutId) {
    if (!confirm('Are you sure you want to delete this workout?')) {
        return;
    }
    
    fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadWorkouts();
        } else {
            alert('Failed to delete workout');
        }
    })
    .catch(error => {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout');
    });
}

function showError(message) {
    const errorDiv = document.getElementById('editorError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Drag and Drop functionality
let draggedElement = null;
let draggedElementType = null; // 'exercise' or 'group'
let dropIndicator = null;

function handleDragStart(e) {
    draggedElement = this;
    draggedElementType = this.classList.contains('exercise-group-editor') ? 'group' : 'exercise';
    this.style.opacity = '0.5';
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    
    // Stop propagation to prevent group from being dragged when dragging an exercise
    if (draggedElementType === 'exercise') {
        e.stopPropagation();
    }
    
    // Create drop indicator
    if (!dropIndicator) {
        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-indicator';
        dropIndicator.style.height = '4px';
        dropIndicator.style.backgroundColor = 'var(--selected-day)';
        dropIndicator.style.borderRadius = '2px';
        dropIndicator.style.margin = '8px 0';
        dropIndicator.style.opacity = '0';
        dropIndicator.style.transition = 'opacity 0.2s ease';
    }
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    // Stop propagation for exercises to prevent group drag handlers from interfering
    if (draggedElementType === 'exercise' && e.currentTarget.classList.contains('exercise-editor-item')) {
        e.stopPropagation();
    }
    
    const target = e.currentTarget;
    const workoutStructure = document.getElementById('workoutStructure');
    
    // Only allow dropping on same type (exercise on exercise, group on group)
    if (draggedElementType === 'group' && target.classList.contains('exercise-group-editor')) {
        if (target !== draggedElement) {
            const rect = target.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const insertBefore = e.clientY < midpoint;
            
            // Remove existing indicator
            const existingIndicator = workoutStructure.querySelector('.drop-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            // Insert indicator
            if (insertBefore) {
                workoutStructure.insertBefore(dropIndicator, target);
            } else {
                if (target.nextSibling) {
                    workoutStructure.insertBefore(dropIndicator, target.nextSibling);
                } else {
                    workoutStructure.appendChild(dropIndicator);
                }
            }
            dropIndicator.style.opacity = '1';
        }
    } else if (draggedElementType === 'exercise') {
        const draggedGroupId = draggedElement ? (draggedElement.dataset.groupId || 'null') : 'null';
        const targetGroupId = target.dataset ? (target.dataset.groupId || 'null') : 'null';
        
        // Can only reorder exercises within the same container (same group or both standalone)
        // Convert both to strings for comparison
        const draggedGroupIdStr = String(draggedGroupId);
        const targetGroupIdStr = String(targetGroupId);
        
        if (draggedGroupIdStr === targetGroupIdStr && target.classList.contains('exercise-editor-item')) {
            const container = draggedGroupIdStr !== 'null' 
                ? document.getElementById(`group-exercises-${draggedGroupIdStr}`) 
                : workoutStructure;
            
            if (target !== draggedElement && container) {
                const rect = target.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const insertBefore = e.clientY < midpoint;
                
                // Remove existing indicator
                const existingIndicator = container.querySelector('.drop-indicator');
                if (existingIndicator && existingIndicator !== dropIndicator) {
                    existingIndicator.remove();
                }
                
                // Insert indicator
                if (insertBefore) {
                    container.insertBefore(dropIndicator, target);
                } else {
                    // Skip drop indicator if it's the next sibling
                    let nextSibling = target.nextSibling;
                    while (nextSibling && nextSibling.classList && nextSibling.classList.contains('drop-indicator')) {
                        nextSibling = nextSibling.nextSibling;
                    }
                    if (nextSibling) {
                        container.insertBefore(dropIndicator, nextSibling);
                    } else {
                        container.appendChild(dropIndicator);
                    }
                }
                dropIndicator.style.opacity = '1';
            }
        }
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Stop propagation for exercises to prevent group drop handlers from interfering
    if (draggedElementType === 'exercise' && e.currentTarget.classList.contains('exercise-editor-item')) {
        e.stopPropagation();
    }
    
    const target = e.currentTarget;
    const workoutStructure = document.getElementById('workoutStructure');
    
    // Remove drop indicator
    if (dropIndicator) {
        dropIndicator.style.opacity = '0';
        setTimeout(() => {
            if (dropIndicator && dropIndicator.parentNode) {
                dropIndicator.parentNode.removeChild(dropIndicator);
            }
        }, 200);
    }
    
    // Perform the actual move
    if (draggedElementType === 'group' && target.classList.contains('exercise-group-editor')) {
        if (target !== draggedElement) {
            const rect = target.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            if (e.clientY < midpoint) {
                workoutStructure.insertBefore(draggedElement, target);
            } else {
                workoutStructure.insertBefore(draggedElement, target.nextSibling);
            }
        }
    } else if (draggedElementType === 'exercise') {
        const draggedGroupId = draggedElement ? (draggedElement.dataset.groupId || 'null') : 'null';
        const targetGroupId = target.dataset ? (target.dataset.groupId || 'null') : 'null';
        
        // Convert both to strings for comparison
        const draggedGroupIdStr = String(draggedGroupId);
        const targetGroupIdStr = String(targetGroupId);
        
        if (draggedGroupIdStr === targetGroupIdStr && target.classList.contains('exercise-editor-item')) {
            const container = draggedGroupIdStr !== 'null' 
                ? document.getElementById(`group-exercises-${draggedGroupIdStr}`) 
                : workoutStructure;
            
            if (target !== draggedElement && container) {
                const rect = target.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                if (e.clientY < midpoint) {
                    container.insertBefore(draggedElement, target);
                } else {
                    // Skip drop indicator if it's the next sibling
                    let nextSibling = target.nextSibling;
                    while (nextSibling && nextSibling.classList && nextSibling.classList.contains('drop-indicator')) {
                        nextSibling = nextSibling.nextSibling;
                    }
                    if (nextSibling) {
                        container.insertBefore(draggedElement, nextSibling);
                    } else {
                        container.appendChild(draggedElement);
                    }
                }
                updateExerciseNumbers();
            }
        }
    }
    
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    this.classList.remove('dragging');
    
    // Remove drop indicator
    if (dropIndicator) {
        dropIndicator.style.opacity = '0';
        setTimeout(() => {
            if (dropIndicator && dropIndicator.parentNode) {
                dropIndicator.parentNode.removeChild(dropIndicator);
            }
        }, 200);
    }
    
    // Update exercise numbers
    updateExerciseNumbers();
    
    draggedElement = null;
    draggedElementType = null;
}

function updateExerciseNumbers() {
    const workoutStructure = document.getElementById('workoutStructure');
    let exerciseNum = 1;
    let groupNum = 1;
    
    workoutStructure.childNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
            if (node.classList.contains('exercise-group-editor')) {
                const header = node.querySelector('.group-editor-header strong');
                if (header) {
                    header.textContent = `Exercise Group ${groupNum}`;
                }
                groupNum++;
                
                // Update exercises within group
                const groupExercises = node.querySelectorAll('.exercise-editor-item');
                groupExercises.forEach((ex, idx) => {
                    const exHeader = ex.querySelector('.exercise-editor-header strong');
                    if (exHeader) {
                        exHeader.textContent = `Exercise ${idx + 1}`;
                    }
                });
            } else if (node.classList.contains('exercise-editor-item')) {
                const header = node.querySelector('.exercise-editor-header strong');
                if (header) {
                    header.textContent = `Exercise ${exerciseNum}`;
                }
                exerciseNum++;
            }
        }
    });
}

// Initialize drag and drop on workout structure
function initializeDragAndDrop() {
    const workoutStructure = document.getElementById('workoutStructure');
    if (workoutStructure) {
        workoutStructure.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
    }
}

function openGenerateWeekModal() {
    const modal = document.getElementById('generateWeekModal');
    const referenceStartDate = document.getElementById('referenceStartDate');
    const referenceEndDate = document.getElementById('referenceEndDate');
    
    if (modal) {
        modal.style.display = 'block';
        
        // Set default reference dates (Dec 1-5, 2025)
        if (referenceStartDate) {
            referenceStartDate.value = '2025-12-01';
        }
        if (referenceEndDate) {
            referenceEndDate.value = '2025-12-05';
        }
        
        // Clear any previous errors/success messages
        const errorDiv = document.getElementById('generateWeekError');
        const successDiv = document.getElementById('generateWeekSuccess');
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
        if (successDiv) {
            successDiv.style.display = 'none';
            successDiv.textContent = '';
        }
    }
}

function closeGenerateWeekModal() {
    const modal = document.getElementById('generateWeekModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function generateWeekFromTemplate() {
    const referenceStartDate = document.getElementById('referenceStartDate');
    const referenceEndDate = document.getElementById('referenceEndDate');
    const targetStartDate = document.getElementById('targetStartDate');
    const targetEndDate = document.getElementById('targetEndDate');
    const errorDiv = document.getElementById('generateWeekError');
    const successDiv = document.getElementById('generateWeekSuccess');
    const submitBtn = document.getElementById('generateWeekSubmitBtn');
    
    // Validate inputs
    if (!referenceStartDate || !referenceStartDate.value ||
        !referenceEndDate || !referenceEndDate.value ||
        !targetStartDate || !targetStartDate.value ||
        !targetEndDate || !targetEndDate.value) {
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Please fill in all date fields';
        }
        return;
    }
    
    // Disable submit button during request
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating...';
    }
    
    // Clear previous messages
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    if (successDiv) {
        successDiv.style.display = 'none';
        successDiv.textContent = '';
    }
    
    // Prepare request data
    const requestData = {
        reference_start_date: referenceStartDate.value,
        reference_end_date: referenceEndDate.value,
        target_start_date: targetStartDate.value,
        target_end_date: targetEndDate.value
    };
    
    // Make API call
    fetch('/api/workouts/generate-from-week', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = data.error;
            }
        } else if (data.success) {
            if (successDiv) {
                successDiv.style.display = 'block';
                successDiv.textContent = `Successfully generated ${data.created_workouts} workout(s)!`;
            }
            
            // Reload workouts after a short delay
            setTimeout(() => {
                loadWorkouts();
                closeGenerateWeekModal();
            }, 1500);
        }
    })
    .catch(error => {
        console.error('Error generating workouts:', error);
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Failed to generate workouts. Please try again.';
        }
    })
    .finally(() => {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Generate Workouts';
        }
    });
}
