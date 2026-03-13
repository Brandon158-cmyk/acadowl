# Acadowl Design System & Brand Guidelines

### Version 1.0 — Production Reference

> **Document Purpose:** This is the single source of truth for all visual and interaction design decisions across the Acadowl platform. It is binding for developers, designers, and AI coding agents. Deviations require explicit approval and a documented rationale. Every specification in this document is directly implementable in code.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Brand Identity](#2-brand-identity)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Layout System](#5-layout-system)
6. [Spacing Scale](#6-spacing-scale)
7. [Component Design System](#7-component-design-system)
   - 7.1 Buttons
   - 7.2 Form Inputs
   - 7.3 Cards
   - 7.4 Navigation — Sidebar
   - 7.5 Navigation — Top Bar
   - 7.6 Badges & Status Chips
   - 7.7 Alerts & Notifications
   - 7.8 Tables
   - 7.9 Modals & Dialogs
   - 7.10 Data Widgets & Stat Cards
8. [Interaction Design](#8-interaction-design)
9. [Iconography](#9-iconography)
10. [Illustration Style](#10-illustration-style)
11. [Accessibility Requirements](#11-accessibility-requirements)
12. [Design Tokens — CSS Variables](#12-design-tokens--css-variables)
13. [Tailwind CSS Configuration](#13-tailwind-css-configuration)
14. [Platform Layout Patterns](#14-platform-layout-patterns)
15. [Role-Specific UI Contexts](#15-role-specific-ui-contexts)
16. [Dark Mode Considerations](#16-dark-mode-considerations)
17. [Mobile & Responsive Rules](#17-mobile--responsive-rules)
18. [Component Reusability Guidelines](#18-component-reusability-guidelines)

---

## 1. Design Philosophy

### 1.1 Core Visual Identity

Acadowl's visual identity is derived from and inspired by the **Africa's Talking developer portal** — a trusted, clean, professional African tech platform that communicates confidence and accessibility in equal measure.

The overriding aesthetic is: **"African institutional clarity."** This is not generic enterprise software. It is purposeful, warm, and rooted in the Zambian context — but executed at the precision of a world-class SaaS product.

### 1.2 Design Pillars

| Pillar                  | Meaning                                                                                                               | Anti-pattern                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Clarity**             | Every screen answers one primary question. Information hierarchy is immediate and unambiguous.                        | Dashboard widgets competing for equal visual attention     |
| **Trust**               | Financial data, exam results, and student welfare information demand a visual language that communicates reliability. | Playful, consumer-app aesthetics on fee receipts           |
| **Accessibility-first** | The platform is used on low-end Android phones over 3G. Performance and readability are design features.              | Font sizes below 14px, low-contrast text, heavy animations |
| **Zambian context**     | Currency is ZMW. Names are Zambian. Colours draw from the Zambian flag's green. Language is British English.          | Generic "international" design that ignores local context  |
| **Role awareness**      | A matron's UI is different from a guardian's UI — not just in content but in visual density and technical depth.      | One-size-fits-all interface across all 10 user roles       |

### 1.3 Design Tone by Role

| User Role             | Tone                        | Visual Density                       |
| --------------------- | --------------------------- | ------------------------------------ |
| Platform Admin        | Technical, analytical       | High — power-user density            |
| School Admin / Bursar | Managerial, data-driven     | High — tables, charts, reports       |
| Head Teacher          | Oversight, summary          | Medium — dashboards, alerts          |
| Teacher               | Task-oriented, efficient    | Medium — forms, lists                |
| Matron / Warden       | Welfare-focused, actionable | Medium — status cards, quick actions |
| Driver                | Single-task, large targets  | Low — one action per screen          |
| Guardian              | Consumer-grade, reassuring  | Low — clear summaries, CTAs          |
| Student               | Modern, engaging            | Medium — LMS, progress               |

---

## 2. Brand Identity

### 2.1 Brand Name & Wordmark

**Acadowl** — set in the primary UI font, weight 700. The "Edu" portion may be rendered in the Primary Green; "Zambia" in the dark text colour. In single-colour contexts (print, emboss), render entirely in Primary Green or white.

### 2.2 Logomark

A minimal square mark: the letters **"EZ"** in white, set on a Primary Green (#2D9B4E) rounded-square background. The mark is used at 32×32px in the sidebar header and 24×24px in the mobile nav. Never stretch, recolour, or separate the mark from the wordmark without explicit approval.

### 2.3 Brand Voice

- **Formal but not cold.** Notifications say "Chanda did not board the bus" — not "Alert! Alert!"
- **Active voice.** "You have 3 overdue fees" not "3 fees are overdue."
- **British English.** "Authorise", "cancelled", "enrolment", "organised".
- **Zambian proper nouns.** ZMW not USD. "Grade 12" not "Senior Year." "Term 1" not "Semester."

---

## 3. Color System

### 3.1 Primary Palette

Derived directly from the Africa's Talking reference image. The dominant left-panel green is the anchor.

---

#### Primary Green — Brand Anchor

|         | Value                |
| ------- | -------------------- |
| **HEX** | `#2D9B4E`            |
| **RGB** | `rgb(45, 155, 78)`   |
| **HSL** | `hsl(138, 55%, 39%)` |

**Usage:**

- Primary action buttons
- Active sidebar navigation items
- Focus ring colour
- Link text (default)
- Input border on focus state
- Progress bars and loading indicators
- Badge backgrounds for "success" / "active" states
- Left panel background on split-screen layouts (login, onboarding)

---

#### Primary Green — Dark (Hover / Pressed)

|         | Value                |
| ------- | -------------------- |
| **HEX** | `#217A3C`            |
| **RGB** | `rgb(33, 122, 60)`   |
| **HSL** | `hsl(138, 57%, 30%)` |

**Usage:** Hover state on all Primary Green elements. Pressed/active state.

---

#### Primary Green — Light (Tints)

| Name      | HEX       | Usage                                                                                     |
| --------- | --------- | ----------------------------------------------------------------------------------------- |
| Green-100 | `#E8F5ED` | Input focus background wash, alert background (success), row hover on green-themed tables |
| Green-200 | `#C3E6CF` | Progress bar track, avatar placeholder for active students                                |
| Green-300 | `#7DC897` | Decorative dividers, sparkline fills                                                      |
| Green-50  | `#F2FAF5` | Page background tint on guardian portal (lightweight, warm)                               |

---

### 3.2 Neutral Palette

The right-panel white background and form elements from the reference image anchor the neutral system.

| Name         | HEX       | RGB                | Usage                                                            |
| ------------ | --------- | ------------------ | ---------------------------------------------------------------- |
| **White**    | `#FFFFFF` | `rgb(255,255,255)` | Card backgrounds, modal backgrounds, right panels                |
| **Gray-50**  | `#F9FAFB` | `rgb(249,250,251)` | Page background (admin dashboards), table row alt                |
| **Gray-100** | `#F3F4F6` | `rgb(243,244,246)` | Input background (resting), sidebar background, chip backgrounds |
| **Gray-200** | `#E5E7EB` | `rgb(229,231,235)` | Input borders (resting), dividers, card borders                  |
| **Gray-300** | `#D1D5DB` | `rgb(209,213,219)` | Placeholder icon colour, disabled input border                   |
| **Gray-400** | `#9CA3AF` | `rgb(156,163,175)` | Placeholder text, caption text, helper text                      |
| **Gray-500** | `#6B7280` | `rgb(107,114,128)` | Secondary body text, subheadings                                 |
| **Gray-700** | `#374151` | `rgb(55,65,81)`    | Primary body text                                                |
| **Gray-900** | `#111827` | `rgb(17,24,39)`    | Page titles, table headers, high-emphasis labels                 |

---

### 3.3 Semantic Colours

These are independent of the primary palette and carry universal meaning across the platform.

---

#### Error / Destructive

|         | Value              |
| ------- | ------------------ |
| **HEX** | `#DC2626`          |
| **RGB** | `rgb(220, 38, 38)` |
| **HSL** | `hsl(0, 72%, 51%)` |

| State                    | HEX       |
| ------------------------ | --------- |
| Error Light (background) | `#FEF2F2` |
| Error Border             | `#FCA5A5` |
| Error Hover              | `#B91C1C` |

**Usage:** Form validation errors, destructive action buttons, "not boarded" status chips, overdue fee badges, critical incident alerts.

---

#### Warning

|         | Value               |
| ------- | ------------------- |
| **HEX** | `#D97706`           |
| **RGB** | `rgb(217, 119, 6)`  |
| **HSL** | `hsl(33, 94%, 44%)` |

| State          | HEX       |
| -------------- | --------- |
| Warning Light  | `#FFFBEB` |
| Warning Border | `#FCD34D` |
| Warning Hover  | `#B45309` |

**Usage:** Fee arrears within 7 days, licence expiry warnings, GPS signal degraded, medium at-risk status.

---

#### Info

|         | Value                |
| ------- | -------------------- |
| **HEX** | `#2563EB`            |
| **RGB** | `rgb(37, 99, 235)`   |
| **HSL** | `hsl(221, 83%, 53%)` |

| State       | HEX       |
| ----------- | --------- |
| Info Light  | `#EFF6FF` |
| Info Border | `#93C5FD` |

**Usage:** Informational banners, "on the bus" boarding status, new platform announcements, tooltips.

---

#### Success

Use **Primary Green** (#2D9B4E) for success states, not a separate colour. Reinforces brand consistency.

| State              | HEX                       |
| ------------------ | ------------------------- |
| Success Background | `#E8F5ED` (Green-100)     |
| Success Border     | `#7DC897` (Green-300)     |
| Success Text       | `#2D9B4E` (Primary Green) |

---

### 3.4 State Colours Summary

| State    | Background | Border    | Text      | Icon      |
| -------- | ---------- | --------- | --------- | --------- |
| Default  | `#FFFFFF`  | `#E5E7EB` | `#374151` | `#9CA3AF` |
| Hover    | `#F3F4F6`  | `#D1D5DB` | `#111827` | `#6B7280` |
| Focus    | `#FFFFFF`  | `#2D9B4E` | `#111827` | `#2D9B4E` |
| Disabled | `#F3F4F6`  | `#E5E7EB` | `#9CA3AF` | `#D1D5DB` |
| Error    | `#FEF2F2`  | `#DC2626` | `#DC2626` | `#DC2626` |
| Success  | `#E8F5ED`  | `#2D9B4E` | `#2D9B4E` | `#2D9B4E` |
| Warning  | `#FFFBEB`  | `#D97706` | `#D97706` | `#D97706` |

---

## 4. Typography System

### 4.1 Font Families

#### Primary UI Font — Plus Jakarta Sans

```css
font-family:
  'Plus Jakarta Sans',
  system-ui,
  -apple-system,
  sans-serif;
```

**Rationale:** Plus Jakarta Sans is a modern, highly legible geometric sans-serif with excellent support for African naming conventions (accents, diacritics). It has a warm, confident character that is neither sterile enterprise nor playful consumer. Available on Google Fonts — load via `next/font/google` for zero layout shift.

**Weights loaded:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

---

#### Secondary Display Font — Lexend

```css
font-family: 'Lexend', 'Plus Jakarta Sans', sans-serif;
```

**Usage:** Large page-level headings (H1, H2 on dashboards), print documents (report cards, transcripts, invoices). Lexend was specifically designed to improve reading fluency — appropriate for a platform used in schools.

**Weights loaded:** 600 (SemiBold), 700 (Bold)

---

#### Monospace Font — JetBrains Mono

```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

**Usage:** Student numbers, invoice reference numbers, transaction codes, ZRA Smart Invoice codes, barcode text labels, API keys (platform admin), code blocks in the LMS.

---

### 4.2 Type Scale

All sizes defined in `px` for specification, implemented in `rem` in code (base 16px).

| Token           | Size | rem       | Weight | Line Height | Letter Spacing | Font              | Usage                                        |
| --------------- | ---- | --------- | ------ | ----------- | -------------- | ----------------- | -------------------------------------------- |
| `text-display`  | 40px | 2.5rem    | 700    | 1.2         | -0.02em        | Lexend            | Page hero titles (rare)                      |
| `text-h1`       | 32px | 2rem      | 700    | 1.25        | -0.02em        | Lexend            | Dashboard section titles                     |
| `text-h2`       | 26px | 1.625rem  | 600    | 1.3         | -0.01em        | Lexend            | Card section headings                        |
| `text-h3`       | 20px | 1.25rem   | 600    | 1.4         | 0              | Plus Jakarta Sans | Sub-section headings                         |
| `text-h4`       | 17px | 1.0625rem | 600    | 1.45        | 0              | Plus Jakarta Sans | Widget titles, table group headers           |
| `text-body-lg`  | 16px | 1rem      | 400    | 1.6         | 0              | Plus Jakarta Sans | Primary body copy                            |
| `text-body`     | 15px | 0.9375rem | 400    | 1.6         | 0              | Plus Jakarta Sans | Default UI text, form labels                 |
| `text-body-sm`  | 14px | 0.875rem  | 400    | 1.55        | 0              | Plus Jakarta Sans | Secondary text, helper messages              |
| `text-caption`  | 12px | 0.75rem   | 400    | 1.5         | 0.01em         | Plus Jakarta Sans | Timestamps, metadata labels                  |
| `text-overline` | 11px | 0.6875rem | 600    | 1.4         | 0.08em         | Plus Jakarta Sans | Section labels (UPPERCASE), nav group labels |
| `text-mono`     | 13px | 0.8125rem | 400    | 1.6         | 0              | JetBrains Mono    | Reference codes, IDs                         |

> **Minimum font size rule:** Never render user-facing text below 12px. On the driver PWA and guardian portal (phone-first), body text must be at least 15px.

---

### 4.3 Font Rendering

```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

---

### 4.4 Typographic Colour Pairings

| Context                        | Text Colour               |
| ------------------------------ | ------------------------- |
| Page title, table header       | `#111827` (Gray-900)      |
| Body text, form labels         | `#374151` (Gray-700)      |
| Secondary text, helper text    | `#6B7280` (Gray-500)      |
| Placeholder text               | `#9CA3AF` (Gray-400)      |
| Inverted (on green background) | `#FFFFFF`                 |
| Links                          | `#2D9B4E` (Primary Green) |
| Links on green background      | `#FFFFFF` with underline  |
| Disabled text                  | `#9CA3AF`                 |

---

## 5. Layout System

### 5.1 Grid System

Acadowl uses a **12-column fluid grid** at all breakpoints. Content is never wider than the defined container max-widths.

| Breakpoint | Name         | Min Width | Columns | Gutter | Container Width |
| ---------- | ------------ | --------- | ------- | ------ | --------------- |
| `xs`       | Mobile small | 320px     | 4       | 16px   | 100%            |
| `sm`       | Mobile       | 480px     | 4       | 16px   | 100%            |
| `md`       | Tablet       | 768px     | 8       | 24px   | 100%            |
| `lg`       | Desktop      | 1024px    | 12      | 24px   | 100%            |
| `xl`       | Wide desktop | 1280px    | 12      | 32px   | 1280px          |
| `2xl`      | Ultra wide   | 1536px    | 12      | 32px   | 1400px          |

### 5.2 Page Structure

```
┌────────────────────────────────────────────────────────┐
│  Top Bar (height: 60px, sticky)                         │
├──────────────┬─────────────────────────────────────────┤
│              │                                          │
│  Sidebar     │  Main Content Area                       │
│  (240px)     │                                          │
│              │  ┌──────────────────────────────────┐   │
│              │  │  Page Header (breadcrumb + title) │   │
│              │  └──────────────────────────────────┘   │
│              │                                          │
│              │  ┌──────────────────────────────────┐   │
│              │  │  Page Content                    │   │
│              │  │  (padding: 24px)                  │   │
│              │  └──────────────────────────────────┘   │
│              │                                          │
└──────────────┴─────────────────────────────────────────┘
```

### 5.3 Sidebar Dimensions

| State                   | Width |
| ----------------------- | ----- |
| Expanded                | 240px |
| Collapsed (icons only)  | 64px  |
| Mobile (drawer overlay) | 280px |

### 5.4 Content Region Widths

| Use Case                                      | Max Width            | When                 |
| --------------------------------------------- | -------------------- | -------------------- |
| Single-focus forms (login, OTP, onboarding)   | 480px                | Full-screen centered |
| Standard forms (student enrolment, add staff) | 640px                | Right panel or modal |
| Dashboard content                             | 100% of content area | All admin views      |
| Report card / print preview                   | 794px (A4 at 96dpi)  | PDF preview mode     |
| Transcript                                    | 794px                | PDF preview mode     |

---

## 6. Spacing Scale

Acadowl uses an **8px base unit** with a 4px micro-step. All spacing values are multiples of 4px.

| Token      | Value | Usage                                                           |
| ---------- | ----- | --------------------------------------------------------------- |
| `space-1`  | 4px   | Icon padding, tight inline gaps, badge inner spacing            |
| `space-2`  | 8px   | Button icon gap, input icon left padding, chip spacing          |
| `space-3`  | 12px  | Input vertical padding, small card inner gap                    |
| `space-4`  | 16px  | Standard element gap, form field spacing, card padding (mobile) |
| `space-5`  | 20px  | Button padding (horizontal), list item padding                  |
| `space-6`  | 24px  | Card padding (desktop), section gap within a card               |
| `space-8`  | 32px  | Between-card gap, form section divider, sidebar item group gap  |
| `space-10` | 40px  | Page header bottom margin, large section gaps                   |
| `space-12` | 48px  | Top-of-page margin, hero section padding                        |
| `space-16` | 64px  | Full-section vertical padding, split-screen panel padding       |
| `space-24` | 96px  | Page-level vertical margins on auth screens                     |

### 6.1 When to Use Each Spacing Value

- **4px:** Sub-pixel adjustments, icon-to-label gaps within a single inline component
- **8px:** Minimum comfortable padding inside a chip, badge, or tag
- **12px:** Compact list items, tight forms (bursar/admin dense views)
- **16px:** Default spacing unit. When in doubt, use 16px.
- **24px:** Card padding, sidebar item vertical padding, spacing between form groups
- **32px:** Spacing between major page sections, between stat cards in a row
- **48px:** Vertical padding on marketing/onboarding panels
- **64px:** Left/right padding on full-screen split layouts (login screen panels)

---

## 7. Component Design System

### 7.1 Buttons

#### Primary Button

The primary button is the highest-emphasis action on any screen. Derived directly from the "Log In" button in the reference image — solid green, full-radius, confident.

```
Height:           44px (desktop) / 48px (mobile/touch)
Min Width:        120px
Padding:          0 24px
Border Radius:    8px
Background:       #2D9B4E (Primary Green)
Text Color:       #FFFFFF
Font:             Plus Jakarta Sans, 15px, SemiBold (600)
Letter Spacing:   0.01em
Border:           none
Shadow:           0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)

States:
  Hover:          Background #217A3C, Shadow 0 4px 12px rgba(45,155,78,0.25)
  Active:         Background #1A6130, Shadow none, translate(0, 1px)
  Focus:          Outline 2px solid #2D9B4E, Outline Offset 2px
  Disabled:       Background #C3E6CF, Text #FFFFFF, Cursor not-allowed, Shadow none
  Loading:        Show spinner (white, 16px) + hide label, maintain dimensions
```

**Full-width variant:** When the button spans the full container width (e.g., login form), add `width: 100%`. This is the primary CTA pattern for forms.

---

#### Secondary Button

```
Height:           44px
Padding:          0 24px
Border Radius:    8px
Background:       #FFFFFF
Text Color:       #2D9B4E
Font:             Plus Jakarta Sans, 15px, SemiBold (600)
Border:           1.5px solid #2D9B4E
Shadow:           none

States:
  Hover:          Background #E8F5ED, Border #217A3C, Text #217A3C
  Active:         Background #C3E6CF, translate(0, 1px)
  Focus:          Outline 2px solid #2D9B4E, Outline Offset 2px
  Disabled:       Background #FFFFFF, Border #E5E7EB, Text #9CA3AF
```

---

#### Ghost Button

```
Height:           44px
Padding:          0 20px
Border Radius:    8px
Background:       transparent
Text Color:       #374151
Font:             Plus Jakarta Sans, 15px, Medium (500)
Border:           1.5px solid #E5E7EB
Shadow:           none

States:
  Hover:          Background #F3F4F6, Border #D1D5DB
  Active:         Background #E5E7EB
  Focus:          Outline 2px solid #2D9B4E, Outline Offset 2px
  Disabled:       Text #9CA3AF, Border #E5E7EB
```

---

#### Destructive Button

```
Height:           44px
Padding:          0 24px
Border Radius:    8px
Background:       #DC2626
Text Color:       #FFFFFF
Font:             Plus Jakarta Sans, 15px, SemiBold (600)
Border:           none
Shadow:           0 1px 3px rgba(0,0,0,0.12)

States:
  Hover:          Background #B91C1C
  Active:         Background #991B1B
  Focus:          Outline 2px solid #DC2626, Outline Offset 2px
  Disabled:       Background #FCA5A5, Text #FFFFFF
```

> **Rule:** Destructive buttons must always be preceded by a confirmation dialog. Never place a destructive button as the default action in a form.

---

#### Icon Button (Square)

```
Size:             36px × 36px (sm), 40px × 40px (md), 44px × 44px (lg)
Border Radius:    8px
Background:       transparent
Icon Color:       #6B7280

States:
  Hover:          Background #F3F4F6, Icon Color #374151
  Active:         Background #E5E7EB
  Focus:          Outline 2px solid #2D9B4E
```

---

#### Social Login Button (OAuth provider)

Derived from the GitHub / Google / Microsoft buttons in the reference image.

```
Height:           44px
Padding:          0 20px
Border Radius:    8px
Background:       #FFFFFF
Text Color:       #374151
Font:             Plus Jakarta Sans, 14px, Medium (500)
Border:           1.5px solid #E5E7EB
Shadow:           0 1px 2px rgba(0,0,0,0.06)
Gap:              8px (between logo and label)

States:
  Hover:          Background #F9FAFB, Border #D1D5DB, Shadow 0 2px 6px rgba(0,0,0,0.08)
  Focus:          Outline 2px solid #2D9B4E
```

---

#### Button Size Variants Summary

| Size | Height | Padding H | Font Size | Icon Size | Usage                                     |
| ---- | ------ | --------- | --------- | --------- | ----------------------------------------- |
| `sm` | 32px   | 12px      | 13px      | 14px      | Inline table actions, compact toolbars    |
| `md` | 40px   | 20px      | 14px      | 16px      | Default for most interface contexts       |
| `lg` | 48px   | 24px      | 15px      | 18px      | Primary CTAs, forms, mobile-first screens |
| `xl` | 56px   | 32px      | 16px      | 20px      | Driver PWA single-action screens          |

---

### 7.2 Form Inputs

#### Standard Text Input

Derived from the email and password fields in the reference image — clean bordered fields with icon prefix slots.

```
Height:           48px (desktop), 52px (mobile)
Padding:          12px 16px
Padding Left:     44px (when icon prefix is present)
Border Radius:    8px
Background:       #FFFFFF
Border:           1.5px solid #E5E7EB
Text Color:       #374151
Font:             Plus Jakarta Sans, 15px, Regular (400)
Placeholder:      #9CA3AF

Icon Prefix:
  Size:           18px
  Color:          #9CA3AF (resting), #2D9B4E (focus), #DC2626 (error)
  Position:       Left 14px, vertically centered

States:
  Hover:          Border #D1D5DB
  Focus:          Border 2px solid #2D9B4E, Shadow 0 0 0 3px rgba(45,155,78,0.15)
  Error:          Border 2px solid #DC2626, Shadow 0 0 0 3px rgba(220,38,38,0.15)
  Success:        Border 2px solid #2D9B4E, Icon (✓) shown in suffix position
  Disabled:       Background #F3F4F6, Border #E5E7EB, Text #9CA3AF, Cursor not-allowed
  Read-only:      Background #F9FAFB, Border #E5E7EB
```

---

#### Input Label

```
Font:             Plus Jakarta Sans, 13px, Medium (500)
Color:            #374151
Margin Bottom:    6px
Display:          block

States:
  Required:       Append " *" in #DC2626 after the label text
  Error:          Color #DC2626
  Disabled:       Color #9CA3AF
```

---

#### Helper Text / Validation Message

```
Font:             Plus Jakarta Sans, 12px, Regular (400)
Margin Top:       6px
Default:          Color #6B7280
Error:            Color #DC2626, prepend ✕ icon (12px)
Success:          Color #2D9B4E, prepend ✓ icon (12px)
```

---

#### Textarea

```
Min Height:       100px
Padding:          12px 16px
Border Radius:    8px
Resize:           vertical only
(All other properties identical to text input)
```

---

#### Select / Dropdown

```
Height:           48px
Padding:          12px 40px 12px 16px  (right padding for chevron icon)
Border Radius:    8px
Background:       #FFFFFF
Border:           1.5px solid #E5E7EB
Chevron Icon:     16px, #6B7280, right 14px

States:           (Identical to text input)
Dropdown Panel:
  Background:     #FFFFFF
  Border:         1px solid #E5E7EB
  Border Radius:  8px
  Shadow:         0 4px 16px rgba(0,0,0,0.10)
  Max Height:     280px, scrollable
  Item Height:    40px
  Item Padding:   0 16px
  Item Hover:     Background #F3F4F6
  Item Active:    Background #E8F5ED, Text #2D9B4E
```

---

#### Checkbox

```
Size:             18px × 18px
Border Radius:    4px
Border:           2px solid #D1D5DB
Background:       #FFFFFF

States:
  Hover:          Border #2D9B4E
  Checked:        Background #2D9B4E, Border #2D9B4E, White checkmark (✓)
  Indeterminate:  Background #2D9B4E, Border #2D9B4E, White dash (—)
  Focus:          Outline 2px solid #2D9B4E, Outline Offset 2px
  Disabled:       Background #F3F4F6, Border #E5E7EB
```

---

#### Radio Button

```
Size:             18px × 18px
Border Radius:    50% (circle)
Border:           2px solid #D1D5DB

States:
  Checked:        Outer ring #2D9B4E, Inner filled circle #2D9B4E (10px diameter)
  Focus:          Outline 2px solid #2D9B4E, Outline Offset 2px
```

---

#### Toggle / Switch

```
Track Size:       44px × 24px
Track Radius:     12px (pill)
Thumb Size:       18px × 18px
Thumb Radius:     50%

Off State:        Track #D1D5DB, Thumb #FFFFFF, left 3px
On State:         Track #2D9B4E, Thumb #FFFFFF, right 3px
Transition:       200ms ease-in-out
Focus:            Outline 2px solid #2D9B4E, Offset 2px
Disabled Off:     Track #E5E7EB, Thumb #F3F4F6
Disabled On:      Track #C3E6CF, Thumb #FFFFFF
```

---

#### Search Input

```
(Standard input with search icon prefix and optional clear × button suffix)
Border Radius:    24px (pill shape — search inputs use full pill)
Height:           40px
Background:       #F3F4F6 (no border in resting state)
Border:           1.5px solid transparent

Focus:            Background #FFFFFF, Border 1.5px solid #2D9B4E
```

---

### 7.3 Cards

#### Standard Card

```
Background:       #FFFFFF
Border:           1px solid #E5E7EB
Border Radius:    12px
Shadow:           0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
Padding:          24px

States:
  Hover (interactive): Border #D1D5DB, Shadow 0 4px 12px rgba(0,0,0,0.08), translate(0, -1px)
  Transition:          150ms ease-in-out
```

---

#### Stat / KPI Card

Used on dashboards — bursar fee summary, head teacher attendance overview, transport run summary.

```
Background:       #FFFFFF
Border:           1px solid #E5E7EB
Border Radius:    12px
Shadow:           0 1px 3px rgba(0,0,0,0.06)
Padding:          20px 24px
Min Width:        200px

Structure:
  Icon Container: 40px × 40px, Border Radius 10px, Background (colour by context)
  Label:          12px, SemiBold, UPPERCASE, letter-spacing 0.06em, Gray-500
  Value:          32px, Bold, Lexend, Gray-900
  Delta:          13px, Medium; Green (#2D9B4E) for positive, Red (#DC2626) for negative
                  With ↑ / ↓ icon prepended
  Subtitle:       12px, Regular, Gray-400

Icon Container Colours by Context:
  Financial:      Background #EFF6FF, Icon #2563EB (blue)
  Attendance:     Background #E8F5ED, Icon #2D9B4E (green)
  Transport:      Background #FFFBEB, Icon #D97706 (amber)
  Boarding:       Background #F5F3FF, Icon #7C3AED (violet)
  Academic:       Background #F0FDF4, Icon #16A34A (green-dark)
  Alert:          Background #FEF2F2, Icon #DC2626 (red)
```

---

#### Feature Panel Card (Split-Screen Variant)

Derived from the left green panel in the reference image. Used on login, onboarding wizard left panels, and marketing sections.

```
Background:       #2D9B4E (Primary Green)
Border Radius:    12px (standalone) or 0 (edge-to-edge panel)
Padding:          64px
Text Color:       #FFFFFF

Title:            Lexend, 32px, Bold, White
Body:             Plus Jakarta Sans, 16px, Regular, rgba(255,255,255,0.88)
Checklist Item:   14px, Medium, rgba(255,255,255,0.90), with ✓ icon in white
CTA Link:         White, underline, arrow icon →

Illustration Area: Centred isometric SVG/Lottie, max 60% panel width
```

---

#### Alert Card / Inline Banner

```
Border Radius:    8px
Padding:          14px 16px
Border Left:      4px solid (semantic colour)
Display:          flex, gap 12px

Info:    Background #EFF6FF,  Border #2563EB, Icon #2563EB
Success: Background #E8F5ED,  Border #2D9B4E, Icon #2D9B4E
Warning: Background #FFFBEB,  Border #D97706, Icon #D97706
Error:   Background #FEF2F2,  Border #DC2626, Icon #DC2626

Title:   15px, SemiBold, Gray-900
Body:    14px, Regular, Gray-700
Close:   Icon button, top-right, 14px × 14px
```

---

### 7.4 Navigation — Sidebar

```
Width:            240px (expanded), 64px (collapsed)
Background:       #111827 (Gray-900, dark sidebar)
Padding:          16px 12px
Position:         Fixed left, full height

Logo / Wordmark Area:
  Height:         60px
  Padding:        0 12px
  Logo:           Acadowl mark + wordmark
  Separator:      1px #1F2937 divider below

Navigation Groups:
  Group Label:    10px, SemiBold, UPPERCASE, letter-spacing 0.08em
                  Color: #6B7280 (Gray-500)
                  Padding: 8px 12px 4px 12px
                  (Hidden in collapsed state)

Nav Item:
  Height:         40px
  Padding:        0 12px
  Border Radius:  8px
  Display:        flex, align-items center, gap 12px
  Font:           14px, Medium (500), #9CA3AF (Gray-400)
  Icon:           18px, #6B7280

  Hover:          Background #1F2937, Text #F9FAFB, Icon #D1D5DB
  Active:         Background #2D9B4E (Primary Green), Text #FFFFFF, Icon #FFFFFF
                  Font Weight: 600
  Focus:          Outline 2px solid #2D9B4E, Outline Offset -2px (inside)

Badge (notification count):
  Size:           18px min-width, height 18px, Border Radius 9px (pill)
  Background:     #DC2626 (red)
  Text:           11px, Bold, #FFFFFF

Sidebar Footer:
  Padding:        16px 12px
  Separator:      1px #1F2937 above
  User Avatar:    32px circle, initials if no photo
  User Name:      13px, Medium, #D1D5DB
  User Role:      11px, Regular, #6B7280
  Settings Icon:  18px, right-aligned, #6B7280
```

---

### 7.5 Navigation — Top Bar

```
Height:           60px
Background:       #FFFFFF
Border Bottom:    1px solid #E5E7EB
Padding:          0 24px
Display:          flex, align-items center, justify-content space-between
Position:         Sticky top, z-index 50

Left:   Hamburger (mobile), School name chip
Centre: Global search bar (md+)
Right:  Notifications bell (with badge), User avatar
```

---

### 7.6 Badges & Status Chips

#### Standard Badge

```
Height:           22px
Padding:          0 8px
Border Radius:    4px (rounded square)
Font:             12px, SemiBold (600)
```

| Variant                | Background    | Text      | Border              |
| ---------------------- | ------------- | --------- | ------------------- |
| Default                | `#F3F4F6`     | `#374151` | —                   |
| Green (Active/Success) | `#E8F5ED`     | `#2D9B4E` | —                   |
| Blue (Info)            | `#EFF6FF`     | `#2563EB` | —                   |
| Amber (Warning)        | `#FFFBEB`     | `#D97706` | —                   |
| Red (Error/Critical)   | `#FEF2F2`     | `#DC2626` | —                   |
| Outline                | `transparent` | `#374151` | `1px solid #E5E7EB` |

#### Pill Badge (Status)

```
Height:           24px
Padding:          0 10px
Border Radius:    12px (full pill)
Font:             12px, SemiBold, with 6px dot prefix (optional)
```

**Usage:** Student status (Active · Inactive · Transferred), run status (In Progress · Completed · Delayed), payment status (Paid · Partial · Overdue).

---

### 7.7 Alerts & Notifications

#### Toast Notification (auto-dismiss)

```
Width:            360px
Min Height:       56px
Padding:          14px 16px
Border Radius:    10px
Shadow:           0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)
Position:         Fixed, bottom-right, z-index 9999
Gap between:      8px (stacked toasts)

Structure:
  Icon:           20px, left-aligned, semantic colour
  Title:          14px, SemiBold, Gray-900
  Body:           13px, Regular, Gray-600 (optional)
  Close Button:   Icon button, top-right
  Progress Bar:   2px bottom, Background semantic colour, animated width (auto-dismiss timer)

Success:  Background #FFFFFF, Left border 4px solid #2D9B4E
Error:    Background #FFFFFF, Left border 4px solid #DC2626
Warning:  Background #FFFFFF, Left border 4px solid #D97706
Info:     Background #FFFFFF, Left border 4px solid #2563EB

Appear:   Slide up + fade in, 200ms ease-out
Dismiss:  Fade out + slide down, 150ms ease-in
```

---

### 7.8 Tables

#### Standard Data Table

```
Background:           #FFFFFF
Border:               1px solid #E5E7EB
Border Radius:        12px
Overflow:             hidden

Table Header (thead):
  Background:         #F9FAFB
  Cell Height:        44px
  Padding:            0 16px
  Font:               12px, SemiBold, UPPERCASE, letter-spacing 0.05em, #6B7280
  Border Bottom:      2px solid #E5E7EB

Table Row (tbody tr):
  Height:             52px (default), 44px (dense mode)
  Padding:            0 16px
  Font:               14px, Regular, #374151
  Border Bottom:      1px solid #F3F4F6

  Hover:              Background #F9FAFB
  Selected:           Background #E8F5ED, Border Left 3px solid #2D9B4E
  Clickable Rows:     Cursor pointer

Alternating Rows:     NOT used by default — use hover highlight instead.

Table Footer:
  Background:         #F9FAFB
  Border Top:         1px solid #E5E7EB
  Padding:            12px 16px
  Pagination:         Right-aligned, page size selector + page navigation

Actions Column:       Right-aligned, icon buttons (sm size)
Sortable Column:      Sort icon (↕/↑/↓) on header hover
```

---

### 7.9 Modals & Dialogs

```
Overlay:          rgba(17, 24, 39, 0.50) (Gray-900 @ 50%), backdrop-filter blur(4px)
Container:
  Background:     #FFFFFF
  Border Radius:  16px
  Shadow:         0 20px 60px rgba(0,0,0,0.20)
  Width:
    sm:  440px
    md:  600px
    lg:  800px
    xl:  1000px (data-heavy admin modals)
  Max Height:     90vh, overflow-y: auto
  Padding:        32px

Header:
  Title:          20px, SemiBold, Gray-900
  Close Button:   Icon button, top-right (×, 20px)
  Border Bottom:  1px solid #E5E7EB, margin-bottom 24px

Footer:
  Border Top:     1px solid #E5E7EB, padding-top 24px
  Actions:        Right-aligned flex, gap 12px
                  Cancel (Ghost) | Confirm (Primary) order

Appear:           Scale from 95% to 100% + fade in, 200ms ease-out
Dismiss:          Scale to 97% + fade out, 150ms ease-in
```

---

### 7.10 Data Widgets & Stat Cards

#### Progress Bar

```
Track:        Background #E5E7EB, Height 8px, Border Radius 4px
Fill:         Background #2D9B4E, Border Radius 4px
Transition:   width 400ms ease-in-out

Variants:
  Warning (< 30%):    Fill #D97706
  Danger (< 15%):     Fill #DC2626
  Striped (in progress): Animated diagonal stripe pattern
```

#### Attendance Heatmap

```
Cell Size:     14px × 14px (compact), 18px × 18px (standard)
Border Radius: 3px
Gap:           3px

  Present:      #2D9B4E
  Absent:       #FCA5A5
  Holiday:      #E5E7EB
  No school:    #F3F4F6
  Late:         #FCD34D

Tooltip on hover: Date + status — 12px, Gray-900, Background white, Border 1px Gray-200
```

#### Risk Score Ring (At-Risk Dashboard)

```
Size:          64px × 64px
Track Width:   6px
Track Color:   #E5E7EB

Colour by band:
  Low (< 50):     #2D9B4E
  Medium (50–69): #D97706
  High (≥ 70):    #DC2626

Centre Text:   16px, Bold, Grey-900 (score number)
Animation:     Draw arc from 0 to value, 600ms ease-out on mount
```

---

## 8. Interaction Design

### 8.1 Transition Defaults

```css
/* Default interactive transition */
transition: all 150ms ease-in-out;

/* Colour-only transitions (buttons, links) */
transition:
  background-color 120ms ease,
  color 120ms ease,
  border-color 120ms ease;

/* Layout/position transitions (modals, drawers) */
transition:
  transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
  opacity 200ms ease;

/* Long transitions (page-level) */
transition: opacity 250ms ease-in-out;
```

**Rule:** No transition should exceed 300ms in the main product UI. Longer animations are acceptable on the guardian portal's illustrated pages and the driver PWA onboarding.

---

### 8.2 Hover Behaviours

| Component        | Hover Behaviour                               |
| ---------------- | --------------------------------------------- |
| Primary button   | Darken background to #217A3C, increase shadow |
| Table row        | Background #F9FAFB                            |
| Interactive card | Translate Y -1px, increase shadow             |
| Sidebar nav item | Background #1F2937, text lightens             |
| Link             | Underline appears                             |
| Icon button      | Background tint appears                       |
| Badge            | No hover state — badges are non-interactive   |

---

### 8.3 Focus States

All focusable elements must have a visible focus state. **No `outline: none` without a custom replacement.**

```css
/* Default focus ring */
:focus-visible {
  outline: 2px solid #2d9b4e;
  outline-offset: 2px;
  border-radius: inherit;
}

/* On dark backgrounds (sidebar) */
:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```

---

### 8.4 Loading States

#### Skeleton Loaders

Used when content is loading and the shape is known (tables, cards, stat widgets).

```
Background:     #F3F4F6
Border Radius:  4px (text lines), 8px (cards), 50% (avatars)
Animation:      shimmer — linear-gradient sweep, 1.5s infinite
```

Never use a full-page spinner for initial page load. Use skeletons instead.

#### Inline Loading

For button loading states (form submission in progress):

```
Button disabled:   true
Button content:    replace text with a spinner (white, 16px, 1s linear rotation)
Cursor:            not-allowed
```

#### Full-Screen Loading (rare)

Used only for the first platform load or inter-school navigation.

```
Background:     #FFFFFF
Centre:         Acadowl logomark (EZ mark, 48px) + pulsing opacity 0.4 → 1.0
Duration:       max 3 seconds, then timeout with error state
```

---

### 8.5 Empty States

Every list, table, and dashboard widget must have a designed empty state.

```
Icon:       48px, Gray-300
Title:      16px, SemiBold, Gray-500
Body:       14px, Regular, Gray-400
CTA:        Primary button or secondary link (optional)
Max Width:  320px, centred
Padding:    48px vertical
```

---

### 8.6 Micro-Interactions

| Trigger                                         | Interaction                                             |
| ----------------------------------------------- | ------------------------------------------------------- |
| Form submission success                         | Toast (success) + form fields briefly get green border  |
| Form validation error                           | Fields shake (3 × 4px left-right) + error text fades in |
| Student marked as boarded (driver PWA)          | Green flash on student card, scale 1→1.05→1             |
| Checkbox checked                                | Scale 0.8→1.1→1.0 with spring easing                    |
| Modal open                                      | Scale 0.95→1.0 + opacity 0→1                            |
| Notification badge appears                      | Scale 0→1 with spring bounce                            |
| Real-time data update (GPS ping, live boarding) | Brief pulse ring on updated element                     |

---

## 9. Iconography

### 9.1 Icon Library

**Primary:** `lucide-react` (consistent with the Next.js + React stack, lightweight, MIT licensed)

**Size scale:**

| Use                                      | Size    |
| ---------------------------------------- | ------- |
| Inline with 12px text                    | 12px    |
| Inline with 14px text                    | 14px    |
| Standard UI (buttons, inputs, nav)       | 16–18px |
| Stat card icons                          | 20–22px |
| Feature illustrations (marketing panels) | 24–28px |
| Empty state icons                        | 48px    |

**Stroke width:** 1.5px (the Lucide default) — do not override to 1px or 2px for consistency.

### 9.2 Colour Rules

Icons inherit the text colour of their container by default (`currentColor`). Override only for semantic icons (error = #DC2626, success = #2D9B4E) and decorative icons (Gray-400 for placeholders).

---

## 10. Illustration Style

Illustrations are used in three contexts on Acadowl: auth/onboarding left panels, empty states, and the guardian portal welcome screen.

### 10.1 Style Reference

Isometric flat illustrations — derived directly from the Africa's Talking reference image. The "persons interacting with a large screen/book" motif is the canonical style.

**Palette:** Illustrations use a constrained 5-colour palette:

- Main background shapes: `#E0F0FF` (pale blue)
- Accent shapes: `#2D9B4E` (Primary Green) and `#217A3C` (Dark Green)
- Figures (skin tones): `#8B6A4E` and `#C9956A` — diverse representation is required
- White: `#FFFFFF`
- No black — dark shadows use `#1F2937` at 15% opacity

**Source:** Commission original SVG illustrations in this style. Alternatively, use the **Storyset** "school" and "Africa" sets — they are free for commercial use and match this aesthetic.

**Rule:** Never use emoji as illustration substitutes in production UI. Use lucide icons for functional states; reserve isometric illustrations for marketing/onboarding contexts.

---

## 11. Accessibility Requirements

Acadowl targets **WCAG 2.1 Level AA** compliance across all interfaces.

### 11.1 Colour Contrast

| Text Size                           | Minimum Contrast | Target |
| ----------------------------------- | ---------------- | ------ |
| Body text (≥ 16px)                  | 4.5:1            | 7:1    |
| Large text (≥ 24px or 18.66px Bold) | 3:1              | 4.5:1  |
| UI components and icons             | 3:1              | 4.5:1  |

**Verified pairs:**

- `#374151` on `#FFFFFF` → 9.5:1 ✓
- `#FFFFFF` on `#2D9B4E` → 4.6:1 ✓ (just meets AA — use `#217A3C` if in doubt)
- `#FFFFFF` on `#217A3C` → 6.1:1 ✓
- `#9CA3AF` on `#FFFFFF` → 2.9:1 ✗ — Gray-400 text is **only** permitted for placeholders and non-essential metadata (never for body copy)
- `#6B7280` on `#FFFFFF` → 4.6:1 ✓

### 11.2 Focus Indicators

- All focusable elements must show a 2px visible focus ring in `#2D9B4E`
- Focus ring must have minimum 3:1 contrast against adjacent colours
- Sidebar focus ring: `#FFFFFF` on dark background
- `outline: none` is forbidden without a `box-shadow` or custom border replacement

### 11.3 Keyboard Navigation

- Full keyboard navigation through all interactive elements using Tab / Shift+Tab
- Modals: focus trap active while open; return focus to trigger on close
- Dropdowns: Arrow keys navigate options; Enter selects; Escape closes
- Tables with row actions: Tab navigates to action buttons; Enter triggers default action
- Sidebar: Up/Down arrows navigate items when sidebar is focused

### 11.4 Screen Reader Requirements

- All icon buttons must have `aria-label`
- All form inputs must have `<label for="...">` or `aria-label`
- Error messages linked to inputs via `aria-describedby`
- Dynamic content updates announced via `aria-live="polite"` (toasts, status changes)
- Loading states: `aria-busy="true"` on containers during loading
- Tables must have `<th scope="col">` headers
- Status badges: include visually-hidden text for screen readers (`<span className="sr-only">Status: </span>Boarded`)

### 11.5 Touch Target Sizes

Minimum touch target: **44px × 44px** on all mobile interfaces.

For the driver PWA, minimum target is **56px × 56px** — the driver cannot look at the screen precisely while operating a vehicle.

---

## 12. Design Tokens — CSS Variables

Implement as CSS custom properties at `:root`. The Tailwind config in Section 13 maps to these same values.

```css
:root {
  /* ─── Brand Colours ─── */
  --color-primary: #2d9b4e;
  --color-primary-hover: #217a3c;
  --color-primary-active: #1a6130;
  --color-primary-light: #e8f5ed;
  --color-primary-100: #e8f5ed;
  --color-primary-200: #c3e6cf;
  --color-primary-300: #7dc897;
  --color-primary-50: #f2faf5;

  /* ─── Semantic Colours ─── */
  --color-error: #dc2626;
  --color-error-hover: #b91c1c;
  --color-error-light: #fef2f2;
  --color-error-border: #fca5a5;

  --color-warning: #d97706;
  --color-warning-hover: #b45309;
  --color-warning-light: #fffbeb;
  --color-warning-border: #fcd34d;

  --color-info: #2563eb;
  --color-info-light: #eff6ff;
  --color-info-border: #93c5fd;

  /* ─── Neutral / Gray Scale ─── */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;

  /* ─── Typography ─── */
  --font-primary: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-display: 'Lexend', 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-display: 2.5rem;
  --text-h1: 2rem;
  --text-h2: 1.625rem;
  --text-h3: 1.25rem;
  --text-h4: 1.0625rem;
  --text-body-lg: 1rem;
  --text-body: 0.9375rem;
  --text-body-sm: 0.875rem;
  --text-caption: 0.75rem;
  --text-overline: 0.6875rem;
  --text-mono: 0.8125rem;

  /* ─── Spacing ─── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;

  /* ─── Border Radius ─── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* ─── Shadows ─── */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-green: 0 4px 12px rgba(45, 155, 78, 0.25);

  /* ─── Z-index ─── */
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;

  /* ─── Sidebar ─── */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --topbar-height: 60px;
}
```

---

## 13. Tailwind CSS Configuration

Add to `tailwind.config.ts` in the Acadowl Next.js project:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D9B4E',
          hover: '#217A3C',
          active: '#1A6130',
          50: '#F2FAF5',
          100: '#E8F5ED',
          200: '#C3E6CF',
          300: '#7DC897',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          700: '#374151',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display: ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['2rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['1.625rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        h4: ['1.0625rem', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        body: ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.55', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        overline: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
        'mono-sm': ['0.8125rem', { lineHeight: '1.6', fontWeight: '400' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
        lg: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        xl: '0 20px 60px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.08)',
        green: '0 4px 12px rgba(45,155,78,0.25)',
      },
      transitionDuration: {
        '120': '120ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 14. Platform Layout Patterns

### 14.1 Authentication Layout (Split-Screen)

Derived directly from the Africa's Talking reference image.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌──────────────────────┐  ┌─────────────────────────────┐    │
│  │                      │  │                             │    │
│  │   Green Panel        │  │   White Form Panel          │    │
│  │   (bg: #2D9B4E)      │  │   (bg: #FFFFFF)             │    │
│  │                      │  │                             │    │
│  │   · Illustration     │  │   · Logo (top)              │    │
│  │   · H1 (white)       │  │   · Form title              │    │
│  │   · Body copy        │  │   · Input fields            │    │
│  │   · Feature list     │  │   · Primary CTA button      │    │
│  │   · CTA link →       │  │   · Links                   │    │
│  │                      │  │   · Divider                 │    │
│  │   40% width          │  │   · Social login            │    │
│  │                      │  │                             │    │
│  │                      │  │   60% width                 │    │
│  └──────────────────────┘  └─────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘

Chevron / diagonal separator: 40px wide SVG wedge between panels.
Background pattern on right panel: subtle repeating chevron at 4% opacity, #2D9B4E.
```

### 14.2 Admin Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Top Bar (60px)                                               │
├──────────────┬───────────────────────────────────────────────┤
│              │  Page Header: Title + Breadcrumb + Actions    │
│  Sidebar     ├───────────────────────────────────────────────┤
│  (240px)     │                                               │
│  bg:#111827  │  Stat Cards Row (4 columns, gap: 16px)        │
│              │                                               │
│              ├───────────────────────────────────────────────┤
│              │                                               │
│              │  Main Content (tables, forms, charts)         │
│              │  padding: 24px                                │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

### 14.3 Guardian Portal Layout (Mobile-First)

```
┌────────────────────────┐
│  Top Bar               │
│  bg:#FFFFFF, 56px      │
│  Logo + Notifications  │
├────────────────────────┤
│                        │
│  Content               │
│  padding: 16px         │
│  max-width: 480px      │
│  margin: 0 auto        │
│                        │
├────────────────────────┤
│  Bottom Nav (56px)     │
│  4 tabs: Home / Kids / │
│  Pay / Messages        │
└────────────────────────┘
```

### 14.4 Driver PWA Layout (Single-Task Focus)

```
┌────────────────────────┐
│  Minimal Top Bar       │
│  Route name only       │
├────────────────────────┤
│                        │
│  LARGE CONTENT AREA    │
│  One primary action    │
│  per screen            │
│  No sidebar            │
│  No bottom nav         │
│                        │
├────────────────────────┤
│  Emergency Button      │
│  (fixed bottom, 56px)  │
└────────────────────────┘
```

---

## 15. Role-Specific UI Contexts

| Role           | Layout                 | Sidebar           | Density    | Primary Actions             |
| -------------- | ---------------------- | ----------------- | ---------- | --------------------------- |
| Platform Admin | Admin dashboard        | Dark, full        | Max        | School management, billing  |
| School Admin   | Admin dashboard        | Dark, full        | High       | Student management, reports |
| Bursar         | Admin dashboard        | Dark, full        | High       | Fee collection, invoices    |
| Head Teacher   | Admin dashboard        | Dark, condensed   | Medium     | Analytics, approvals        |
| Teacher        | Teacher layout         | Dark, minimal     | Medium     | Attendance, marks           |
| Matron         | Tablet-optimised admin | Dark, minimal     | Medium     | Boarding, sick bay          |
| Driver         | PWA full-screen        | None              | Very low   | Run active, boarding        |
| Guardian       | Mobile portal          | None (bottom nav) | Low        | Pay, view, message          |
| Student        | Student portal         | None (bottom nav) | Low–Medium | LMS, library, results       |

---

## 16. Dark Mode Considerations

Acadowl does **not** ship a system-level dark mode toggle in the initial platform release. The sidebar is permanently dark (`#111827`) — this provides contrast without full dark-mode complexity.

The driver PWA **does** support an optional night mode (for 18:00–06:00 use, or manual toggle) with these overrides:

```css
/* Driver PWA Night Mode */
--dm-bg: #0f172a;
--dm-surface: #1e293b;
--dm-border: #334155;
--dm-text: #f1f5f9;
--dm-text-muted: #94a3b8;
--dm-primary: #4ade80; /* Lighter green for dark bg contrast */
```

---

## 17. Mobile & Responsive Rules

### 17.1 Breakpoint Behaviour

| Breakpoint | Layout Change                                                                     |
| ---------- | --------------------------------------------------------------------------------- |
| `< 768px`  | Sidebar becomes an overlay drawer; bottom nav appears on guardian/student portals |
| `< 1024px` | Sidebar collapses to icon-only (64px) by default; top search bar hidden           |
| `≥ 1024px` | Full sidebar (240px), full top bar                                                |

### 17.2 Touch-Specific Rules

- All tap targets: minimum 44px × 44px (driver PWA: 56px)
- No hover-only interactions on touch devices — all hover states must have an equivalent tap state
- Swipe to dismiss on toasts and mobile drawers
- Pull-to-refresh on all list views in the guardian and student portals
- No tooltips on mobile — replace with `title` text or inline helper text

### 17.3 Performance Budget (Guardian Portal)

- First Contentful Paint: < 2 seconds on Slow 3G
- Total page weight per route: < 150KB (excluding cached assets)
- System font stack fallback: `system-ui, -apple-system, sans-serif` renders immediately while Plus Jakarta Sans loads
- Images: WebP, lazy-loaded, with `width` and `height` to prevent layout shift

---

## 18. Component Reusability Guidelines

### 18.1 Naming Conventions

```
Components:   PascalCase          ButtonPrimary, StatCard, StudentTableRow
CSS modules:  camelCase           .buttonPrimary, .statCard
Tokens:       kebab-case (CSS)    --color-primary, --radius-md
Props:        camelCase           backgroundColor, borderRadius
```

### 18.2 Component Hierarchy

```
Primitives (atoms)    Button, Input, Badge, Icon, Avatar
Compositions          FormField, StatCard, NavItem, TableCell
Patterns              DataTable, Sidebar, ModalDialog, ToastStack
Templates             LoginPage, DashboardLayout, MobilePortalLayout
```

### 18.3 Variant Pattern (shadcn/ui)

Acadowl uses `shadcn/ui` as the base component library. All visual customisation is applied through the Tailwind config and CSS variables above — never by overriding shadcn component internals.

```typescript
// Correct — override via className prop
<Button className="bg-primary hover:bg-primary-hover">
  Save Changes
</Button>

// Incorrect — never override shadcn internals directly
// (bypasses the design token system)
```

### 18.4 Feature-Gated UI Rules

Every component that renders feature-gated content must:

1. Check the feature flag before rendering — not just before making API calls
2. Render `null` (not an empty placeholder) when the feature is disabled
3. Never crash if the gated feature's data is absent

```typescript
// Pattern for feature-gated UI
{school.features.includes(Feature.TRANSPORT) && (
  <TransportTab studentId={student._id} />
)}
```

### 18.5 Role-Aware Component Rule

Components that differ by role should use a **single component with variant props** — not separate components per role.

```typescript
// Correct
<StudentCard variant="guardian" student={student} />
<StudentCard variant="admin"    student={student} />

// Incorrect — leads to divergent implementations
<GuardianStudentCard student={student} />
<AdminStudentCard    student={student} />
```

---
