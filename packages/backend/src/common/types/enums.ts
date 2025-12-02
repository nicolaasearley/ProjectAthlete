// Enum types - can be moved to shared package later

export enum Role {
  USER = 'USER',
  COACH = 'COACH',
  ADMIN = 'ADMIN',
}

export enum WorkoutType {
  PERSONAL = 'PERSONAL',
  COMMUNITY = 'COMMUNITY',
}

export enum Privacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
}

export enum StorageProvider {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  MINIO = 'MINIO',
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  FIRE = 'FIRE',
  THUMBS_UP = 'THUMBS_UP',
  CELEBRATE = 'CELEBRATE',
}

export enum ReactionTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
}

export enum ChallengeMetricType {
  TIME = 'TIME',
  REPS = 'REPS',
  WEIGHT = 'WEIGHT',
  DISTANCE = 'DISTANCE',
  CUMULATIVE = 'CUMULATIVE',
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED',
}

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export enum NotificationType {
  COMMENT = 'COMMENT',
  REACTION = 'REACTION',
  CHALLENGE_UPDATE = 'CHALLENGE_UPDATE',
  COACH_ANNOUNCEMENT = 'COACH_ANNOUNCEMENT',
  WORKOUT_ASSIGNED = 'WORKOUT_ASSIGNED',
}

export enum AnalyticsEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  WORKOUT_CREATED = 'WORKOUT_CREATED',
  WORKOUT_COMPLETED = 'WORKOUT_COMPLETED',
  CHALLENGE_ENTRY = 'CHALLENGE_ENTRY',
  POST_CREATED = 'POST_CREATED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  REACTION_CREATED = 'REACTION_CREATED',
}

