/**
 * Azerbaijan GitHub Community - Landing Page Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it's visible to only animate once
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));


    // --- Number Counter Animation ---
    const numberObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            let currentVal = Math.floor(easeOutQuart * (end - start) + start);
            
            // Format number with commas
            obj.innerHTML = currentVal.toLocaleString();
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toLocaleString(); // Ensure it finishes exactly at end
            }
        };
        window.requestAnimationFrame(step);
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = parseInt(target.getAttribute('data-value'), 10);
                if (!isNaN(endValue)) {
                    animateValue(target, 0, endValue, 2500);
                }
                observer.unobserve(target); // Only animate completely once
            }
        });
    }, numberObserverOptions);

    // Apply data-value to the hero goal stat and observe it
    const goalStat = document.querySelector('.hero-visual .text-gradient.stat-value');
    if (goalStat) {
        // Remove text content temporarily for animation
        goalStat.textContent = '0';
        goalStat.setAttribute('data-value', '5000000');
        statsObserver.observe(goalStat);
    }
    
    // Apply to current stat as well
    const currentStat = document.querySelector('.hero-visual .stat-value:not(.text-gradient)');
    if (currentStat) {
        currentStat.textContent = '0';
        currentStat.setAttribute('data-value', '700000');
        // Custom simple animation for smaller number
        statsObserver.observe(currentStat);
        
        // Add "k" back after animation since original was "700k" (Handling in a simpler way: just animate the raw number)
        // Original text was "700k", let's animate the full number "700,000" for consistency with the goal
    }

    // --- Progress Bar Animation ---
    const progressObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const targetWidth = bar.getAttribute('data-width');
                
                // Reset to 0 then animate to target
                setTimeout(() => {
                    bar.style.width = targetWidth;
                }, 100);
                
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });

    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        // Calculate percentage: (700,000 / 5,000,000) * 100 = 14%
        const percentage = '14%';
        progressBar.style.width = '0%'; // Start at 0
        progressBar.setAttribute('data-width', percentage);
        progressObserver.observe(progressBar);
    }

    // --- Smooth Scrolling for Navigation ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Offset for fixed header
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
