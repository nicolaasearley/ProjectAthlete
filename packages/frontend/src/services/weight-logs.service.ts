import { apiClient, ApiError } from '../lib/api';

export interface WeightLog {
  id: string;
  userId: string;
  exerciseId?: string;
  workoutRunId?: string;
  weight?: number;
  reps?: number;
  sets?: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  exercise?: {
    id: string;
    name: string;
    category?: string;
  };
  workoutRun?: {
    id: string;
    workout: {
      id: string;
      title: string;
    };
  };
}

export interface WeightLogListResponse {
  data: WeightLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateWeightLogRequest {
  exerciseId?: string;
  workoutRunId?: string;
  weight?: number;
  reps?: number;
  sets?: number;
  date: string;
  notes?: string;
}

export interface UpdateWeightLogRequest {
  exerciseId?: string;
  workoutRunId?: string;
  weight?: number;
  reps?: number;
  sets?: number;
  date?: string;
  notes?: string;
}

export interface WeightLogQuery {
  page?: number;
  limit?: number;
  exerciseId?: string;
  workoutRunId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExerciseProgression {
  id: string;
  weight: number;
  reps?: number;
  sets?: number;
  date: string;
}

export class WeightLogsService {
  async getAll(query?: WeightLogQuery): Promise<WeightLogListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.exerciseId) params.append('exerciseId', query.exerciseId);
    if (query?.workoutRunId) params.append('workoutRunId', query.workoutRunId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);

    const endpoint = `/weight-logs${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<WeightLogListResponse>(endpoint);
  }

  async getById(id: string): Promise<WeightLog> {
    return apiClient.get<WeightLog>(`/weight-logs/${id}`);
  }

  async create(data: CreateWeightLogRequest): Promise<WeightLog> {
    return apiClient.post<WeightLog>('/weight-logs', data);
  }

  async update(id: string, data: UpdateWeightLogRequest): Promise<WeightLog> {
    return apiClient.patch<WeightLog>(`/weight-logs/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/weight-logs/${id}`);
  }

  async getExerciseProgression(exerciseId: string, startDate?: string, endDate?: string): Promise<ExerciseProgression[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const endpoint = `/weight-logs/exercise/${exerciseId}/progression${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ExerciseProgression[]>(endpoint);
  }
}

export const weightLogsService = new WeightLogsService();

