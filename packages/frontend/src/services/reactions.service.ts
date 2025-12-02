import { apiClient, ApiError } from '../lib/api';

export type ReactionTargetType = 'POST' | 'COMMENT';
export type ReactionType = 'LIKE' | 'LOVE' | 'FIRE' | 'THUMBS_UP' | 'CELEBRATE';

export interface CreateReactionRequest {
  targetType: ReactionTargetType;
  targetId: string;
  reactionType: ReactionType;
}

export interface Reaction {
  id: string;
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  reactionType: ReactionType;
  createdAt: string;
  user?: {
    id: string;
    displayName?: string;
  };
}

export class ReactionsService {
  async createOrUpdate(data: CreateReactionRequest): Promise<{ action: string; reaction: Reaction | null }> {
    return apiClient.post<{ action: string; reaction: Reaction | null }>('/reactions', data);
  }

  async delete(targetType: ReactionTargetType, targetId: string): Promise<void> {
    return apiClient.delete(`/reactions/${targetType}/${targetId}`);
  }
}

export const reactionsService = new ReactionsService();

