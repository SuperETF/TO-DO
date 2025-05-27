// src/layouts/ResponsiveContainer.tsx
import type { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveContainer({ children, className = "" }: ResponsiveContainerProps) {
  return (
    <div className={`min-h-screen bg-gray-50 px-4 py-6 flex justify-center ${className}`}>
      <div className="w-full max-w-screen-md">{children}</div>
    </div>
  );
}
