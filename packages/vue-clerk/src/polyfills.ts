/**
 * Vite does not define `global` by default
 * One workaround is to use the `define` config prop
 * https://vitejs.dev/config/#define
 * We are solving this in the SDK level to reduce setup steps.
 */
if (typeof window !== 'undefined' && !window.global)
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-ignore
  window.global = typeof globalThis === 'undefined' ? window : globalThis

export {}
