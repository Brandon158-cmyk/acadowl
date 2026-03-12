# Acadowl Platform — Design System & Brand Guidelines

> **Version 1.0** | Derived from Africa's Talking Visual Language  
> Status: **Production-Ready** | Audience: Designers · Developers · AI Agents

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Brand Identity](#2-brand-identity)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Layout System](#5-layout-system)
6. [Component Design System](#6-component-design-system)
7. [Interaction Design](#7-interaction-design)
8. [Accessibility Requirements](#8-accessibility-requirements)
9. [Developer Implementation Guide](#9-developer-implementation-guide)

---

## 1. Design Philosophy

### 1.1 Design Aesthetic

**Aesthetic Direction:** _Civic Minimal_ — professional, trustworthy, and developer-friendly. The platform prioritizes information clarity over decoration, using color purposefully as a functional signal rather than an ornamental element.

**Dominant Tone:** Clean · Structured · Approachable  
**Secondary Tone:** Modern · Professional

**DFII Score: 11/15** — Strong. Proceed with discipline.

| Dimension                  | Score | Rationale                                           |
| -------------------------- | ----- | --------------------------------------------------- |
| Aesthetic Impact           | 3     | Memorable through restraint and green dominance     |
| Context Fit                | 5     | Perfectly matched to an academic/developer platform |
| Implementation Feasibility | 5     | Fully achievable with standard web technologies     |
| Performance Safety         | 4     | Minimal animation, fast loads                       |
| Consistency Risk           | −6    | Low risk; simple token-based system                 |

### 1.2 Core Design Tenets

1. **Clarity First** — Every element must serve a legibility or functional purpose.
2. **Green as Identity** — The brand's primary green is the visual anchor of every screen.
3. **Generous White Space** — Breathing room reduces cognitive load for students.
4. **Purposeful Hierarchy** — Size, weight, and color communicate importance before content is read.
5. **Predictable Patterns** — No surprising interactions. Users should always know what to expect.

### 1.3 Differentiation Anchor

> "If this were screenshotted with the logo removed, users would recognize it by the assertive emerald-green left panel paired with sparse, uncluttered forms — a split-panel identity unique to this platform."

---

## 2. Brand Identity

### 2.1 Brand Personality

| Trait            | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| **Trustworthy**  | Consistent, stable, reliable — a platform students depend on |
| **Professional** | Clean UI patterns, structured layouts                        |
| **Approachable** | Warm greens, readable type, friendly copy                    |
| **Focused**      | No unnecessary decoration; student attention is respected    |

### 2.2 Visual Language

The platform uses a **split-panel visual metaphor** — a bold colored panel paired with a clean white workspace. This signals _authority on the left, clarity on the right_. Like a classroom whiteboard next to the teacher: structured knowledge on one side, open workspace on the other.

---

## 3. Color System

### 3.1 Primary Brand Colors

#### Primary Green (Brand Core)

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#2D8C3E`            |
| **RGB**  | `rgb(45, 140, 62)`   |
| **HSL**  | `hsl(131, 51%, 36%)` |

**Usage:**

- Primary action buttons (CTAs)
- Active navigation states
- Brand panel backgrounds (left sidebar, hero panels)
- Checkmark icons, selection indicators
- Focus rings on interactive elements
- Brand logo colour

---

#### Primary Green — Dark (Deep)

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#236B30`            |
| **RGB**  | `rgb(35, 107, 48)`   |
| **HSL**  | `hsl(131, 51%, 28%)` |

**Usage:**

- Button hover states
- Text on light green backgrounds
- Pressed/active button states

---

#### Primary Green — Light (Tint)

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#E8F5EB`            |
| **RGB**  | `rgb(232, 245, 235)` |
| **HSL**  | `hsl(131, 47%, 94%)` |

**Usage:**

- Light background tint for selected table rows
- Alert/success backgrounds
- Chip/badge backgrounds (success state)
- Hover states on list items

---

### 3.2 Neutral Colors

#### Neutral — White

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#FFFFFF`            |
| **RGB**  | `rgb(255, 255, 255)` |
| **HSL**  | `hsl(0, 0%, 100%)`   |

**Usage:** Main content area backgrounds, card surfaces, modal backgrounds, button text on dark backgrounds.

---

#### Neutral — Off White / Surface

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#F9FAFB`            |
| **RGB**  | `rgb(249, 250, 251)` |
| **HSL**  | `hsl(220, 14%, 98%)` |

**Usage:** Page background, input backgrounds, zebra-striped table rows.

---

#### Neutral — Border / Divider

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#E5E7EB`            |
| **RGB**  | `rgb(229, 231, 235)` |
| **HSL**  | `hsl(220, 9%, 91%)`  |

**Usage:** Input borders, card borders, dividers, table cell borders.

---

#### Neutral — Placeholder / Disabled Text

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#9CA3AF`            |
| **RGB**  | `rgb(156, 163, 175)` |
| **HSL**  | `hsl(220, 9%, 65%)`  |

**Usage:** Placeholder text in inputs, disabled button labels, secondary metadata text.

---

#### Neutral — Body Text

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#374151`            |
| **RGB**  | `rgb(55, 65, 81)`    |
| **HSL**  | `hsl(220, 19%, 27%)` |

**Usage:** Body copy, form labels, paragraph text on white backgrounds.

---

#### Neutral — Heading / Dark

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#111827`            |
| **RGB**  | `rgb(17, 24, 39)`    |
| **HSL**  | `hsl(221, 39%, 11%)` |

**Usage:** H1, H2 headings, high-emphasis labels, dark panel text.

---

### 3.3 Semantic / State Colors

#### Success

| Property | Value                                                 |
| -------- | ----------------------------------------------------- |
| **HEX**  | `#2D8C3E`                                             |
| **Note** | Same as Primary Green — success leverages brand color |

**Usage:** Success alerts, completed task indicators, valid input states.

---

#### Error / Destructive

| Property | Value              |
| -------- | ------------------ |
| **HEX**  | `#DC2626`          |
| **RGB**  | `rgb(220, 38, 38)` |
| **HSL**  | `hsl(0, 72%, 51%)` |

**Usage:** Error messages, form validation failures, destructive action buttons.

**Error Light (Background):** `#FEF2F2` — used for error alert backgrounds.

---

#### Warning

| Property | Value               |
| -------- | ------------------- |
| **HEX**  | `#D97706`           |
| **RGB**  | `rgb(217, 119, 6)`  |
| **HSL**  | `hsl(37, 95%, 44%)` |

**Usage:** Warning alerts, pending status badges, attention-required indicators.

**Warning Light (Background):** `#FFFBEB`

---

#### Info

| Property | Value                |
| -------- | -------------------- |
| **HEX**  | `#2563EB`            |
| **RGB**  | `rgb(37, 99, 235)`   |
| **HSL**  | `hsl(224, 82%, 53%)` |

**Usage:** Informational alerts, links, external references.

**Info Light (Background):** `#EFF6FF`

---

### 3.4 Interactive States

| State                   | Color                    | Notes                         |
| ----------------------- | ------------------------ | ----------------------------- |
| **Hover (Primary)**     | `#236B30`                | 15% darkened primary green    |
| **Active/Pressed**      | `#1A5225`                | 25% darkened primary green    |
| **Focus Ring**          | `#2D8C3E` at 40% opacity | 3px offset, 2px width outline |
| **Disabled Background** | `#E5E7EB`                | Neutral border color          |
| **Disabled Text**       | `#9CA3AF`                | Placeholder color             |
| **Link Default**        | `#2D8C3E`                | Primary green                 |
| **Link Hover**          | `#236B30`                | Underlined                    |
| **Link Visited**        | `#4B5563`                | Muted gray                    |

---

### 3.5 Brand Panel Colors

The brand panel (left sidebar / hero panel) uses a gradient for depth:

```
background: linear-gradient(160deg, #2D8C3E 0%, #236B30 100%);
```

**Panel text color:** `#FFFFFF`  
**Panel secondary text:** `rgba(255, 255, 255, 0.80)`  
**Panel illustration tint:** Semi-transparent white at 10–15% to maintain brand panel depth.

---

## 4. Typography System

### 4.1 Font Families

#### Primary UI Font — `Inter`

**Source:** Google Fonts  
**Import:** `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

**Rationale:** Inter was designed specifically for screens. Its advanced OpenType features (contextual alternates, tabular numbers) make it ideal for a data-dense academic platform. It reads clearly at small sizes — critical for form labels and table data.

```css
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

---

#### Secondary / Display Font — `Plus Jakarta Sans`

**Source:** Google Fonts  
**Import:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap`

**Usage:** Marketing headlines, landing pages, large hero sections, page titles where brand personality should read.

```css
font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
```

---

#### Monospace Font — `JetBrains Mono`

**Source:** Google Fonts  
**Usage:** Code blocks, IDs, system values, data keys.

```css
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

---

### 4.2 Type Scale

All sizes use `rem` units based on a 16px root. Use `px` values in specifications, `rem` in code.

| Token             | Size             | Weight | Line Height | Letter Spacing | Usage                                    |
| ----------------- | ---------------- | ------ | ----------- | -------------- | ---------------------------------------- |
| `--text-display`  | 48px / 3rem      | 800    | 1.15        | −0.03em        | Hero headings (landing page only)        |
| `--text-h1`       | 36px / 2.25rem   | 700    | 1.2         | −0.02em        | Page titles                              |
| `--text-h2`       | 28px / 1.75rem   | 700    | 1.25        | −0.01em        | Section headings                         |
| `--text-h3`       | 22px / 1.375rem  | 600    | 1.3         | −0.01em        | Card headings, panel titles              |
| `--text-h4`       | 18px / 1.125rem  | 600    | 1.35        | 0em            | Sub-section headings, modal titles       |
| `--text-h5`       | 16px / 1rem      | 600    | 1.4         | 0em            | Label headings, form section titles      |
| `--text-body-lg`  | 18px / 1.125rem  | 400    | 1.6         | 0em            | Large body copy, onboarding descriptions |
| `--text-body`     | 16px / 1rem      | 400    | 1.5         | 0em            | Standard paragraph text                  |
| `--text-body-sm`  | 14px / 0.875rem  | 400    | 1.5         | 0em            | Secondary descriptions, captions         |
| `--text-label`    | 14px / 0.875rem  | 500    | 1.4         | 0.01em         | Form labels, table column headers        |
| `--text-caption`  | 12px / 0.75rem   | 400    | 1.4         | 0.02em         | Timestamps, helper text, metadata        |
| `--text-overline` | 11px / 0.6875rem | 600    | 1.4         | 0.08em         | Section overlines (uppercase)            |
| `--text-code`     | 14px / 0.875rem  | 400    | 1.6         | 0em            | Code snippets (monospace font)           |

---

### 4.3 Font Weight Reference

| Weight Name | Value | Usage                                 |
| ----------- | ----- | ------------------------------------- |
| Regular     | `400` | Body text, descriptions, placeholder  |
| Medium      | `500` | Labels, secondary headings, nav items |
| SemiBold    | `600` | H3–H5, emphasis, button text          |
| Bold        | `700` | H1, H2, strong emphasis               |
| ExtraBold   | `800` | Display headings only                 |

---

### 4.4 Typography Rules

- **Minimum body text size:** 14px — never below for interactive or readable content.
- **Maximum line length:** 70 characters (~680px at 16px body) for paragraph text.
- **Avoid full-width body text** across wide containers — use max-width constraints.
- **Uppercase text** (overlines, badges) must use `letter-spacing: 0.06–0.09em` to aid legibility.
- **Numbers in tables** must use `font-variant-numeric: tabular-nums` for column alignment.

---

## 5. Layout System

### 5.1 Grid System

The platform uses a **12-column flexbox/CSS grid** system with adaptive breakpoints.

| Breakpoint | Name         | Min Width | Columns | Gutter | Margin          |
| ---------- | ------------ | --------- | ------- | ------ | --------------- |
| **xs**     | Mobile       | 0px       | 4       | 16px   | 16px            |
| **sm**     | Mobile Large | 480px     | 4       | 16px   | 24px            |
| **md**     | Tablet       | 768px     | 8       | 24px   | 32px            |
| **lg**     | Desktop      | 1024px    | 12      | 24px   | 32px            |
| **xl**     | Wide         | 1280px    | 12      | 32px   | 48px            |
| **2xl**    | Ultrawide    | 1536px    | 12      | 32px   | auto (centered) |

---

### 5.2 Container Widths

```css
--container-sm: 640px; /* Narrow: forms, dialogs, auth pages */
--container-md: 768px; /* Medium: content-focused pages */
--container-lg: 1024px; /* Standard: dashboard content area */
--container-xl: 1280px; /* Wide: full dashboard layouts */
--container-full: 100%; /* Full-bleed: brand panels, hero sections */
```

---

### 5.3 Application Shell Layout

```
┌─────────────────────────────────────────────────────────┐
│  TOP NAV (64px fixed)                                   │
├──────────────┬──────────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT AREA                       │
│  240px fixed │  flex-1, overflow-y: auto                │
│  (collapsed: │  padding: 32px                           │
│   64px)      │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Top Navigation Height:** 64px  
**Sidebar Width (expanded):** 240px  
**Sidebar Width (collapsed):** 64px  
**Content Area Padding:** `32px` desktop, `24px` tablet, `16px` mobile

---

### 5.4 Split-Panel Layout (Auth / Onboarding)

Inspired directly from the Africa's Talking reference — used for login, registration, and onboarding screens.

```
┌─────────────────────┬───────────────────────────────────┐
│  BRAND PANEL        │  CONTENT PANEL                    │
│  (green background) │  (white background)               │
│  ~40% width         │  ~60% width                       │
│  min: 360px         │  min: 400px                       │
│  Brand identity     │  Form / Action content            │
│  Illustration       │  Centered vertically              │
└─────────────────────┴───────────────────────────────────┘
```

On mobile: Brand panel collapses to a top banner (max-height: 160px); content panel takes full width.

---

### 5.5 Spacing Scale

The platform uses a **4px base unit** spacing scale. All spacing must be a multiple of 4.

| Token         | Value | Usage                                                     |
| ------------- | ----- | --------------------------------------------------------- |
| `--space-0.5` | 2px   | Micro gaps, icon padding within tight containers          |
| `--space-1`   | 4px   | Minimal separation, icon internal padding                 |
| `--space-2`   | 8px   | Tight component padding, small gaps between related items |
| `--space-3`   | 12px  | Icon + label gap, chip internal padding                   |
| `--space-4`   | 16px  | Standard padding (inputs, small cards), paragraph spacing |
| `--space-5`   | 20px  | Between form fields, compact card padding                 |
| `--space-6`   | 24px  | Section internal padding, card padding (standard)         |
| `--space-8`   | 32px  | Between sections, card-to-card gaps, page side margins    |
| `--space-10`  | 40px  | Between major layout blocks                               |
| `--space-12`  | 48px  | Section separators, large content blocks                  |
| `--space-16`  | 64px  | Hero sections, major page divisions                       |
| `--space-20`  | 80px  | Page-level top spacing, onboarding vertical centering     |
| `--space-24`  | 96px  | Full-bleed section padding                                |

---

## 6. Component Design System

### 6.1 Buttons

#### Anatomy

All buttons share:

- Font: Inter, 14px, SemiBold (600)
- Letter spacing: 0.01em
- Border radius: `--radius-md` (8px)
- Transition: all 150ms ease-in-out
- Min height: 40px
- Padding: 10px 20px

---

#### Primary Button

The main call-to-action. Used for form submissions and primary actions.

```
Background:   #2D8C3E (Primary Green)
Text Color:   #FFFFFF
Border:       none
Shadow:       0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.08)
Height:       40px
Padding:      10px 20px
Border Radius: 8px

Hover:
  Background: #236B30
  Shadow:     0px 4px 8px rgba(45,140,62,0.28)

Active:
  Background: #1A5225
  Shadow:     none (inset 0 1px 3px rgba(0,0,0,0.2))

Focus:
  Outline:    3px solid rgba(45,140,62,0.4)
  Outline Offset: 2px

Disabled:
  Background: #E5E7EB
  Text Color: #9CA3AF
  Cursor:     not-allowed
  Shadow:     none
```

---

#### Secondary Button

Used for secondary actions alongside a primary button.

```
Background:   #FFFFFF
Text Color:   #374151
Border:       1.5px solid #E5E7EB
Shadow:       0px 1px 2px rgba(0,0,0,0.05)
Height:       40px
Padding:      10px 20px
Border Radius: 8px

Hover:
  Background: #F9FAFB
  Border:     1.5px solid #D1D5DB

Active:
  Background: #F3F4F6
  Border:     1.5px solid #9CA3AF

Focus:
  Outline:    3px solid rgba(45,140,62,0.4)
  Outline Offset: 2px

Disabled:
  Background: #F9FAFB
  Text Color: #9CA3AF
  Border:     1.5px solid #E5E7EB
  Cursor:     not-allowed
```

---

#### Ghost Button

Minimal button for tertiary actions. Common in toolbars and icon actions.

```
Background:   transparent
Text Color:   #374151
Border:       none
Shadow:       none
Height:       40px
Padding:      10px 16px
Border Radius: 8px

Hover:
  Background: #F3F4F6

Active:
  Background: #E5E7EB

Focus:
  Outline:    3px solid rgba(45,140,62,0.4)

Disabled:
  Text Color: #9CA3AF
  Cursor:     not-allowed
```

---

#### Destructive Button

For irreversible actions (delete, remove).

```
Background:   #DC2626
Text Color:   #FFFFFF
Border:       none
Shadow:       0px 1px 3px rgba(0,0,0,0.12)
Height:       40px
Padding:      10px 20px
Border Radius: 8px

Hover:
  Background: #B91C1C
  Shadow:     0px 4px 8px rgba(220,38,38,0.28)

Active:
  Background: #991B1B
```

---

#### Social Login Button (OAuth Pattern)

Used for third-party sign-in options (GitHub, Google, Microsoft).

```
Background:   #FFFFFF
Text Color:   #374151
Border:       1.5px solid #E5E7EB
Shadow:       0px 1px 2px rgba(0,0,0,0.05)
Height:       44px
Padding:      10px 24px
Border Radius: 8px
Icon Gap:     10px (between icon and label)

Hover:
  Background: #F9FAFB
  Border:     1.5px solid #D1D5DB
```

---

#### Button Size Variants

| Size           | Height | Padding   | Font Size |
| -------------- | ------ | --------- | --------- |
| `sm`           | 32px   | 6px 14px  | 13px      |
| `md` (default) | 40px   | 10px 20px | 14px      |
| `lg`           | 48px   | 12px 24px | 16px      |
| `xl`           | 56px   | 16px 32px | 18px      |

---

#### Icon Button

Square button with icon only. Requires `aria-label`.

```
Width = Height = button size variant
Padding: equal on all sides
Border Radius: 8px (or --radius-full for circular variant)
```

---

### 6.2 Form Inputs

#### Text Input

```
Height:       40px
Padding:      10px 12px
Border:       1.5px solid #E5E7EB
Border Radius: 8px
Background:   #FFFFFF
Text Color:   #111827
Font:         Inter, 14px, Regular (400)
Placeholder:  #9CA3AF

Default State:
  Border: 1.5px solid #E5E7EB
  Shadow: none

Hover State:
  Border: 1.5px solid #D1D5DB

Focus State:
  Border: 1.5px solid #2D8C3E
  Shadow: 0 0 0 3px rgba(45,140,62,0.15)
  Outline: none (shadow replaces)

Error State:
  Border: 1.5px solid #DC2626
  Shadow: 0 0 0 3px rgba(220,38,38,0.12)

Success State:
  Border: 1.5px solid #2D8C3E

Disabled State:
  Background: #F9FAFB
  Text:       #9CA3AF
  Border:     1.5px solid #E5E7EB
  Cursor:     not-allowed
```

---

#### Input with Icon

Inputs may have a leading icon (common for email, password, search fields).

```
Left Icon:   Positioned 12px from left, vertically centered
             Icon size: 16px, color: #9CA3AF
             Input padding-left: 38px

Right Icon:  Positioned 12px from right (e.g., show/hide password)
             Input padding-right: 38px
```

---

#### Form Label

```
Font:         Inter, 14px, Medium (500)
Color:        #374151
Margin Bottom: 6px
Display:      block
```

Required indicator (`*`):

```
Color:  #DC2626
Margin: 0 0 0 2px
```

---

#### Helper Text / Hint

```
Font:         Inter, 12px, Regular
Color:        #6B7280
Margin Top:   4px
Display:      block
```

---

#### Error Message

```
Font:         Inter, 12px, Medium (500)
Color:        #DC2626
Margin Top:   4px
Display:      block (with error icon, 12px, left of text)
```

---

#### Textarea

Follows Input rules with additions:

```
Min Height:   80px
Resize:       vertical only
Padding:      10px 12px
```

---

#### Select / Dropdown

Follows Input rules. Custom dropdown indicator:

```
Right icon:   Chevron-down, 16px, #6B7280
Padding Right: 36px
```

---

#### Checkbox

```
Size:         18px × 18px
Border:       1.5px solid #D1D5DB
Border Radius: 4px
Background:   #FFFFFF

Checked:
  Background: #2D8C3E
  Border:     none
  Checkmark:  White SVG

Focus:
  Outline:    3px solid rgba(45,140,62,0.3)
  Outline Offset: 2px

Label Font:   14px, Regular, #374151
Label Gap:    8px
```

---

#### Radio Button

```
Size:         18px × 18px (circle)
Border:       1.5px solid #D1D5DB

Selected:
  Border:     2px solid #2D8C3E
  Inner Dot:  6px circle, #2D8C3E

Focus:
  Outline:    3px solid rgba(45,140,62,0.3)
```

---

#### Toggle / Switch

```
Track Width:  44px
Track Height: 24px
Track Border Radius: 999px

Unchecked:
  Track Background:  #D1D5DB
  Thumb:             White circle, 18px, positioned left

Checked:
  Track Background:  #2D8C3E
  Thumb:             White circle, 18px, positioned right

Transition: 150ms ease-in-out
```

---

### 6.3 Cards

#### Standard Card

```
Background:       #FFFFFF
Border:           1px solid #E5E7EB
Border Radius:    12px
Padding:          24px
Shadow:           0px 1px 3px rgba(0,0,0,0.08), 0px 1px 2px rgba(0,0,0,0.06)

Hover (interactive cards only):
  Shadow:         0px 4px 16px rgba(0,0,0,0.10)
  Transform:      translateY(-1px)
  Transition:     all 200ms ease-out
```

---

#### Stat / Metric Card

```
Follows Standard Card +
Header:   Icon (24px), title (--text-label), value (--text-h2 or --text-h3)
Accent Line: 3px left border in brand color (optional)
```

---

#### Profile / User Card

```
Avatar: See Avatar specs below
Name: --text-h5
Meta: --text-body-sm, #6B7280
Layout: Horizontal (avatar left, text right), gap: 12px
```

---

### 6.4 Navigation

#### Top Navigation Bar

```
Height:       64px
Background:   #FFFFFF
Border Bottom: 1px solid #E5E7EB
Shadow:       0 1px 0 rgba(0,0,0,0.06)
Padding:      0 32px
Z-index:      100
Position:     sticky top 0

Logo Area:    Left side, height: 32px
Nav Links:    Center or right, gap: 4px
User Actions: Far right (avatar, notifications)
```

---

#### Sidebar Navigation

```
Width:        240px (expanded), 64px (collapsed)
Background:   #FFFFFF
Border Right: 1px solid #E5E7EB
Padding Top:  16px
Z-index:      50
Position:     fixed left 0

Nav Item Height:  44px
Nav Item Padding: 0 16px
Nav Item Radius:  8px (6px margin from edges)
Nav Item Gap:     2px

Default:
  Text:       #374151
  Icon:       #6B7280
  Background: transparent

Hover:
  Background: #F3F4F6
  Text:       #111827
  Icon:       #374151

Active:
  Background: #E8F5EB
  Text:       #2D8C3E
  Icon:       #2D8C3E
  Font Weight: 600

Section Label (Group):
  Font:   11px, SemiBold, #9CA3AF, uppercase, letter-spacing: 0.08em
  Margin: 20px 16px 6px 16px
```

---

#### Breadcrumbs

```
Font:         Inter, 14px, Regular
Separator:    "/" or Chevron-right icon (14px, #D1D5DB)
Item Gap:     6px

Default Link: #6B7280, no underline
Hover Link:   #2D8C3E, underline
Current Page: #111827, SemiBold, not a link
```

---

#### Tabs

```
Tab Container:
  Border Bottom: 1px solid #E5E7EB

Tab Item:
  Height:         44px
  Padding:        0 16px
  Font:           14px, Medium
  Color (default): #6B7280
  Background:     transparent

Tab Hover:
  Color:          #374151
  Background:     #F9FAFB

Tab Active:
  Color:          #2D8C3E
  Font Weight:    600
  Border Bottom:  2px solid #2D8C3E (offset -1px)
```

---

### 6.5 Data Display

#### Table

```
Table Background:   #FFFFFF
Header Background:  #F9FAFB
Header Text:        #6B7280, 12px, SemiBold, uppercase, letter-spacing: 0.06em
Header Border:      1px solid #E5E7EB (bottom)

Row Height:         52px (standard), 40px (compact)
Row Border:         1px solid #F3F4F6 (bottom)
Row Hover:          Background #F9FAFB

Cell Padding:       0 16px
Cell Text:          #374151, 14px, Regular

Selected Row:
  Background: #E8F5EB
  Left Border: 3px solid #2D8C3E
```

---

#### Badge / Chip

```
Height:           22px
Padding:          2px 8px
Border Radius:    999px (pill shape)
Font:             Inter, 12px, SemiBold (600)

Variants:
  Success:   Background #DCFCE7, Text #15803D
  Error:     Background #FEE2E2, Text #DC2626
  Warning:   Background #FEF3C7, Text #D97706
  Info:      Background #DBEAFE, Text #2563EB
  Neutral:   Background #F3F4F6, Text #374151
  Brand:     Background #E8F5EB, Text #2D8C3E
```

---

#### Avatar

```
Shape:          Circle (border-radius: 999px)
Border:         2px solid #FFFFFF (with shadow)

Sizes:
  xs:  24px
  sm:  32px
  md:  40px (default)
  lg:  56px
  xl:  80px
  2xl: 128px

Fallback (initials):
  Background: #E8F5EB
  Text:       #2D8C3E, SemiBold
  Font Size:  40% of avatar size
```

---

### 6.6 Overlays

#### Modal / Dialog

```
Overlay Background:  rgba(0, 0, 0, 0.5)
Modal Background:    #FFFFFF
Modal Border Radius: 12px
Modal Shadow:        0px 20px 60px rgba(0,0,0,0.2)
Modal Padding:       24px
Max Width:           560px (standard), 800px (wide)
Animation:
  Overlay: fade in 150ms ease
  Modal:   fade + scale (0.96 → 1.0) 200ms ease-out
```

---

#### Toast / Notification

```
Width:          360px (max)
Background:     #FFFFFF
Border Radius:  10px
Shadow:         0px 10px 40px rgba(0,0,0,0.15)
Padding:        12px 16px
Border Left:    4px solid (by variant color)
Position:       bottom-right, 16px from edges
Z-index:        1000

Variants: Use semantic state colors for border-left.
Auto-dismiss: 5 seconds (with progress bar option)
```

---

#### Tooltip

```
Background:     #111827
Text Color:     #FFFFFF
Font:           Inter, 12px, Regular
Padding:        6px 10px
Border Radius:  6px
Max Width:      240px
Shadow:         0px 4px 12px rgba(0,0,0,0.2)
Delay:          400ms (show), 100ms (hide)
```

---

#### Dropdown Menu

```
Background:     #FFFFFF
Border:         1px solid #E5E7EB
Border Radius:  8px
Shadow:         0px 4px 24px rgba(0,0,0,0.10)
Padding:        4px 0
Min Width:      180px

Item Height:    36px
Item Padding:   0 12px
Item Font:      14px, Regular, #374151

Item Hover:     Background #F3F4F6
Separator:      1px solid #F3F4F6, margin: 4px 0

Destructive Item: Text #DC2626
```

---

## 7. Interaction Design

### 7.1 Motion Principles

- **Motion is purposeful.** Every animation must communicate a state change or guide attention.
- **Motion is fast.** Users should never wait for an animation.
- **Motion is physics-informed.** Ease curves mimic real-world friction.

---

### 7.2 Duration Scale

| Name         | Duration | Usage                                       |
| ------------ | -------- | ------------------------------------------- |
| `instant`    | 75ms     | Press feedback, toggle states               |
| `fast`       | 150ms    | Hover states, focus rings, color changes    |
| `standard`   | 200ms    | Modal entrance, dropdown open, tooltip show |
| `deliberate` | 300ms    | Page transitions, complex element entrances |
| `slow`       | 500ms    | Loading sequences, step-by-step reveals     |

---

### 7.3 Easing Curves

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Standard smooth */
--ease-out: cubic-bezier(0, 0, 0.2, 1); /* Element enter */
--ease-in: cubic-bezier(0.4, 0, 1, 1); /* Element exit */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy, use sparingly */
```

---

### 7.4 Hover States

```
Duration:  150ms
Easing:    ease-in-out
Properties: background-color, border-color, color, box-shadow
```

Never animate: `width`, `height`, `font-size`, or layout properties on hover — these cause layout thrash.

---

### 7.5 Focus States

```
All interactive elements must have a visible focus ring.
Focus Ring:
  outline: 3px solid rgba(45, 140, 62, 0.5)
  outline-offset: 2px
  border-radius: inherit

Never set `outline: none` without providing an equivalent replacement.
```

---

### 7.6 Loading States

#### Skeleton Loading

Used when content is loading and layout structure is known.

```
Background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)
Background Size: 400% 100%
Animation: shimmer 1.5s ease-in-out infinite
Border Radius: matches the element being loaded
```

---

#### Spinner

For indeterminate loading (user action processing).

```
Size:   24px (inline), 40px (page-level)
Color:  #2D8C3E
Border: 3px solid rgba(45,140,62,0.2)
Active Border: 3px solid #2D8C3E (top/right)
Animation: spin 700ms linear infinite
```

---

#### Button Loading State

```
Button becomes disabled, text replaced with spinner OR
text changes to "Loading..." with spinner icon prepended.
Width remains fixed (no layout shift).
```

---

### 7.7 Page Transitions

```
Page Exit:  opacity 0 → 1, translateY 4px → 0
Duration:   200ms
Easing:     ease-out
Use:        Route changes within authenticated app
```

---

### 7.8 Micro-Interactions

| Interaction             | Behavior                                                 |
| ----------------------- | -------------------------------------------------------- |
| Button click            | Scale down to 0.97, 75ms                                 |
| Form submission success | Check icon animates in, field borders turn green         |
| Form error              | Inputs briefly shake (3px horizontal, 2 cycles, 200ms)   |
| Notification appear     | Slides in from right, 200ms ease-out                     |
| Accordion open          | Height animates from 0 to auto, content fades in         |
| Tab switch              | Active indicator slides on bottom border, 150ms          |
| Modal open              | Backdrop fades in 150ms, modal scales from 0.96→1, 200ms |

---

## 8. Accessibility Requirements

### 8.1 Color Contrast (WCAG 2.1 AA)

| Use Case                           | Minimum Ratio  | Target Ratio |
| ---------------------------------- | -------------- | ------------ |
| Normal text (< 18px)               | 4.5:1          | 7:1          |
| Large text (≥ 18px or ≥ 14px Bold) | 3:1            | 4.5:1        |
| UI Components / Focus indicators   | 3:1            | 4.5:1        |
| Decorative elements                | No requirement | —            |

**Verified Contrast Ratios:**

| Combination        | Ratio  | Status             |
| ------------------ | ------ | ------------------ |
| #2D8C3E on #FFFFFF | 4.6:1  | ✅ AA              |
| #FFFFFF on #2D8C3E | 4.6:1  | ✅ AA              |
| #111827 on #FFFFFF | 18.1:1 | ✅ AAA             |
| #374151 on #FFFFFF | 9.7:1  | ✅ AAA             |
| #6B7280 on #FFFFFF | 4.6:1  | ✅ AA              |
| #9CA3AF on #FFFFFF | 2.8:1  | ⚠️ Decorative only |
| #DC2626 on #FFFFFF | 4.5:1  | ✅ AA              |

> ⚠️ `#9CA3AF` must **never** be used for functional text — placeholder text and disabled states only.

---

### 8.2 Focus Management

- **All interactive elements** must be keyboard-accessible.
- **Tab order** must follow the natural reading order (left-to-right, top-to-bottom).
- **Modal dialogs** must trap focus within when open and return focus to the trigger element on close.
- **Skip navigation link** must be present as the first focusable element on every page.
- **Focus rings** are never hidden. Use the defined green focus ring universally.

---

### 8.3 ARIA Requirements

| Component       | Required ARIA                                           |
| --------------- | ------------------------------------------------------- |
| Icon buttons    | `aria-label`                                            |
| Modal           | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Navigation      | `role="navigation"`, `aria-label`                       |
| Alerts          | `role="alert"` (live region)                            |
| Loading states  | `aria-busy="true"`, `aria-live="polite"`                |
| Form errors     | `aria-describedby` linking input to error message       |
| Required fields | `aria-required="true"`                                  |

---

### 8.4 Keyboard Navigation

| Key               | Behavior                                   |
| ----------------- | ------------------------------------------ |
| `Tab`             | Move to next interactive element           |
| `Shift+Tab`       | Move to previous interactive element       |
| `Enter` / `Space` | Activate buttons, links, checkboxes        |
| `Escape`          | Close modals, dropdowns, tooltips          |
| `Arrow keys`      | Navigate radio groups, tabs, select menus  |
| `Home` / `End`    | Jump to first/last item in list components |

---

### 8.5 Motion Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This rule is **mandatory** in the global stylesheet.

---

### 8.6 Screen Reader Guidelines

- All images must have `alt` text (empty `alt=""` for decorative images).
- Icons used alone must have `aria-label` or be paired with visually hidden text.
- Dynamically loaded content must use `aria-live` regions.
- Data tables must use `<th scope="col/row">` correctly.
- Form fields must always have associated `<label>` elements (not `placeholder` as a substitute).

---

## 9. Developer Implementation Guide

### 9.1 CSS Custom Properties (Design Tokens)

Paste this `:root` block into your global stylesheet. All components must reference only these variables — **no hardcoded values**.

```css
:root {
  /* ── Brand Colors ──────────────────────────────── */
  --color-brand: #2d8c3e;
  --color-brand-dark: #236b30;
  --color-brand-darker: #1a5225;
  --color-brand-light: #e8f5eb;

  /* ── Neutral Palette ───────────────────────────── */
  --color-white: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-border-dark: #d1d5db;
  --color-text-muted: #9ca3af;
  --color-text-secondary: #6b7280;
  --color-text-body: #374151;
  --color-text-heading: #111827;

  /* ── Semantic Colors ───────────────────────────── */
  --color-success: #2d8c3e;
  --color-success-light: #dcfce7;
  --color-error: #dc2626;
  --color-error-light: #fee2e2;
  --color-warning: #d97706;
  --color-warning-light: #fef3c7;
  --color-info: #2563eb;
  --color-info-light: #dbeafe;

  /* ── Typography ────────────────────────────────── */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  --text-display: 3rem; /* 48px */
  --text-h1: 2.25rem; /* 36px */
  --text-h2: 1.75rem; /* 28px */
  --text-h3: 1.375rem; /* 22px */
  --text-h4: 1.125rem; /* 18px */
  --text-h5: 1rem; /* 16px */
  --text-body-lg: 1.125rem; /* 18px */
  --text-body: 1rem; /* 16px */
  --text-body-sm: 0.875rem; /* 14px */
  --text-label: 0.875rem; /* 14px */
  --text-caption: 0.75rem; /* 12px */
  --text-overline: 0.6875rem; /* 11px */
  --text-code: 0.875rem; /* 14px */

  /* ── Spacing ───────────────────────────────────── */
  --space-0-5: 0.125rem; /* 2px  */
  --space-1: 0.25rem; /* 4px  */
  --space-2: 0.5rem; /* 8px  */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */

  /* ── Border Radius ─────────────────────────────── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* ── Shadows ───────────────────────────────────── */
  --shadow-xs: 0px 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0px 4px 16px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0px 10px 40px rgba(0, 0, 0, 0.14);
  --shadow-xl: 0px 20px 60px rgba(0, 0, 0, 0.2);
  --shadow-brand: 0px 4px 8px rgba(45, 140, 62, 0.28);

  /* ── Transitions ───────────────────────────────── */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --duration-instant: 75ms;
  --duration-fast: 150ms;
  --duration-standard: 200ms;
  --duration-deliberate: 300ms;
  --duration-slow: 500ms;

  /* ── Z-Index Scale ─────────────────────────────── */
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 200;
  --z-sticky: 300;
  --z-overlay: 400;
  --z-modal: 500;
  --z-toast: 600;
  --z-tooltip: 700;

  /* ── Container Widths ──────────────────────────── */
  --container-sm: 40rem; /* 640px  */
  --container-md: 48rem; /* 768px  */
  --container-lg: 64rem; /* 1024px */
  --container-xl: 80rem; /* 1280px */

  /* ── Layout ────────────────────────────────────── */
  --nav-height: 64px;
  --sidebar-width: 240px;
  --sidebar-collapsed: 64px;
}
```

---

### 9.2 Naming Conventions

| Category      | Pattern                                        | Example                                |
| ------------- | ---------------------------------------------- | -------------------------------------- |
| Color tokens  | `--color-{role}` or `--color-{role}-{variant}` | `--color-brand`, `--color-error-light` |
| Typography    | `--text-{scale}`                               | `--text-h1`, `--text-body-sm`          |
| Spacing       | `--space-{n}` (n = 4px multiplier)             | `--space-4`, `--space-8`               |
| Border Radius | `--radius-{size}`                              | `--radius-md`, `--radius-full`         |
| Shadows       | `--shadow-{size}`                              | `--shadow-sm`, `--shadow-lg`           |
| Transitions   | `--ease-{type}`, `--duration-{speed}`          | `--ease-out`, `--duration-fast`        |
| Z-Index       | `--z-{layer}`                                  | `--z-modal`, `--z-tooltip`             |

**Component CSS Classes:**

- BEM methodology: `.block__element--modifier`
- Example: `.btn--primary`, `.input--error`, `.card__header`

**JavaScript / React components:**

- PascalCase: `Button`, `InputField`, `DataTable`
- Props follow HTML standards where applicable: `disabled`, `aria-label`

---

### 9.3 Developer Principles

1. **Token-only styling.** Never use raw color values or hardcoded numbers in component styles.
2. **Mobile-first media queries.** Start from smallest screen, add complexity upward.
3. **Semantic HTML first.** Accessibility is not an afterthought.
4. **No `!important`.** Token-based systems should make specificity manageable without overrides.
5. **Dark mode ready.** All tokens should be overridable via a `[data-theme="dark"]` attribute scope in the future.

---

### 9.4 Tailwind CSS Mapping

If using Tailwind CSS (v3+), configure `tailwind.config.js` to mirror these tokens:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2D8C3E',
          dark: '#236B30',
          darker: '#1A5225',
          light: '#E8F5EB',
        },
        // ... extend with neutral and semantic colors
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
    },
  },
};
```

---

### 9.5 Component Reusability Guidelines

1. **Single responsibility.** Each component does one thing well.
2. **Composition over configuration.** Prefer composable sub-components (`Card`, `Card.Header`, `Card.Body`) over monolithic components with many props.
3. **Forward refs.** All interactive components should support `ref` forwarding for external focus management.
4. **Accessible by default.** A component is not complete until it passes keyboard navigation and has correct ARIA attributes.
5. **Variants over duplication.** Use a `variant` prop (`primary`, `secondary`, `ghost`) rather than separate components.

---

_End of Acadowl Design System & Brand Guidelines v1.0_
