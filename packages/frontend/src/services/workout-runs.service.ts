import { apiClient, ApiError } from '../lib/api';

export interface WorkoutRun {
  id: string;
  userId: string;
  workoutId: string;
  date: string;
  startedAt?: string;
  completedAt?: string;
  results?: Record<string, any>;
  notes?: string;
  totalTimeSeconds?: number;
  createdAt: string;
  updatedAt: string;
  workout?: {
    id: string;
    title: string;
    description?: string;
    exercises?: any[];
    type?: string;
  };
  weightLogs?: Array<{
    id: string;
    weight?: number;
    reps?: number;
    sets?: number;
    exercise?: {
      id: string;
      name: string;
    };
  }>;
}

export interface WorkoutRunListResponse {
  data: WorkoutRun[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateWorkoutRunRequest {
  workoutId: string;
  date: string;
  results?: Record<string, any>;
  notes?: string;
  totalTimeSeconds?: number;
}

export interface UpdateWorkoutRunRequest {
  results?: Record<string, any>;
  notes?: string;
  totalTimeSeconds?: number;
  date?: string;
}

export interface WorkoutRunQuery {
  page?: number;
  limit?: number;
  workoutId?: string;
  startDate?: string;
  endDate?: string;
}

export class WorkoutRunsService {
  async getAll(query?: WorkoutRunQuery): Promise<WorkoutRunListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.workoutId) params.append('workoutId', query.workoutId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);

    const endpoint = `/workout-runs${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<WorkoutRunListResponse>(endpoint);
  }

  async getById(id: string): Promise<WorkoutRun> {
    return apiClient.get<WorkoutRun>(`/workout-runs/${id}`);
  }

  async create(data: CreateWorkoutRunRequest): Promise<WorkoutRun> {
    return apiClient.post<WorkoutRun>('/workout-runs', data);
  }

  async update(id: string, data: UpdateWorkoutRunRequest): Promise<WorkoutRun> {
    return apiClient.patch<WorkoutRun>(`/workout-runs/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/workout-runs/${id}`);
  }

  async complete(id: string, results?: Record<string, any>, notes?: string): Promise<WorkoutRun> {
    return apiClient.post<WorkoutRun>(`/workout-runs/${id}/complete`, { results, notes });
  }
}

export const workoutRunsService = new WorkoutRunsService();

