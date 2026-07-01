# UI Kit

## Purpose

This document defines the visual system and layout standards for the application.

It governs:

- spacing
- typography
- layout
- cards
- tables
- forms
- badges
- scores
- charts
- interaction hierarchy
- reusable UI components

It does NOT define:

- navigation structure
- dashboard layout modules
- sidebar links
- route structure
- portal permissions
- business logic

Those will be handled separately.

---

# Product Structure

This codebase contains multiple portals:

1. Admin Portal
2. Organization Portal

Both portals must share the same visual system.

Navigation and page structure are configurable per portal and must NOT be hardcoded inside the UI kit.

---

# Brand Feel

The application should feel like a professional investment research platform.

Design tone:

- institutional
- structured
- analytical
- premium
- calm
- data-first
- modern SaaS research terminal

Avoid:

- playful UI
- heavy gradients
- oversized rounded elements
- consumer app styling
- inconsistent spacing
- one-off custom components

---

# Design Principles

1. Data clarity over decoration
2. Dense but readable layouts
3. Strong hierarchy on every page
4. Cards organize sections
5. Tables organize decisions
6. Scores must be scannable
7. Signals must be explainable
8. Components must be reusable
9. Layout must support multiple portals
10. Styling must remain consistent across Admin + Organization portals

---

# Color Palette

Primary:

#163A2E

Accent:

#D6C6A5

Background:

#F8F7F3

Surface:

#FFFFFF

Text Primary:

#111827

Text Secondary:

#6B7280

Muted:

#9CA3AF

Border:

#E5E7EB

Success:

#166534

Warning:

#A16207

Danger:

#B91C1C

Info:

#1D4ED8

---

# Typography

Recommended fonts:

- Inter
- Geist
- Manrope

Page title:

text-3xl font-semibold tracking-tight

Section title:

text-xl font-semibold

Card title:

text-base font-semibold

Body:

text-sm text-gray-700

Muted body:

text-sm text-gray-500

Metric values:

text-2xl font-semibold tracking-tight

Table text:

text-sm

Labels:

text-xs uppercase tracking-wide text-gray-500

---

# Layout System

Main background:

bg-[#F8F7F3]

Card surface:

bg-white border border-gray-200 rounded-2xl shadow-sm

Standard container:

max-w-7xl mx-auto px-6 py-6

Spacing rules:

Page sections:

space-y-6

Card padding:

p-6

Dense card padding:

p-4

Form spacing:

space-y-4

---

# Navigation Rules

Navigation structure is portal-specific.

The UI kit must NOT define sidebar links.

Shared rules:

- Use one Sidebar component
- Use one TopNav component
- Navigation items passed via configuration
- Active state clearly visible
- Icons minimal
- Labels short
- Same spacing across portals

Example pattern:

adminNavItems = []

organizationNavItems = []

---

# Buttons

Primary button:

bg-[#163A2E] text-white hover:bg-[#0F2A22] rounded-xl px-4 py-2 text-sm font-medium

Secondary button:

bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-xl px-4 py-2 text-sm font-medium

Ghost button:

text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2 text-sm

Danger button:

bg-red-700 text-white hover:bg-red-800 rounded-xl px-4 py-2 text-sm font-medium

---

# Cards

Cards organize nearly all content.

Default card:

rounded-2xl border border-gray-200 bg-white shadow-sm p-6

Compact card:

rounded-xl border border-gray-200 bg-white p-4

Card header pattern:

Title  
Short explanation sentence

Cards should group:

- signals
- score breakdowns
- factor groups
- reports
- model sections
- filters
- configuration panels

---

# Tables

Tables are core decision interfaces.

Use tables for:

- rankings
- signals
- factor values
- insider activity
- political activity
- holdings
- watchlists

Header style:

text-xs uppercase tracking-wide text-gray-500 bg-gray-50

Row style:

border-b border-gray-100 hover:bg-gray-50

Cell style:

px-4 py-3 text-sm

Numeric alignment:

text-right tabular-nums

Rules:

- sticky headers preferred
- compact rows
- sortable columns
- score columns visually emphasized

---

# Scores

Score readability is critical.

Score badge base:

inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium

Strong:

bg-green-50 text-green-700 border-green-200

Good:

bg-emerald-50 text-emerald-700 border-emerald-200

Neutral:

bg-gray-50 text-gray-700 border-gray-200

Weak:

bg-red-50 text-red-700 border-red-200

---

# Tags and Signal Labels

Used for:

- signal type
- exposure direction
- activity level
- classification
- factor category

Style:

inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium

Keep labels short.

---

# Forms

Forms must feel structured and professional.

Form section container:

rounded-2xl border border-gray-200 bg-white p-6

Input:

rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm

Label:

text-sm font-medium text-gray-900

Helper text:

text-sm text-gray-500

Group related inputs inside cards.

---

# Empty States

Example pattern:

No items yet.

Create your first item to begin.

Container:

rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center

Empty states should guide action.

---

# Loading States

Use skeleton loaders for:

- tables
- cards
- score panels
- charts

Avoid full-screen spinners.

---

# Charts

Charts must remain analytical and minimal.

Use:

- line charts for score history
- bar charts for factor comparison
- stacked bars for composition
- sparklines inside tables

Avoid decorative charts.

---

# Shared Components

Standardize these components:

AppShell  
Sidebar  
TopNav  
PageHeader  
SectionCard  
MetricCard  
ScoreBadge  
SignalBadge  
DataTable  
FilterPanel  
EmptyState  
LoadingSkeleton  
FormSection  
ActionBar  
InsightPanel  

---

# Cursor Refactor Rules

When refactoring UI:

Do NOT:

- change business logic
- change routes
- change navigation structure
- change API behavior
- move portal boundaries

Do:

- replace one-off styling
- standardize spacing
- standardize typography
- standardize cards
- standardize tables
- standardize buttons
- standardize empty states
- standardize loading states
- support Admin + Organization portals equally

Navigation must remain configuration-driven.
