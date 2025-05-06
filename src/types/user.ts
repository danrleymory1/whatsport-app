// src/types/user.ts
export enum UserType {
  PLAYER = "jogador",
  MANAGER = "gerente"
}

export interface UserSport {
  sport_type: string;
  skill_level: string;
  years_experience?: number;
  preferred_position?: string;
}

export interface CompanyInfo {
  name: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  phone?: string;
}

export interface BankingInfo {
  bank_name: string;
  account_type: string;
  account_number: string;
  branch_number?: string;
  pix_key?: string;
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
  
  // Player specific fields
  sports?: UserSport[];
  
  // Manager specific fields
  position?: string;
  company_info?: CompanyInfo;
  banking_info?: BankingInfo;
}