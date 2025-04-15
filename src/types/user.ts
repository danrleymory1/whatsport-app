// src/types/user.ts
export enum UserType {
    PLAYER = "jogador",
    MANAGER = "gerente"
  }
  
  export interface User {
    id: string;
    email: string;
    user_type: UserType;
    name?: string;
    profile_image?: string;
    phone?: string;
    address?: string; 
    birth_date?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
  }
