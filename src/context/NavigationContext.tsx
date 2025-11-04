"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type NavigationContextType = {
  from: string;
};

const NavigationContext = createContext<NavigationContextType>({
  from: "/",
});

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const newPathname = usePathname();

  const [from, setFrom] = useState("/");
  const [pathname, setPathname] = useState(() => newPathname);

  useEffect(() => {
    if (newPathname !== pathname) {
      setFrom(pathname);
      setPathname(newPathname);
    }
  }, [newPathname, pathname]);

  return (
    <NavigationContext.Provider value={{ from }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
