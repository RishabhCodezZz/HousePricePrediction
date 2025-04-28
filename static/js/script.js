document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements for better performance
    const form = document.getElementById('prediction-form');
    const resultSection = document.getElementById('result-section');
    const predictedPrice = document.getElementById('predicted-price');
    const confidenceFill = document.querySelector('.confidence-fill');
    initializeThemeToggle();

    // Initialize theme handling
    initializeThemeToggle();
    
    // Initialize form animations and interactions
    initializeFormAnimations();

    /**
     * Handle form submission and price prediction
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Collect form data and validate
            const formData = collectFormData();
            validateFormData(formData);

            // Show loading state
            const button = toggleLoadingState(true);

            // Make API call to prediction endpoint
            const prediction = await getPrediction(formData);

            // Display results with animations
            displayPredictionResult(prediction);

        } catch (error) {
            showError(error.message || 'Error connecting to server');
        } finally {
            toggleLoadingState(false);
        }
    });

    /**
     * Collect and validate form data
     */
    function collectFormData() {
        return {
            bedrooms: parseInt(document.getElementById('bedrooms').value),
            grade: parseInt(document.getElementById('grade').value),
            has_basement: document.getElementById('has_basement').checked,
            living_in_m2: parseFloat(document.getElementById('living_area').value),
            renovated: document.getElementById('renovated').checked,
            nice_view: document.getElementById('nice_view').checked,
            perfect_condition: document.getElementById('perfect_condition').checked,
            real_bathrooms: parseFloat(document.getElementById('bathrooms').value),
            has_lavatory: document.getElementById('has_lavatory').checked,
            single_floor: document.getElementById('single_floor').checked,
            lot_m2: parseFloat(document.getElementById('lot_area').value)
        };
    }

    /**
     * Validate required form fields
     */
    function validateFormData(formData) {
        const requiredFields = ['bedrooms', 'grade', 'living_in_m2', 'real_bathrooms', 'lot_m2'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }
    }

    /**
     * Make API call to get prediction
     */
    async function getPrediction(formData) {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        return await response.json();
    }

    /**
     * Display prediction result with animations
     */
    function displayPredictionResult(data) {
        if (data.success) {
            // Show result section
            resultSection.classList.remove('hidden');
            
            // Animate price counter
            animateValue(predictedPrice, 0, data.prediction, 2000);
            
            // Animate confidence bar
            confidenceFill.style.width = '85%';
            
            // Show celebration or improvement suggestions
            const isGoodScore = data.prediction > 500000;
            setTimeout(() => {
                if (isGoodScore) {
                    celebrateGoodScore();
                } else {
                    showLowerScore();
                }
            }, 2000);

            // Smooth scroll to results
            resultSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error('Error making prediction: ' + data.error);
        }
    }

    // Theme switching functionality
    function initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-switch');
        
        // Check for saved theme preference or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    
        // Add transition class after initial theme is set
        setTimeout(() => {
            document.body.classList.add('theme-transition');
        }, 100);
    
        themeToggle.addEventListener('click', () => {
            // Add click effect
            themeToggle.style.transform = 'scale(0.95)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 100);
    
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // Add logo animation on hover
    const logo = document.querySelector('.logo');
    logo.addEventListener('mouseenter', () => {
        const chart = document.querySelector('.logo-chart');
        chart.style.animation = 'none';
        chart.offsetHeight; // Trigger reflow
        chart.style.animation = 'draw 2s forwards';
    });

    // Add input validation and formatting
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const min = parseFloat(e.target.min);
            const max = parseFloat(e.target.max);
            
            if (value < min) e.target.value = min;
            if (value > max) e.target.value = max;
        });
    });

    function celebrateGoodScore() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const confettiColors = isDarkMode
        ? ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff']
        : ['#2563eb', '#1d4ed8', '#3b82f6', '#60a5fa'];

        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0,
            colors: confettiColors
        };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);

        // Add celebratory message
        const message = document.createElement('div');
        message.className = 'celebration-message';
        message.textContent = '🎉 Excellent Property Value!';
        resultSection.querySelector('.result-card').appendChild(message);

        // Auto-remove after 2 seconds
        setTimeout(() => {
            message.remove();
        }, 2000);
    }


    function showLowerScore() {
        // Add improvement suggestions message
        const message = document.createElement('div');
        message.className = 'improvement-message';
        message.innerHTML = `
        <h3>💡 Potential Improvements:</h3>
        <ul class="improvement-list">
        <li>Consider renovation opportunities</li>
        <li>Enhance curb appeal</li>
        <li>Upgrade key amenities</li>
        <li>Improve overall condition</li>
        </ul>
        `;
        const resultCard = resultSection.querySelector('.result-card');
        resultCard.appendChild(message);

        // Add gentle pulse animation to the result card
        resultCard.classList.add('pulse-animation');

        // Auto-remove message after 2 seconds
        setTimeout(() => {
            message.remove();
            resultCard.classList.remove('pulse-animation'); // Also stop pulsing
        }, 2000);
    }

    function initializeFormAnimations() {
        // Animate form sections on scroll
        const formSections = document.querySelectorAll('.form-section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        formSections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'all 0.5s ease-out';
            observer.observe(section);
        });

        // Add hover effects to input groups
        const inputGroups = document.querySelectorAll('.input-group');
        inputGroups.forEach(group => {
            const label = group.querySelector('label');
            const input = group.querySelector('input');

            input.addEventListener('focus', () => {
                label.style.color = 'var(--primary-color)';
            });

            input.addEventListener('blur', () => {
                label.style.color = 'var(--text-color)';
            });
        });
    }

    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentValue = Math.floor(progress * (end - start) + start);
            element.textContent = currentValue.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        // Insert error message after the form
        form.parentNode.insertBefore(errorDiv, form.nextSibling);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    function toggleLoadingState(isLoading) {
        const button = form.querySelector('button');
        button.disabled = isLoading;
        button.classList.toggle('loading', isLoading);
        button.textContent = isLoading ? 'Calculating...' : 'Get Price Estimate';
        return button;
    }
});