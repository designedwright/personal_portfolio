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

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Image Row Height Control (+/-)
    // 3 discrete states matching Josselin's overflow-clipping technique:
    //   –  (state 0) → compact rows, ~5 images visible
    //   default (state 1) → comfortable rows, ~3 images visible
    //   +  (state 2) → tall rows, ~1 image visible
    // Images overflow the right edge of the container (overflow:hidden) as height increases.
    const gridPlus = document.getElementById('grid-plus');
    const gridMinus = document.getElementById('grid-minus');
    const portfolio = document.querySelector('.portfolio');

    // 3 discrete states — +/- controls item WIDTH, not height.
    // Images use width:100%; height:auto so tops align and each bottom falls
    // at the image's natural aspect ratio (no cropping, no squishing).
    // Items that exceed the container width overflow and are clipped (overflow:hidden on grid).
    const NUM_STATES = 3;
    const DEFAULT_STATE = 1;

    let gridState = parseInt(localStorage.getItem('portfolio-grid-state'));
    if (isNaN(gridState) || gridState < 0 || gridState >= NUM_STATES) {
        gridState = DEFAULT_STATE;
    }

    // Calculates a uniform item width per state and applies it to every item.
    // gap = var(--space-sm) = 0.5rem = 8px
    const GAP = 8;
    const applyFlexBases = () => {
        document.querySelectorAll('.project-grid').forEach(grid => {
            const containerW = grid.clientWidth;
            let itemW;
            if (gridState === 0) {
                // – state: 5 images fit exactly wall-to-wall
                itemW = (containerW - 4 * GAP) / 5;
            } else if (gridState === 2) {
                // + state: 1 image fills the full row
                itemW = containerW;
            } else {
                // default: 3 images fit, 4th and 5th clip off the right
                itemW = (containerW - 2 * GAP) / 3;
            }
            grid.querySelectorAll('.project-item').forEach(item => {
                let currentItemW = itemW;
                // Allow specific items to span 2 columns in state 0 and 1
                if (item.classList.contains('span-two') && gridState !== 2) {
                    currentItemW = (itemW * 2) + GAP;
                }
                item.style.flex = `0 0 ${currentItemW.toFixed(1)}px`;
            });
        });
    };


    const applyGridState = () => {
        applyFlexBases();
        if (gridPlus)  gridPlus.classList.toggle('grid-control--disabled', gridState === NUM_STATES - 1);
        if (gridMinus) gridMinus.classList.toggle('grid-control--disabled', gridState === 0);
    };

    applyGridState();

    // Re-apply on resize so item widths stay accurate when the window changes
    window.addEventListener('resize', applyFlexBases);

    if (gridPlus) {
        gridPlus.addEventListener('click', (e) => {
            e.preventDefault();
            if (gridState < NUM_STATES - 1) {
                gridState++;
                applyGridState();
                localStorage.setItem('portfolio-grid-state', gridState);
            }
        });
    }

    if (gridMinus) {
        gridMinus.addEventListener('click', (e) => {
            e.preventDefault();
            if (gridState > 0) {
                gridState--;
                applyGridState();
                localStorage.setItem('portfolio-grid-state', gridState);
            }
        });
    }

    /* =========================================
       Text Character Reveal (Contact Page)
       Mimics Josselin's "progress bar" sweep:
       - Each paragraph is split into characters
       - Every char starts at opacity 0
       - JS fires opacity → 1 on each char with a
         ~18ms stagger, so the text "fills" left-to-right
       ========================================= */
    function initTextReveal() {
        const targets = document.querySelectorAll('.contact-bio p, .contact-info p');
        if (!targets.length) return;

        // Replace each paragraph's text with character-wrapped spans
        targets.forEach(p => {
            const original = p.textContent;
            p.textContent = '';

            // Split on whitespace boundaries, keeping the spaces
            const tokens = original.split(/(\s+)/);
            tokens.forEach(token => {
                if (/^\s+$/.test(token)) {
                    // Pure whitespace — preserve as a text node so spacing is natural
                    p.appendChild(document.createTextNode(token));
                } else {
                    // Word — wrap each character individually
                    const wordEl = document.createElement('span');
                    wordEl.className = 'word-wrap';
                    [...token].forEach(char => {
                        const charEl = document.createElement('span');
                        charEl.className = 'char-reveal';
                        charEl.textContent = char;
                        wordEl.appendChild(charEl);
                    });
                    p.appendChild(wordEl);
                }
            });
        });

        // Stagger opacity across every character in reading order
        const allChars = document.querySelectorAll('.char-reveal');
        const CHAR_DELAY = 2;     // ms between each character — the sweep speed
        const START_DELAY = 100;  // wait for page fade-in (body opacity transition) to settle

        allChars.forEach((char, i) => {
            setTimeout(() => {
                char.style.opacity = '1';
            }, START_DELAY + i * CHAR_DELAY);
        });
    }

    // Only run on the contact page
    if (document.body.classList.contains('contact-body')) {
        initTextReveal();
    }

    /* =========================================
       Archive — WRIGHT scroll lock
       WRIGHT starts centred at 50vh and scrolls
       upward with the page. Once it reaches
       --space-xl (20px) from the top it locks
       there for the rest of the scroll. No bounce.
       ========================================= */
    if (document.body.classList.contains('archive-body')) {
        const wrightEl = document.querySelector('.sidebar-inner');
        const SPACE_XL = 20; // mirrors --space-xl

        const updateWright = () => {
            const centredTop = window.innerHeight * 0.5 - wrightEl.offsetHeight * 0.5;
            const top = Math.max(SPACE_XL, centredTop - window.scrollY);
            wrightEl.style.top = top + 'px';
        };

        updateWright();
        window.addEventListener('scroll', updateWright, { passive: true });
        window.addEventListener('resize', updateWright, { passive: true });
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
       Page Transition Logic
       On exit: wipe in, then navigate.
       On enter: if arriving via wipe, start
       covered and wipe out to reveal new page.
       ========================================= */

    document.body.classList.add('page-loaded');

    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto')) {
                e.preventDefault();
                document.body.classList.remove('page-loaded');
                document.body.classList.add('page-transitioning');
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
