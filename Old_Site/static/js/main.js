// Calendar and Workout Display Logic
let selectedDate = new Date();
selectedDate.setHours(0, 0, 0, 0); // Set to midnight to avoid timezone issues
let workouts = {}; // Store workouts by date: { '2024-01-01': [workout1, workout2, ...] }
let selectedWorkoutIds = {}; // Track selected workout ID per date: { '2024-01-01': workoutId }
let swiper; // Swiper instance for calendar
let isUpdatingCalendar = false; // Flag to prevent recursion
let isInitializingCalendar = false; // Flag to prevent multiple initializations
let currentViewingDate = new Date(); // Track which week we're currently viewing
currentViewingDate.setHours(0, 0, 0, 0);

function initCalendar() {
    const swiperEl = document.querySelector('.calendar-swiper');
    if (!swiperEl || isInitializingCalendar || swiper) return;
    
    isInitializingCalendar = true;
    isUpdatingCalendar = true; // Set this to prevent slideChange from triggering updates during init

    swiper = new Swiper('.calendar-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        centeredSlides: true,
        initialSlide: 1,
        on: {
            slideChange: function() {
                if (!isUpdatingCalendar && !isInitializingCalendar) {
                    handleSlideChange();
                }
            }
        }
    });

    isInitializingCalendar = false;
    isUpdatingCalendar = false;

    // Initial display - wait a tick to ensure swiper is fully initialized
    setTimeout(() => {
        updateCalendarDisplay(true);
    }, 0);
}

function getWeekDates(date) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getWeekRange(date) {
    const weekDates = getWeekDates(date);
    return {
        start: formatDate(weekDates[0]),
        end: formatDate(weekDates[6])
    };
}

function handleSlideChange() {
    if (!swiper || isUpdatingCalendar) return;
    
    const currentSlide = swiper.activeIndex;
    
    // Determine direction: -1 for previous week, 0 for current, +1 for next week
    // Since we always have 3 slides (previous, current, next), slide 1 is always the center
    const slideOffset = currentSlide - 1;
    
    // Update the viewing date based on slide direction
    if (slideOffset === -1) {
        // Swiped to previous week
        currentViewingDate.setDate(currentViewingDate.getDate() - 7);
    } else if (slideOffset === 1) {
        // Swiped to next week
        currentViewingDate.setDate(currentViewingDate.getDate() + 7);
    }
    // If slideOffset === 0, we're still on the same week (shouldn't happen, but handle it)
    
    // Update calendar display with the new viewing date
    updateCalendarDisplay(false);
}

function updateCalendarDisplay(forceUpdate = false) {
    const wrapper = document.getElementById('calendarWrapper');
    if (!wrapper) return;
    
    // If swiper isn't initialized yet, initialize it (but only once)
    if (!swiper && !isInitializingCalendar) {
        const swiperEl = document.querySelector('.calendar-swiper');
        if (swiperEl) {
            initCalendar();
            return;
        }
        return;
    }
    
    // Wait for initialization to complete
    if (isInitializingCalendar || !swiper) {
        return;
    }
    
    // Prevent recursion - if we're already updating and this wasn't forced, skip
    if (isUpdatingCalendar && !forceUpdate) {
        return;
    }
    
    isUpdatingCalendar = true;

    // Use the tracked viewing date instead of calculating from slide index
    const baseDate = new Date(currentViewingDate);
    
    const weekDates = getWeekDates(baseDate);
    
    // Clear and create weeks (previous, current, next)
    wrapper.innerHTML = '';
    
    for (let weekOffset = -1; weekOffset <= 1; weekOffset++) {
        const weekDate = new Date(baseDate);
        weekDate.setDate(baseDate.getDate() + weekOffset * 7);
        const week = getWeekDates(weekDate);
        
        const weekDiv = document.createElement('div');
        weekDiv.className = 'swiper-slide';
        weekDiv.innerHTML = createWeekHTML(week);
        wrapper.appendChild(weekDiv);
    }
    
    // Update Swiper to recognize new slides and reset to center slide
    if (swiper) {
        swiper.update();
        // Always reset to slide 1 (center) after updating slides
        swiper.slideTo(1, 0); // 0 = no animation
    }
    
    isUpdatingCalendar = false;

    // Update selected date if it's in the current visible week
    const visibleWeek = getWeekDates(baseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isSelectedInVisibleWeek = visibleWeek.some(d => 
        d.toDateString() === selectedDate.toDateString()
    );
    
    // If selected date is not in visible week, default to today (if in visible week) or first day of visible week
    if (!isSelectedInVisibleWeek) {
        const todayInVisibleWeek = visibleWeek.find(d => d.toDateString() === today.toDateString());
        selectedDate = todayInVisibleWeek || visibleWeek[0];
    }

    // Update visual selection
    const dateStr = formatDate(selectedDate);
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
        if (day.dataset.date === dateStr) {
            day.classList.add('selected');
        }
    });

    // Update workout name display
    updateWorkoutNameDisplay(dateStr);
    
    // Display workout for selected date
    displayWorkout(dateStr);

    // Fetch workouts for the visible week range (3 weeks total for smooth swiping)
    const startRange = getWeekRange(new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    const endRange = getWeekRange(new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    fetchWorkouts(startRange.start, endRange.end);
}

function createWeekHTML(dates) {
    let html = '<div class="calendar-week">';
    
    dates.forEach((date) => {
        const dayNum = date.getDate();
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const dateStr = formatDate(date);
        const hasWorkout = workouts[dateStr] ? true : false;
        const classes = ['calendar-day'];
        if (isSelected) classes.push('selected');
        if (hasWorkout) classes.push('has-workout');
        
        html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${dayNum}</div>`;
    });
    
    html += '</div>';
    return html;
}

function selectDay(date) {
    selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0); // Set to midnight to avoid timezone issues
    const dateStr = formatDate(selectedDate);
    
    // Update calendar UI
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
        if (day.dataset.date === dateStr) {
            day.classList.add('selected');
        }
    });

    // Load workouts for this date and populate selector
    loadWorkoutsForDate(dateStr);
}

function updateWorkoutNameDisplay(dateStr) {
    const workoutNameDisplay = document.getElementById('workoutName');
    const workoutList = workouts[dateStr] || [];
    const selectedWorkoutId = selectedWorkoutIds[dateStr];
    
    if (workoutList.length === 0) {
        if (workoutNameDisplay) workoutNameDisplay.textContent = '';
        return;
    }
    
    // Find selected workout or use first one
    let workout = workoutList.find(w => w.id === selectedWorkoutId);
    if (!workout && workoutList.length > 0) {
        workout = workoutList[0];
    }
    
    if (workoutNameDisplay && workout) {
        workoutNameDisplay.textContent = workout.workout_name;
    }
}

function fetchWorkouts(startDate, endDate) {
    fetch(`/api/workouts?start_date=${startDate}&end_date=${endDate}`)
        .then(response => response.json())
        .then(data => {
            // Store workouts by date as arrays
            data.forEach(workout => {
                if (!workouts[workout.date]) {
                    workouts[workout.date] = [];
                }
                // Check if workout already exists (avoid duplicates)
                if (!workouts[workout.date].find(w => w.id === workout.id)) {
                    workouts[workout.date].push(workout);
                }
            });
            
            // Update calendar indicators
            updateCalendarIndicators();
            
            // Load workouts for selected date and populate selector
            loadWorkoutsForDate(formatDate(selectedDate));
        })
        .catch(error => {
            console.error('Error fetching workouts:', error);
        });
}

function loadWorkoutsForDate(dateStr) {
    // Fetch all workouts for this specific date
    fetch(`/api/workouts/date/${dateStr}`)
        .then(response => response.json())
        .then(data => {
            // Store workouts for this date
            workouts[dateStr] = data || [];
            
            // Select default workout (coach first, then user, then most recent)
            selectDefaultWorkout(dateStr);
            
            // Populate workout selector dropdown
            populateWorkoutSelector(dateStr);
            
            // Update workout name display
            updateWorkoutNameDisplay(dateStr);
            
            // Display selected workout
            displayWorkout(dateStr);
        })
        .catch(error => {
            console.error('Error loading workouts for date:', error);
            workouts[dateStr] = [];
            populateWorkoutSelector(dateStr);
            displayWorkout(dateStr);
        });
}

function selectDefaultWorkout(dateStr) {
    const workoutList = workouts[dateStr] || [];
    
    if (workoutList.length === 0) {
        delete selectedWorkoutIds[dateStr];
        return;
    }
    
    // Priority: coach workout first, then user workout, then most recent
    let selectedWorkout = null;
    
    // Try to find coach workout
    const coachWorkout = workoutList.find(w => !w.is_user_workout);
    if (coachWorkout) {
        selectedWorkout = coachWorkout;
    } else {
        // No coach workout, try user workout
        const userWorkout = workoutList.find(w => w.is_user_workout);
        if (userWorkout) {
            selectedWorkout = userWorkout;
        } else {
            // Fallback to most recent (first in list, already sorted by created_at)
            selectedWorkout = workoutList[0];
        }
    }
    
    if (selectedWorkout) {
        selectedWorkoutIds[dateStr] = selectedWorkout.id;
    }
}

function populateWorkoutSelector(dateStr) {
    const workoutSelector = document.querySelector('.workout-selector');
    if (!workoutSelector) return;
    
    const workoutList = workouts[dateStr] || [];
    const selectedWorkoutId = selectedWorkoutIds[dateStr];
    
    // Remove existing dropdown if it exists
    const existingDropdown = workoutSelector.querySelector('.workout-selector-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // If no workouts or only one workout, don't show dropdown
    if (workoutList.length <= 1) {
        return;
    }
    
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'workout-selector-dropdown';
    
    workoutList.forEach(workout => {
        const option = document.createElement('div');
        option.className = `workout-selector-option ${workout.is_user_workout ? 'user-workout' : 'coach-workout'} ${workout.id === selectedWorkoutId ? 'selected' : ''}`;
        option.dataset.workoutId = workout.id;
        option.onclick = () => selectWorkout(workout.id, dateStr);
        
        option.innerHTML = `
            <div class="workout-selector-option-content">
                <span class="workout-selector-option-name">${escapeHtml(workout.workout_name)}</span>
                <div class="workout-selector-creator">
                    <div class="profile-icon-small" data-initials="${workout.creator_initials || '?'}">${workout.creator_initials || '?'}</div>
                    <span>${escapeHtml(workout.creator_name || 'Unknown')}</span>
                </div>
            </div>
        `;
        
        dropdown.appendChild(option);
    });
    
    workoutSelector.appendChild(dropdown);
}

function selectWorkout(workoutId, dateStr) {
    if (!dateStr) {
        dateStr = formatDate(selectedDate);
    }
    
    selectedWorkoutIds[dateStr] = workoutId;
    
    // Update dropdown selection
    const dropdown = document.querySelector('.workout-selector-dropdown');
    if (dropdown) {
        dropdown.querySelectorAll('.workout-selector-option').forEach(option => {
            if (parseInt(option.dataset.workoutId) === workoutId) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    // Update display
    updateWorkoutNameDisplay(dateStr);
    displayWorkout(dateStr);
    
    // Close dropdown
    closeWorkoutSelector();
}

function toggleWorkoutSelector() {
    const dropdown = document.querySelector('.workout-selector-dropdown');
    const arrow = document.getElementById('workoutSelectorArrow');
    
    if (!dropdown) {
        // If dropdown doesn't exist, try to populate it first
        const dateStr = formatDate(selectedDate);
        loadWorkoutsForDate(dateStr);
        // Try again after a short delay
        setTimeout(() => {
            const newDropdown = document.querySelector('.workout-selector-dropdown');
            if (newDropdown) {
                newDropdown.classList.add('show');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        }, 100);
        return;
    }
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        dropdown.classList.add('show');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }
}

function closeWorkoutSelector() {
    const dropdown = document.querySelector('.workout-selector-dropdown');
    const arrow = document.getElementById('workoutSelectorArrow');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    if (arrow) arrow.style.transform = 'rotate(0deg)';
}

function updateCalendarIndicators() {
    document.querySelectorAll('.calendar-day').forEach(day => {
        const dateStr = day.dataset.date;
        const workoutList = workouts[dateStr];
        if (workoutList && workoutList.length > 0) {
            day.classList.add('has-workout');
        } else {
            day.classList.remove('has-workout');
        }
    });
}

function displayWorkout(dateStr) {
    const workoutDisplay = document.getElementById('workoutDisplay');
    if (!workoutDisplay) return;
    
    const workoutList = workouts[dateStr] || [];
    const selectedWorkoutId = selectedWorkoutIds[dateStr];
    
    // Find selected workout or use first one
    let workout = workoutList.find(w => w.id === selectedWorkoutId);
    if (!workout && workoutList.length > 0) {
        workout = workoutList[0];
    }
    
    if (!workout || (!workout.exercises || workout.exercises.length === 0) && (!workout.exercise_groups || workout.exercise_groups.length === 0)) {
        workoutDisplay.innerHTML = `
            <div class="empty-state">
                <div class="emoji">🤘</div>
                <div class="empty-message">
                    <strong>No training planned (yet)</strong>
                    <p>Have fun, enjoy your day!</p>
                </div>
            </div>
        `;
        // Hide export button
        const exportBtnContainer = document.getElementById('exportButtonContainer');
        if (exportBtnContainer) {
            exportBtnContainer.style.display = 'none';
        }
        return;
    }

    // Parse date correctly to avoid timezone issues
    const dateParts = dateStr.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    let exercisesHTML = '<div class="exercise-list">';
    
    // Display standalone exercises first
    if (workout.exercises && workout.exercises.length > 0) {
        workout.exercises.forEach(exercise => {
            exercisesHTML += createExerciseHTML(exercise, workout.id, workout.date);
        });
    }
    
    // Display exercise groups
    if (workout.exercise_groups && workout.exercise_groups.length > 0) {
        workout.exercise_groups.forEach((group, groupIndex) => {
            const groupId = `group-${groupIndex}`;
            exercisesHTML += `<div class="exercise-group" id="${groupId}">`;
            
            // Group header
            let groupHeader = '';
            if (group.group_name) {
                groupHeader = escapeHtml(group.group_name);
            }
            if (group.rounds) {
                groupHeader += (groupHeader ? ': ' : '') + escapeHtml(group.rounds);
            }
            if (group.rep_scheme) {
                groupHeader += (groupHeader ? ' - ' : '') + escapeHtml(group.rep_scheme);
            }
            
            if (groupHeader) {
                exercisesHTML += `<div class="exercise-group-header" onclick="toggleExerciseGroup('${groupId}')">
                    <span>${groupHeader}</span>
                    <button class="group-toggle-btn" aria-label="Toggle group">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>`;
            }
            
            // Group content (notes + exercises) - collapsible
            exercisesHTML += `<div class="exercise-group-content">`;
            
            // Group notes (display after header, before exercises)
            if (group.notes) {
                exercisesHTML += `<div class="exercise-group-notes">${formatNotes(group.notes)}</div>`;
            }
            
            // Group exercises
            if (group.exercises && group.exercises.length > 0) {
                group.exercises.forEach(exercise => {
                    exercisesHTML += createExerciseHTML(exercise, workout.id, workout.date);
                });
            }
            
            exercisesHTML += `</div></div>`;
        });
    }
    
    exercisesHTML += '</div>';

    workoutDisplay.innerHTML = `
        <div class="workout-content">
            <div class="workout-header">
                <div class="workout-title">${escapeHtml(workout.workout_name)}</div>
                <div class="workout-date">${formattedDate}</div>
                ${workout.creator_name ? `<div class="workout-creator"><div class="profile-icon-small" data-initials="${workout.creator_initials || '?'}">${workout.creator_initials || '?'}</div><span>Created by ${escapeHtml(workout.creator_name)}</span></div>` : ''}
            </div>
            ${exercisesHTML}
        </div>
    `;
    
    // Show export button if workout exists
    const exportBtnContainer = document.getElementById('exportButtonContainer');
    if (exportBtnContainer) {
        exportBtnContainer.style.display = 'block';
    }
}

function createExerciseHTML(exercise, workoutId = null, workoutDate = null) {
    const calculatorButton = exercise.has_1rm_calculator ? `
        <button class="btn-1rm-calculator" onclick="open1RMCalculator('${escapeHtml(exercise.exercise_name || 'Exercise')}')" aria-label="Open 1RM Calculator">
            <i class="fa-solid fa-calculator"></i>
        </button>
    ` : '';
    
    const weightLoggingButton = exercise.has_weight_logging ? `
        <button class="btn-weight-logging" onclick="openWeightLoggingModal(${exercise.id}, '${escapeHtml(exercise.exercise_name || 'Exercise')}', ${workoutId || 'null'}, '${workoutDate || ''}', '${escapeHtml(exercise.sets || '')}', '${escapeHtml(exercise.reps || '')}')" aria-label="Log Weight">
            <i class="fa-solid fa-dumbbell"></i>
        </button>
    ` : '';
    
    const leaderboardButton = exercise.has_weight_logging && workoutId && workoutDate ? `
        <button class="btn-leaderboard" onclick="openLeaderboardModal(${exercise.id}, '${escapeHtml(exercise.exercise_name || 'Exercise')}', ${workoutId}, '${workoutDate}')" aria-label="View Leaderboard">
            <i class="fa-solid fa-trophy"></i>
            <span>Leaderboard</span>
        </button>
    ` : '';
    
    return `
        <div class="exercise-item">
            <div class="exercise-name-header">
                <div class="exercise-name">${escapeHtml(exercise.exercise_name || 'Exercise')}</div>
                ${calculatorButton}
                ${weightLoggingButton}
            </div>
            <div class="exercise-details">
                ${exercise.sets ? `
                    <div class="exercise-detail">
                        <span class="exercise-detail-label">Sets</span>
                        <span class="exercise-detail-value">${escapeHtml(exercise.sets)}</span>
                    </div>
                ` : ''}
                ${exercise.reps ? `
                    <div class="exercise-detail">
                        <span class="exercise-detail-label">Reps</span>
                        <span class="exercise-detail-value">${escapeHtml(exercise.reps)}</span>
                    </div>
                ` : ''}
                ${exercise.weight ? `
                    <div class="exercise-detail">
                        <span class="exercise-detail-label">Weight</span>
                        <span class="exercise-detail-value">${escapeHtml(exercise.weight)}</span>
                    </div>
                ` : ''}
                ${exercise.tempo ? `
                    <div class="exercise-detail">
                        <span class="exercise-detail-label">Tempo</span>
                        <span class="exercise-detail-value">${escapeHtml(exercise.tempo)}</span>
                    </div>
                ` : ''}
                ${exercise.rest ? `
                    <div class="exercise-detail">
                        <span class="exercise-detail-label">Rest</span>
                        <span class="exercise-detail-value">${escapeHtml(exercise.rest)}</span>
                    </div>
                ` : ''}
            </div>
            ${exercise.notes ? `
                <div class="exercise-notes">${formatNotes(exercise.notes)}</div>
            ` : ''}
            ${leaderboardButton}
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNotes(text) {
    if (!text) return '';
    // Escape HTML first, then convert line breaks to <br>
    const escaped = escapeHtml(text);
    return escaped.replace(/\n/g, '<br>');
}

function toggleExerciseGroup(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    
    const content = group.querySelector('.exercise-group-content');
    const toggleBtn = group.querySelector('.group-toggle-btn i');
    
    if (!content || !toggleBtn) return;
    
    const isCollapsed = group.classList.contains('collapsed');
    
    if (isCollapsed) {
        group.classList.remove('collapsed');
        toggleBtn.classList.remove('fa-chevron-up');
        toggleBtn.classList.add('fa-chevron-down');
    } else {
        group.classList.add('collapsed');
        toggleBtn.classList.remove('fa-chevron-down');
        toggleBtn.classList.add('fa-chevron-up');
    }
}

// Export workout functionality
function exportWorkout() {
    const workoutDisplay = document.getElementById('workoutDisplay');
    const workoutContent = workoutDisplay.querySelector('.workout-content');
    
    if (!workoutContent) {
        alert('No workout to export');
        return;
    }
    
    // Create a new window for export
    const exportWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Clone the workout content
    const clonedContent = workoutContent.cloneNode(true);
    
    // Remove calculator buttons and other interactive elements
    clonedContent.querySelectorAll('.btn-1rm-calculator').forEach(btn => btn.remove());
    
    // Create export HTML
    const exportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Workout Export - ProjectAthlete</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    padding: 20px;
                    background: #fff;
                    line-height: 1.4;
                    font-size: 14px;
                }
                .export-container {
                    max-width: 100%;
                    margin: 0 auto;
                    background: white;
                    padding: 20px;
                }
                .workout-header {
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid #333;
                }
                .workout-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 4px;
                    color: #333;
                }
                .workout-date {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 8px;
                }
                .workout-creator {
                    font-size: 12px;
                    color: #888;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .exercise-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .exercise-group {
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 12px;
                    background: #f9f9f9;
                }
                .exercise-group-header {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: #333;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #ddd;
                }
                .exercise-group-notes {
                    font-size: 13px;
                    color: #555;
                    margin-bottom: 10px;
                    padding: 8px;
                    background: #fff;
                    border-left: 3px solid #4CAF50;
                    border-radius: 3px;
                }
                .exercise-item {
                    background: white;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    border: 1px solid #e0e0e0;
                }
                .exercise-name {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: #333;
                }
                .exercise-details {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .exercise-detail {
                    display: flex;
                    flex-direction: column;
                }
                .exercise-detail-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #888;
                    margin-bottom: 2px;
                    letter-spacing: 0.5px;
                }
                .exercise-detail-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                }
                .exercise-notes {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #e0e0e0;
                    color: #555;
                    font-size: 12px;
                    white-space: pre-wrap;
                }
                .export-close-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                    transition: all 0.2s ease;
                }
                .export-close-btn:hover {
                    background: #555;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                @media print {
                    body {
                        background: white;
                        padding: 10px;
                    }
                    .export-container {
                        box-shadow: none;
                        padding: 10px;
                    }
                    .export-close-btn {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <button class="export-close-btn" onclick="window.close()">Close</button>
            <div class="export-container">
                ${clonedContent.innerHTML}
            </div>
        </body>
        </html>
    `;
    
    exportWindow.document.write(exportHTML);
    exportWindow.document.close();
    
    // Wait for content to load, then print or allow screenshot
    exportWindow.onload = function() {
        // Auto-print option (commented out - user can use browser print)
        // exportWindow.print();
    };
}

// Event delegation for calendar day clicks
document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
    
    // Export button click handler
    const exportBtn = document.getElementById('exportWorkoutBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportWorkout);
    }
    
    // Use event delegation for calendar day clicks (since calendar is dynamically generated)
    document.addEventListener('click', function(e) {
        const dayElement = e.target.closest('.calendar-day');
        if (dayElement) {
            const dateStr = dayElement.dataset.date;
            if (dateStr) {
                // Parse date string properly to avoid timezone issues
                const dateParts = dateStr.split('-');
                const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                selectDay(date);
            }
        }
    });
    
    // Close workout selector dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const workoutSelector = document.querySelector('.workout-selector');
        const dropdown = document.querySelector('.workout-selector-dropdown');
        
        if (workoutSelector && dropdown && dropdown.classList.contains('show')) {
            if (!workoutSelector.contains(event.target)) {
                closeWorkoutSelector();
            }
        }
    });
});

// Make toggleWorkoutSelector globally accessible
window.toggleWorkoutSelector = toggleWorkoutSelector;

