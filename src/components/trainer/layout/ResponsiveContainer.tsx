// src/layouts/ResponsiveContainer.tsx
import type { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveContainer({ children, className = "" }: ResponsiveContainerProps) {
  return (
    <div className={`min-h-screen bg-gray-50 pt-[160px] px-2 md:px-6 flex justify-center ${className}`}>
      <div className="w-full max-w-screen-md">{children}</div>
    </div>
  );
}
