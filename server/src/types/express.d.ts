import type { Role } from "@food/shared";

declare global {
  namespace Express {
    interface User {
      id: number;
      restaurantId?: string | null;
      email: string;
      role: Role;
      name: string;
    }

    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export {};
