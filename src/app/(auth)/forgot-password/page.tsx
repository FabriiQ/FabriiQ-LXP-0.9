import { ForgotPasswordForm } from "@/components/ui/organisms/forgot-password-form";
import Image from "next/image";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Aivy LXP Logo"
              width={120}
              height={40}
              priority
            />
          </div>
          <ForgotPasswordForm />
        </div>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <Image
          className="absolute inset-0 h-full w-full object-cover"
          src="/auth-background.jpg"
          alt="Learning background"
          width={1920}
          height={1080}
          priority
        />
        <div className="absolute inset-0 bg-primary-600 mix-blend-multiply opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <blockquote className="space-y-2 max-w-lg">
            <p className="text-lg font-medium text-white">
              "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice."
            </p>
            <footer className="text-sm text-white/80">- Brian Herbert</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
} 