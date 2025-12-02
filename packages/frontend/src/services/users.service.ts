import { apiClient, ApiError } from '../lib/api';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified: boolean;
  profilePicturePath?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  workoutCount: number;
  workoutRunCount: number;
  weightLogCount: number;
}

export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profilePicturePath?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class UsersService {
  async getMe(): Promise<User> {
    return apiClient.get<User>('/users/me');
  }

  async getMyStats(): Promise<UserStats> {
    return apiClient.get<UserStats>('/users/me/stats');
  }

  async updateProfile(data: UpdateUserRequest): Promise<User> {
    return apiClient.patch<User>('/users/me', data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>('/users/me/password', data);
  }

  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  // Admin-only methods

  async getAllUsers(query?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<UserListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.role) params.append('role', query.role);
    if (query?.search) params.append('search', query.search);

    const endpoint = `/users/admin/list${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<UserListResponse>(endpoint);
  }

  async updateUserByAdmin(id: string, data: AdminUpdateUserRequest): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data);
  }

  async changeUserRole(id: string, role: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/role`, { role });
  }

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  }
}

export interface UserListResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUpdateUserRequest {
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  profilePicturePath?: string;
}

export const usersService = new UsersService();

