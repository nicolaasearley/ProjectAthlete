import { apiClient, ApiError } from '../lib/api';

export type ChallengeMetricType = 'TIME' | 'REPS' | 'WEIGHT' | 'DISTANCE' | 'CUMULATIVE';

export interface Challenge {
  id: string;
  coachId: string;
  title: string;
  description?: string;
  metricType: ChallengeMetricType;
  startAt: string;
  endAt: string;
  targetValue?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  coach?: {
    id: string;
    email: string;
    displayName?: string;
  };
  _count?: {
    entries: number;
  };
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  value: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    displayName?: string;
  };
  challenge?: {
    id: string;
    title: string;
    metricType: ChallengeMetricType;
  };
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  total: number;
  entryCount: number;
}

export interface CreateChallengeRequest {
  title: string;
  description?: string;
  metricType: ChallengeMetricType;
  startAt: string;
  endAt: string;
  targetValue?: number;
  isActive?: boolean;
}

export interface UpdateChallengeRequest {
  title?: string;
  description?: string;
  metricType?: ChallengeMetricType;
  startAt?: string;
  endAt?: string;
  targetValue?: number;
  isActive?: boolean;
}

export interface CreateChallengeEntryRequest {
  challengeId: string;
  value: number;
  date: string;
  notes?: string;
}

export interface ChallengeQuery {
  isActive?: boolean;
}

export class ChallengesService {
  async getAll(query?: ChallengeQuery): Promise<Challenge[]> {
    const params = new URLSearchParams();
    if (query?.isActive !== undefined) {
      params.append('isActive', query.isActive.toString());
    }

    const endpoint = `/challenges${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<Challenge[]>(endpoint);
  }

  async getById(id: string): Promise<Challenge> {
    return apiClient.get<Challenge>(`/challenges/${id}`);
  }

  async create(data: CreateChallengeRequest): Promise<Challenge> {
    return apiClient.post<Challenge>('/challenges', data);
  }

  async update(id: string, data: UpdateChallengeRequest): Promise<Challenge> {
    return apiClient.patch<Challenge>(`/challenges/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/challenges/${id}`);
  }

  async getLeaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
    return apiClient.get<LeaderboardEntry[]>(`/challenges/${challengeId}/leaderboard`);
  }

  async getEntries(challengeId: string, userId?: string): Promise<ChallengeEntry[]> {
    const params = new URLSearchParams();
    if (userId) {
      params.append('userId', userId);
    }

    const endpoint = `/challenges/${challengeId}/entries${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ChallengeEntry[]>(endpoint);
  }

  async createEntry(data: CreateChallengeEntryRequest): Promise<ChallengeEntry> {
    return apiClient.post<ChallengeEntry>(`/challenges/${data.challengeId}/entries`, data);
  }

  async updateEntry(entryId: string, value: number, notes?: string): Promise<ChallengeEntry> {
    return apiClient.patch<ChallengeEntry>(`/challenges/entries/${entryId}`, { value, notes });
  }

  async deleteEntry(entryId: string): Promise<void> {
    return apiClient.delete(`/challenges/entries/${entryId}`);
  }
}

export const challengesService = new ChallengesService();

