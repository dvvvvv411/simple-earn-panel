export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  branding_id: string | null;
  consultant_id: string | null;
  balance: number;
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
  consultant_id?: string;
  password: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  branding_id?: string;
  consultant_id?: string;
  balance?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'adjustment';
  description: string;
  previous_balance: number;
  new_balance: number;
  created_at: string;
  created_by: string | null;
}

export interface BalanceUpdateData {
  amount: number;
  type: 'add' | 'set';
  description: string;
}