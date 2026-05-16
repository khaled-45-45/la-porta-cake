import { useState } from "react";
import { CartDrawerContext } from "./cartDrawerContextValue";

export function CartDrawerProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartDrawerContext.Provider value={{ isCartOpen, openCart, closeCart }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

