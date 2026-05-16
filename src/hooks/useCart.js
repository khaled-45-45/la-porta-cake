import { useContext } from "react";
import { CartContext } from "../context/CartContext";

/**
 * useCart — convenience hook that exposes the cart context.
 * Must be used inside <CartProvider>.
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
