import { lazy } from "react";
import {
  Link,
  Navigate,
  RouterProvider,
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
  type RouteObject,
} from "react-router-dom";

import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/layouts/AppLayout";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Claims = lazy(() => import("@/pages/Claims"));
const ClaimDetails = lazy(() => import("@/pages/ClaimDetails"));
const UploadClaim = lazy(() => import("@/pages/UploadClaim"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const AIProcessing = lazy(() => import("@/pages/AIProcessing"));
const Evaluation = lazy(() => import("@/pages/Evaluation"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error;

  return (
    <div className="p-6">
      <Card className="mx-auto max-w-lg">
        <ErrorState
          title="Something went wrong on this page."
          error={message}
          onRetry={() => window.location.reload()}
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          }
        />
      </Card>
    </div>
  );
}

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "claims", element: <Claims /> },
      { path: "claims/:claimId", element: <ClaimDetails /> },
      { path: "upload", element: <UploadClaim /> },
      { path: "analytics", element: <Analytics /> },
      { path: "ai-processing", element: <AIProcessing /> },
      { path: "evaluation", element: <Evaluation /> },
      { path: "settings", element: <Settings /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

const router = createBrowserRouter(appRoutes);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
