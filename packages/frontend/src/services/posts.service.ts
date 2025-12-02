import { apiClient, ApiError } from '../lib/api';

export type Privacy = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
export type ReactionType = 'LIKE' | 'LOVE' | 'FIRE' | 'THUMBS_UP' | 'CELEBRATE';

export interface Post {
  id: string;
  userId: string;
  text: string;
  mediaPaths?: string[];
  privacy: Privacy;
  exerciseTags?: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    displayName?: string;
    profilePicturePath?: string;
  };
  _count?: {
    comments: number;
  };
  reactionCounts?: Record<string, number>;
  userReaction?: ReactionType | null;
}

export interface PostListResponse {
  data: Post[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePostRequest {
  text: string;
  mediaPaths?: string[];
  privacy?: Privacy;
  exerciseTags?: string[];
  location?: string;
}

export interface UpdatePostRequest {
  text?: string;
  mediaPaths?: string[];
  privacy?: Privacy;
  exerciseTags?: string[];
  location?: string;
}

export interface PostQuery {
  page?: number;
  limit?: number;
  userId?: string;
}

export class PostsService {
  async getAll(query?: PostQuery): Promise<PostListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.userId) params.append('userId', query.userId);

    const endpoint = `/posts${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<PostListResponse>(endpoint);
  }

  async getById(id: string): Promise<Post> {
    return apiClient.get<Post>(`/posts/${id}`);
  }

  async create(data: CreatePostRequest): Promise<Post> {
    return apiClient.post<Post>('/posts', data);
  }

  async update(id: string, data: UpdatePostRequest): Promise<Post> {
    return apiClient.patch<Post>(`/posts/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/posts/${id}`);
  }
}

export const postsService = new PostsService();

