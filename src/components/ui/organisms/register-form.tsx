'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../atoms/button";
import { FormField } from "../molecules/form-field";
import { z } from "zod";
import { UserType } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  userType: z.nativeEnum(UserType),
  institutionId: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;

function isValidUserType(value: FormDataEntryValue | null): value is UserType {
  return value !== null && Object.values(UserType).includes(value as UserType);
}

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    userType: UserType.CAMPUS_STUDENT,
    institutionId: "default-institution", // This should be dynamically set based on context
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "userType" && isValidUserType(value) ? value : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const userTypeValue = formData.get("userType");
      
      if (!isValidUserType(userTypeValue)) {
        setErrors({ userType: "Invalid user type" });
        return;
      }

      const data: RegisterFormData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
        userType: userTypeValue,
        institutionId: formData.get("institutionId") as string,
      };

      // Validate the data with zod schema
      const validatedData = registerSchema.parse(data);

      // Call registration API with validated data
      await register(validatedData);
      router.push("/login");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: RegisterFormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setErrors({
          email: error.message,
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Full Name"
        type="text"
        name="name"
        required
        value={formData.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        autoComplete="name"
      />
      <FormField
        label="Email"
        type="email"
        name="email"
        required
        value={formData.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        autoComplete="email"
      />
      <FormField
        label="Username"
        type="text"
        name="username"
        required
        value={formData.username}
        onChange={handleChange}
        error={!!errors.username}
        helperText={errors.username}
        autoComplete="username"
      />
      <FormField
        label="Password"
        type="password"
        name="password"
        required
        value={formData.password}
        onChange={handleChange}
        error={!!errors.password}
        helperText={errors.password}
        autoComplete="new-password"
      />
      <FormField
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        required
        value={formData.confirmPassword}
        onChange={handleChange}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        autoComplete="new-password"
      />
      <div className="space-y-2">
        <label
          htmlFor="userType"
          className="block text-sm font-medium text-gray-700"
        >
          User Type
        </label>
        <select
          id="userType"
          name="userType"
          value={formData.userType}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          {Object.values(UserType).map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/login")}
        >
          Already have an account?
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Register
        </Button>
      </div>
    </form>
  );
} 