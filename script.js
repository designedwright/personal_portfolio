// script.js

document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById('theme-toggle');
    const rootElement = document.documentElement;

    // Function to set theme

    // Functional Theme Setter
    const setTheme = (theme) => {
        rootElement.setAttribute('data-theme', theme);
        localStorage.setItem('portfolio-theme', theme);
    };

    // Initialize Theme
    const savedTheme = localStorage.getItem('portfolio-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Default to 'light' for default visual alignment to image, unless user has strong OS pref
    const initialTheme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // Theme Toggle Click Handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Grid Size Control
    const gridPlus = document.getElementById('grid-plus');
    const gridMinus = document.getElementById('grid-minus');
    const portfolio = document.querySelector('.portfolio');

    // Grid sizes: 1 to 4 columns. + makes images larger (fewer cols).
    let currentGridSize = 3;

    const updateGridSize = () => {
        portfolio.setAttribute('data-grid-size', currentGridSize);
    };

    // Set initial size
    if (portfolio) {
        updateGridSize();
    }

    if (gridPlus) {
        gridPlus.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentGridSize > 1) {
                currentGridSize--;
                updateGridSize();
            }
        });
    }

    if (gridMinus) {
        gridMinus.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentGridSize < 4) {
                currentGridSize++;
                updateGridSize();
            }
        });
    }

    /* =========================================
       Salt Lake City Clock Logic
       ========================================= */
    const slcTimeEl = document.getElementById('slc-time');

    function updateClock() {
        if (!slcTimeEl) return;

        // Salt Lake City is in America/Denver timezone
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Denver',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        // Format e.g., "01:48:17 am" (lowercase am/pm matches mockup)
        const timeString = formatter.format(now).toLowerCase();
        slcTimeEl.textContent = timeString;
    }

    if (slcTimeEl) {
        updateClock();
        setInterval(updateClock, 1000);
    }

    /* =========================================
       Soft Page Transition Logic
       ========================================= */
    document.body.classList.add('page-loaded');

    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Intercept internal HTML links
            if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto')) {
                e.preventDefault();
                document.body.classList.remove('page-loaded');
                document.body.classList.add('page-transitioning');

                // Wait for the CSS transition (0.5s) before navigating
                setTimeout(() => {
                    window.location.href = href;
                }, 450);
            }
        });
    });
});

// Fix Safari/fallback bfcache back button stuck on opacity 0
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('page-transitioning');
        document.body.classList.add('page-loaded');
    }
});
