# BallotBuddy 🗳️

Your smart, AI-powered guide to the election process. 

![BallotBuddy Demo](./public/favicon.svg)

## 📌 Chosen Vertical
**Electoral Awareness & Civic Education**
BallotBuddy aims to simplify the voting process, making electoral information accessible, interactive, and personalized for every citizen.

## 🚀 Approach and Logic
BallotBuddy acts as an intelligent companion that guides users through five critical steps of their electoral journey:
1. **Voter Registration**
2. **Candidate Research**
3. **Polling Day Logistics**
4. **Casting Your Vote**
5. **Results & Next Steps**

We built a responsive React frontend that maintains conversational state and detects the user's progress along a "timeline" based on their interaction with the AI. The AI (powered by Google's Gemini Flash model) provides concise, actionable, and localized advice. 

To enhance usability:
- **Location Context:** Users select their region at the start, ensuring the AI gives hyper-local advice.
- **Smart Date Detection:** The frontend automatically scans AI responses for dates and offers a "1-click add to Google Calendar" button.
- **Map Integration:** A built-in polling station finder uses the Google Maps Embed API.
- **Accessibility:** Features like dynamic font-sizing and high-contrast dark themes ensure inclusivity.

## ⚙️ How the Solution Works
1. **Frontend**: A React SPA (built with Vite) manages the UI, timeline state, and chat interface.
2. **Backend**: A Firebase Cloud Function (Node.js/Express) acts as a secure proxy to communicate with the Gemini API, ensuring the API keys remain hidden from the client.
3. **APIs Used**: 
   - **Google Gemini 1.5 Flash (via proxy)**: Powers the conversational AI logic.
   - **Google Maps API**: Embeds real-time maps for locating polling stations.
4. **Hosting**: The frontend is hosted on Firebase Hosting, and the backend proxy is hosted on Firebase Cloud Functions.

## 📝 Assumptions Made
- **Local Rules:** We assume the user's region dictates specific electoral rules, and we rely on Gemini's generalized knowledge for regions where real-time APIs aren't available.
- **Internet Connection:** The app requires an active internet connection to communicate with the AI and load maps.
- **Free Tier Limits:** API quotas (like Gemini rate limits) might restrict usage if scaled significantly without upgrading.

## 🛠️ Running Locally
1. Clone the repository.
2. Install dependencies: `npm install`
3. Install function dependencies: `cd functions && npm install`
4. Set up your `.env` files with `GEMINI_API_KEY` and `VITE_GOOGLE_MAPS_API_KEY`.
5. Run the frontend: `npm run dev`
6. Run the local backend: `npm run server`

## 🧪 Testing
We use Vitest and React Testing Library to ensure code quality.
Run tests with: `npm run test`

## 🧹 Code Quality & Linting
The codebase adheres to strict ESLint rules for maintainability.
Run linter with: `npm run lint`
