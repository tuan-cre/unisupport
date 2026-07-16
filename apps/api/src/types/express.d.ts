declare namespace Express {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    roleId: string | null;
    roleName: string | null;
  }
}
