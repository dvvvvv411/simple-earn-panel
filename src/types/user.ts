export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  branding_id: string | null;
  created_at: string;
  updated_at: string;
  branding?: {
    id: string;
    name: string;
  };
  roles?: Array<{
    role: string;
  }>;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  branding_id?: string;
  password: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  branding_id?: string;
}