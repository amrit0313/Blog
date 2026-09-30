import { apiRequest, ApiError } from "./api";

export interface CommentAuthor {
  _id: string;
  name?: string;
  email?: string;
}

export interface Reply {
  _id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  blog: string;
  content: string;
  author: CommentAuthor;
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentListMeta {
  total: number;
}

export interface CommentListApiResponse {
  result: Comment[];
  message: string;
  meta: CommentListMeta;
}

export interface ApiResponse<T> {
  result: T;
  message: string;
  meta: null;
}

export const commentApi = {
  list(blogId: string) {
    return apiRequest<CommentListApiResponse>(`/blog/${blogId}/comments`, {
      method: "GET",
    });
  },

  create(blogId: string, content: string) {
    return apiRequest<ApiResponse<Comment>>(`/blog/${blogId}/comments`, {
      method: "POST",
      data: { content },
    });
  },

  addReply(commentId: string, content: string) {
    return apiRequest<ApiResponse<Comment>>(`/comments/${commentId}/replies`, {
      method: "POST",
      data: { content },
    });
  },

  delete(commentId: string) {
    return apiRequest<ApiResponse<null>>(`/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  deleteReply(commentId: string, replyId: string) {
    return apiRequest<ApiResponse<Comment>>(`/comments/${commentId}/replies/${replyId}`, {
      method: "DELETE",
    });
  },
};

export { ApiError };