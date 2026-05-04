# Eko Schools Arts & Crafts — Student Challenge Platform

A full-stack web application for managing the **Eko Schools Arts & Crafts 2025** competition. Students register, verify their identity, and submit artwork. Judges score submissions. Admins oversee the entire process.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Functions) |

## Features

### Student Portal (`/student/*`)
- Register with email/password and receive a verification email
- **Identity Verification** — upload passport photo and ID card, fill in personal details
- **Submit Application** — upload artwork title, description, video (≤ 100 MB), and images (≤ 100 MB each)
- View submitted application status
- Settings (email notifications, change password)
- Report issues
- Help & FAQ

### Judge Portal (`/judge/*`)
- Dashboard with stats: total applications, scored by you, pending for you — plus top-10 leaderboard
- Applications table — score each submission (0–10) via a modal
- Applicants — browse verified students and view their full profiles
- Analytics — filter scoreboard by avg score and percentage

### Admin Portal (`/admin/*`)
- Dashboard with live Firestore `count()` stats: total users, students, judges, admins, submissions
- Applications — view all submissions with per-judge score breakdowns
- Judges — invite new judges by email or promote existing users (max 10), remove judges
- Students — list all students, link to profile and submission
- Student detail — edit display name, send password reset, view/delete verification files or submission
- Reports — triage user-submitted reports (open → in progress → closed)
- Analytics — filter scoreboard by judge, avg score range, and percentage range

## Project Structure

```
src/
├── assets.ts                  # Image asset paths
├── firebase.ts                # Firebase app init (auth, db, storage, functions)
├── main.tsx / App.tsx         # Entry point and routes
├── index.css                  # Tailwind CSS v4 entry
├── components/
│   ├── RoleGuard.tsx          # Auth + Firestore role check
│   ├── GuestGuard.tsx         # Redirect logged-in users away from guest pages
│   └── SignOutButton.tsx
├── layouts/
│   ├── StudentLayout.tsx
│   ├── JudgeLayout.tsx
│   └── AdminLayout.tsx
└── pages/
    ├── Login.tsx / Register.tsx / VerifyEmail.tsx
    ├── AfterLogin.tsx         # Role-based redirect after login
    ├── SetupAdmin.tsx         # Bootstrap first admin via Cloud Function
    ├── student/               # StudentRoute, StudentVerify, StudentSubmit, …
    ├── judge/                 # JudgeDashboard, JudgeApplications, …
    └── admin/                 # AdminDashboard, AdminJudges, AdminStudents, …
```

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A Firebase project with Auth, Firestore, Storage, and Cloud Functions enabled

### Install & Run

```bash
npm install
npm run dev
```

### Environment / Firebase Config

Firebase configuration is hardcoded in `src/firebase.ts`. Replace the values with your own project config if deploying to a different Firebase project.

### Build

```bash
npm run build
```

## Firestore Data Model

| Collection | Description |
|---|---|
| `users/{uid}` | Profile, role, verification data |
| `submissions/{uid}` | Artwork submission, score aggregates |
| `submissions/{uid}/scores/{judgeUid}` | Individual judge scores |
| `judgeScores/{judgeUid}/subs/{sid}` | Tracks which submissions a judge has scored |
| `reports/{id}` | User-submitted issue reports |

## Cloud Functions Used

| Function | Purpose |
|---|---|
| `bootstrapAdmin` | Make the current user an admin (first-run) |
| `inviteUser` | Create an invite for a new judge/user by email |
| `setUserRole` | Promote an existing user to a given role |
| `deleteUserDeep` | Fully delete a user (auth + Firestore + Storage + scores) |
| `adminUpdateUserProfile` | Update a user's auth display name |
| `adminDeleteStudentArtifacts` | Selectively delete verification files or submission |

## License

MIT
