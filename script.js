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

    // Live-respond to OS theme changes, but only if the user hasn't manually set a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('portfolio-theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

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

    // Josselin equal-height technique:
    // All visible images in a row share a single height H.
    // H is calculated so that the sum of (AR_i × H) + gaps = containerWidth.
    // Each item's flex-basis = AR_i × H.
    // Images use width:100%; height:auto — natural aspect ratio, zero cropping.
    // Items beyond the visible count overflow off the right (overflow:hidden on grid).

    const GAP = 8;

    const getAR = (item) => {
        const img = item.querySelector('img');
        const vid = item.querySelector('video');
        if (img && img.naturalWidth && img.naturalHeight) {
            return img.naturalWidth / img.naturalHeight;
        }
        if (vid && vid.videoWidth && vid.videoHeight) {
            return vid.videoWidth / vid.videoHeight;
        }
        // Fallback to rendered size if not loaded yet
        const media = img || vid;
        if (media && media.offsetWidth && media.offsetHeight) {
            return media.offsetWidth / media.offsetHeight;
        }
        return 1.5; // generic landscape fallback
    };

    const applyFlexBases = () => {
        const isMobile = window.innerWidth <= 900;
        document.querySelectorAll('.project-grid').forEach(grid => {
            if (isMobile) {
                // Reset any JS-set inline styles and let CSS handle mobile entirely
                grid.style.height = '';
                grid.querySelectorAll('.project-item').forEach(item => {
                    item.style.flex = '';
                });
                return;
            }

            // Clear any stale inline height left by a previous JS version
            grid.style.height = '';

            const containerW = grid.clientWidth;
            if (!containerW) return;

            const items = Array.from(grid.querySelectorAll('.project-item'));
            if (!items.length) return;

            // How many visible "slots" for this state
            let numSlots;
            if (gridState === 0) numSlots = 5;
            else if (gridState === 2) numSlots = 1;
            else numSlots = 3;

            // Build visible set — span-two items consume 2 slots
            const visibleItems = [];
            let slotsUsed = 0;
            for (const item of items) {
                if (slotsUsed >= numSlots) break;
                const cost = (item.classList.contains('span-two') && gridState !== 2) ? 2 : 1;
                if (slotsUsed + cost > numSlots) break;
                visibleItems.push(item);
                slotsUsed += cost;
            }

            // Compute shared row height H from visible items' natural aspect ratios
            const arList = visibleItems.map(getAR);
            const sumAR = arList.reduce((a, b) => a + b, 0);
            const numGaps = visibleItems.length - 1;
            if (!sumAR) return;

            const H = (containerW - numGaps * GAP) / sumAR;

            // Pin the grid to exactly H pixels so overflow items (sitting off-screen to the
            // right) can't make the container taller and create blank space below.
            grid.style.height = Math.round(H) + 'px';

            // Apply flex-basis to ALL items using H (overflow items naturally extend right)
            items.forEach(item => {
                const ar = getAR(item);
                item.style.flex = `0 0 ${(ar * H).toFixed(1)}px`;
            });
        });
    };

    // Equal-height Josselin technique for project-image-row pairs on project pages.
    // Same maths as applyFlexBases but targets .project-image-row children instead,
    // and ALL items are visible (no overflow) so no height pin needed.
    const applyImageRows = () => {
        const isMobile = window.innerWidth <= 900;
        document.querySelectorAll('.project-image-row').forEach(row => {
            const items = Array.from(row.querySelectorAll('.project-full-image'));
            if (!items.length) return;

            if (isMobile) {
                items.forEach(item => { item.style.flex = ''; });
                return;
            }

            const containerW = row.clientWidth;
            if (!containerW) return;

            const arList = items.map(item => {
                const img = item.querySelector('img');
                const vid = item.querySelector('video');
                if (img && img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
                if (vid && vid.videoWidth  && vid.videoHeight)  return vid.videoWidth  / vid.videoHeight;
                const media = img || vid;
                if (media && media.offsetWidth && media.offsetHeight) return media.offsetWidth / media.offsetHeight;
                return 1.5;
            });

            const sumAR = arList.reduce((a, b) => a + b, 0);
            if (!sumAR) return;

            const H = (containerW - (items.length - 1) * GAP) / sumAR;

            items.forEach((item, i) => {
                item.style.flex = `0 0 ${(arList[i] * H).toFixed(1)}px`;
            });
        });
    };

    // Fire once on load, then on every resize
    applyImageRows();
    window.addEventListener('resize', applyImageRows);

    // Re-apply once images/videos in rows have loaded their dimensions
    document.querySelectorAll('.project-image-row img').forEach(img => {
        if (!img.complete) img.addEventListener('load', applyImageRows);
    });
    document.querySelectorAll('.project-image-row video').forEach(vid => {
        if (!vid.videoWidth) vid.addEventListener('loadedmetadata', applyImageRows);
    });

    const applyGridState = () => {
        applyFlexBases();
        if (gridPlus)  gridPlus.classList.toggle('grid-control--disabled', gridState === NUM_STATES - 1);
        if (gridMinus) gridMinus.classList.toggle('grid-control--disabled', gridState === 0);
    };

    applyGridState();

    // Re-apply once images load so naturalWidth/naturalHeight are available
    document.querySelectorAll('.project-grid img').forEach(img => {
        if (!img.complete) {
            img.addEventListener('load', applyFlexBases);
        }
    });

    // Re-apply once video metadata loads so videoWidth/videoHeight are available
    document.querySelectorAll('.project-grid video').forEach(video => {
        if (!video.videoWidth) {
            video.addEventListener('loadedmetadata', applyFlexBases);
        }
    });

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
       ← portfolio back link positioning
       Measures the right edge of WRIGHT and the left edge of the content
       column, then centres the link in that gap. Re-runs on resize.
       ========================================= */
    const backLink = document.querySelector('.project-back-link');
    if (backLink) {
        const positionBackLink = () => {
            const brandEl   = document.querySelector('.brand-name');
            const contentEl = document.querySelector('.project-content');
            if (!brandEl || !contentEl) return;

            const wrightRight  = brandEl.getBoundingClientRect().right;
            const contentLeft  = contentEl.getBoundingClientRect().left;
            // Subtract a few px so the arrow glyph doesn't push the text visually right
            const center       = (wrightRight + contentLeft) / 2 - 8;

            backLink.style.left = center + 'px';
        };

        positionBackLink();
        window.addEventListener('resize', positionBackLink);
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
       Archive — Lightbox
       Click any image to open full-screen preview.
       X / click-outside / Esc to close.
       ← → arrows (on screen or keyboard) to step through.
       ========================================= */
    if (document.body.classList.contains('archive-body')) {
        const lightbox      = document.getElementById('lightbox');
        const lightboxImg   = document.getElementById('lightbox-img');
        const lightboxCap   = document.getElementById('lightbox-caption');
        const btnClose      = document.querySelector('.lightbox-close');
        const btnPrev       = document.querySelector('.lightbox-prev');
        const btnNext       = document.querySelector('.lightbox-next');

        const items = Array.from(document.querySelectorAll('.archive-item'));
        let current = 0;

        const show = (index) => {
            current = (index + items.length) % items.length;
            const item   = items[current];
            const img    = item.querySelector('img');
            const name   = item.querySelector('.project-name');
            const cat    = item.querySelector('.project-category');

            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCap.textContent = [name && name.textContent, cat && cat.textContent]
                .filter(Boolean).join('  ');

            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        const close = () => {
            lightbox.classList.remove('open');
            document.body.style.overflow = '';
            // Clear src after transition so there's no flash on next open
            setTimeout(() => { lightboxImg.src = ''; }, 200);
        };

        // Open on item click
        items.forEach((item, i) => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => show(i));
        });

        btnClose.addEventListener('click', close);
        btnPrev.addEventListener('click',  (e) => { e.stopPropagation(); show(current - 1); });
        btnNext.addEventListener('click',  (e) => { e.stopPropagation(); show(current + 1); });

        // Click outside image to close
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

        // Keyboard: Esc closes, arrows navigate
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape')     close();
            if (e.key === 'ArrowLeft')  show(current - 1);
            if (e.key === 'ArrowRight') show(current + 1);
        });
    }

    /* =========================================
       Project pages — Lightbox
       Same lightbox overlay as the archive, but
       scoped to images inside .project-content.
       Videos are excluded (already full-width).
       Click any image → full-screen preview.
       X / click-outside / Esc to close.
       ← → arrows or keyboard to step through.
       ========================================= */
    if (document.body.classList.contains('project-body')) {
        const lightbox    = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCap = document.getElementById('lightbox-caption');
        const btnClose    = document.querySelector('.lightbox-close');
        const btnPrev     = document.querySelector('.lightbox-prev');
        const btnNext     = document.querySelector('.lightbox-next');

        // Collect all images inside project content (skip videos)
        const imgs = Array.from(
            document.querySelectorAll('.project-content .project-full-image img')
        );
        let current = 0;

        if (imgs.length && lightbox) {
            const show = (index) => {
                current = (index + imgs.length) % imgs.length;
                const img = imgs[current];
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt;
                lightboxCap.textContent = img.alt || '';
                lightbox.classList.add('open');
                document.body.style.overflow = 'hidden';
            };

            const close = () => {
                lightbox.classList.remove('open');
                document.body.style.overflow = '';
                setTimeout(() => { lightboxImg.src = ''; }, 200);
            };

            // Make each image clickable
            imgs.forEach((img, i) => {
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => show(i));
            });

            btnClose.addEventListener('click', close);
            btnPrev.addEventListener('click',  (e) => { e.stopPropagation(); show(current - 1); });
            btnNext.addEventListener('click',  (e) => { e.stopPropagation(); show(current + 1); });

            lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

            document.addEventListener('keydown', (e) => {
                if (!lightbox.classList.contains('open')) return;
                if (e.key === 'Escape')     close();
                if (e.key === 'ArrowLeft')  show(current - 1);
                if (e.key === 'ArrowRight') show(current + 1);
            });
        }
    }

    /* =========================================
       Archive — lightweight custom masonry
       No external library needed. Tracks each
       column's running height and drops each item
       into whichever column is shortest.
       ========================================= */
    if (document.body.classList.contains('archive-body')) {
        const runMasonry = () => {
            const grid = document.querySelector('.archive-grid');
            if (!grid) return;

            const items = Array.from(grid.querySelectorAll('.archive-item'));
            const COLS = window.innerWidth <= 420 ? 1 : window.innerWidth <= 900 ? 2 : 4;
            const GAP = 8;
            const gridW = grid.clientWidth;
            const colW = (gridW - GAP * (COLS - 1)) / COLS;

            // Track the bottom of each column
            const colHeights = new Array(COLS).fill(0);

            items.forEach(item => {
                const isSpanTwo = item.classList.contains('span-two') && COLS >= 2;

                if (isSpanTwo) {
                    // Find the best adjacent pair: lowest max of two neighbouring columns
                    let bestCol = 0;
                    let bestMax = Infinity;
                    for (let c = 0; c < COLS - 1; c++) {
                        const pairMax = Math.max(colHeights[c], colHeights[c + 1]);
                        if (pairMax < bestMax) { bestMax = pairMax; bestCol = c; }
                    }
                    const x = bestCol * (colW + GAP);
                    const y = bestMax + (bestMax > 0 ? GAP : 0);
                    const w = colW * 2 + GAP;

                    item.style.position = 'absolute';
                    item.style.width = w + 'px';
                    item.style.left = x + 'px';
                    item.style.top = y + 'px';

                    const bottom = y + item.offsetHeight;
                    colHeights[bestCol] = bottom;
                    colHeights[bestCol + 1] = bottom;
                } else {
                    // Find the shortest single column
                    const minH = Math.min(...colHeights);
                    const col = colHeights.indexOf(minH);
                    const x = col * (colW + GAP);
                    const y = minH + (minH > 0 ? GAP : 0);

                    item.style.position = 'absolute';
                    item.style.width = colW + 'px';
                    item.style.left = x + 'px';
                    item.style.top = y + 'px';

                    colHeights[col] = y + item.offsetHeight;
                }
            });

            // Set explicit height so the grid wrapper doesn't collapse
            grid.style.height = Math.max(...colHeights) + GAP + 'px';
        };

        // Wait for all images and videos before laying out.
        const allImgs  = Array.from(document.querySelectorAll('.archive-grid img'));
        const allVids  = Array.from(document.querySelectorAll('.archive-grid video'));
        let loaded = 0;
        const total = allImgs.length + allVids.length;

        const onLoad = () => {
            loaded++;
            if (loaded >= total) runMasonry();
        };

        if (total === 0) {
            runMasonry();
        } else {
            allImgs.forEach(img => {
                if (img.complete) onLoad();
                else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
            });
            allVids.forEach(vid => {
                if (vid.readyState >= 1) onLoad(); // HAVE_METADATA
                else { vid.addEventListener('loadedmetadata', onLoad); vid.addEventListener('error', onLoad); }
            });
        }

        window.addEventListener('resize', runMasonry);

        // ── Scroll-triggered fade-in (IntersectionObserver) ──────────────
        // Items start invisible via CSS (.archive-item { opacity: 0 }).
        // After masonry fires and positions items, the observer watches for
        // each item entering the viewport and adds .is-visible to fade it in.
        // We set this up now; it will fire correctly once items are positioned.
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '0px 0px 80px 0px',
            threshold: 0.01
        });

        document.querySelectorAll('.archive-item').forEach(item => {
            fadeObserver.observe(item);
        });
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
            if (window.innerWidth <= 900) {
                wrightEl.style.top = ''; // let CSS mobile rule take over
                return;
            }
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

// Fix Safari/fallback bfcache back button stuck on opacity 0.
// Also re-trigger the flex layout so stale item widths from before navigation are corrected.
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.remove('page-transitioning');
        document.body.classList.add('page-loaded');
        // Dispatching resize re-runs applyFlexBases and applyImageRows
        // (both registered as resize handlers) with fresh naturalWidth/naturalHeight values.
        window.dispatchEvent(new Event('resize'));
    }
});
