# La Porta Cake

La Porta Cake is a premium bakery e-commerce website built with React, Vite, Tailwind CSS, and React Router. It presents a polished storefront experience for browsing handcrafted cakes, viewing product details, managing a cart, and preparing an order through a checkout flow that generates a WhatsApp message.

This project is currently a frontend portfolio/demo project. It does not include a backend, database, payment gateway, or real order management system yet.

## Features

- Responsive homepage with hero, featured products, process, and contact sections
- Product menu page with category filtering
- Product detail pages powered by React Router route parameters
- Reusable product cards with add-to-cart behavior
- Cart drawer with item list, subtotal, quantity controls, and empty state
- Checkout page with customer details, fulfillment method, payment method, notes, and order summary
- Pickup and delivery checkout options
- Minimum 50% non-refundable deposit policy shown in checkout and included in the WhatsApp message
- WhatsApp order message generation with cart items, customer details, fulfillment details, payment method, and policy notes
- Theme toggle with persisted light/dark mode
- Responsive UI across mobile and desktop layouts
- Not Found page for invalid routes

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router DOM
- Lucide React
- JavaScript

## Project Structure

```text
src/
  components/   Reusable layout and UI components such as Navbar, Footer, CartSlideOver, ProductCard, and ThemeToggle
  pages/        Route-level pages including HomePage, MenuPage, ProductDetailPage, CheckoutPage, and NotFoundPage
  sections/     Homepage sections such as Hero, FeaturedProducts, HowItWorks, and Contact
  context/      React Context providers for cart, cart drawer, and theme state
  hooks/        Custom hooks for accessing cart, cart drawer, and theme contexts
  data/         Menu item and category data used by the storefront
  utils/        Shared utility helpers such as currency formatting
public/         Static assets including favicons, icons, and logo files
```

## Installation

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run lint checks:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

## Environment and Deployment Notes

This project is frontend-only at the moment. No backend, database, payment gateway, or real payment processor is connected.

Before a production launch, replace the placeholder WhatsApp number, bank details, wallet details, business phone number, social links, map links, and any final business information with real values.

## Screenshots

Screenshots will be added soon.

Suggested screenshots:

- Homepage
- Menu page
- Product detail page
- Cart drawer
- Checkout page
- Dark mode

## Future Improvements

- Replace placeholder business data with real business details
- Add real product images and final pricing
- Add a deployed live demo link
- Improve SEO metadata and social sharing previews
- Add accessibility polish for keyboard and screen reader users
- Add backend order management later
- Add a payment gateway later if needed
- Add cart persistence with local storage
- Add automated tests for cart and checkout behavior

## Portfolio Highlights

This project demonstrates:

- Component-based React architecture
- Client-side routing with React Router DOM
- State management using React Context and custom hooks
- Cart functionality with add, remove, and quantity update behavior
- Checkout UX for pickup and delivery orders
- WhatsApp order message generation
- Responsive UI implementation with Tailwind CSS
- Light/dark theme support
- Business-focused frontend development for an e-commerce use case

## License

This project is currently for portfolio and educational purposes.
