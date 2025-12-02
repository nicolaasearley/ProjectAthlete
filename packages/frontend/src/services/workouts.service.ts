import { apiClient, ApiError } from '../lib/api';

export interface Exercise {
  id: string;
  name: string;
  order: number;
  sets?: string;
  reps?: string;
  weight?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  groupType?: 'NONE' | 'SUPERSET' | 'CIRCUIT';
  groupIndex?: number; // Used to identify which exercises are in the same group
}

export interface Workout {
  id: string;
  title: string;
  description?: string;
  type: 'PERSONAL' | 'COMMUNITY';
  exercises: Exercise[];
  estimatedTimeMinutes?: number;
  tags?: string[];
  notes?: string;
  isTemplate?: boolean;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface WorkoutListResponse {
  data: Workout[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateWorkoutRequest {
  title: string;
  description?: string;
  type: 'PERSONAL' | 'COMMUNITY';
  exercises: Exercise[];
  estimatedTimeMinutes?: number;
  tags?: string[];
  notes?: string;
  isTemplate?: boolean;
}

export interface UpdateWorkoutRequest {
  title?: string;
  description?: string;
  type?: 'PERSONAL' | 'COMMUNITY';
  exercises?: Exercise[];
  estimatedTimeMinutes?: number;
  tags?: string[];
  notes?: string;
  isTemplate?: boolean;
}

export interface WorkoutQuery {
  page?: number;
  limit?: number;
  type?: 'PERSONAL' | 'COMMUNITY';
  ownerId?: string;
  search?: string;
}

export class WorkoutsService {
  async getAll(query?: WorkoutQuery): Promise<WorkoutListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.type) params.append('type', query.type);
    if (query?.ownerId) params.append('ownerId', query.ownerId);
    if (query?.search) params.append('search', query.search);

    const endpoint = `/workouts${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<WorkoutListResponse>(endpoint);
  }

  async getById(id: string): Promise<Workout> {
    return apiClient.get<Workout>(`/workouts/${id}`);
  }

  async create(data: CreateWorkoutRequest): Promise<Workout> {
    return apiClient.post<Workout>('/workouts', data);
  }

  async update(id: string, data: UpdateWorkoutRequest): Promise<Workout> {
    return apiClient.patch<Workout>(`/workouts/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/workouts/${id}`);
  }

  async copy(id: string): Promise<Workout> {
    return apiClient.post<Workout>(`/workouts/${id}/copy`);
  }
}

export const workoutsService = new WorkoutsService();

