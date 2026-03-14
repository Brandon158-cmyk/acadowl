# Acadowl Design System

> A high-contrast, minimal design system for building consistent school management experiences. Built for clarity, speed, and scalability. Heavily inspired by Vercel's Geist design system.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Foundations — Colors](#colors)
3. [Foundations — Typography](#typography)
4. [Foundations — Spacing & Grid](#spacing)
5. [Foundations — Iconography](#iconography)
6. [Components — Buttons](#buttons)
7. [Components — Badges & Status](#badges)
8. [Components — Inputs & Forms](#inputs)
9. [Components — Tables](#tables)
10. [Components — Cards](#cards)
11. [Components — Navigation](#navigation)
12. [Components — Feedback](#feedback)
13. [Patterns — Grades & Results](#grades)
14. [Patterns — Attendance](#attendance)
15. [Design Tokens (CSS Variables)](#tokens)

---

## Design Principles

These four principles govern every decision in the Acadowl design system. When in doubt, return to these.

### 1. Clarity over cleverness

Dense data must be immediately readable. Every design decision should reduce cognitive load, not add to it. If something needs to be explained through UI, it should be redesigned.

### 2. Semantic color only

Color encodes meaning — success, warning, failure, neutral. It is **never** used decoratively. A red element always means an error or critical state. Never use color just to make something look interesting.

### 3. Consistency at every scale

A badge in a table and a badge in a modal are identical. Spacing tokens, typography scales, and radius values are shared globally. Exceptions are rare and intentional.

### 4. Accessible by default

All text meets WCAG AA contrast ratios. Interactive elements are keyboard-navigable. Status is never conveyed by color alone — always paired with a text label or icon.

---

## Colors

### Theme

Acadowl is **dark-first**. The default theme is dark. A light mode may exist but dark is the primary experience.

### Backgrounds

Two background surfaces exist. Use Background 1 as the default page background. Use Background 2 for cards, sidebars, panels, and elevated surfaces.

| Token    | Hex       | Usage                             |
| -------- | --------- | --------------------------------- |
| `--bg-1` | `#0a0a0a` | Page background                   |
| `--bg-2` | `#111111` | Cards, sidebar, elevated surfaces |

### Gray Scale

The foundation of all surfaces, borders, and text. 12 stops from deep black to near-white.

| Token       | Hex       | Usage                            |
| ----------- | --------- | -------------------------------- |
| `--gray-1`  | `#111111` | Deepest surface                  |
| `--gray-2`  | `#1a1a1a` | Card backgrounds, hover states   |
| `--gray-3`  | `#222222` | Active backgrounds               |
| `--gray-4`  | `#2a2a2a` | Dividers, table row borders      |
| `--gray-5`  | `#313131` | Input borders (default)          |
| `--gray-6`  | `#3a3a3a` | Button borders, active borders   |
| `--gray-7`  | `#4e4e4e` | Disabled text, placeholder icons |
| `--gray-8`  | `#666666` | Placeholder text, muted labels   |
| `--gray-9`  | `#888888` | Secondary text, sidebar links    |
| `--gray-10` | `#999999` | Tertiary text, hints             |
| `--gray-11` | `#a8a8a8` | Default body text                |
| `--gray-12` | `#ededed` | Primary text, headings           |

### Semantic Accent Scales

Six accent colors. Each has a vivid stop (9), a text stop (11), and alpha variants for backgrounds.

| Color  | Vivid (9) | Text (11) | 20% Alpha BG            | Usage                                                  |
| ------ | --------- | --------- | ----------------------- | ------------------------------------------------------ |
| Blue   | `#0070f3` | `#52a8ff` | `rgba(0,112,243,0.12)`  | Info, enrolled status, links, primary CTA              |
| Green  | `#47b647` | `#67d46b` | `rgba(71,182,71,0.12)`  | Success, present attendance, passing grades, paid fees |
| Amber  | `#f5a623` | `#ffc757` | `rgba(245,166,35,0.12)` | Warning, at-risk students, overdue, borderline grades  |
| Red    | `#e5484d` | `#ff9592` | `rgba(229,72,77,0.12)`  | Error, absent, failing grades, destructive actions     |
| Purple | `#8a63d2` | `#bf97ff` | `rgba(138,99,210,0.12)` | Exams, special events, admin-only actions              |
| Teal   | `#12a594` | `#0bd8b6` | `rgba(18,165,148,0.12)` | Electives, extracurricular, co-curricular activities   |

### Semantic Color Mapping (School Context)

| Concept                  | Color  | Examples                                                  |
| ------------------------ | ------ | --------------------------------------------------------- |
| Present / Active         | Green  | Attendance marked present, active enrollment              |
| Absent / Fail            | Red    | Absent attendance, failing grade (F), overdue fees        |
| At Risk / Warning        | Amber  | Attendance below threshold, borderline grade (C), pending |
| Enrolled / Info          | Blue   | Normal enrolled status, informational messages            |
| Exam / Special           | Purple | Exam schedules, admin-only records                        |
| Elective / Co-curricular | Teal   | Sport, club, optional subjects                            |
| Inactive / Neutral       | Gray   | Archived records, inactive status                         |

### Usage Rules

- **Never** use color as pure decoration
- **Always** pair color with a text label (e.g., a red badge says "Absent", not just shows red)
- **Never** invent new semantic meanings for colors mid-project
- For borders on colored elements: use the same color at 20–30% alpha on dark backgrounds

---

## Typography

### Typefaces

**Geist Sans** — Used for all UI text, labels, headings, body copy, and button text.

```
font-family: 'Geist', -apple-system, sans-serif;
```

**Geist Mono** — Used exclusively for data values: student IDs, admission numbers, marks, scores, percentages, timestamps, and inline code.

```
font-family: 'Geist Mono', 'Fira Code', monospace;
```

> Both fonts are available from Google Fonts: `https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900`

### Heading Scale

Used to introduce pages and sections. Apply negative letter-spacing at larger sizes.

| Style             | Size | Weight | Letter Spacing | Usage                              |
| ----------------- | ---- | ------ | -------------- | ---------------------------------- |
| Page Title        | 32px | 600    | -0.8px         | Module headings, dashboard titles  |
| Section Heading   | 24px | 600    | -0.5px         | Card headings, modal titles        |
| Sub Heading       | 20px | 600    | -0.3px         | Panel headers, form section labels |
| Component Heading | 16px | 600    | -0.1px         | Widget titles, sidebar labels      |

### Label Scale

Single-line text for UI chrome — menus, buttons, table headers, badges. Ample line-height for icon alignment.

| Style            | Size | Weight | Special                   | Usage                                   |
| ---------------- | ---- | ------ | ------------------------- | --------------------------------------- |
| Label Strong 14  | 14px | 600    | —                         | Table column headers, primary nav items |
| Label Regular 14 | 14px | 400    | —                         | Default UI text, sidebar links          |
| Label 13 Medium  | 13px | 500    | —                         | Table cell text, secondary labels       |
| Label 12 Caps    | 12px | 500    | uppercase, 0.08em spacing | Section dividers, column group headers  |
| Mono 13          | 13px | 400    | Geist Mono                | Student IDs, grades, timestamps         |
| Mono 12          | 12px | 400    | Geist Mono                | Inline record numbers, short codes      |

### Copy Scale

Multi-line body text. Higher line-height (1.65–1.7) than Label for comfortable reading.

| Style   | Size | Line Height | Usage                                                    |
| ------- | ---- | ----------- | -------------------------------------------------------- |
| Copy 16 | 16px | 1.7         | Modals, announcements, detail views with room to breathe |
| Copy 14 | 14px | 1.7         | Default body text, descriptions, notes                   |
| Copy 13 | 13px | 1.65        | Secondary text, tooltips, helper text, metadata          |

### Typography Rules

- Headings: `color: --gray-12`
- Body text: `color: --gray-11`
- Secondary text: `color: --gray-9`
- Placeholder / hint text: `color: --gray-7` or `--gray-8`
- **All data values** (marks, IDs, percentages): `font-family: --font-mono`
- Use negative letter-spacing on headings 20px and above
- Never use font-weight 700 or above in the UI — 600 is the maximum

---

## Spacing & Grid

### Base-4 Spacing Scale

All spacing values are multiples of 4px.

| Token        | Value | Usage                                       |
| ------------ | ----- | ------------------------------------------- |
| `--space-1`  | 4px   | Icon gaps, dense inline padding             |
| `--space-2`  | 8px   | Badge padding, small component gaps         |
| `--space-3`  | 12px  | Button padding, form element spacing        |
| `--space-4`  | 16px  | Compact card padding, table cell padding    |
| `--space-5`  | 20px  | Card header padding                         |
| `--space-6`  | 24px  | Default card body padding, between sections |
| `--space-8`  | 32px  | Sub-section margin tops                     |
| `--space-10` | 40px  | Page section separators, dividers           |
| `--space-16` | 64px  | Top-level page padding                      |

### Border Radius Scale

| Token         | Value  | Usage                                    |
| ------------- | ------ | ---------------------------------------- |
| `--radius-sm` | 4px    | Tags, small inline elements, code chips  |
| `--radius-md` | 6px    | Buttons, inputs, selects                 |
| `--radius-lg` | 8px    | Cards (compact), notices, code blocks    |
| `--radius-xl` | 12px   | Cards (default), modals, panels          |
| pill          | 9999px | Badges, status indicators, avatar stacks |

### Layout Structure

- **Sidebar width:** 240px, fixed, sticky, full viewport height
- **Content max-width:** 860px, centered, `padding: 64px 48px`
- **Sidebar padding:** 24px 0 for the nav, 0 20px for links
- **Card gap in grids:** 1px (use `gap: 1px` on a colored background to create the illusion of thin borders between grid cells)
- **Responsive:** Sidebar collapses below 768px viewport width

---

## Iconography

- Use a single consistent icon library throughout (recommended: Lucide Icons or Heroicons — both have clean, thin strokes that match the Geist aesthetic)
- Icon size: **16px** for inline UI icons, **20px** for standalone action icons
- Icon stroke width: **1.5px** — never filled or heavy
- Icon color: inherits from its text context (`--gray-9` for secondary, `--gray-12` for primary)
- **Never** use icons without an accompanying label for important actions (accessibility)
- Icons in buttons: 16px, gap of 6px between icon and label

---

## Buttons

### Variants

| Variant   | Background  | Border      | Text             | Usage                                                           |
| --------- | ----------- | ----------- | ---------------- | --------------------------------------------------------------- |
| Primary   | `--gray-12` | `--gray-12` | `--bg-1` (black) | Single most important action per screen. Use sparingly.         |
| Secondary | Transparent | `--gray-6`  | `--gray-12`      | Default action button for most interactions                     |
| Ghost     | Transparent | Transparent | `--gray-9`       | Low-emphasis actions, table row actions                         |
| Danger    | Transparent | `--gray-6`  | `--red-11`       | Destructive actions — must always be followed by a confirmation |

### Sizes

| Size    | Height | Font Size | Padding |
| ------- | ------ | --------- | ------- |
| Small   | 28px   | 12px      | 0 10px  |
| Default | 36px   | 14px      | 0 14px  |
| Large   | 44px   | 15px      | 0 20px  |

### States

- **Hover (Primary):** Background lightens to `--gray-10`
- **Hover (Secondary):** Background becomes `--gray-3`
- **Hover (Ghost):** Background becomes `--gray-3`, text becomes `--gray-12`
- **Hover (Danger):** Background becomes `rgba(229,72,77,0.1)`, border becomes `--red-9`
- **Disabled:** `opacity: 0.4`, `cursor: not-allowed`
- **Loading:** Replace label with "Loading…" or a spinner, `cursor: wait`

### Rules

- Only one Primary button per screen section
- Danger buttons must always trigger a confirmation modal before executing
- Button border-radius: `--radius-md` (6px)
- Font: `--font-sans`, weight 500

---

## Badges & Status

### Badges

Inline semantic read-only labels. Never interactive. Always use the correct color for the correct meaning.

```
Structure: pill shape (border-radius: 9999px)
Height: auto (padding: 2px 8px)
Font: 11px, weight 500
Border: 1px solid (same color at 20% alpha)
Background: same color at 12% alpha
Text: same color at "11" stop (light variant)
```

| Variant | Background       | Border           | Text          | When to use                          |
| ------- | ---------------- | ---------------- | ------------- | ------------------------------------ |
| Gray    | `--gray-3`       | `--gray-5`       | `--gray-10`   | Inactive, archived, neutral state    |
| Blue    | Blue 12% alpha   | Blue 20% alpha   | `--blue-11`   | Enrolled, in progress, informational |
| Green   | Green 12% alpha  | Green 20% alpha  | `--green-11`  | Present, passed, active, paid        |
| Amber   | Amber 12% alpha  | Amber 20% alpha  | `--amber-11`  | At risk, late, warning, pending      |
| Red     | Red 12% alpha    | Red 20% alpha    | `--red-11`    | Absent, failed, suspended, overdue   |
| Purple  | Purple 12% alpha | Purple 20% alpha | `--purple-11` | Exam, admin, special event           |
| Teal    | Teal 12% alpha   | Teal 20% alpha   | `--teal-11`   | Elective, sport, club                |

Badges may include a 5px dot indicator before the label for live/dynamic states (Present, At Risk, Absent, etc.).

### Status Dots

Used in tables and entity lists for at-a-glance live status. Always paired with a text label.

| State              | Color       | Glow                        | When to use                       |
| ------------------ | ----------- | --------------------------- | --------------------------------- |
| Online / Active    | `--green-9` | `rgba(71,182,71,0.2)` ring  | Active session, present           |
| Warning            | `--amber-9` | `rgba(245,166,35,0.2)` ring | Below threshold, attention needed |
| Error / Critical   | `--red-9`   | `rgba(229,72,77,0.2)` ring  | Suspended, critical flag          |
| Offline / Inactive | `--gray-7`  | None                        | Archived, inactive                |

Size: 8px diameter, `border-radius: 50%`.

### Grade Tiles

Compact monospaced grade indicators for results tables. Square tiles with rounded corners.

| Grade       | Background      | Text         | When to use |
| ----------- | --------------- | ------------ | ----------- |
| A / A+      | Green 15% alpha | `--green-11` | 75–100%     |
| B / B+ / B− | Blue 15% alpha  | `--blue-11`  | 60–74%      |
| C / C+ / C− | Amber 15% alpha | `--amber-11` | 45–59%      |
| F           | Red 15% alpha   | `--red-11`   | Below 45%   |

```
Size: 28×28px minimum (wider for two-character grades like A+)
Font: --font-mono, 13px, weight 700
Border-radius: --radius-sm (6px)
```

### Attendance Codes

Consistent single-letter codes used in register views:

| Code | Badge Color | Meaning        |
| ---- | ----------- | -------------- |
| P    | Green       | Present        |
| A    | Red         | Absent         |
| L    | Amber       | Late           |
| E    | Blue        | Excused        |
| H    | Gray        | Public Holiday |

---

## Inputs & Forms

### Input Field

```
Height: 36px
Background: --gray-2
Border: 1px solid --gray-5 (default), --gray-9 (focus)
Border-radius: --radius-md (6px)
Font: --font-sans, 14px
Color: --gray-12
Placeholder color: --gray-7
Padding: 0 12px
Transition: border-color 0.15s
```

### Select

Same dimensions as Input. Uses a custom chevron SVG background. No native OS styling (`appearance: none`).

### Textarea

Same border and background as Input. `padding: 8px 12px`. `resize: vertical` only.

### Form Structure

```
Label: 12px, weight 500, color --gray-11, margin-bottom 6px
Input: full width within its column
Helper text: 11px, color --gray-8, margin-top 6px
Error text: 11px, color --red-11, margin-top 6px
Error state: input border becomes 1px solid --red-9
```

### Form Layout Rules

- Labels are always above their input, never inline or floating
- Use a max-width of 320px for single-column form fields (unless a wider field is contextually justified, e.g. address or notes)
- Group related fields visually using spacing, not box borders
- Required fields: append `*` to the label in `--red-11`
- Disabled fields: `opacity: 0.5`, `cursor: not-allowed`

---

## Tables

The primary data display primitive in Acadowl. Used for student lists, grade books, attendance registers, fee records, and more.

### Structure

```
Font: 13px, --gray-11
Header: 11px, font-weight 600, uppercase, letter-spacing 0.06em, color --gray-8
Row border: 1px solid --gray-3 (between rows), 1px solid --gray-4 (header bottom)
Row hover: background becomes --gray-2
Cell padding: 12px 16px (td), 8px 16px (th)
```

### Column Types

| Type                  | Font                  | Color       | Notes                               |
| --------------------- | --------------------- | ----------- | ----------------------------------- |
| Primary (name, title) | Sans 13px, weight 500 | `--gray-12` | First meaningful column             |
| Secondary (metadata)  | Sans 13px, weight 400 | `--gray-11` | Dates, descriptions                 |
| Mono (IDs, marks, %)  | Mono 12px             | `--gray-9`  | All numeric data values             |
| Badge column          | —                     | —           | Status, grade, enrollment           |
| Action column         | —                     | —           | Ghost buttons, always right-aligned |

### Rules

- Tables never use alternating row background colors — use 1px dividers only
- The action column (View, Edit, Delete) is always the rightmost column, right-aligned
- Student/teacher name cells use an Avatar + name + secondary info (e.g., email) stacked
- Progress bars inside table cells: 80px wide, 4px height, `--gray-4` track

### Avatar in Tables

```
Size: 32×32px, border-radius: 50%
Background: semantic color at 15% alpha (assigned per student, consistent)
Text: initials, 12px, weight 600, semantic color at "11" stop
```

---

## Cards

### Base Card

```
Background: --gray-2
Border: 1px solid --gray-4
Border-radius: --radius-xl (12px)
Overflow: hidden
```

### Card Header

```
Padding: 16px 20px
Border-bottom: 1px solid --gray-4
Display: flex, align-items: center, justify-content: space-between
Title: 14px, weight 600, --gray-12
Subtitle: 12px, --gray-9
```

### Card Body

```
Padding: 20px
```

### Stat Cards

Used for summary metrics on dashboards.

```
Background: --gray-2
Border: 1px solid --gray-4
Border-radius: --radius-xl
Padding: 20px 24px

Label: 12px, --gray-8, margin-bottom 8px
Value: 28px, weight 600, letter-spacing -1px, --gray-12
Delta: 12px
  - Positive delta: --green-11
  - Negative delta: --red-11
  - No change: --gray-8
```

Stat cards are grouped in a tight grid with `gap: 1px` on a `--gray-4` background to create seamless borders between cells.

### Entity Card (Student / Teacher Profile)

Used for profile summaries. Combines avatar, name, status badge, and a definition list of key details.

Definition list inside cards:

```
Two-column grid: 180px key column, 1fr value column
Gap: 1px, background: --gray-4 (creates cell borders)
Key: --gray-2 bg, 12px, weight 600, --gray-10, font-mono
Value: --gray-2 bg, 13px, --gray-11
```

---

## Navigation

### Sidebar

```
Width: 240px
Background: --bg-1
Border-right: 1px solid --gray-4
Position: sticky, height: 100vh
Padding: 24px 0 40px
```

Logo area:

```
Padding: 0 20px 24px
Border-bottom: 1px solid --gray-4
Logo mark: 24×24px, --gray-12 background, border-radius 4px
Logo name: 14px, weight 600, --gray-12, letter-spacing -0.3px
```

Section labels (group headings):

```
Font: 11px, weight 600, uppercase, letter-spacing 0.08em
Color: --gray-8
Padding: 4px 20px
```

Nav links:

```
Font: 13px, color: --gray-9
Padding: 5px 20px
Border-left: 2px solid transparent
Hover: color --gray-12, background --gray-2
Active: color --gray-12, border-left-color --gray-12, background --gray-2
```

### Tabs

```
Display: flex
Border-bottom: 1px solid --gray-4
Tab padding: 10px 16px
Font: 13px, weight 500
Default color: --gray-8
Hover: --gray-11
Active: --gray-12, border-bottom 2px solid --gray-12 (overhangs by 1px)
```

### Breadcrumb

```
Font: 12px
Links: --gray-9 (hover: --gray-12)
Separator: / in --gray-6
Current page: --gray-12
Display: flex, align-items: center, gap: 6px
```

### Keyboard Shortcuts (kbd)

```
Height: 20px, min-width: 20px, padding: 0 5px
Border-radius: 4px
Font: 11px, --font-sans
Background: --gray-3
Border: 1px solid --gray-6
Color: --gray-10
Box-shadow: 0 1px 0 0 --gray-6 (bottom shadow for depth)
```

---

## Feedback

### Notices (Inline Alerts)

Used for contextual information within page content. Not dismissible. Four variants.

```
Border-radius: --radius-lg (8px)
Border: 1px solid (color-specific)
Padding: 12px 16px
Font: 13px
Display: flex, gap: 10px, align-items: flex-start
```

| Variant | Background     | Border          | Text Color   | Icon |
| ------- | -------------- | --------------- | ------------ | ---- |
| Info    | Blue 8% alpha  | Blue 30% alpha  | `--blue-11`  | ℹ    |
| Warning | Amber 8% alpha | Amber 30% alpha | `--amber-11` | ⚠    |
| Error   | Red 8% alpha   | Red 30% alpha   | `--red-11`   | ✕    |
| Success | Green 8% alpha | Green 30% alpha | `--green-11` | ✓    |

### Toasts

Transient notifications that appear at bottom-right (or top-right) of the screen. Auto-dismiss after 4–5 seconds.

```
Background: --gray-2
Border: 1px solid --gray-5
Border-radius: --radius-xl (12px)
Padding: 12px 16px
Width: 320px
Box-shadow: 0 8px 24px rgba(0,0,0,0.4)
Font: 13px

Structure:
  - Icon: 18×18px circle, semantic color bg + icon
  - Message: --gray-12, font weight 500
  - Sub-text: --gray-8, 12px (optional)
  - Close button: × in --gray-7
```

### Modal

```
Overlay: rgba(0,0,0,0.7)
Modal background: --gray-2
Border: 1px solid --gray-5
Border-radius: --radius-xl
Max-width: 420px (default), 560px (large), 680px (wide)
Overflow: hidden

Header: padding 20px 24px 16px, border-bottom 1px solid --gray-4
  Title: 15px, weight 600, --gray-12
  Sub: 12px, --gray-9
  Close button: ×, 18px, --gray-8

Body: padding 20px 24px

Footer: padding 16px 24px, border-top 1px solid --gray-4
  Buttons: right-aligned, gap 8px
  Always: Cancel (Secondary) + Primary action
  Destructive: Cancel (Secondary) + Danger button
```

### Empty States

When a list or table has no data to show.

```
Container: centered, padding 48px 24px
Icon: 40px, --gray-7 (outline style)
Title: 16px, weight 600, --gray-12, margin-top 16px
Description: 14px, --gray-9, max-width 320px, text-align center, margin-top 8px
CTA button: Secondary or Primary, margin-top 20px (only when an action can resolve the empty state)
```

---

## Grades & Results

### Grade Display Rules

- All marks are displayed in `Geist Mono`
- Format: `score/total` (e.g., `85/100`)
- Out-of values are always shown — never just a raw score
- Percentage equivalents: shown in Mono, one decimal place (e.g., `85.0%`)
- Grade letter: always shown as a Grade Tile alongside the numeric mark
- Color-code the mark itself using the semantic color for that grade band (green for A, blue for B, amber for C, red for F)

### Grade Band Thresholds (Default — configurable per school)

| Grade | Range   | Color       |
| ----- | ------- | ----------- |
| A     | 75–100% | Green       |
| B     | 60–74%  | Blue        |
| C     | 45–59%  | Amber       |
| D     | 35–44%  | Amber (dim) |
| F     | 0–34%   | Red         |

### Results Table Column Order

1. Student name (with avatar)
2. Component marks (CAT 1, CAT 2, etc.) — Mono
3. Exam mark — Mono
4. Total — Mono, weight 600
5. Grade tile
6. Remark badge

---

## Attendance

### Attendance Thresholds (Default)

| Range  | Status   | Color | Action                      |
| ------ | -------- | ----- | --------------------------- |
| ≥ 80%  | Good     | Green | None                        |
| 70–79% | At Risk  | Amber | Queue guardian notification |
| < 70%  | Critical | Red   | Raise intervention flag     |

### Attendance Progress Bar

- Track: 4px height, `--gray-4` background, `border-radius: 2px`
- Fill: uses semantic color based on threshold (Green / Amber / Red)
- Width in table cells: 80px fixed
- Always followed by the percentage value in Mono 12px, `--gray-10`

### Register View

- Columns: Student name, then one column per day (Mon–Fri or calendar dates)
- Each cell: attendance code badge (P / A / L / E)
- Final column: weekly/period total in Mono (e.g., `4/5`)
- Total column color: matches threshold (green/amber/red)

---

## Design Tokens (CSS Variables)

Complete reference. Define in `:root`.

```css
/* ——— Typefaces ——— */
--font-sans: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Geist Mono', 'Fira Code', 'Courier New', monospace;

/* ——— Backgrounds ——— */
--bg-1: #0a0a0a; /* Page background */
--bg-2: #111111; /* Cards, sidebar, elevated surfaces */

/* ——— Gray Scale ——— */
--gray-1: #111111;
--gray-2: #1a1a1a;
--gray-3: #222222;
--gray-4: #2a2a2a;
--gray-5: #313131;
--gray-6: #3a3a3a;
--gray-7: #4e4e4e;
--gray-8: #666666;
--gray-9: #888888;
--gray-10: #999999;
--gray-11: #a8a8a8;
--gray-12: #ededed;

/* ——— Blue ——— */
--blue-9: #0070f3;
--blue-10: #0072f5;
--blue-11: #52a8ff;
--blue-12: #eaf0ff;

/* ——— Green ——— */
--green-9: #47b647;
--green-10: #4cc14c;
--green-11: #67d46b;
--green-12: #e9f9e9;

/* ——— Amber ——— */
--amber-9: #f5a623;
--amber-10: #ffb224;
--amber-11: #ffc757;
--amber-12: #fff9ed;

/* ——— Red ——— */
--red-9: #e5484d;
--red-10: #ec5d5e;
--red-11: #ff9592;
--red-12: #ffeaea;

/* ——— Purple ——— */
--purple-9: #8a63d2;
--purple-10: #9e77de;
--purple-11: #bf97ff;
--purple-12: #f4f0ff;

/* ——— Teal ——— */
--teal-9: #12a594;
--teal-10: #0eb39e;
--teal-11: #0bd8b6;
--teal-12: #e7fdf9;

/* ——— Border Radius ——— */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;

/* ——— Spacing ——— */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-16: 64px;
```

---

## Quick-Reference Cheatsheet

### "What component do I use for…"

| Need                             | Component                       |
| -------------------------------- | ------------------------------- |
| Show student status at a glance  | Badge (Green/Amber/Red)         |
| Show a grade letter              | Grade Tile                      |
| Show attendance %                | Progress Bar + Mono text        |
| Show a daily attendance mark     | Attendance Code Badge (P/A/L/E) |
| Show a live online/offline state | Status Dot                      |
| Show a list of students          | Data Table                      |
| Show a student's full profile    | Entity Card                     |
| Show dashboard summary numbers   | Stat Card Grid                  |
| Confirm a destructive action     | Modal with Danger button        |
| Show a system alert inline       | Notice                          |
| Show a quick success/error       | Toast                           |
| Show empty list state            | Empty State                     |
| Primary navigation               | Sidebar                         |
| Sub-page navigation              | Tabs                            |
| Show current location            | Breadcrumb                      |

### "What color do I use for…"

| Situation                  | Color        |
| -------------------------- | ------------ |
| Student is present         | Green        |
| Student is absent          | Red          |
| Student is late            | Amber        |
| Grade is A or B            | Green / Blue |
| Grade is C                 | Amber        |
| Grade is F                 | Red          |
| Fee is paid                | Green        |
| Fee is overdue             | Red          |
| Fee is pending             | Amber        |
| It's an exam               | Purple       |
| It's an elective           | Teal         |
| Something is inactive      | Gray         |
| Something is informational | Blue         |

---

_Acadowl Design System · Version 1.0 · Inspired by Vercel Geist_
