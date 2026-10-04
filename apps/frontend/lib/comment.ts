import { apiRequest, ApiError } from "./api";

/**
 * User information associated with a comment or reply.
 */
export interface CommentUser {
  _id: string;
  name?: string;
  email?: string;
}

/**
 * Reply content and metadata returned for a comment.
 */
export interface Reply {
  _id: string;
  content: string;
  user?: CommentUser;
  author?: CommentUser;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Comment content, author, replies, and timestamps.
 */
export interface Comment {
  _id: string;
  blog: string;
  content: string;
  user?: CommentUser;
  author?: CommentUser;
  replies: Reply[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Pagination metadata for a comment list.
 */
export interface CommentListMeta {
  total: number;
}

/**
 * API response returned when listing comments for a blog.
 */
export interface CommentListApiResponse {
  result: Comment[];
  message: string;
  meta: CommentListMeta;
}

/**
 * Generic response returned by comment mutations.
 */
export interface ApiResponse<T> {
  result: T;
  message: string;
  meta: null;
}

/**
 * Client methods for retrieving and managing blog comments and replies.
 */
export const commentApi = {
  /**
   * Lists comments for a blog post.
   *
   * @param blogId - ID of the blog post.
   * @returns A promise containing the comments and total count.
   */
  list(blogId: string) {
    return apiRequest<CommentListApiResponse>(`/blog/${blogId}/comments`, {
      method: "GET",
    });
  },

  /**
   * Creates a comment on a blog post.
   *
   * @param blogId - ID of the blog post.
   * @param content - Text content of the comment.
   * @returns A promise containing the created comment.
   */
  create(blogId: string, content: string) {
    return apiRequest<ApiResponse<Comment>>(`/blog/${blogId}/comments`, {
      method: "POST",
      data: { content },
    });
  },

  /**
   * Adds a reply to a comment.
   *
   * @param commentId - ID of the comment to reply to.
   * @param content - Text content of the reply.
   * @returns A promise containing the updated comment.
   */
  addReply(commentId: string, content: string) {
    return apiRequest<ApiResponse<Comment>>(`/comments/${commentId}/replies`, {
      method: "POST",
      data: { content },
    });
  },

  /**
   * Deletes a comment.
   *
   * @param commentId - ID of the comment to delete.
   * @returns A promise containing the deletion response.
   */
  delete(commentId: string) {
    return apiRequest<ApiResponse<null>>(`/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  /**
   * Deletes a reply from a comment.
   *
   * @param commentId - ID of the parent comment.
   * @param replyId - ID of the reply to delete.
   * @returns A promise containing the updated comment.
   */
  deleteReply(commentId: string, replyId: string) {
    return apiRequest<ApiResponse<Comment>>(`/comments/${commentId}/replies/${replyId}`, {
      method: "DELETE",
    });
  },
};

export { ApiError };