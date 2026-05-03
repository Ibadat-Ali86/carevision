# CareVision: UI/UX Design & Architecture Document

## 1. Executive Summary
The CareVision Progressive Web App (PWA) is engineered specifically for **Community Health Workers (CHWs)** operating in low-resource and remote clinical environments. The UI/UX is built with a primary focus on **offline reliability, high legibility, and cognitive ease**. Every interface decision prioritizes speed and clarity to minimize friction during patient encounters.

The design system employs a **Medical Teal** and **Clinical Blue** palette to evoke trust and professionalism, heavily utilizing structured cards and distinct severity indicators to safely guide clinical decision-making.

---

## 2. Design System & Tokens

The application leverages a custom Tailwind CSS configuration rooted in `src/index.css`.

### 2.1 Color Palette
- **Primary (Medical Teal):** Used for primary actions, success states, and dominant branding. 
  - Base: `#0A6E5C` (`--color-medical-teal-500`)
  - Accent: `#0F9D7E`
- **Secondary (Clinical Blue):** Used for secondary interactions, data visualization, and supporting elements.
  - Base: `#2C5F8D` (`--color-clinical-blue-500`)
- **Neutral Scale:** Clean, high-contrast backgrounds maximizing readability.
  - Backgrounds: `#F8FAFB` (Primary bg), `#FFFFFF` (Elevated cards), `#F1F5F9` (Subtle bg)
  - Text: `#1A2332` (Primary), `#475569` (Secondary), `#64748B` (Tertiary)

### 2.2 Severity & Status Indicators
Given the clinical nature of the app, communicating risk is strictly color-coded:
- **Success/Clear:** `#10B981` (Green)
- **Info/Observation:** `#3B82F6` (Blue)
- **Warning/Moderate:** `#F59E0B` (Amber/Yellow)
- **Danger/Serious:** `#EF4444` (Red)
- **Critical/Emergency:** `#991B1B` (Dark Red - paired with pulsing animations like `emergencyPulse`)

### 2.3 Typography & Spacing
- **Font:** `Inter` (Google Fonts), highly legible sans-serif.
- **Spacing Unit:** 4px base (e.g., `--space-4: 1rem`).
- **Corner Radius:** Soft, approachable components (e.g., `--radius-md: 0.5rem`, `--radius-lg: 0.75rem`).
- **Shadows:** Soft, layered shadows for depth (`--shadow-md`, `--shadow-lg`, `--shadow-teal`).

---

## 3. Application Structure & Pages

The frontend follows a distinct layout pattern handled by `src/components/layout/`.

### 3.1 Layout Shell
- **`Header.tsx`**: Contains the app logo, current navigation context, and global actions.
- **`PageContainer.tsx`**: Ensures uniform padding, max-widths, and bottom safe-area spacing for mobile views.
- **`Footer.tsx`**: Standard bottom-bar navigation typical of mobile-first PWAs.

### 3.2 Core Modules (`src/pages/`)
1. **`Home.tsx` (Dashboard):** 
   - A grid layout of "Quick Actions" representing the core multimodal features.
   - Designed with large tap targets (`.feature-card`) for easy interaction on mobile screens.
2. **Analysis Flows (`TestStrip.tsx`, `MedScan.tsx`, `WoundAssess.tsx`, `DocReader.tsx`):**
   - **Capture Phase:** Interfaces utilizing `Camera.tsx` for real-time photo capture or file uploads.
   - **Consent Phase:** `ConsentToggle.tsx` ensures explicit patient consent before processing.
   - **Result Phase:** Powered by the polymorphic `ResultCard.tsx`.
3. **`ProtocolAssistant.tsx`:** 
   - A chat-like conversational UI allowing CHWs to query medical guidelines.
   - Supports contextual follow-ups mapped from analysis results.
4. **`PatientLog.tsx`:**
   - A synchronized history of patient encounters utilizing local IndexedDB (Dexie.js).
   - Card-based list layout prioritizing date, analysis type, and severity.
5. **`Onboarding.tsx` & `Settings.tsx`:**
   - First-time setup, language preference (`LanguageSelector.tsx`), and configuration of region-specific clinical data.

---

## 4. Key Reusable Components (`src/components/`)

### 4.1 `ResultCard.tsx` (Polymorphic Output)
The most critical UI component in the app. It dynamically shifts its rendering strategy based on the `analysisType` prop:
- **TestStrip:** Renders line validation and binary recommendations.
- **MedScan:** Formats drug indications, contraindications (red backgrounds), and dosages.
- **WoundAssess:** Integrates emergency visual cues (flashing dark red borders) and a `ReferralCard` generation action.
- **DocReader:** Tabular extraction of clinical document text.
- **Universal Actions:** Includes a unified `ConfidenceIndicator`, required legal `DisclaimerBanner`, and a `Save to Log` button.

### 4.2 Utility Components
- **`Camera.tsx`**: Custom WebRTC viewfinder optimized for low-end device cameras, abstracting complex media stream management.
- **`SeverityBadge.tsx`**: A pill-shaped badge consistently mapping numeric severity scores to their appropriate textual and color representation.
- **`OfflineIndicator.tsx`**: Essential UX pattern that floats at the top to notify CHWs when they are detached from the network, reassuring them that local sync is active.

---

## 5. Accessibility & UX Principles

1. **Reduced Motion:** 
   - Strict adherence to `prefers-reduced-motion` media queries in CSS.
2. **Screen Reader (A11y) Support:** 
   - Heavy usage of `.sr-only` classes to provide context to non-visual users, especially for dynamically loaded AI results.
3. **Touch Targets:** 
   - Minimum 44x44px target sizes (`.btn-primary`, `.btn-icon`) following Apple HIG / Google Material guidelines.
4. **Feedback & Loading:**
   - Shimmer animations (`.skeleton`) during network requests.
   - Inline toast feedback on actions (e.g., saving to logs).
   - "Glassmorphism" overlays (`.glass`) for modals to maintain background context.

---

## 6. Current Implementation Status
- **PWA Capabilities:** Service worker registration, offline caching, and Dexie.js offline-first queues are in place.
- **Design Tokens:** Strictly adhered to and fully implemented in `index.css` leveraging Tailwind's utility pipeline.
- **Responsive Nature:** Primarily mobile-first (mobile viewport max-width containers) but scales gracefully to tablet views via flexible grids.
