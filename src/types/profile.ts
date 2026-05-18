export type UserRole = 'captador' | 'supervisor' | 'administrador';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}
