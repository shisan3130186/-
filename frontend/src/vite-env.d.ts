interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "react" {
  export type ReactNode = unknown;
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps?: unknown[]): T;
  export function useState<T>(initial: T): [T, (value: T | ((current: T) => T)) => void];
}

declare module "react-dom/client" {
  export function createRoot(element: Element): { render(node: unknown): void };
}

declare module "react/jsx-runtime" {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
