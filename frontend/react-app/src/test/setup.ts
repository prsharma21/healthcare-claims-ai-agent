import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

import { mockSettings } from "@/services/mockClaimService";

import { mockClaimsBackend } from "./mockApi";

// Run the mock API without artificial latency.
mockSettings.delayScale = 0;

// Lazy-loaded pages can take a moment to compile on first use.
configure({ asyncUtilTimeout: 8000 });

// jsdom lacks these browser APIs. Desktop-width and reduced-motion queries match, so the
// full sidebar renders and charts skip their animations.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: query.includes("min-width") || query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub;
Element.prototype.scrollIntoView = () => {};

// Tests never call the real backend; individual tests can replace this with mockApi().
beforeEach(() => {
  mockClaimsBackend();
});

afterEach(() => {
  cleanup();
});
