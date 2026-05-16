import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { CartDrawerProvider } from "./context/CartDrawerContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ScrollToHash from "./components/layout/ScrollToHash";
import CartSlideOver from "./components/layout/CartSlideOver";

// Pages
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <CartDrawerProvider>
          <BrowserRouter>
            <ScrollToHash />
            <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 transition-colors duration-300 flex flex-col">
              <Navbar />

              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              <Footer />
              <CartSlideOver />
            </div>
          </BrowserRouter>
        </CartDrawerProvider>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
