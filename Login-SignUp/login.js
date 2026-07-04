const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('login-error-message');
const CURRENT_USER_KEY = 'vanillaTaskCurrentUser';

form.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const validuser = users.find(user => user.email.toLowerCase() === email && user.password === password);

    if (email === '' || password === '') {
        showLoginMessage('Please fill in all fields', 'red');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        showLoginMessage('Please enter a valid email address', 'red');
        return;
    }

    if (password.length < 6) {
        showLoginMessage('Password must be at least 6 characters long', 'red');
        return;
    }

    if (validuser) {
        const activeUser = {
            username: validuser.username,
            email: validuser.email.toLowerCase()
        };

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(activeUser));
        localStorage.setItem('currentUser', validuser.username);
        showLoginMessage('Login successful!', '#4ade80');

        setTimeout(() => {
            window.location.href = '../Homepage/homepage.html';
        }, 500);
    } else {
        showLoginMessage('Invalid Email or Password.', 'red');
    }
});

function showLoginMessage(message, color) {
    errorMsg.textContent = message;
    errorMsg.style.color = color;
    errorMsg.style.display = 'block';
}

//Toggle Password Visibility
function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleText = document.querySelector('.toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleText.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        toggleText.textContent = 'Show';
    }
}
