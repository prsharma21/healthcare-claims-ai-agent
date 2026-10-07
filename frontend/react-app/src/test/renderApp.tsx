import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { appRoutes } from "@/routes/AppRoutes";

/** Renders the full application (layout, routes and toasts) at the given URL. */
export function renderApp(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const user = userEvent.setup();
  const view = render(
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>,
  );
  return { ...view, router, user };
}
