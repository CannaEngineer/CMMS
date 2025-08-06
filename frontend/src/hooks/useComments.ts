// React hooks for comment system
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService, Comment, CreateCommentRequest, UpdateCommentRequest, CommentFilters } from '../services/commentService';

// Hook to get comments for an entity
export function useComments(
  entityType: string,
  entityId: number,
  filters?: CommentFilters
) {
  return useQuery({
    queryKey: ['comments', entityType, entityId, filters],
    queryFn: () => commentService.getComments(entityType, entityId, filters),
    enabled: !!(entityType && entityId),
  });
}

// Hook to get a single comment
export function useComment(id: number) {
  return useQuery({
    queryKey: ['comment', id],
    queryFn: () => commentService.getComment(id),
    enabled: !!id,
  });
}

// Hook to get comment count
export function useCommentCount(
  entityType: string,
  entityId: number,
  includeInternal: boolean = true
) {
  return useQuery({
    queryKey: ['comment-count', entityType, entityId, includeInternal],
    queryFn: () => commentService.getCommentCount(entityType, entityId, includeInternal),
    enabled: !!(entityType && entityId),
  });
}

// Hook to get recent comments
export function useRecentComments(
  entityType: string,
  entityId: number,
  limit: number = 5,
  includeInternal: boolean = true
) {
  return useQuery({
    queryKey: ['recent-comments', entityType, entityId, limit, includeInternal],
    queryFn: () => commentService.getRecentComments(entityType, entityId, limit, includeInternal),
    enabled: !!(entityType && entityId),
  });
}

// Hook to create a comment
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      commentData,
    }: {
      entityType: string;
      entityId: number;
      commentData: CreateCommentRequest;
    }) => commentService.createComment(entityType, entityId, commentData),
    onSuccess: (newComment, variables) => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comment-count', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recent-comments', variables.entityType, variables.entityId],
      });
    },
  });
}

// Hook to update a comment
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      commentData,
      entityType,
      entityId,
    }: {
      id: number;
      commentData: UpdateCommentRequest;
      entityType: string;
      entityId: number;
    }) => commentService.updateComment(id, commentData),
    onSuccess: (updatedComment, variables) => {
      // Update the comment in cache
      queryClient.setQueryData(['comment', variables.id], updatedComment);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recent-comments', variables.entityType, variables.entityId],
      });
    },
  });
}

// Hook to delete a comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      entityType,
      entityId,
    }: {
      id: number;
      entityType: string;
      entityId: number;
    }) => commentService.deleteComment(id),
    onSuccess: (_, variables) => {
      // Remove comment from cache
      queryClient.removeQueries({ queryKey: ['comment', variables.id] });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comment-count', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recent-comments', variables.entityType, variables.entityId],
      });
    },
  });
}

// Hook to toggle pin status
export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isPinned,
      entityType,
      entityId,
    }: {
      id: number;
      isPinned: boolean;
      entityType: string;
      entityId: number;
    }) => commentService.togglePin(id, isPinned),
    onSuccess: (updatedComment, variables) => {
      // Update the comment in cache
      queryClient.setQueryData(['comment', variables.id], updatedComment);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      });
    },
  });
}

// Hook to toggle internal status
export function useToggleInternal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isInternal,
      entityType,
      entityId,
    }: {
      id: number;
      isInternal: boolean;
      entityType: string;
      entityId: number;
    }) => commentService.toggleInternal(id, isInternal),
    onSuccess: (updatedComment, variables) => {
      // Update the comment in cache
      queryClient.setQueryData(['comment', variables.id], updatedComment);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      });
    },
  });
}

// Hook to search comments
export function useSearchComments(
  searchTerm: string,
  entityType?: string,
  entityId?: number,
  limit: number = 50
) {
  return useQuery({
    queryKey: ['search-comments', searchTerm, entityType, entityId, limit],
    queryFn: () => commentService.searchComments(searchTerm, entityType, entityId, limit),
    enabled: !!searchTerm.trim(),
  });
}

// Hook to get comments by user
export function useCommentsByUser(userId: number, limit: number = 50) {
  return useQuery({
    queryKey: ['comments-by-user', userId, limit],
    queryFn: () => commentService.getCommentsByUser(userId, limit),
    enabled: !!userId,
  });
}

// Hook to reply to a comment
export function useReplyToComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      parentId,
      content,
      isInternal,
    }: {
      entityType: string;
      entityId: number;
      parentId: number;
      content: string;
      isInternal?: boolean;
    }) => commentService.replyToComment(entityType, entityId, parentId, content, isInternal),
    onSuccess: (newReply, variables) => {
      // Invalidate comments queries to show the new reply
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comment', variables.parentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comment-count', variables.entityType, variables.entityId],
      });
    },
  });
}

// Hook to get entity comment summary
export function useCommentSummary(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ['comment-summary', entityType, entityId],
    queryFn: () => commentService.getEntityCommentSummary(entityType, entityId),
    enabled: !!(entityType && entityId),
  });
}

// Hook to get comment thread (parent + replies)
export function useCommentThread(id: number) {
  return useQuery({
    queryKey: ['comment-thread', id],
    queryFn: () => commentService.getCommentThread(id),
    enabled: !!id,
  });
}

// Custom hook to manage comment form state
export function useCommentForm(
  entityType: string,
  entityId: number,
  onSuccess?: () => void
) {
  const createCommentMutation = useCreateComment();
  const replyMutation = useReplyToComment();

  const submitComment = async (
    content: string,
    options?: {
      isInternal?: boolean;
      isPinned?: boolean;
      parentId?: number;
      attachments?: string[];
    }
  ) => {
    try {
      if (options?.parentId) {
        // This is a reply
        await replyMutation.mutateAsync({
          entityType,
          entityId,
          parentId: options.parentId,
          content,
          isInternal: options.isInternal,
        });
      } else {
        // This is a new comment
        await createCommentMutation.mutateAsync({
          entityType,
          entityId,
          commentData: {
            content,
            isInternal: options?.isInternal,
            isPinned: options?.isPinned,
            attachments: options?.attachments,
          },
        });
      }
      
      onSuccess?.();
    } catch (error) {
      throw error;
    }
  };

  return {
    submitComment,
    isSubmitting: createCommentMutation.isPending || replyMutation.isPending,
    error: createCommentMutation.error || replyMutation.error,
    reset: () => {
      createCommentMutation.reset();
      replyMutation.reset();
    },
  };
}

// Hook to manage comment permissions
export function useCommentPermissions(comment?: Comment, currentUserId?: number, currentUserRole?: string) {
  const canEdit = comment && (
    comment.userId === currentUserId || 
    ['ADMIN', 'MANAGER'].includes(currentUserRole || '')
  );

  const canDelete = comment && (
    comment.userId === currentUserId || 
    ['ADMIN', 'MANAGER'].includes(currentUserRole || '')
  );

  const canPin = ['ADMIN', 'MANAGER'].includes(currentUserRole || '');
  
  const canToggleInternal = ['ADMIN', 'MANAGER'].includes(currentUserRole || '');

  const canReply = !!currentUserId;

  return {
    canEdit,
    canDelete,
    canPin,
    canToggleInternal,
    canReply,
  };
}