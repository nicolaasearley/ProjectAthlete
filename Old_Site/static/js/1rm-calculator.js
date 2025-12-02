// 1RM Calculator Functions
function open1RMCalculator(exerciseName) {
    const modal = document.getElementById('1rmModal');
    const exerciseNameEl = document.getElementById('modalExerciseName');
    const input = document.getElementById('1rmInput');
    
    if (exerciseNameEl) {
        exerciseNameEl.textContent = `${exerciseName} - 1RM Calculator`;
    }
    
    input.value = '';
    
    // Always show percentage boxes, even when empty
    calculate1RMPercentages();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock page scroll
    
    setTimeout(() => {
        input.focus();
    }, 100);
}

function close1RMCalculator() {
    const modal = document.getElementById('1rmModal');
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Unlock page scroll
}

function calculate1RMPercentages() {
    const input = document.getElementById('1rmInput');
    const resultsDiv = document.getElementById('1rmResults');
    const oneRM = parseFloat(input.value);
    
    // Calculate percentages from 50% to 95% in 5% increments
    const percentages = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
    
    const resultsHTML = `
        <div class="modal-1rm-percentages">
            ${percentages.map(percent => {
                let weightDisplay = '---';
                let weightClass = 'modal-1rm-weight-empty';
                
                if (oneRM && oneRM > 0) {
                    const weight = Math.round((oneRM * percent / 100) * 2) / 2; // Round to nearest 0.5
                    weightDisplay = `${weight} lbs`;
                    weightClass = 'modal-1rm-weight';
                }
                
                return `
                    <div class="modal-1rm-percentage-item">
                        <span class="modal-1rm-percent">${percent}%</span>
                        <span class="${weightClass}">${weightDisplay}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    resultsDiv.innerHTML = resultsHTML;
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('1rmModal');
    if (modal && modal.style.display === 'flex') {
        const modalContent = modal.querySelector('.modal-1rm-content');
        // Close if clicking on the modal backdrop (not on the content itself)
        if (event.target === modal) {
            close1RMCalculator();
        }
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('1rmModal');
        if (modal && modal.style.display === 'flex') {
            close1RMCalculator();
        }
    }
});

