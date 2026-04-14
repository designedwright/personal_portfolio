# Portfolio Handoff — Charlie Wright

## Project location
`~/Desktop/WEBSITE/personal_portfolio/`
Local preview: `python3 -m http.server 8080 --directory ~/Desktop/WEBSITE/personal_portfolio/` → `localhost:8080/index.html`

---

## Site structure
| File | Purpose |
|---|---|
| `index.html` | Portfolio homepage — 3 projects: NSSA, TANK Magazine, Sleepy Hollow Ranch |
| `nssa.html` | NSSA project page |
| `lanserhof.html` | TANK Magazine project page |
| `shr.html` | Sleepy Hollow Ranch project page |
| `tanya.html` | Tanya Kizko project page (legacy, kept) |
| `archive.html` | Photo/graphic archive with masonry grid + lightbox |
| `contact.html` | Contact page (orange background, character reveal animation) |
| `style.css` | Single stylesheet for the whole site |
| `script.js` | Single script for the whole site |

---

## CSS / JS versioning
- `style.css` is linked with `?v=3` on most pages — bump this if CSS isn't updating
- `script.js` is currently at `?v=9` on all pages — always bump after JS changes

---

## Key layout concepts

### Portfolio homepage grid (`index.html`)
- 4-column CSS grid. Column 1 = WRIGHT sidebar. Columns 2–4 = content.
- Each project has a `.project-grid` (flex, nowrap, overflow:hidden).
- **Josselin equal-height technique**: JS (`applyFlexBases` in script.js) reads each image's natural aspect ratio, computes a shared row height H so all visible images share the same height, and sets `flex-basis = AR × H` on each item. No cropping — images keep natural proportions.
- 3 grid states controlled by +/– buttons:
  - State 0 (–): 5 images visible
  - State 1 (default): 3 images visible
  - State 2 (+): 1 image full width
- `span-two` class on a `.project-item` counts as 2 slots (NSSA first item uses this).
- Grid height is pinned to H via `grid.style.height` to prevent overflow items from creating blank space.
- Load listeners fire `applyFlexBases` again after images/videos load their natural dimensions (important — NSSA first item is a video, uses `loadedmetadata`).
- `pageshow` event re-dispatches resize to fix bfcache restore issues.

### Project detail pages
- `.project-content` spans columns 2–4.
- Full-width images: `.project-full-image`
- Side-by-side pairs: `.project-image-row` containing two `.project-full-image` divs
- **Equal-height rows**: `applyImageRows()` in script.js applies the same Josselin AR maths to `.project-image-row` pairs. All items visible, no overflow. Load/resize listeners included.
- `← portfolio` back link: fixed position, JS-positioned (`positionBackLink`) to the midpoint between the right edge of WRIGHT and the left edge of `.project-content`. Updates on resize. Hidden at ≤900px. Offset by −8px to compensate for arrow glyph visual weight.

### Archive page
- Custom JS masonry (4 columns desktop, 2 tablet, 1 mobile) — `runMasonry()` in script.js.
- `span-two` items span 2 columns in masonry.
- WRIGHT scrolls with page then locks at top on archive (JS-driven `updateWright()`).
- **Lightbox**: click any archive image → full-screen overlay. X to close, ← → arrows or keyboard to navigate. Uses `←` `→` arrows at `1.5rem` to match portfolio back link style.
- Hover states on archive images: `scale(1.02)` + `brightness(0.9)`, cursor: pointer (same as portfolio).

### Contact page
- Orange background (`#f26624`), white text.
- Character-by-character text reveal animation on load.
- SLC clock in nav, abbreviated to "SLC" at ≤530px to prevent overlap.
- Contact info: `justify-self: center; text-align: left`.

---

## Important rules Charlie has set
- **Never crop images** — always preserve natural aspect ratios. The Josselin technique achieves tidy rows without cropping.
- **Never change mobile layout** unless explicitly asked. Mobile (≤900px) shows one image per project, full width, height auto.
- The `← portfolio` back link positioning logic — do not simplify back to a fixed vw value, it must use JS measurement.
- Archive hover states must remain enabled (`scale(1.02)` + `brightness(0.9)`), not disabled.

---

## File naming conventions
- Archive images: `YYYYMMDD_WRIGHT_P_Name.jpg` (photography) or `YYYYMMDD_WRIGHT_Name.jpg` (graphic)
- Project images: `YYYYMMDD_440_[PROJECT]_Name.jpg`
- Files ending in `-s` are secondary/small images, meant for `.project-image-row` pairs on project pages
- Special characters in filenames must be URL-encoded in src attributes: `(` → `%28`, `)` → `%29`, `?` → `%3F`, space → `%20`

---

## Current project image counts
- NSSA: 20
- TANK Magazine: 8
- Sleepy Hollow Ranch: 14

---

## SHR page order (as of last session)
1. PresentationVid (video, full width)
2. Logo (full width)
3. Row: ParatrooperClassPhotoCrop-s + Ranch Gate Crop-s
4. Sign (full width)
5. Row: Shearing-s + Wagon-s
6. LogoAnim (video, full width)
7. BC_Mockup (full width)
8. Row: MarkAndArline-s + ProvoCanyonHerd-s
9. Truck_Mockup (full width)
10. Row: SheepSticker + UtahSticker

---

## Archive — recent additions
Items are ordered newest → oldest. Most recent additions:
- `20260413_WRIGHT_P_HouseGroupChatLogo.jpg` — graphic, 2026 (near bottom)
- `20260216_WRIGHT_P_?.jpg` — photography, 2026
- `20251130_WRIGHT_P_Chase.jpg` — pastels, 2025
- `20220304_WRIGHT_P_Juicy.jpg` — graphic, 2022 (oldest item, double-wide, at very bottom)

---

## Things to keep in mind
- Script version must be bumped (`?v=N`) any time script.js changes, on every HTML file that uses it
- The NSSA project on index.html uses **videos** as its first two items — always add `loadedmetadata` listeners for videos alongside `load` listeners for images
- `applyFlexBases` and `applyImageRows` both need mobile guards (`window.innerWidth <= 900`) that reset inline styles and return early
