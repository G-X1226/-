export interface AuthUserResponseDto {
  id: string;
  email: string;
  role: string;
  status: string;
  balanceCreditsMicro: string;
  freeCreditsMicro: string;
  createdAt: Date;
}

export interface AuthResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUserResponseDto;
}
