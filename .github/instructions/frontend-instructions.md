---
applyTo: "**/frontend/**" 
---

# Copilot Frontend Instructions — Inventory Management System

## Purpose

You are a **senior frontend developer**, obsessed with maintainable, reusable, and well-structured components.
These instructions define **global frontend standards** for the Inventory Management System. All frontend code must adhere to these standards to ensure **consistency, usability, accessibility, and performance** across the entire app.

---

## Stack Assumptions

* **Framework:** React (TypeScript)
<!-- * **State Management:** React Query / Zustand / Pinia / Vue Query (depending on feature stack)v -->
* **UI Components:** Material UI, Chakra UI, or Tailwind + custom components
* **Routing:** React Router / Vue Router
* **Forms:** React Hook Form or Formik
* **Tables & Lists:** Material UI DataGrid, TanStack Table, AG-Grid
* **Virtualization:** React-Window / React-Virtualized for large lists

---

## Component Architecture

### General Principles

* Components must be **modular, stateless where possible, and controlled**.
* All data mutations happen via **callbacks/events**; do not manipulate global state inside a component.
* Components must have **typed props** and exported **TypeScript interfaces**.
* **JSDoc** for all interactive components explaining accessibility, expected behavior, and keyboard interactions.
* Every interactive element must include a `data-testid` or `data-test` for testing.
* Design components to be **reusable across features** (no hardcoded labels, categories, or filters).

---

## Interaction & Layout Guidelines

### Tables / Lists

* **Server-side pagination** for datasets > 200 items.
* **Debounced search**: 300–500ms for input fields.
* Each row shows required data (name, SKU, category, tags, stock, status, actions).
* **Keyboard navigation**: Arrow keys for row movement, Enter to select, Esc to close panels.
* **Row selection** triggers a controlled panel (drawer/collapse) with focus trap.
* Highlight selected row visually and via `aria-selected`.

### Panels / Drawers

* Controlled props: `isOpen`, `onClose`, `initialFocusRef`, `title`.
* Focus moves to the first interactive element when opened; returns to trigger when closed.
* Should display **contextual info** (e.g., "Add Stock — Product X").
* Use smooth transitions (<200ms) and **avoid layout shifts**.

### Filters

* Filters must be **keyboard accessible** and linked to list/table via `aria-controls`.
* Multi-selects and dropdowns must announce selection count.
* Include a **clear/reset filters** action.
* Show **active filters** as chips or tags.

### Loading, Empty & Error States

* Every list/table must have:

  * **Loading**: skeleton rows or spinner
  * **Empty**: illustration, message, primary CTA
  * **Error**: message + retry action
* Avoid blocking UI unnecessarily; provide feedback on long-running actions.

### Visual Consistency

* Use **design tokens** for spacing, typography, and color.
* Maintain consistent **grid alignment, padding, and vertical rhythm**.
* All actions are in predictable locations (final “Actions” column or fixed FAB).
* Maintain a consistent **color scheme for hover, focus, and active states**.

### Responsive Design

* Fully responsive: mobile, tablet, desktop.
* Touch targets ≥44px for mobile.
* Stack forms and collapse panels appropriately on smaller screens.

---

## Accessibility Standards

* **Keyboard-first**: Full navigation using Tab, Shift+Tab, Arrow keys, Enter, and Esc.
* **ARIA roles/labels**:

  * Drawers/panels: `role="dialog"`, `aria-modal="true"`, trap focus.
  * Dynamic notifications: `aria-live="polite"`.
  * Tables: column headers and `aria-selected` for row selection.
* **Focus management**: visible focus indicator, correct tab order, focus returned on panel close.
* **Contrast**: All text and UI meet WCAG AA.
* **Color independence**: Do not rely on color alone to convey info; use text or icons.
* **Forms & validation**:

  * Inline errors use `aria-invalid` and `aria-describedby`.
  * Focus moves to the first invalid field after submit failure.
* **Screen reader support**: All interactive elements must be announced correctly.

---

## Component API Standards

* **Tables/List Component**

  ```ts
  interface TableProps<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    error?: string;
    selected?: T | null;
    onRowSelect: (item: T) => void;
    onPageChange: (page: number) => void;
    onSort: (column: string, direction: 'asc' | 'desc') => void;
    onFilter: (filters: Record<string, any>) => void;
    'data-testid'?: string;
  }
  ```

* **SidePanel/Drawer Component**

  ```ts
  interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialFocusRef?: React.RefObject<HTMLElement>;
    children: React.ReactNode;
    'data-testid'?: string;
  }
  ```

* **Filter Controls**

  * Accept `value`, `onChange`, `options`.
  * Support keyboard navigation.
  * Provide `aria-controls` referencing the target list/table.

* **Forms**

  * Controlled components with explicit validation via React Hook Form/Formik.
  * Display submission state with `aria-busy`.
  * Show inline errors programmatically associated.

---

## Performance & Scalability

* Use **virtualized lists** for large tables (>50 visible items).
* Memoize row renderers and pure components.
* Debounce expensive inputs; throttle frequent events.
* Lazy-load heavy modules, hydrate interactive regions on demand.
* Avoid unnecessary re-renders and layout shifts.

---

## Testing Requirements

* **Unit tests** for each component (props, interactions, states).
* **Integration tests** for main flows:

  * Select row → open panel → submit form → update list
* **Accessibility tests** with `axe` for all interactive elements.
* Include at least **one manual accessibility checklist** for each complex component.
* Test edge cases: empty list, server error, slow network, keyboard-only navigation.

---

## PR Requirements

* Include **UX & accessibility decisions** in PR description.
* Include **screenshots or GIFs** showing keyboard flows, panel focus, mobile and desktop layouts.
* Include **test results**: unit, integration, and accessibility.
* Ensure all **CI checks pass** before requesting review.
* Verify **all component APIs** follow the documented contract.
* All code must follow the **frontend template** and **interaction, layout, accessibility, and performance standards**.

---

---
