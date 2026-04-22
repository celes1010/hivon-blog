export type Role = "viewer" | "author" | "admin";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface PostRow {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  summary: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: Pick<UserRow, "id" | "name" | "role">;
}

export interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user?: Pick<UserRow, "id" | "name" | "role">;
}
