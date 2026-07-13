# Careerverse

A premium interactive space-themed portfolio platform built with Next.js, Three.js, Framer Motion and Firebase.

## Features

- **Interactive Space Navigation**: Immersive 3D space scene containing interactive planets representing portfolio categories.
- **Planet-based Portfolio**: Drill down into Core Profile, Education, Skills, Work Experience, Achievements, and Contact sections on planet zoom-in.
- **Spaceship Travel Animations**: Smooth canvas transitions simulating space flight and hyper-drive effects on planet navigation.
- **Mission Control CMS**: Fixed-layout content management editor for profile data modification, state handling, and database updates.
- **Firebase Firestore**: Dynamic client-repository architecture mapping profiles, skills, and experience items.
- **Live Content Updates**: Integrates snapshot listeners to synchronize client portfolio changes automatically.
- **PIN Protected Admin**: Secure authentication system utilizing server-verified PIN checks and secure cookies.
- **Responsive Design**: Adapts display systems and panels elegantly to mobile, tablet, and desktop viewports.

## Tech Stack

- **Next.js** (App Router, Turbopack)
- **React**
- **TypeScript**
- **TailwindCSS**
- **Framer Motion**
- **Three.js**
- **React Three Fiber**
- **Firebase Firestore**
- **Vercel**

## Local Setup

Install dependencies:
```bash
npm install
```

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the interactive portfolio. Visit `/mission-control` to access the PIN protected CMS dashboard.

## Environment Variables

Create a `.env.local` file in the root of the project with the following keys. Do NOT commit the values to version control:

```env
# PIN code to unlock Mission Control CMS
MISSION_CONTROL_PIN=your_secret_pin

# Firebase Web Client SDK Credentials
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Deployment

Deploy directly using Vercel. Ensure all environment variables listed above are configured in your Vercel project environment variables settings.
