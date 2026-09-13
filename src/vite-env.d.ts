/// <reference types="vite/client" />

interface Window {
  /** WebGL support, checked once by the inline script in the page head (see vite.config.ts). */
  __webgl?: boolean;
}
