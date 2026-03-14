import { z } from "zod";

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Enter your full name").max(120),
    email: z.string().email("Enter a valid email address, like name@example.com"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm_password: z.string(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date of birth"),
    sex: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
    phone: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
