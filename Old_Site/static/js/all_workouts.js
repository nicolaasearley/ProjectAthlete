// All Workouts Page - Display all past workouts in a list format
document.addEventListener('DOMContentLoaded', function() {
    loadAllWorkouts();
});

function loadAllWorkouts() {
    fetch('/api/workouts')
        .then(response => response.json())
        .then(workouts => {
            displayAllWorkouts(workouts);
        })
        .catch(error => {
            console.error('Error loading workouts:', error);
            const container = document.getElementById('workoutsList');
            if (container) {
                container.innerHTML = '<p>Error loading workouts. Please try again.</p>';
            }
        });
}

function displayAllWorkouts(workouts) {
    const container = document.getElementById('workoutsList');
    if (!container) return;
    
    if (workouts.length === 0) {
        container.innerHTML = '<p>No workouts found.</p>';
        return;
    }
    
    // Parse dates and filter to only past workouts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const workoutsWithDates = workouts.map(workout => {
        const dateParts = workout.date.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        date.setHours(0, 0, 0, 0);
        
        return {
            ...workout,
            dateObj: date
        };
    });
    
    // Filter to only past workouts and sort by date (most recent first)
    const pastWorkouts = workoutsWithDates
        .filter(w => w.dateObj < today)
        .sort((a, b) => b.dateObj - a.dateObj);
    
    if (pastWorkouts.length === 0) {
        container.innerHTML = '<p>No previous workouts found.</p>';
        return;
    }
    
    // Create a simple list format
    let html = '<div style="max-width: 1200px; margin: 0 auto;">';
    html += `<h2 style="margin-bottom: 20px;">${pastWorkouts.length} Previous Workout${pastWorkouts.length !== 1 ? 's' : ''}</h2>`;
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
    
    pastWorkouts.forEach(workout => {
        const formattedDate = workout.dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        html += `
            <div style="background: var(--card-bg); border-radius: 8px; padding: 16px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 12px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">${escapeHtml(workout.workout_name || 'Untitled Workout')}</h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">${formattedDate}</p>
                        ${workout.creator_name ? `<p style="margin: 8px 0 0 0; color: var(--text-secondary); font-size: 12px;">Created by ${escapeHtml(workout.creator_name)}</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="window.location.href='/admin?edit=${workout.id}'" style="font-size: 14px; padding: 8px 16px;">
                            <i class="fa-solid fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="deleteWorkout(${workout.id})" style="font-size: 14px; padding: 8px 16px;">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

function deleteWorkout(workoutId) {
    if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
        return;
    }
    
    fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error deleting workout: ' + data.error);
        } else {
            // Reload the list
            loadAllWorkouts();
        }
    })
    .catch(error => {
        console.error('Error deleting workout:', error);
        alert('Failed to delete workout. Please try again.');
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

