import { useEffect } from "react";

import { appConfig } from "@/lib/config";

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${appConfig.appName}` : appConfig.appName;
  }, [title]);
}
