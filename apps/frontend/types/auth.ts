export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role?: string;
}

export interface AuthResponse {
  message?: string;
  payload?: Partial<AuthUser>;
  user?: Partial<AuthUser>;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}
