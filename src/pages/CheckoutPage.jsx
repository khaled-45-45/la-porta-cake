import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/formatCurrency";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";

// TODO: Replace with the actual WhatsApp business number before launch (e.g., "962700000000")
const WHATSAPP_NUMBER = "962700000000";

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    fulfillmentMethod: "pickup", // 'pickup' | 'delivery'
    pickupDate: "",
    pickupTime: "",
    deliveryAddress: "",
    deliveryArea: "",
    deliveryNotes: "",
    paymentMethod: "bank", // 'bank' | 'wallet'
    notes: ""
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const deposit = totalPrice * 0.5;
  const balance = totalPrice - deposit;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center py-24 px-4 text-center transition-colors duration-300">
        <h1 className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-4xl mb-4 transition-colors duration-300">Your cart is empty</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md leading-relaxed transition-colors duration-300">
          Looks like you haven&apos;t added any delicious cakes to your cart yet.
        </p>
        <Link
          to="/menu"
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all duration-300 hover:-translate-y-0.5"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on type
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    
    if (formData.fulfillmentMethod === "pickup") {
      if (!formData.pickupDate) newErrors.pickupDate = "Pickup date is required";
      if (!formData.pickupTime) newErrors.pickupTime = "Pickup time is required";
    } else {
      if (!formData.deliveryAddress.trim()) newErrors.deliveryAddress = "Delivery address is required";
      if (!formData.deliveryArea.trim()) newErrors.deliveryArea = "Area / City is required";
    }

    setErrors(newErrors);
    
    // Scroll to the first error
    if (Object.keys(newErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const buildWhatsAppMessage = () => {
    const d = formData;
    let message = `*New Order - La Porta Cake* 🎂\n\n`;
    
    message += `*Customer Details*\n`;
    message += `Name: ${d.fullName}\n`;
    message += `Phone: ${d.phone}\n\n`;

    if (d.fulfillmentMethod === "pickup") {
      message += `*Fulfillment: Pickup from Store*\n`;
      message += `Date: ${d.pickupDate}\n`;
      message += `Time: ${d.pickupTime}\n\n`;
    } else {
      message += `*Fulfillment: Delivery*\n`;
      message += `Area/City: ${d.deliveryArea}\n`;
      message += `Address: ${d.deliveryAddress}\n`;
      if (d.deliveryNotes) message += `Delivery Notes: ${d.deliveryNotes}\n`;
      message += `\n`;
    }

    message += `*Order Items*\n`;
    items.forEach(item => {
      message += `- ${item.quantity}x ${item.name} - Unit: ${formatCurrency(item.price)} - Subtotal: ${formatCurrency(item.price * item.quantity)}\n`;
    });
    message += `\n`;

    message += `*Payment Summary*\n`;
    message += `Total Price: ${formatCurrency(totalPrice)}\n`;
    message += `Minimum 50% Deposit: ${formatCurrency(deposit)}\n`;
    message += `Remaining Balance: ${formatCurrency(balance)}\n`;
    message += `Payment Method: ${d.paymentMethod === 'bank' ? 'Bank Transfer' : 'Wallet Transfer'}\n\n`;

    message += `*Important Policies*\n`;
    message += `Deposit Policy: The minimum 50% deposit is non-refundable once the order is confirmed.\n`;
    
    if (d.fulfillmentMethod === "pickup") {
      message += `Payment Rule: The remaining balance can be paid at pickup or through an agreed payment method.\n\n`;
    } else {
      message += `Payment Rule: Delivery orders require at least a 50% non-refundable deposit before acceptance. The remaining balance and delivery fee will be confirmed here. Full payment including delivery fees may be required before delivery depending on the order and location.\n\n`;
    }

    if (d.notes) {
      message += `*Order Notes*\n${d.notes}\n`;
    }

    return encodeURIComponent(message);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`;
      window.open(waLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 py-12 md:py-24 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-rose-500 transition-colors font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        <h1 className="text-zinc-900 dark:text-stone-50 font-serif font-bold text-3xl md:text-4xl lg:text-5xl mb-8 md:mb-12 transition-colors duration-300">
          Secure Checkout
        </h1>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ——— Left Column: Form ——— */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            <form id="checkout-form" onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-zinc-800 flex flex-col gap-8 transition-colors duration-300">
              
              {/* Customer Details */}
              <section>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-stone-50 mb-6 transition-colors duration-300">1. Your Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="fullName" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border ${errors.fullName ? 'border-rose-400 focus:ring-rose-200' : 'border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30'} outline-none transition-all text-zinc-800 dark:text-zinc-100`}
                      placeholder="Jane Doe"
                    />
                    {errors.fullName && <span className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.fullName}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="phone" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border ${errors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30'} outline-none transition-all text-zinc-800 dark:text-zinc-100`}
                      placeholder="+962 7X XXX XXXX"
                    />
                    {errors.phone && <span className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.phone}</span>}
                  </div>
                </div>
              </section>

              <hr className="border-stone-100 dark:border-zinc-800 transition-colors duration-300" />

              {/* Fulfillment Method */}
              <section>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-stone-50 mb-6 transition-colors duration-300">2. Fulfillment</h2>
                <div className="flex gap-4 mb-6">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.fulfillmentMethod === 'pickup' ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 font-bold' : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium'}`}>
                    <input type="radio" name="fulfillmentMethod" value="pickup" checked={formData.fulfillmentMethod === 'pickup'} onChange={handleInputChange} className="hidden" />
                    Pickup
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.fulfillmentMethod === 'delivery' ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 font-bold' : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium'}`}>
                    <input type="radio" name="fulfillmentMethod" value="delivery" checked={formData.fulfillmentMethod === 'delivery'} onChange={handleInputChange} className="hidden" />
                    Delivery
                  </label>
                </div>

                {formData.fulfillmentMethod === 'pickup' ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pickupDate" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Pickup Date *</label>
                      <input type="date" id="pickupDate" name="pickupDate" min={getTodayLocalDate()} value={formData.pickupDate} onChange={handleInputChange} className={`px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border ${errors.pickupDate ? 'border-rose-400 focus:ring-rose-200' : 'border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30'} outline-none transition-all text-zinc-800 dark:text-zinc-100 [color-scheme:light] dark:[color-scheme:dark]`} />
                      {errors.pickupDate && <span className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.pickupDate}</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pickupTime" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Pickup Time *</label>
                      <input type="time" id="pickupTime" name="pickupTime" value={formData.pickupTime} onChange={handleInputChange} className={`px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border ${errors.pickupTime ? 'border-rose-400 focus:ring-rose-200' : 'border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30'} outline-none transition-all text-zinc-800 dark:text-zinc-100 [color-scheme:light] dark:[color-scheme:dark]`} />
                      {errors.pickupTime && <span className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.pickupTime}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="deliveryArea" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Area / City *</label>
                      <input type="text" id="deliveryArea" name="deliveryArea" value={formData.deliveryArea} onChange={handleInputChange} placeholder="e.g. Sweifieh, Amman" className={`px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border ${errors.deliveryArea ? 'border-rose-400 focus:ring-rose-200' : 'border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30'} outline-none transition-all text-zinc-800 dark:text-zinc-100`} />
                      {errors.deliveryArea && <span className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.deliveryArea}</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="deliveryAddress" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Full Address *</label>
                      <input type="text" id="deliveryAddress" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleInputChange} placeholder="Street, Building, Apartment" className={`px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border ${errors.deliveryAddress ? 'border-rose-400 focus:ring-rose-200' : 'border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30'} outline-none transition-all text-zinc-800 dark:text-zinc-100`} />
                      {errors.deliveryAddress && <span className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.deliveryAddress}</span>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="deliveryNotes" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Delivery Notes (Optional)</label>
                      <textarea id="deliveryNotes" name="deliveryNotes" value={formData.deliveryNotes} onChange={handleInputChange} rows={2} placeholder="Any specific instructions for the driver?" className="px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition-all resize-none text-zinc-800 dark:text-zinc-100" />
                    </div>
                  </div>
                )}
              </section>

              <hr className="border-stone-100 dark:border-zinc-800 transition-colors duration-300" />

              {/* Payment Method */}
              <section>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-stone-50 mb-6 transition-colors duration-300">3. Payment Method</h2>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'bank' ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 font-bold' : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium'}`}>
                    <input type="radio" name="paymentMethod" value="bank" checked={formData.paymentMethod === 'bank'} onChange={handleInputChange} className="hidden" />
                    Bank Transfer
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'wallet' ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 font-bold' : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium'}`}>
                    <input type="radio" name="paymentMethod" value="wallet" checked={formData.paymentMethod === 'wallet'} onChange={handleInputChange} className="hidden" />
                    Wallet Transfer
                  </label>
                </div>
                
                <div className="bg-stone-50 dark:bg-zinc-950 p-4 rounded-xl flex items-start gap-3 transition-colors duration-300">
                  <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors duration-300">
                    Bank and wallet transfer details will be confirmed on WhatsApp once your order is received.
                    {/* TODO: Add real bank account and wallet details here in the future if needed in UI */}
                  </p>
                </div>
              </section>

              <hr className="border-stone-100 dark:border-zinc-800 transition-colors duration-300" />

              {/* Additional Notes */}
              <section>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-stone-50 mb-6 transition-colors duration-300">4. Additional Notes</h2>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notes" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors duration-300">Order Notes (Optional)</label>
                  <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={3} placeholder="Any allergies or special requests?" className="px-4 py-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 focus:border-rose-400 focus:ring-rose-100 dark:focus:ring-rose-900/30 outline-none transition-all resize-none text-zinc-800 dark:text-zinc-100" />
                </div>
              </section>

            </form>
          </div>

          {/* ——— Right Column: Summary ——— */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
            
            <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] shadow-sm border border-stone-100 dark:border-zinc-800 flex flex-col gap-6 transition-colors duration-300">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-stone-50 transition-colors duration-300">Order Summary</h2>
              
              {/* Items List */}
              <ul className="flex flex-col gap-4">
                {items.map(item => (
                  <li key={item.id} className="flex gap-4">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl bg-stone-100 dark:bg-zinc-800 shrink-0 transition-colors duration-300" />
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-stone-50 line-clamp-1 transition-colors duration-300">{item.name}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 transition-colors duration-300">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-stone-50 transition-colors duration-300">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <hr className="border-stone-100 dark:border-zinc-800 transition-colors duration-300" />

              {/* Deposit Rules Notice */}
              <div className="bg-rose-50/50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-xl flex flex-col gap-2 transition-colors duration-300">
                <p className="text-sm font-bold text-rose-600">
                  A minimum 50% non-refundable deposit is required to confirm your order.
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors duration-300">
                  Because each order is prepared specifically for you, deposits cannot be refunded after confirmation.
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400 transition-colors duration-300">Total Price</span>
                  <span className="font-bold text-zinc-900 dark:text-stone-50 transition-colors duration-300">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-rose-600">Minimum 50% Deposit</span>
                  <span className="text-rose-600">{formatCurrency(deposit)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400 transition-colors duration-300">Remaining Balance</span>
                  <span className="font-bold text-zinc-900 dark:text-stone-50 transition-colors duration-300">{formatCurrency(balance)}</span>
                </div>
              </div>

              <hr className="border-stone-100 dark:border-zinc-800 transition-colors duration-300" />

              {/* Fulfillment Rule Note */}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed transition-colors duration-300">
                {formData.fulfillmentMethod === 'pickup' 
                  ? "The remaining balance can be paid at pickup or through an agreed payment method."
                  : "Delivery orders require at least a 50% non-refundable deposit before acceptance. The remaining balance and delivery fee will be confirmed on WhatsApp. Full payment including delivery fees may be required before delivery depending on the order and location."
                }
              </p>

              {/* Submit CTA */}
              <button
                form="checkout-form"
                type="submit"
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl dark:hover:shadow-rose-900/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Send Order on WhatsApp
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
