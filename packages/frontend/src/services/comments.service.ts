import { apiClient, ApiError } from '../lib/api';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    displayName?: string;
    profilePicturePath?: string;
  };
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface CreateCommentRequest {
  postId: string;
  text: string;
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  text: string;
}

export class CommentsService {
  async getByPost(postId: string): Promise<Comment[]> {
    return apiClient.get<Comment[]>(`/comments/post/${postId}`);
  }

  async create(data: CreateCommentRequest): Promise<Comment> {
    return apiClient.post<Comment>('/comments', data);
  }

  async update(id: string, data: UpdateCommentRequest): Promise<Comment> {
    return apiClient.patch<Comment>(`/comments/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/comments/${id}`);
  }
}

export const commentsService = new CommentsService();

