'use client';

import { useForm, Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/molecules/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { useToast } from "@/components/ui/feedback/toast";
import { useRouter } from "next/navigation";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = api.auth.forgotPassword.useMutation({
    onSuccess: () => {
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists with this email, you will receive a password reset link that will expire in 1 hour.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    await forgotPasswordMutation.mutateAsync(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={forgotPasswordMutation.isLoading}
        >
          {forgotPasswordMutation.isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </Form>
  );
} 