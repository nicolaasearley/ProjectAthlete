# Fitness Earley v2 - Complete Data Model Documentation

This document describes all database models, their relationships, and provides JSON examples for each.

## Table of Contents

1. [User](#user)
2. [OAuthToken](#oauthtoken)
3. [Workout](#workout)
4. [Exercise](#exercise)
5. [WorkoutRun](#workoutrun)
6. [WeightLog](#weightlog)
7. [Post](#post)
8. [MediaFile](#mediafile)
9. [Comment](#comment)
10. [Reaction](#reaction)
11. [Challenge](#challenge)
12. [ChallengeEntry](#challengeentry)
13. [Notification](#notification)
14. [AnalyticsEvent](#analyticsevent)

---

## User

Unified user model supporting roles: USER, COACH, ADMIN.

### Fields

- `id` (UUID, primary key)
- `email` (string, unique, indexed)
- `passwordHash` (string, nullable - for OAuth users)
- `displayName` (string, nullable)
- `firstName`, `lastName` (string, nullable)
- `role` (enum: USER | COACH | ADMIN, default: USER)
- `emailVerified` (boolean, default: false)
- `emailVerificationToken` (string, nullable, unique)
- `profilePicturePath` (string, nullable)
- `lastActive` (datetime, nullable)
- `createdAt`, `updatedAt` (datetime)
- `deletedAt` (datetime, nullable - soft delete)

### Example JSON

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "passwordHash": "$2b$10$...",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "emailVerified": true,
  "emailVerificationToken": null,
  "profilePicturePath": "/media/users/123e4567/profile.jpg",
  "lastActive": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "deletedAt": null
}
```

---

## OAuthToken

Unified OAuth provider tokens for Google and Apple authentication.

### Fields

- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `provider` (enum: GOOGLE | APPLE)
- `providerUserId` (string, unique per provider)
- `accessToken` (string, encrypted)
- `refreshToken` (string, nullable, encrypted)
- `expiresAt` (datetime, nullable)
- `createdAt`, `updatedAt` (datetime)

### Example JSON

```json
{
  "id": "223e4567-e89b-12d3-a456-426614174001",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "provider": "GOOGLE",
  "providerUserId": "google_user_123456",
  "accessToken": "encrypted_token_here",
  "refreshToken": "encrypted_refresh_token_here",
  "expiresAt": "2024-01-16T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Workout

Personal or community workouts with JSON exercise structure.

### Fields

- `id` (UUID, primary key)
- `ownerUserId` (UUID, nullable, foreign key → User)
- `title` (string, required)
- `description` (string, nullable)
- `type` (enum: PERSONAL | COMMUNITY, default: PERSONAL)
- `exercises` (JSON - structured exercise array)
- `estimatedTimeMinutes` (integer, nullable)
- `tags` (string array)
- `notes` (string, nullable)
- `isTemplate` (boolean, default: false)
- `createdAt`, `updatedAt` (datetime)
- `deletedAt` (datetime, nullable - soft delete)

### Exercises JSON Structure

```json
{
  "exercises": [
    {
      "id": "exercise-uuid",
      "name": "Bench Press",
      "order": 1,
      "sets": "5",
      "reps": "5",
      "weight": "225",
      "tempo": "3-0-1",
      "rest": "180s",
      "notes": "Focus on form"
    },
    {
      "id": "exercise-uuid-2",
      "name": "Squat",
      "order": 2,
      "sets": "5",
      "reps": "5",
      "weight": "315",
      "tempo": "3-1-1",
      "rest": "240s",
      "notes": "Full depth"
    }
  ]
}
```

### Example JSON

```json
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "ownerUserId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Push Day",
  "description": "Upper body push workout",
  "type": "PERSONAL",
  "exercises": [
    {
      "id": "ex1",
      "name": "Bench Press",
      "order": 1,
      "sets": "5",
      "reps": "5",
      "weight": "225",
      "tempo": "3-0-1",
      "rest": "180s",
      "notes": "Focus on form"
    }
  ],
  "estimatedTimeMinutes": 60,
  "tags": ["push", "chest", "shoulders"],
  "notes": "Focus on progressive overload",
  "isTemplate": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "deletedAt": null
}
```

---

## Exercise

Exercise library with default metrics.

### Fields

- `id` (UUID, primary key)
- `name` (string, unique, indexed)
- `description` (string, nullable)
- `category` (string, nullable - STRENGTH, CARDIO, MOBILITY, etc.)
- `defaultMetrics` (JSON, nullable - supports weight/reps/time/distance)
- `createdAt`, `updatedAt` (datetime)

### DefaultMetrics JSON Structure

```json
{
  "defaultMetrics": {
    "primary": "weight",
    "supports": ["weight", "reps", "sets"],
    "units": {
      "weight": "lbs",
      "reps": "reps",
      "time": "seconds"
    }
  }
}
```

### Example JSON

```json
{
  "id": "423e4567-e89b-12d3-a456-426614174003",
  "name": "Bench Press",
  "description": "Barbell bench press exercise",
  "category": "STRENGTH",
  "defaultMetrics": {
    "primary": "weight",
    "supports": ["weight", "reps", "sets"],
    "units": {
      "weight": "lbs",
      "reps": "reps"
    }
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## WorkoutRun

User workout execution/session tracking.

### Fields

- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `workoutId` (UUID, foreign key → Workout)
- `date` (date, indexed)
- `startedAt` (datetime, nullable)
- `completedAt` (datetime, nullable)
- `results` (JSON, nullable - exercise results structure)
- `notes` (string, nullable)
- `totalTimeSeconds` (integer, nullable)
- `createdAt`, `updatedAt` (datetime)

### Results JSON Structure

```json
{
  "results": [
    {
      "exerciseId": "ex1",
      "sets": [
        { "set": 1, "weight": 225, "reps": 5, "completed": true },
        { "set": 2, "weight": 225, "reps": 5, "completed": true },
        { "set": 3, "weight": 225, "reps": 4, "completed": true }
      ]
    }
  ]
}
```

### Example JSON

```json
{
  "id": "523e4567-e89b-12d3-a456-426614174004",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "workoutId": "323e4567-e89b-12d3-a456-426614174002",
  "date": "2024-01-15",
  "startedAt": "2024-01-15T09:00:00Z",
  "completedAt": "2024-01-15T10:05:00Z",
  "results": [
    {
      "exerciseId": "ex1",
      "sets": [
        { "set": 1, "weight": 225, "reps": 5, "completed": true }
      ]
    }
  ],
  "notes": "Felt strong today",
  "totalTimeSeconds": 3900,
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T10:05:00Z"
}
```

---

## WeightLog

Weight logging entries linked to exercises/sessions.

### Fields

- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User, indexed)
- `exerciseId` (UUID, nullable, foreign key → Exercise)
- `workoutRunId` (UUID, nullable, foreign key → WorkoutRun)
- `weight` (decimal, nullable)
- `reps` (integer, nullable)
- `sets` (integer, nullable)
- `date` (date, indexed)
- `notes` (string, nullable)
- `createdAt`, `updatedAt` (datetime)

### Example JSON

```json
{
  "id": "623e4567-e89b-12d3-a456-426614174005",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "exerciseId": "423e4567-e89b-12d3-a456-426614174003",
  "workoutRunId": "523e4567-e89b-12d3-a456-426614174004",
  "weight": 225.0,
  "reps": 5,
  "sets": 3,
  "date": "2024-01-15",
  "notes": "PR!",
  "createdAt": "2024-01-15T10:05:00Z",
  "updatedAt": "2024-01-15T10:05:00Z"
}
```

---

## Post

Social feed posts with media references and privacy settings.

### Fields

- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `text` (string, required)
- `mediaPaths` (string array - references MediaFile)
- `privacy` (enum: PUBLIC | PRIVATE | FRIENDS_ONLY, default: PUBLIC)
- `exerciseTags` (string array)
- `location` (string, nullable)
- `isPinned` (boolean, default: false)
- `moderationStatus` (enum: PENDING | APPROVED | FLAGGED | REMOVED, default: APPROVED)
- `createdAt`, `updatedAt` (datetime)
- `deletedAt` (datetime, nullable - soft delete)

### Example JSON

```json
{
  "id": "723e4567-e89b-12d3-a456-426614174006",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "text": "Just hit a new PR on bench press! 💪",
  "mediaPaths": ["/media/files/823e4567/photo.jpg"],
  "privacy": "PUBLIC",
  "exerciseTags": ["bench-press"],
  "location": "Home Gym",
  "isPinned": false,
  "moderationStatus": "APPROVED",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "deletedAt": null
}
```

---

## MediaFile

Centralized media tracking with storage provider abstraction.

### Fields

- `id` (UUID, primary key)
- `userId` (UUID, nullable, foreign key → User)
- `filename` (string)
- `originalFilename` (string)
- `mimeType` (string)
- `fileSizeBytes` (bigint)
- `storagePath` (string - relative to uploads root)
- `publicUrlPath` (string - for Traefik routing)
- `thumbnailPath` (string, nullable)
- `width`, `height` (integers, nullable for images)
- `durationSeconds` (integer, nullable for video)
- `storageProvider` (enum: LOCAL | S3 | MINIO, default: LOCAL)
- `checksumMd5` (string, nullable, for integrity)
- `createdAt`, `updatedAt` (datetime)

### Example JSON

```json
{
  "id": "823e4567-e89b-12d3-a456-426614174007",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "photo_20240115.jpg",
  "originalFilename": "IMG_20240115_103000.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 2048576,
  "storagePath": "/data/uploads/123e4567/823e4567/original.jpg",
  "publicUrlPath": "/media/823e4567/original.jpg",
  "thumbnailPath": "/data/uploads/123e4567/823e4567/thumbnail.jpg",
  "width": 1920,
  "height": 1080,
  "durationSeconds": null,
  "storageProvider": "LOCAL",
  "checksumMd5": "d41d8cd98f00b204e9800998ecf8427e",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Comment

Post comments with nested support and moderation.

### Fields

- `id` (UUID, primary key)
- `postId` (UUID, foreign key → Post)
- `userId` (UUID, foreign key → User)
- `text` (string, required)
- `parentCommentId` (UUID, nullable, foreign key → Comment - for nested comments)
- `moderationStatus` (enum: PENDING | APPROVED | FLAGGED | REMOVED, default: APPROVED)
- `createdAt`, `updatedAt` (datetime)
- `deletedAt` (datetime, nullable - soft delete)

### Example JSON

```json
{
  "id": "923e4567-e89b-12d3-a456-426614174008",
  "postId": "723e4567-e89b-12d3-a456-426614174006",
  "userId": "a23e4567-e89b-12d3-a456-426614174009",
  "text": "Great job! Keep it up! 🔥",
  "parentCommentId": null,
  "moderationStatus": "APPROVED",
  "createdAt": "2024-01-15T10:35:00Z",
  "updatedAt": "2024-01-15T10:35:00Z",
  "deletedAt": null
}
```

---

## Reaction

Polymorphic reactions (posts/comments) with reaction types.

### Fields

- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `targetType` (enum: POST | COMMENT)
- `targetId` (UUID - references Post or Comment)
- `reactionType` (enum: LIKE | LOVE | FIRE | THUMBS_UP | CELEBRATE)
- `createdAt` (datetime)

### Unique Constraint

- One reaction per user per target: `(userId, targetType, targetId)`

### Example JSON

```json
{
  "id": "b23e4567-e89b-12d3-a456-426614174010",
  "userId": "a23e4567-e89b-12d3-a456-426614174009",
  "targetType": "POST",
  "targetId": "723e4567-e89b-12d3-a456-426614174006",
  "reactionType": "FIRE",
  "createdAt": "2024-01-15T10:36:00Z"
}
```

---

## Challenge

Monthly challenges created by coaches.

### Fields

- `id` (UUID, primary key)
- `coachId` (UUID, foreign key → User, must be COACH or ADMIN)
- `title` (string)
- `description` (string, nullable)
- `metricType` (enum: TIME | REPS | WEIGHT | DISTANCE | CUMULATIVE)
- `startAt`, `endAt` (datetime)
- `targetValue` (decimal, nullable)
- `isActive` (boolean, default: true)
- `createdAt`, `updatedAt` (datetime)

### Example JSON

```json
{
  "id": "c23e4567-e89b-12d3-a456-426614174011",
  "coachId": "d23e4567-e89b-12d3-a456-426614174012",
  "title": "January Push-Up Challenge",
  "description": "Complete 10,000 push-ups this month",
  "metricType": "REPS",
  "startAt": "2024-01-01T00:00:00Z",
  "endAt": "2024-01-31T23:59:59Z",
  "targetValue": 10000.0,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## ChallengeEntry

User progress on challenges.

### Fields

- `id` (UUID, primary key)
- `challengeId` (UUID, foreign key → Challenge)
- `userId` (UUID, foreign key → User)
- `value` (decimal)
- `date` (date, indexed)
- `notes` (string, nullable)
- `createdAt`, `updatedAt` (datetime)

### Unique Constraint

- One entry per user per challenge per day: `(challengeId, userId, date)`

### Example JSON

```json
{
  "id": "e23e4567-e89b-12d3-a456-426614174013",
  "challengeId": "c23e4567-e89b-12d3-a456-426614174011",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "value": 300.0,
  "date": "2024-01-15",
  "notes": "Did 3 sets of 100",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

---

## Notification

In-app notifications with read status.

### Fields

- `id` (UUID, primary key)
- `userId` (UUID, foreign key → User)
- `type` (enum: COMMENT | REACTION | CHALLENGE_UPDATE | COACH_ANNOUNCEMENT | WORKOUT_ASSIGNED)
- `title` (string)
- `message` (string)
- `relatedEntityType` (string, nullable - POST, COMMENT, CHALLENGE, etc.)
- `relatedEntityId` (UUID, nullable)
- `isRead` (boolean, default: false)
- `createdAt` (datetime)

### Example JSON

```json
{
  "id": "f23e4567-e89b-12d3-a456-426614174014",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "type": "COMMENT",
  "title": "New comment on your post",
  "message": "John Doe commented on your post",
  "relatedEntityType": "POST",
  "relatedEntityId": "723e4567-e89b-12d3-a456-426614174006",
  "isRead": false,
  "createdAt": "2024-01-15T10:35:00Z"
}
```

---

## AnalyticsEvent

Telemetry tracking for key events.

### Fields

- `id` (UUID, primary key)
- `eventType` (enum: USER_REGISTERED | USER_LOGGED_IN | WORKOUT_CREATED | WORKOUT_COMPLETED | CHALLENGE_ENTRY | POST_CREATED | COMMENT_CREATED | REACTION_CREATED)
- `userId` (UUID, nullable - for anonymous events)
- `entityType` (string, nullable)
- `entityId` (UUID, nullable)
- `metadata` (JSON, nullable - additional event data)
- `ipAddress` (string, nullable)
- `userAgent` (string, nullable)
- `createdAt` (datetime)

### Example JSON

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174015",
  "eventType": "WORKOUT_CREATED",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "entityType": "WORKOUT",
  "entityId": "323e4567-e89b-12d3-a456-426614174002",
  "metadata": {
    "workoutType": "PERSONAL",
    "exerciseCount": 5
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Relationships Summary

- **User** has many: OAuthTokens, Workouts, WorkoutRuns, WeightLogs, Posts, Comments, Reactions, ChallengeEntries, Notifications, MediaFiles
- **Workout** belongs to: User (owner), has many: WorkoutRuns, WeightLogs
- **WorkoutRun** belongs to: User, Workout, has many: WeightLogs
- **Post** belongs to: User, has many: Comments, Reactions
- **Comment** belongs to: Post, User, Parent Comment (optional), has many: Replies, Reactions
- **Reaction** belongs to: User, targets Post or Comment
- **Challenge** belongs to: User (coach), has many: ChallengeEntries
- **ChallengeEntry** belongs to: Challenge, User
- **MediaFile** belongs to: User (optional)
- **Notification** belongs to: User
- **WeightLog** belongs to: User, Exercise (optional), WorkoutRun (optional)
- **Exercise** has many: WeightLogs

