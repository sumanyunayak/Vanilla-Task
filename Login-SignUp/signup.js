const form = document.getElementById('signupForm');
const errorMsg = document.getElementById('error-message');
const CURRENT_USER_KEY = 'vanillaTaskCurrentUser';
const TASKS_PREFIX = 'vanillaTaskTasks:';

form.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (username === '' || email === '' || password === '' || confirmPassword === '') {
        showSignupMessage('Please fill in all fields', 'red');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        showSignupMessage('Please enter a valid email address', 'red');
        return;
    }

    if (password.length < 6) {
        showSignupMessage('Password must be at least 6 characters long', 'red');
        return;
    }

    if (users.find(user => user.email.toLowerCase() === email)) {
        showSignupMessage('Email is already registered', 'red');
        return;
    }

    if (users.find(user => user.username.toLowerCase() === username.toLowerCase())) {
        showSignupMessage('Username is already taken', 'red');
        return;
    }

    if (password !== confirmPassword) {
        showSignupMessage('Passwords do not match', 'red');
        return;
    }

    const newUser = { username, email, password };
    const activeUser = { username, email };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(activeUser));
    localStorage.setItem('currentUser', username);
    localStorage.setItem(getUserTasksKey(email), JSON.stringify([]));

    showSignupMessage('Account created successfully!', '#4ade80');
    form.reset();
    resetStrengthIndicator();

    setTimeout(() => {
        window.location.href = '../Homepage/homepage.html';
    }, 500);
});

function showSignupMessage(message, color) {
    errorMsg.textContent = message;
    errorMsg.style.color = color;
    errorMsg.style.display = 'block';
}

function getUserTasksKey(email) {
    return `${TASKS_PREFIX}${encodeURIComponent(email.toLowerCase())}`;
}

//Toggle Password Visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleText = document.querySelector('.toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleText.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        toggleText.textContent = 'Show';
    }
}

//Password Strength Indicator
const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');

passwordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[@$!%*?&]/)) strength++;

    switch (strength) {
        case 0:
            resetStrengthIndicator();
            break;
        case 1:
            updateStrengthIndicator('20%', '#ef4444', 'Very Weak');
            break;
        case 2:
            updateStrengthIndicator('40%', '#f97316', 'Weak');
            break;
        case 3:
            updateStrengthIndicator('60%', '#eab308', 'Medium');
            break;
        case 4:
            updateStrengthIndicator('80%', '#22c55e', 'Strong');
            break;
        case 5:
            updateStrengthIndicator('100%', '#17a917', 'Very Strong');
            break;
    }
});

function updateStrengthIndicator(width, color, text) {
    strengthBar.style.width = width;
    strengthBar.style.background = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}

function resetStrengthIndicator() {
    strengthBar.style.width = '0%';
    strengthText.textContent = '';
}
