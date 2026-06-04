export interface UserResponseDto {
  id: string;
  email: string;
  role: string;
  status: string;
  balanceCreditsMicro: string;
  freeCreditsMicro: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
