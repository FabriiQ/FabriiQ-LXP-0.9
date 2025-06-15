import { RegisterForm } from "@/components/ui/organisms/register-form";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
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
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
          <RegisterForm />
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
              "The beautiful thing about learning is that no one can take it away from you."
            </p>
            <footer className="text-sm text-white/80">- B.B. King</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
} 