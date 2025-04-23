import { type PropsWithChildren } from "react";

export function Container({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background flex">
      {children}
    </div>
  );
}