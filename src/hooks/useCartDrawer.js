import { useContext } from "react";
import { CartDrawerContext } from "../context/cartDrawerContextValue";

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error("useCartDrawer must be used within a CartDrawerProvider");
  }
  return context;
}
