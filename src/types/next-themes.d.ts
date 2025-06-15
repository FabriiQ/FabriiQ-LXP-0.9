declare module 'next-themes' {
  export function useTheme(): {
    theme: string;
    setTheme: (theme: string) => void;
    resolvedTheme: string;
    themes: string[];
    systemTheme: string;
  };
}
