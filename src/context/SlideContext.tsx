// src/context/SlideContext.tsx

import { createContext, useContext, useState } from "react";

const SlideContext = createContext<{
  direction: number;
  setDirection: React.Dispatch<React.SetStateAction<number>>;
}>({
  direction: 1,
  setDirection: () => {},
});

export const useSlide = () => useContext(SlideContext);

export const SlideProvider = ({ children }: { children: React.ReactNode }) => {
  const [direction, setDirection] = useState(1);
  return (
    <SlideContext.Provider value={{ direction, setDirection }}>
      {children}
    </SlideContext.Provider>
  );
};
