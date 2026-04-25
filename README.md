# BallotBuddy 🗳️

Your smart, AI-powered guide to the election process.

![BallotBuddy Demo](./public/favicon.svg)

## 📌 Chosen Vertical
**Electoral Awareness & Civic Education**
BallotBuddy aims to simplify the voting process, making electoral information accessible, interactive, and personalized for every citizen.

## 🚀 Approach and Logic
BallotBuddy acts as an intelligent companion that guides users through five critical steps of their electoral journey:
1. **Voter Registration** — Check eligibility & enroll
2. **Candidate Research** — Know who's running and their manifestos
3. **Polling Day Logistics** — Where, when & what to bring
4. **Casting Your Vote** — Step-by-step at the booth (EVM, ballot, etc.)
5. **Results & Next Steps** — After the election

We built a responsive React frontend that maintains conversational state and detects the user's progress along a "timeline" based on their interaction with the AI. The AI (powered by **Google Gemini 2.5 Flash**) provides concise, actionable, and localized advice.

To enhance usability:
- **Location Context:** Users select their region at the start, ensuring the AI gives hyper-local advice for Indian states and international regions.
- **Smart Date Detection:** The frontend automatically scans AI responses for dates (multiple formats: ISO, dd/mm/yyyy, natural language) and offers a "1-click add to Google Calendar" button.
- **Map Integration:** A built-in polling station finder uses the Google Maps Embed API to show nearby polling stations based on PIN/ZIP code.
- **Accessibility:** Features like dynamic font-sizing, high-contrast dark theme, ARIA labels, keyboard navigation, and multi-language support (14 languages including 10 Indian languages) ensure inclusivity.

## ⚙️ How the Solution Works

### Architecture
```
┌──────────────────┐       ┌────────────────────────┐      ┌──────────────────┐
│   React SPA      │──────▶│ Firebase Cloud Function │─────▶│  Google Gemini   │
│   (Vite + React) │◀──────│ (chatProxy)             │◀─────│  2.0 Flash API   │
│                  │       │ (logFeedback)            │      │                  │
└──────────────────┘       └────────────────────────┘      └──────────────────┘
        │                           │
        │                           ▼
        │                  ┌────────────────────────┐
        │                  │   Cloud Firestore      │
        │                  │   - usage_stats        │
        │                  │   - user_feedback       │
        │                  │   - session_analytics   │
        │                  └────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│         Google Services Integration       │
│                                          │
│  • Firebase Analytics (GA4)              │
│  • Firebase Performance Monitoring       │
│  • Firebase Hosting (CDN)                │
│  • Firebase Cloud Functions (v2)         │
│  • Cloud Firestore (NoSQL database)      │
│  • Cloud Logging (structured logs)       │
│  • Google Maps Embed API                 │
│  • Google Calendar API                   │
│  • Google Gemini 2.5 Flash (Gen AI)      │
│  • Google Fonts API                      │
└──────────────────────────────────────────┘
```

### Frontend (`src/`)
- **React 19 SPA** built with Vite for fast development and optimized production builds
- **Component architecture** with separation of concerns:
  - `App.jsx` — Root component with state management and routing
  - `ChatPanel.jsx` — AI chat interface with message bubbles and typing indicator
  - `Sidebar.jsx` — Election timeline, polling station finder, accessibility controls
  - `HomeScreen.jsx` — Region selector and journey start CTA
  - `ProgressBar.jsx` — Fixed header with animated step progress
  - `CalendarButton.jsx` — Smart date detection and Google Calendar integration
  - `AccessibilityControls.jsx` — Font size toggle and multi-language selector
  - `ErrorBoundary.jsx` — Graceful error handling UI
- **Custom React hooks** for logic encapsulation:
  - `useChat.js` — Chat API communication with AbortController, timeout handling, and Firebase Performance tracing
  - `usePersistentState.js` — localStorage-backed state that survives page reloads

### Backend (`functions/`)
- **Firebase Cloud Functions v2 (Node.js 20)** — Serverless HTTPS endpoints:
  - `chatProxy` — Secure proxy for Google Gemini API (keeps API key server-side)
  - `logFeedback` — Stores user feedback in Cloud Firestore

### Performance Optimizations
- **React.memo** on all leaf components to prevent unnecessary re-renders
- **React.lazy + Suspense** for code-splitting (ChatPanel loads only when needed)
- **useMemo** for derived state (step detection, date parsing)
- **useCallback** for all event handlers to maintain referential equality
- **Vite manual chunk splitting** — separate vendor chunks for React and Firebase
- **AbortController** with request timeout for API calls
- **requestAnimationFrame** for smooth scroll behavior
- **Firebase Hosting CDN caching** — immutable cache headers for static assets
- **Lazy loading** for Google Maps iframes

### Google Services Used

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| **Google Gemini 2.5 Flash** | Conversational AI for civic education | Cloud Function proxy (`/api/chat`) |
| **Firebase Cloud Functions v2** | Serverless backend (API proxy, feedback) | `functions/index.js` — `chatProxy`, `logFeedback` |
| **Cloud Firestore** | Usage analytics, feedback, session tracking | Server-side (`functions/`) + Client-side (`firebase.js`) |
| **Firebase Analytics (GA4)** | User behavior tracking (events, engagement) | `firebase.js` — 10+ custom events |
| **Firebase Performance Monitoring** | Web Vitals, API latency traces | `firebase.js` — custom traces on API calls |
| **Firebase Hosting** | Global CDN with SSL, custom caching | `firebase.json` — immutable asset caching |
| **Cloud Logging** | Structured server-side logging | `functions/index.js` — request/response metadata |
| **Google Maps Embed API** | Polling station location finder | `PollingStationFinder.jsx` |
| **Google Calendar API** | 1-click election date reminders | `CalendarButton.jsx` — URL-based event creation |
| **Google Fonts API** | Premium typography (Playfair Display, Source Sans 3) | `index.html` — preconnected font loading |

### Security Implementation
- **API key isolation**: Gemini API key stored server-side in Cloud Functions environment
- **Input validation**: Message array length limits, prompt length validation, field type checks
- **Firestore Security Rules**: Collection-level access control with field validation
- **Content safety**: Gemini API safety settings (harassment, hate speech, explicit content, dangerous content)
- **CORS**: Configured for cross-origin requests
- **CSP-friendly**: No inline scripts, proper asset loading
- **Environment variables**: All secrets in `.env` files, excluded from version control

### Testing Strategy
- **Unit tests** for all utility functions (detectStep, parseDateString, generateCalendarUrl)
- **Integration tests** for App component (render, interaction, state management)
- **Component tests** for all UI components (ChatPanel, Sidebar, ProgressBar, etc.)
- **Data integrity tests** for constants (REGIONS, TIMELINE_STEPS, LANGUAGES)
- **Edge case coverage** (corrupted localStorage, empty inputs, invalid dates)
- **Test framework**: Vitest + React Testing Library + jsdom

### Accessibility (a11y) Features
- ARIA roles and labels on all interactive elements
- `role="progressbar"` with proper `aria-valuenow/min/max`
- `role="log"` with `aria-live="polite"` for chat messages
- `role="radiogroup"` for font size toggle
- `role="list/listitem"` for timeline steps
- `aria-current="step"` for active timeline step
- Focus-visible outlines with gold accent color
- Keyboard navigation (Enter to send, Tab to navigate)
- Dynamic font sizing (normal/large) via CSS custom properties
- High-contrast dark theme with WCAG 2.1 compliant color ratios
- Semantic HTML5 elements (`<header>`, `<main>`, `<aside>`, `<nav>`)
- Screen reader friendly with `aria-hidden` on decorative elements

## 📝 Assumptions Made
- **Local Rules:** We assume the user's region dictates specific electoral rules, and we rely on Gemini's generalized knowledge for regions where real-time APIs aren't available.
- **Internet Connection:** The app requires an active internet connection to communicate with the AI and load maps.
- **Free Tier Limits:** API quotas (like Gemini rate limits) might restrict usage if scaled significantly without upgrading.
- **Modern Browser:** Targeting ES2020+ browsers for optimal bundle size and performance.

## 🛠️ Running Locally

### Prerequisites
- Node.js 20+
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/BallotBuddy.git
   cd BallotBuddy
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Install Cloud Functions dependencies:
   ```bash
   cd functions && npm install && cd ..
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   cp .env functions/.env
   ```
5. Run the frontend development server:
   ```bash
   npm run dev
   ```
6. Run the local API proxy (separate terminal):
   ```bash
   npm run server
   ```

### Production Build
```bash
npm run build        # Creates optimized bundle in dist/
npm run preview      # Preview production build locally
```

### Deployment
```bash
firebase deploy      # Deploy hosting + Cloud Functions
```

## 🧪 Testing
We use **Vitest** and **React Testing Library** to ensure code quality and reliability.

```bash
npm run test         # Run all tests
```

Test coverage includes:
- 9 unit test suites covering all components and utilities
- 40+ individual test cases
- Edge case handling (corrupted data, empty inputs, API errors)
- Component rendering, interaction, and state management tests

## 🧹 Code Quality & Linting
The codebase adheres to strict ESLint rules for maintainability:

```bash
npm run lint         # Run ESLint
```

Code quality practices:
- **PropTypes** on all components for runtime type checking
- **JSDoc** documentation on all functions and modules
- **Custom hooks** (useChat, usePersistentState) for logic encapsulation
- **ErrorBoundary** for graceful error handling
- **Consistent naming**: camelCase for functions, PascalCase for components
- **React.memo** on all leaf components for performance
- **useCallback/useMemo** for referential equality optimization
- **Functional setState** pattern to avoid stale closures

## 📁 Project Structure
```
BallotBuddy/
├── src/
│   ├── components/
│   │   ├── AccessibilityControls.jsx   # Font size + language controls
│   │   ├── AccessibilityControls.test.jsx
│   │   ├── CalendarButton.jsx          # Google Calendar integration
│   │   ├── CalendarButton.test.jsx
│   │   ├── ChatPanel.jsx               # AI chat interface
│   │   ├── ChatPanel.test.jsx
│   │   ├── ErrorBoundary.jsx           # Error handling fallback
│   │   ├── HomeScreen.jsx              # Region selector + CTA
│   │   ├── HomeScreen.test.jsx
│   │   ├── PollingStationFinder.jsx    # Google Maps integration
│   │   ├── PollingStationFinder.test.jsx
│   │   ├── ProgressBar.jsx             # Header progress indicator
│   │   ├── ProgressBar.test.jsx
│   │   ├── Sidebar.jsx                 # Timeline + controls
│   │   └── Sidebar.test.jsx
│   ├── hooks/
│   │   ├── useChat.js                  # Chat API + Performance tracing
│   │   └── usePersistentState.js       # localStorage-backed state
│   ├── App.jsx                         # Root component
│   ├── App.test.jsx                    # Integration tests
│   ├── analytics.js                    # Analytics re-exports
│   ├── firebase.js                     # Firebase services (Analytics, Perf, Firestore)
│   ├── constants.js                    # App constants + utilities
│   ├── constants.test.js               # Constants unit tests
│   ├── utils.js                        # Utility functions
│   ├── index.css                       # Design system (CSS custom properties)
│   ├── main.jsx                        # Entry point
│   └── setupTests.js                   # Test configuration
├── functions/
│   ├── index.js                        # Cloud Functions (chatProxy, logFeedback)
│   └── package.json
├── firebase.json                       # Firebase config (Hosting, Functions, Firestore)
├── firestore.rules                     # Firestore Security Rules
├── firestore.indexes.json              # Firestore composite indexes
├── vite.config.js                      # Vite + Vitest config
├── eslint.config.js                    # ESLint flat config
├── index.html                          # HTML entry (SEO optimized)
├── .env.example                        # Environment variable template
└── package.json                        # Dependencies + scripts
```

## 🏗️ Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, Vanilla CSS |
| Backend | Firebase Cloud Functions v2, Node.js 20 |
| AI | Google Gemini 2.5 Flash |
| Database | Cloud Firestore |
| Analytics | Firebase Analytics (GA4) |
| Performance | Firebase Performance Monitoring |
| Hosting | Firebase Hosting (Global CDN) |
| Maps | Google Maps Embed API |
| Calendar | Google Calendar API |
| Fonts | Google Fonts (Playfair Display, Source Sans 3) |
| Logging | Cloud Logging (structured) |
| Testing | Vitest, React Testing Library, jsdom |
| Linting | ESLint (flat config) |
