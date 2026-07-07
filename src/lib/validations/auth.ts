import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email 格式不正確"),
  password: z.string().min(6, "密碼至少 6 碼"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Email 格式不正確"),
    displayName: z
      .string()
      .min(2, "暱稱至少 2 個字")
      .max(30, "暱稱過長"),
    lineContact: z.string().max(100).optional().or(z.literal("")),
    password: z.string().min(6, "密碼至少 6 碼").max(72, "密碼過長"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "兩次密碼不一致",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
