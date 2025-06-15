declare module '@testing-library/react' {
  export function render(component: React.ReactElement): any;
  export function screen(): any;
  export function fireEvent: any;
  export function waitFor(callback: () => void, options?: any): Promise<void>;
  export function act(callback: () => void): void;
}
