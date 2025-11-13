declare const enum UserRole {
  ADMIN,
  MANAGER,
  USER,
}

export type UserType = {
  id?: number;
  name: string;
  lastName?: string;
  email: string;
  password: string;
  role?: UserRole.USER;
  birthDate?: Date;
  mobile?: string;
  phone?: string;
  status: boolean;
};
