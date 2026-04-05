# sentinel

an ai-powered clinical companion designed to track cognitive sharpness, monitor shift fatigue, and prevent burnout through proactive baseline testing. built for medical professionals, sentinel acts as a localized dashboard to track baseline metrics during long shifts.

## features

* cognitive baseline testing (reaction time, typing mapping, short-term memory scoring).
* live fatigue monitoring and algorithmic shift degradation alerts.
* locally persisted shift history via encrypted secure-state localstorage tracking.
* integrated gemini 3.1 ai assistant for contextual shift feedback and prescription assisting.

## getting started

first, install the dependencies using your package manager of choice (pnpm is recommended):

```bash
pnpm install
```

create a `.env.local` file in your root directory and inject your gemini api configurations:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
```

start the development server:

```bash
pnpm dev
```

this will boot up the local dev server on port 3000. navigate to `http://localhost:3000` to interact with sentinel.

## tech stack

* next.js 15 (app router)
* react 19
* tailwind css (dark-mode first paradigm)
* google genai sdk (gemini-3-flash-preview)
* recharts for timeline data visualizations
* date-fns for contextual localized timestamps

## deployment

to build for production environments with turbopack integration:

```bash
pnpm build
```

the static compilation creates optimized build payloads ready for any standard v8 edge networks or node-based environments like vercel.
