import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "text-sm",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
