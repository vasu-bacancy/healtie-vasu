import { z } from "zod";

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "At least 2 characters").max(120),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid date"),
    sex: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
    phone: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
