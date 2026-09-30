export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  departmentId: string | null;
  teamId: string | null;
  managerId: string | null;
}
