import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(document, 'fullscreenElement', {
  configurable: true,
  writable: true,
  value: null,
});

Object.defineProperty(document, 'exitFullscreen', {
  configurable: true,
  writable: true,
  value: () => Promise.resolve(),
});

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  configurable: true,
  writable: true,
  value: () => Promise.resolve(),
});
