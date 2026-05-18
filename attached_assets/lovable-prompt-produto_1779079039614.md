Build "TrainFlow" — a PWA that connects personal trainers with their students. The app has two completely separate experiences sharing the same codebase: one for students, one for trainers. It must be installable on Android and iOS like a native app, work offline during workouts, and feel like a premium sports performance product.

---

## WHO USES IT

**Students** are the primary users. They open the app to do their workout for the day. They need to see their exercises, record their performance set by set, chat with their trainer, and check their history. They might be at a gym with bad signal, so everything must work without internet.

**Trainers** manage everything behind the scenes. They create students, build workout plans, organize exercises, and communicate with their students individually or in groups. Trainers access the app through a subtle link at the bottom of the student login screen — their area is secondary and intentionally low-profile in the entry flow.

---

## HOW THE APP OPENS

When someone opens TrainFlow, they see the student login screen. This is the main entry point and should feel exceptional — like opening a premium fitness app. Large bold welcome text, a single email field, a magic link button. At the very bottom of the screen, a small quiet link: "I'm a personal trainer" that leads to the trainer login. The trainer login is simple and plain — no special visual treatment.

After clicking the magic link in their email, users are authenticated and redirected to their respective area based on their role. New students who received an invite from their trainer land on an onboarding screen to complete their profile before accessing their home.

---

## STUDENT EXPERIENCE

**Home screen:** Shows the student's workout for today — the day name, plan name, number of exercises, and a big call-to-action button to start the workout. Below that, a horizontal scroll of recent past sessions. There's also a preview of their latest unread message from their trainer. Bottom navigation with Home, Workout, Chat, and Profile tabs.

**Workout player — the most important screen in the entire app:** When the student starts a workout, they enter a full-screen immersive player. There's no bottom navigation here. The experience includes:

- A visual progress indicator (a ring or arc) showing how far through the session they are, updating as they complete sets
- The current exercise shown as an animated GIF — full width, looping — so the student can see proper form. The next exercise's GIF should be preloaded silently in the background so transitions are instant
- The exercise name in large bold text, with the prescribed sets and reps clearly visible
- An audio narration that plays automatically when an exercise loads, describing what to do. The next exercise's audio should also be preloaded so there's no delay
- A set logger: two large inputs side by side for weight (kg) and reps done. A confirm button below. After confirming a set, the player advances to the next set or triggers the rest timer
- A rest timer between sets: a full-screen overlay with a large countdown number in the center, a circular progress ring around it, and audio beeps in the final 3 seconds. The phone vibrates when the timer ends and when the player moves to a new exercise. The student can skip the rest timer manually
- Play and pause controls. Pausing stops both the timer and the audio simultaneously. The student can navigate to previous or next exercises manually
- If the student is offline, a thin amber banner appears at the top saying their progress is being saved to the device. Every set they log is saved locally first, regardless of connectivity, and synced to the server when internet returns
- If anything crashes, the screen must never go white. Show a friendly error message saying progress was saved, with a retry button
- When the session ends, show a completion screen with total time, sets done, and total volume lifted. If there's pending data to sync, show a sync button

**Chat:** The student sees their conversation with their trainer. Messages appear in real time without refreshing. Sent messages appear on the right in the accent color. Received messages appear on the left in a dark surface. If they send a message while offline, it shows a pending indicator and syncs when back online.

**Profile:** Basic profile info, avatar, and their measurements or goals if their trainer has set them up.

---

## TRAINER EXPERIENCE

Trainers access their area through the quiet link on the student login screen. Their interface is more functional and management-focused.

**Dashboard:** Overview of active students, recent activity, and unread messages.

**Students list:** All students the trainer has added, with their status (invited or active) and quick access to their profile. A button to add a new student.

**Adding a student:** The trainer enters the student's name and email. The system sends the student a magic link to create their account. The trainer doesn't need to involve the student in any setup beyond that. If the email already has an account, the system handles it gracefully.

**Student detail:** The trainer can see the student's active workout plan, their session history, send them a message, and update their profile information or measurements.

**Exercise library:** A searchable, filterable library of exercises. There are global exercises available to all trainers, and each trainer can also create their own custom exercises. Each exercise has a name, muscle group, equipment needed, an animated GIF showing the movement, and optionally an audio narration file. Trainers can filter by muscle group (chest, back, legs, shoulders, biceps, triceps, core, cardio) and toggle between the global library and their own. Creating an exercise opens a form where they can fill in all details and upload a GIF and audio file.

**Plan builder:** Trainers create workout plans and assign them to a specific student. A plan has multiple days (like Monday — Chest/Triceps, Wednesday — Back/Biceps). Each day has a list of exercises pulled from the exercise library, with customizable sets, reps, rest time, and notes per exercise. Exercises within a day can be reordered by drag and drop. The plan auto-saves as the trainer edits. When ready, the trainer publishes the plan to the student.

**Chat:** The trainer sees a list of all their conversations — both direct chats with individual students and group chats with multiple students. Tapping a conversation opens it. Messages appear in real time. Creating a group chat lets the trainer select multiple students. The trainer also gets push notifications when students message them.

---

## OFFLINE CAPABILITY

The offline experience is critical, not optional. Students frequently train in gyms with poor signal. The app must:

- Load the workout data and let the student train completely without internet
- Save every set logged locally on the device the moment it's confirmed
- Show a clear offline indicator when there's no connection
- Automatically sync all pending data when the connection returns, or let the student trigger sync manually
- Never lose data — even if the student closes the app mid-workout and reopens it, their progress must still be there

---

## REAL-TIME CHAT

Messages must appear instantly for both parties without any page refresh or manual reload. Both direct conversations (trainer ↔ one student) and group conversations (trainer → multiple students) must work this way. Unread message badges update in real time. When a message arrives while the app is in the background or closed, the recipient gets a push notification.

---

## PUSH NOTIFICATIONS

Both trainers and students receive push notifications for: new messages, new workout plans published, and workout reminders. The app asks for push permission after the user logs in for the first time. On iOS, the app should only request push permission if it's already installed to the home screen, since push only works in that context on iOS.

---

## PWA AND INSTALLATION

The app is fully installable as a PWA on both Android and iOS. It should prompt users to install after their second visit with a friendly custom banner (not the browser's default). On iOS, show instructions for adding to the home screen manually. The app icon, splash screen, and theme color should match the dark design. Once installed, it opens in standalone mode with no browser UI.

---

## DESIGN DIRECTION

Dark, bold, premium sports performance aesthetic. Think of it as the intersection of a high-end fitness app and a clean productivity tool. The student's workout player in particular should feel immersive and focused — nothing distracting, everything readable at a glance even when tired and sweating. Large touch targets everywhere. High contrast. The accent color should feel energetic. Typography should be confident and athletic for headings, clean and readable for body text. Animations should feel snappy and physical, not floaty.
