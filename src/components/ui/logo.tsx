import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="text-4xl font-bold text-primary transition-transform duration-300 hover:scale-105">
        AIVY
      </div>
      {showTagline && (
        <p className="mt-2 text-sm text-medium-gray dark:text-gray-300 text-center">
          Engage. Inspire. Elevate
        </p>
      )}
    </div>
  );
} 