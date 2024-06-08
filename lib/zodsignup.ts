import * as z from 'zod';

export const AuthCredentialsValidator = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(20, 'First name must be less than 21 characters')
    .regex(/^[a-zA-Z]+$/, 'First name should only contain letters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(20, 'Last name must be less than 21 characters')
    .regex(/^[a-zA-Z]+$/, 'Last name should only contain letters'),
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters')
    .max(20, 'Username must be less than 21 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  role: z.string().min(1, "Role is required"),
});