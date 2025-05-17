export interface JwtPayload {
  sub: string; // User ID
  username: string;
  email: string;
  tenant_id: string;
  schema_name: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for tracking tokens for revocation
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TenantInfo {
  id: string;
  name: string;
  schema_name: string;
  status: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventPasswordReuse: boolean;
  passwordHistoryCount: number;
  expiryDays: number | null;
}
