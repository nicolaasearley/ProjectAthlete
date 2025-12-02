import { apiClient, ApiError } from '../lib/api';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category?: string;
  defaultMetrics?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseListResponse {
  data: Exercise[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  category?: string;
  defaultMetrics?: Record<string, any>;
}

export interface UpdateExerciseRequest {
  name?: string;
  description?: string;
  category?: string;
  defaultMetrics?: Record<string, any>;
}

export interface ExerciseQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export class ExercisesService {
  async getAll(query?: ExerciseQuery): Promise<ExerciseListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.category) params.append('category', query.category);
    if (query?.search) params.append('search', query.search);

    const endpoint = `/exercises${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ExerciseListResponse>(endpoint);
  }

  async getById(id: string): Promise<Exercise> {
    return apiClient.get<Exercise>(`/exercises/${id}`);
  }

  async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/exercises/categories');
  }

  async create(data: CreateExerciseRequest): Promise<Exercise> {
    return apiClient.post<Exercise>('/exercises', data);
  }

  async update(id: string, data: UpdateExerciseRequest): Promise<Exercise> {
    return apiClient.patch<Exercise>(`/exercises/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/exercises/${id}`);
  }
}

export const exercisesService = new ExercisesService();

