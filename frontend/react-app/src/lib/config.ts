export const appConfig = {
  appName: "Healthcare Claims AI",
  environment: "Development",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  useMockApi: (import.meta.env.VITE_USE_MOCK_API ?? "true") !== "false",
  currentUser: {
    name: "Claims Administrator",
    email: "claims.admin@demo.local",
    initials: "CA",
  },
} as const;
