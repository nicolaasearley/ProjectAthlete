document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        signUp();
    });
});

function signUp() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Hide previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Basic validation
    if (!firstName || !lastName || !email || !password) {
        showError('All fields are required');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // EULA acceptance validation
    const agreeEula = document.getElementById('agreeEula');
    if (!agreeEula || !agreeEula.checked) {
        showError('You must agree to the End User License Agreement to continue');
        return;
    }
    
    fetch('/api/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError(data.error);
        } else {
            const username = data.username || 'your username';
            showSuccess(`Account created successfully! Redirecting to your profile...`);
            showUsername(username);
            // Redirect to profile page (user is auto-logged in)
            setTimeout(() => {
                window.location.href = data.redirect || '/user/profile';
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error signing up:', error);
        showError('Failed to create account. Please try again.');
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
}

function showUsername(username) {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const usernameValue = document.getElementById('usernameValue');
    if (usernameDisplay && usernameValue) {
        usernameValue.textContent = username;
        usernameDisplay.style.display = 'block';
        // Scroll to username display
        usernameDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

