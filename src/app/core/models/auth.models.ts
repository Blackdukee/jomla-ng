/**
 * Auth models matching backend AuthResponseDto and related types.
 * Backend: Jomla.Application.Features.Auth.DTOs.AuthResponseDto
 */

export interface AuthResponse {
  token: string;
  userId: string;           // Backend: Guid → string
  email: string;
  firstName: string;
  lastName: string;
   imageUrl?: string;  
  refreshTokenExpiresOn: string;  // ISO date string
}

/**
 * Local user representation stored in localStorage.
 * Derived from AuthResponse + JWT role claim.
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Buyer' | 'Supplier';
  imageUrl?: string;
}

/**
 * Register request payload.
 * Backend: Jomla.Application.Features.Auth.Commands.Register.RegisterCommand
 */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'Buyer' | 'Supplier';
}

/**
 * Login request payload.
 * Backend: Jomla.Application.Features.Auth.Commands.Login.LoginCommand
 */
export interface LoginRequest {
  email: string;
  password: string;
}
