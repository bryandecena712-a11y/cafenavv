console.log("app.js script loaded successfully!");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");

    // ==========================================
    // 1. SIGNUP FORM HANDLER
    // ==========================================
    const signupForm = document.getElementById('signupForm');
    const signupBox = document.getElementById('signupBox');

    if (signupForm) {
        console.log("signupForm found! Attaching submit listener...");

        signupForm.addEventListener('submit', async(e) => {
            e.preventDefault(); // Stops HTML page reload
            console.log(" Form submit event triggered!");

            const usernameEl = document.getElementById('signupUsername');
            const emailEl = document.getElementById('signupEmail');
            const passwordEl = document.getElementById('signupPassword');
            const confirmPasswordEl = document.getElementById('signupConfirmPassword');

            const username = usernameEl ? usernameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';
            const password = passwordEl ? passwordEl.value : '';
            const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';

            console.log("Data to send:", { username, email, password });

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();
                console.log("Server response:", data);

                if (response.ok) {
                    if (signupBox) {
                        signupBox.innerHTML = `
                            <div class="success-container">
                                <div class="success-banner">
                                    You successfully<br>Signed Up!
                                </div>
                                <a href="login.html" class="btn-login-now">Login Now</a>
                            </div>
                        `;
                    }
                } else {
                    alert(data.error || "Failed to sign up.");
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                alert("Error connecting to server.");
            }
        });
    }

    // ==========================================
    // 2. LOGIN FORM HANDLER (FIXED FOR OFFERS UI)
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log("loginForm detected!");

        loginForm.addEventListener('submit', async(e) => {
            e.preventDefault(); // STOP page refresh
            console.log("Login submit triggered!");

            const emailEl = document.getElementById('email');
            const passwordEl = document.getElementById('password');

            const email = emailEl ? emailEl.value.trim() : '';
            const password = passwordEl ? passwordEl.value : '';

            console.log("Sending login data:", { email, password });

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log("Login server response:", data);

                if (response.ok) {
                    // Extract username safely from response
                    const loggedInUsername = (data.user && data.user.username) ? data.user.username : (data.username || 'Kit');

                    // Save session details to LocalStorage
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', loggedInUsername);
                    localStorage.setItem('showLoginBanner', 'true');

                    console.log(`Login successful! User: ${loggedInUsername}. Redirecting to offers.html...`);

                    // Redirect directly to the Offers UI page
                    window.location.href = 'offers.html';
                } else {
                    alert(data.error || "Invalid login credentials.");
                }
            } catch (err) {
                console.error("Login fetch error:", err);
                alert("Server connection failed.");
            }
        });
    } else {
        console.warn("loginForm element NOT found on this page.");
    }

    // ==========================================
    // 3. LOGGED-IN UI & NAVBAR STATE HANDLER
    // ==========================================
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const savedUsername = localStorage.getItem('username') || 'User';

    const userGreeting = document.getElementById('userGreeting');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const navLoginLink = document.getElementById('navLoginLink');
    const navLogoutContainer = document.getElementById('navLogoutContainer');
    const btnLogout = document.getElementById('btnLogout');
    const loginSuccessBanner = document.getElementById('loginSuccessBanner');

    // Check if the current page is offers.html
    const isOffersPage = window.location.pathname.includes('offers.html');

    if (isLoggedIn) {
        // Show greeting ONLY on offers.html page
        if (isOffersPage && userGreeting && usernameDisplay) {
            usernameDisplay.textContent = savedUsername;
            userGreeting.classList.remove('hidden');
        } else if (userGreeting) {
            userGreeting.classList.add('hidden'); // Ensure hidden on Home / Index
        }

        // Hide "Login" link, Show "Logout" button
        if (navLoginLink) navLoginLink.classList.add('hidden');
        if (navLogoutContainer) navLogoutContainer.classList.remove('hidden');

        // Trigger top green banner if just logged in
        if (localStorage.getItem('showLoginBanner') === 'true' && loginSuccessBanner) {
            loginSuccessBanner.classList.remove('hidden');

            setTimeout(() => {
                loginSuccessBanner.classList.add('hidden');
                localStorage.removeItem('showLoginBanner');
            }, 4000);
        }
    } else {
        // Logged-out defaults
        if (userGreeting) userGreeting.classList.add('hidden');
        if (navLoginLink) navLoginLink.classList.remove('hidden');
        if (navLogoutContainer) navLogoutContainer.classList.add('hidden');
    }

    // LOGOUT BUTTON LISTENER
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Clear saved session
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('showLoginBanner');

            // Redirect home in logged-out state
            window.location.href = 'index.html';
        });
    }

    // ==========================================
    // 4. FORGOT PASSWORD MULTI-STEP HANDLER
    // ==========================================
    const forgotPasswordBox = document.getElementById('forgotPasswordBox');
    let resetEmail = '';

    if (forgotPasswordBox) {
        // STEP 1: Submit Email
        const forgotForm = document.getElementById('forgotForm');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async(e) => {
                e.preventDefault();
                const emailInput = document.getElementById('forgotEmail');
                const errorBox = document.getElementById('forgotError');
                resetEmail = emailInput ? emailInput.value.trim() : '';

                try {
                    const response = await fetch('/api/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resetEmail })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Render STEP 2: Code Verification
                        renderCodeVerificationStep();
                    } else {
                        if (errorBox) {
                            errorBox.textContent = data.error || "This email address does not exist!";
                            errorBox.classList.remove('hidden');
                        }
                    }
                } catch (err) {
                    console.error("Forgot password error:", err);
                }
            });
        }
    }

    // Render STEP 2: Code Verification UI
    function renderCodeVerificationStep() {
        forgotPasswordBox.innerHTML = `
            <h1 class="forgot-header">Code Verification</h1>
            <div class="alert-box alert-success">
                We've sent a password reset OTP to your email.
            </div>
            <div id="otpError" class="alert-box alert-danger hidden">
                The code was incorrect!
            </div>
            <form id="otpForm" class="forgot-form-box">
                <div class="input-field-container">
                    <input type="text" id="otpCode" placeholder="Please enter the code" required>
                </div>
                <button type="submit" class="btn-dark-forgot">VERIFY</button>
            </form>
        `;

        const otpForm = document.getElementById('otpForm');
        otpForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            const otpInput = document.getElementById('otpCode');
            const otpCode = otpInput ? otpInput.value.trim() : '';
            const otpError = document.getElementById('otpError');

            try {
                const response = await fetch('/api/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmail, otp: otpCode })
                });

                if (response.ok) {
                    // Render STEP 3: Reset Password
                    renderNewPasswordStep();
                } else {
                    if (otpError) otpError.classList.remove('hidden');
                }
            } catch (err) {
                console.error("OTP verification error:", err);
            }
        });
    }

    // Render STEP 3: New Password UI
    function renderNewPasswordStep() {
        forgotPasswordBox.innerHTML = `
            <h1 class="forgot-header">New Password</h1>
            <div class="alert-box alert-success">
                Please create a new password.
            </div>
            <div id="passError" class="alert-box alert-danger hidden">
                Password does not matched!
            </div>
            <form id="newPasswordForm" class="forgot-form-box">
                <div class="input-field-container">
                    <input type="password" id="newPassword" placeholder="Enter new password" required>
                </div>
                <div class="input-field-container">
                    <input type="password" id="confirmNewPassword" placeholder="Confirm your password" required>
                </div>
                <button type="submit" class="btn-dark-forgot">Confirm</button>
            </form>
        `;

        const newPasswordForm = document.getElementById('newPasswordForm');
        newPasswordForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            const passEl = document.getElementById('newPassword');
            const confirmPassEl = document.getElementById('confirmNewPassword');

            const pass = passEl ? passEl.value : '';
            const confirmPass = confirmPassEl ? confirmPassEl.value : '';
            const passError = document.getElementById('passError');

            if (pass !== confirmPass) {
                if (passError) passError.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetEmail, password: pass })
                });

                if (response.ok) {
                    // Render STEP 4: Success Screen
                    renderSuccessStep();
                } else {
                    alert("Failed to reset password.");
                }
            } catch (err) {
                console.error("Password reset error:", err);
            }
        });
    }

    // Render STEP 4: Reset Successful UI
    function renderSuccessStep() {
        forgotPasswordBox.innerHTML = `
            <div class="success-container">
                <div class="success-banner">
                    Your password changed. Now you can login with your new password.
                </div>
                <a href="login.html" class="btn-login-now">Login Now</a>
            </div>
        `;
    }

});

document.addEventListener('DOMContentLoaded', () => {
    const btnGetStarted = document.getElementById('btnGetStarted');
    const offersLanding = document.getElementById('offersLanding');
    const quizContainer = document.getElementById('quizContainer');
    const btnQuitQuiz = document.getElementById('btnQuitQuiz');

    // Show quiz when clicking Get Started
    if (btnGetStarted && offersLanding && quizContainer) {
        btnGetStarted.addEventListener('click', () => {
            offersLanding.classList.add('hidden');
            quizContainer.classList.remove('hidden');
        });
    }

    // Hide quiz and return to landing when clicking Quit
    if (btnQuitQuiz && offersLanding && quizContainer) {
        btnQuitQuiz.addEventListener('click', () => {
            quizContainer.classList.add('hidden');
            offersLanding.classList.remove('hidden');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const quizStep1 = document.getElementById('quizContainer');
    const quizStep2 = document.getElementById('quizStep2');
    const btnContinueStep1 = document.getElementById('btnContinueStep1');
    const btnBackToStep1 = document.getElementById('btnBackToStep1');

    // Step 1 -> Step 2
    if (btnContinueStep1) {
        btnContinueStep1.addEventListener('click', () => {
            quizStep1.classList.add('hidden');
            quizStep2.classList.remove('hidden');
        });
    }

    // Global Back Function attached to window
    window.handleQuizBack = function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const quizStep1 = document.getElementById('quizContainer');
        const quizStep2 = document.getElementById('quizStep2');

        if (quizStep1 && quizStep2) {
            quizStep2.classList.add('hidden');
            quizStep1.classList.remove('hidden');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const quizStep1 = document.getElementById('quizContainer');
    const quizStep2 = document.getElementById('quizStep2');
    const quizStep3 = document.getElementById('quizStep3');

    const btnContinueStep1 = document.getElementById('btnContinueStep1');
    const btnContinueStep2 = document.getElementById('btnContinueStep2');
    const btnContinueStep3 = document.getElementById('btnContinueStep3');

    // Step 1 -> Step 2
    if (btnContinueStep1) {
        btnContinueStep1.addEventListener('click', () => {
            if (quizStep1 && quizStep2) {
                quizStep1.classList.add('hidden');
                quizStep2.classList.remove('hidden');
            }
        });
    }

    // Step 2 -> Step 3
    if (btnContinueStep2) {
        btnContinueStep2.addEventListener('click', () => {
            if (quizStep2 && quizStep3) {
                quizStep2.classList.add('hidden');
                quizStep3.classList.remove('hidden');
            }
        });
    }

    // Step 3 -> Next (Step 4 placeholder or finish)
    if (btnContinueStep3) {
        btnContinueStep3.addEventListener('click', () => {
            console.log("Step 3 complete!");
            // Add Step 4 transition or results submission here
        });
    }

    // Back to Step 1 (from Step 2)
    window.handleQuizBack = function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (quizStep1 && quizStep2) {
            quizStep2.classList.add('hidden');
            quizStep1.classList.remove('hidden');
        }
    };

    // Back to Step 2 (from Step 3)
    window.handleQuizBackToStep2 = function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (quizStep2 && quizStep3) {
            quizStep3.classList.add('hidden');
            quizStep2.classList.remove('hidden');
        }
    };
});

document.addEventListener('DOMContentLoaded', () => {
    const quizStep1 = document.getElementById('quizContainer');
    const quizStep2 = document.getElementById('quizStep2');
    const quizStep3 = document.getElementById('quizStep3');
    const quizStep4 = document.getElementById('quizStep4');

    const btnContinueStep1 = document.getElementById('btnContinueStep1');
    const btnContinueStep2 = document.getElementById('btnContinueStep2');
    const btnContinueStep3 = document.getElementById('btnContinueStep3');
    const btnFinishQuiz = document.getElementById('btnFinishQuiz');

    // Step 1 -> Step 2
    if (btnContinueStep1) {
        btnContinueStep1.addEventListener('click', () => {
            if (quizStep1 && quizStep2) {
                quizStep1.classList.add('hidden');
                quizStep2.classList.remove('hidden');
            }
        });
    }

    // Step 2 -> Step 3
    if (btnContinueStep2) {
        btnContinueStep2.addEventListener('click', () => {
            if (quizStep2 && quizStep3) {
                quizStep2.classList.add('hidden');
                quizStep3.classList.remove('hidden');
            }
        });
    }

    // Step 3 -> Step 4
    if (btnContinueStep3) {
        btnContinueStep3.addEventListener('click', () => {
            if (quizStep3 && quizStep4) {
                quizStep3.classList.add('hidden');
                quizStep4.classList.remove('hidden');
            }
        });
    }

    // Step 4 Final Submit
    if (btnFinishQuiz) {
        btnFinishQuiz.addEventListener('click', () => {
            console.log("Quiz completed!");
            alert("Finding your perfect coffee shop match!");
            // Redirect or show recommendation results here
        });
    }

    // Back to Step 1 (from Step 2)
    window.handleQuizBack = function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (quizStep1 && quizStep2) {
            quizStep2.classList.add('hidden');
            quizStep1.classList.remove('hidden');
        }
    };

    // Back to Step 2 (from Step 3)
    window.handleQuizBackToStep2 = function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (quizStep2 && quizStep3) {
            quizStep3.classList.add('hidden');
            quizStep2.classList.remove('hidden');
        }
    };

    // Back to Step 3 (from Step 4)
    window.handleQuizBackToStep3 = function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (quizStep3 && quizStep4) {
            quizStep4.classList.add('hidden');
            quizStep3.classList.remove('hidden');
        }
    };
});

// Step 4 "Find My Coffee Shop" Click Handler
if (btnFinishQuiz) {
    btnFinishQuiz.addEventListener('click', () => {
        const heroSection = document.querySelector('.hero-section');
        const resultsContainer = document.getElementById('resultsContainer');

        if (heroSection && resultsContainer) {
            heroSection.classList.add('hidden'); // Hide Step 4 & Hero
            resultsContainer.classList.remove('hidden'); // Display Header & Results
            window.scrollTo({ top: 0, behavior: 'instant' }); // Reset view to top header
        }
    });
}