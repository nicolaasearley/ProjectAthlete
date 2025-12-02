// Gym Timer Functions
let timerInterval = null;
let timerMode = 'simple'; // 'simple' or 'interval'
let isRunning = false;
let timeRemaining = 0; // in seconds
let currentRound = 1;
let totalRounds = 1;
let workTime = 30;
let restTime = 10;
let isWorkPhase = true;

// Initialize timer on page load
document.addEventListener('DOMContentLoaded', function() {
    setupTimerModes();
    setupTimerButton();
});

function setupTimerButton() {
    const timerButton = document.getElementById('timerButton');
    if (timerButton) {
        timerButton.addEventListener('click', openTimer);
    }
}

function setupTimerModes() {
    const modeButtons = document.querySelectorAll('.timer-mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and content
            document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.timer-mode-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            timerMode = this.dataset.mode;
            
            // Show corresponding content
            if (timerMode === 'simple') {
                document.getElementById('simpleTimer').classList.add('active');
            } else {
                document.getElementById('intervalTimer').classList.add('active');
            }
            
            // Reset timer when switching modes
            resetTimer();
            resetIntervalTimer();
        });
    });
}

function openTimer() {
    const modal = document.getElementById('timerModal');
    modal.style.display = 'flex';
    resetTimer();
    resetIntervalTimer();
}

function closeTimer() {
    const modal = document.getElementById('timerModal');
    modal.style.display = 'none';
    // Stop any running timers
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
}

// Simple Timer Functions
function startPauseTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        // Get time from inputs if timer is at 0
        if (timeRemaining === 0) {
            const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
            const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
            timeRemaining = minutes * 60 + seconds;
            
            if (timeRemaining === 0) {
                alert('Please set a timer duration');
                return;
            }
        }
        
        startTimer();
    }
}

function startTimer() {
    isRunning = true;
    const btn = document.getElementById('startPauseBtn');
    btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    
    timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateSimpleTimerDisplay();
        } else {
            // Timer finished
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;
            btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
            playBeep();
            
            // Flash alert
            flashTimerComplete();
        }
    }, 1000);
    
    updateSimpleTimerDisplay();
}

function pauseTimer() {
    isRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const btn = document.getElementById('startPauseBtn');
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    timeRemaining = minutes * 60 + seconds;
    
    const btn = document.getElementById('startPauseBtn');
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    
    updateSimpleTimerDisplay();
}

function updateSimpleTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('simpleTimerDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Interval Timer Functions
function startPauseIntervalTimer() {
    if (isRunning) {
        pauseIntervalTimer();
    } else {
        // Get settings from inputs
        workTime = parseInt(document.getElementById('workTime').value) || 30;
        restTime = parseInt(document.getElementById('restTime').value) || 10;
        totalRounds = parseInt(document.getElementById('numRounds').value) || 1;
        
        if (workTime <= 0 || totalRounds <= 0) {
            alert('Please set valid work time and number of rounds');
            return;
        }
        
        currentRound = 1;
        isWorkPhase = true;
        timeRemaining = workTime;
        startIntervalTimer();
    }
}

function startIntervalTimer() {
    isRunning = true;
    const btn = document.getElementById('startPauseIntervalBtn');
    btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    
    updateIntervalStatus();
    updateIntervalTimerDisplay();
    
    timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateIntervalTimerDisplay();
        } else {
            // Phase finished
            if (isWorkPhase) {
                // Rest phase
                playBeep();
                isWorkPhase = false;
                timeRemaining = restTime;
                if (restTime > 0) {
                    updateIntervalStatus();
                    updateIntervalTimerDisplay();
                } else {
                    // No rest time, move to next round
                    completeRound();
                }
            } else {
                // Rest finished, move to next round
                playBeep();
                completeRound();
            }
        }
    }, 1000);
}

function completeRound() {
    currentRound++;
    if (currentRound > totalRounds) {
        // All rounds complete
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        const btn = document.getElementById('startPauseIntervalBtn');
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        document.getElementById('intervalStatus').textContent = 'Complete!';
        playBeep();
        flashTimerComplete();
    } else {
        // Start next round
        isWorkPhase = true;
        timeRemaining = workTime;
        updateIntervalStatus();
        updateIntervalTimerDisplay();
    }
}

function pauseIntervalTimer() {
    isRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const btn = document.getElementById('startPauseIntervalBtn');
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
}

function resetIntervalTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    currentRound = 1;
    isWorkPhase = true;
    workTime = parseInt(document.getElementById('workTime').value) || 30;
    timeRemaining = workTime;
    
    const btn = document.getElementById('startPauseIntervalBtn');
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    
    updateIntervalStatus();
    updateIntervalTimerDisplay();
}

function updateIntervalStatus() {
    const statusEl = document.getElementById('intervalStatus');
    if (isWorkPhase) {
        statusEl.textContent = 'Work';
        statusEl.className = 'timer-status timer-status-work';
    } else {
        statusEl.textContent = 'Rest';
        statusEl.className = 'timer-status timer-status-rest';
    }
}

function updateIntervalTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('intervalTimerDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('intervalRound').textContent = `Round ${currentRound} / ${totalRounds}`;
}

function playBeep() {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function flashTimerComplete() {
    const display = timerMode === 'simple' 
        ? document.getElementById('simpleTimerDisplay')
        : document.getElementById('intervalTimerDisplay');
    
    display.classList.add('timer-complete');
    setTimeout(() => {
        display.classList.remove('timer-complete');
    }, 2000);
}

// Close modal when clicking outside or pressing Escape
window.addEventListener('click', function(event) {
    const timerModal = document.getElementById('timerModal');
    if (event.target === timerModal) {
        closeTimer();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const timerModal = document.getElementById('timerModal');
        if (timerModal && timerModal.style.display === 'flex') {
            closeTimer();
        }
    }
});

