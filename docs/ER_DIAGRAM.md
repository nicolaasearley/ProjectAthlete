# Fitness Earley v2 - Entity Relationship Diagram

This document contains the ER diagram in Mermaid format showing all relationships between models.

## Complete ER Diagram

```mermaid
erDiagram
    User ||--o{ OAuthToken : has
    User ||--o{ Workout : owns
    User ||--o{ WorkoutRun : executes
    User ||--o{ WeightLog : logs
    User ||--o{ Post : creates
    User ||--o{ Comment : writes
    User ||--o{ Reaction : reacts
    User ||--o{ ChallengeEntry : submits
    User ||--o{ Notification : receives
    User ||--o{ MediaFile : uploads
    User ||--o{ Challenge : creates

    Workout ||--o{ WorkoutRun : executed_as
    Workout ||--o{ WeightLog : referenced_in

    Exercise ||--o{ WeightLog : tracked_in

    WorkoutRun ||--o{ WeightLog : contains

    Post ||--o{ Comment : has
    Post ||--o{ Reaction : receives

    Comment ||--o{ Comment : replies_to
    Comment ||--o{ Reaction : receives

    Challenge ||--o{ ChallengeEntry : has

    User {
        uuid id PK
        string email UK
        string passwordHash
        string displayName
        string firstName
        string lastName
        enum role
        boolean emailVerified
        string emailVerificationToken
        string profilePicturePath
        datetime lastActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    OAuthToken {
        uuid id PK
        uuid userId FK
        enum provider
        string providerUserId
        text accessToken
        text refreshToken
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    Workout {
        uuid id PK
        uuid ownerUserId FK
        string title
        text description
        enum type
        json exercises
        int estimatedTimeMinutes
        array tags
        text notes
        boolean isTemplate
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Exercise {
        uuid id PK
        string name UK
        text description
        string category
        json defaultMetrics
        datetime createdAt
        datetime updatedAt
    }

    WorkoutRun {
        uuid id PK
        uuid userId FK
        uuid workoutId FK
        date date
        datetime startedAt
        datetime completedAt
        json results
        text notes
        int totalTimeSeconds
        datetime createdAt
        datetime updatedAt
    }

    WeightLog {
        uuid id PK
        uuid userId FK
        uuid exerciseId FK
        uuid workoutRunId FK
        decimal weight
        int reps
        int sets
        date date
        text notes
        datetime createdAt
        datetime updatedAt
    }

    Post {
        uuid id PK
        uuid userId FK
        text text
        array mediaPaths
        enum privacy
        array exerciseTags
        string location
        boolean isPinned
        enum moderationStatus
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    MediaFile {
        uuid id PK
        uuid userId FK
        string filename
        string originalFilename
        string mimeType
        bigint fileSizeBytes
        string storagePath
        string publicUrlPath
        string thumbnailPath
        int width
        int height
        int durationSeconds
        enum storageProvider
        string checksumMd5
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        uuid id PK
        uuid postId FK
        uuid userId FK
        uuid parentCommentId FK
        text text
        enum moderationStatus
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Reaction {
        uuid id PK
        uuid userId FK
        enum targetType
        uuid targetId
        enum reactionType
        datetime createdAt
    }

    Challenge {
        uuid id PK
        uuid coachId FK
        string title
        text description
        enum metricType
        datetime startAt
        datetime endAt
        decimal targetValue
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    ChallengeEntry {
        uuid id PK
        uuid challengeId FK
        uuid userId FK
        decimal value
        date date
        text notes
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        uuid id PK
        uuid userId FK
        enum type
        string title
        text message
        string relatedEntityType
        uuid relatedEntityId
        boolean isRead
        datetime createdAt
    }

    AnalyticsEvent {
        uuid id PK
        enum eventType
        uuid userId
        string entityType
        uuid entityId
        json metadata
        string ipAddress
        string userAgent
        datetime createdAt
    }
```

## Key Relationships

### One-to-Many

- User → OAuthToken (1:many)
- User → Workout (1:many)
- User → WorkoutRun (1:many)
- User → WeightLog (1:many)
- User → Post (1:many)
- User → Comment (1:many)
- User → Reaction (1:many)
- User → ChallengeEntry (1:many)
- User → Notification (1:many)
- User → MediaFile (1:many)
- User → Challenge (1:many - as coach)
- Workout → WorkoutRun (1:many)
- Workout → WeightLog (1:many)
- Exercise → WeightLog (1:many)
- WorkoutRun → WeightLog (1:many)
- Post → Comment (1:many)
- Post → Reaction (1:many)
- Comment → Comment (1:many - self-referential for nested comments)
- Comment → Reaction (1:many)
- Challenge → ChallengeEntry (1:many)

### Many-to-One

- OAuthToken → User (many:1)
- Workout → User (many:1 - owner)
- WorkoutRun → User (many:1)
- WorkoutRun → Workout (many:1)
- WeightLog → User (many:1)
- WeightLog → Exercise (many:1, optional)
- WeightLog → WorkoutRun (many:1, optional)
- Post → User (many:1)
- Comment → Post (many:1)
- Comment → User (many:1)
- Comment → Comment (many:1 - parent comment)
- Reaction → User (many:1)
- Challenge → User (many:1 - coach)
- ChallengeEntry → Challenge (many:1)
- ChallengeEntry → User (many:1)
- Notification → User (many:1)
- MediaFile → User (many:1, optional)

### Constraints

- **OAuthToken**: Unique constraint on (provider, providerUserId)
- **Reaction**: Unique constraint on (userId, targetType, targetId) - one reaction per user per target
- **ChallengeEntry**: Unique constraint on (challengeId, userId, date) - one entry per user per challenge per day
- **User.email**: Unique constraint
- **Exercise.name**: Unique constraint

### Soft Deletes

Models with soft delete support (deletedAt field):
- User
- Workout
- Post
- Comment

### Indexes

Key indexes for performance:
- User: email, role, deletedAt
- Workout: ownerUserId, type, deletedAt
- WorkoutRun: userId, workoutId, date
- WeightLog: userId, exerciseId, workoutRunId, date
- Post: userId, privacy, moderationStatus, deletedAt, createdAt
- Comment: postId, userId, parentCommentId, deletedAt
- Reaction: targetType+targetId, userId
- Challenge: coachId, isActive, startAt+endAt
- ChallengeEntry: challengeId, userId, date
- Notification: userId, isRead, createdAt
- AnalyticsEvent: eventType, userId, createdAt, entityType+entityId

