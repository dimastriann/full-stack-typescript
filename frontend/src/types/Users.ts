export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export type UserType = {
  id?: number;
  name: string;
  lastName?: string;
  email: string;
  password: string;
  role?: UserRole;
  birthDate?: Date;
  mobile?: string;
  phone?: string;
  status: boolean;
};
