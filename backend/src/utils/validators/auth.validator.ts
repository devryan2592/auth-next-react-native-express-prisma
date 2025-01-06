import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(255, 'Email must be less than 255 characters')
      .trim()
      .toLowerCase(),
    
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    
    confirmPassword: z
      .string({ required_error: 'Password confirmation is required' }),
    
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .trim()
      .regex(
        /^[a-zA-Z\s]+$/,
        'Name can only contain letters and spaces'
      ),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];

// Response type for successful registration
export interface RegisterResponse {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
}
