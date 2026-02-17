// src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Background from "../components/Background";
import axios from "axios";

// --- Helper Icon Components ---
const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;
const LockIcon = () => <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2h12v-2h-1.258l-1.038-1.038A6.002 6.002 0 0118 8zm-6-4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>;

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({ name: user?.name || "", street: "", city: "", pincode: "" });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("new");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [paymentInfo, setPaymentInfo] = useState({ cardNumber: "", expiry: "", cvv: "" });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fetch user's saved addresses from the database
  useEffect(() => {
    if (user?.id) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`)
        .then(res => {
          const userAddresses = res.data.addresses || [];
          setSavedAddresses(userAddresses);
          if (userAddresses.length > 0) {
            setSelectedAddress(0);
            setShippingInfo(prev => ({ ...prev, ...userAddresses[0] }));
          }
        })
        .catch(err => console.error("Could not fetch user addresses", err));
    }
  }, [user]);

  // Handle card number input to format it with spaces and limit to 16 digits
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove all non-digits
    value = value.substring(0, 16);
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    setPaymentInfo({ ...paymentInfo, cardNumber: formattedValue });
  };

  const handleAddressSelection = (e) => {
    const value = e.target.value;
    setSelectedAddress(value);
    if (value === "new") {
      setShippingInfo({ name: user?.name || "", street: "", city: "", pincode: "" });
    } else {
      setShippingInfo({ name: user?.name || "", ...savedAddresses[value] });
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    if (selectedAddress === "new") {
      const newAddress = { street: shippingInfo.street, city: shippingInfo.city, pincode: shippingInfo.pincode };
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
          addresses: [...savedAddresses, newAddress]
        });
      } catch (err) { console.error("Failed to save new address", err); }
    }
    setStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === "Card") {
      const rawCardNumber = paymentInfo.cardNumber.replace(/\s/g, "");
      if (rawCardNumber.length !== 16) {
        alert("Please enter a valid 16-digit card number.");
        return;
      }
    }
    setStep(3);
  };

  const handleConfirmOrder = async () => {
    if (!user || !user.id) return;
    setIsPlacingOrder(true);
    const orderDetails = {
      products: cartItems.map(item => ({
        productId: item.productId, name: item.name, price: item.price, quantity: item.quantity,
      })),
      totalAmount: cartTotal,
      shippingInfo: { name: shippingInfo.name, address: shippingInfo.street, city: shippingInfo.city, pincode: shippingInfo.pincode },
      paymentMethod: paymentMethod,
    };

    try {
      // Step 1: Attempt to place the order
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders/${user.id}`, orderDetails);

      // Step 2: If successful, show success message and navigate away immediately
      alert("Order placed successfully!");
      navigate("/orders");

      // Step 3: Attempt to clear the cart silently in the background.
      // A failure here will not show an error alert to the user.
      try {
        await clearCart();
      } catch (clearCartError) {
        console.error("Order was placed, but failed to clear cart:", clearCartError);
      }

    } catch (err) {
      // This will only catch errors from the initial order placement.
      alert("There was an error placing your order.");
      console.error("Order placement error:", err);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0 && !isPlacingOrder) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4">
        <div className="absolute inset-0 z-0"><Background /></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-purple-400 mb-4">Your Cart is Empty</h1>
          <button onClick={() => navigate('/products')} className="bg-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-700">Go Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full pt-24 pb-12 px-4">
      <div className="absolute inset-0 z-0"><Background /></div>
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              {['Shipping', 'Payment', 'Confirm'].map((stepName, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > index ? 'bg-purple-600' : 'bg-gray-700'}`}>{step > index + 1 ? <CheckIcon /> : index + 1}</div><span className={`ml-3 font-semibold ${step >= index + 1 ? 'text-purple-400' : 'text-gray-500'}`}>{stepName}</span></div>
                  {index < 2 && <div className="flex-1 h-0.5 bg-gray-700 mx-4"></div>}
                </React.Fragment>
              ))}
            </div>

            {step === 1 && (
              <form onSubmit={handleShippingSubmit}>
                <h2 className="text-2xl font-bold mb-4 text-gray-200">Shipping Information</h2>
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-300">Select a saved address</h3>
                    <div className="space-y-2">
                      {savedAddresses.map((addr, index) => (
                        <label key={index} className="flex items-center p-3 bg-gray-800/70 rounded-lg cursor-pointer transition-all hover:bg-gray-800"><input type="radio" name="address" value={index} checked={selectedAddress == index} onChange={handleAddressSelection} className="accent-purple-500 w-5 h-5" /><span className="ml-4 text-gray-300">{addr.street}, {addr.city}, {addr.pincode}</span></label>
                      ))}
                      <label className="flex items-center p-3 bg-gray-800/70 rounded-lg cursor-pointer transition-all hover:bg-gray-800"><input type="radio" name="address" value="new" checked={selectedAddress === "new"} onChange={handleAddressSelection} className="accent-purple-500 w-5 h-5" /><span className="ml-4 text-gray-200 font-semibold">Enter a new address</span></label>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <input type="text" placeholder="Full Name" value={shippingInfo.name} onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })} required className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg" />
                  <input type="text" placeholder="Street Address" value={shippingInfo.street} onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })} required className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg" />
                  <div className="flex gap-4">
                    <input type="text" placeholder="City" value={shippingInfo.city} onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })} required className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg" />
                    <input type="text" placeholder="Pincode" value={shippingInfo.pincode} onChange={(e) => setShippingInfo({ ...shippingInfo, pincode: e.target.value })} required className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg" />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => navigate("/cart")} className="w-full py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-700">Back to Cart</button>
                  <button type="submit" className="w-full py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700">Continue to Payment</button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handlePaymentSubmit}>
                <h2 className="text-2xl font-bold mb-6 text-gray-200">Payment Details</h2>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">Choose Payment Method</h3>
                  <div className="flex gap-4">
                    <label className={`flex-1 p-4 rounded-lg cursor-pointer transition-all ${paymentMethod === 'Card' ? 'bg-purple-600 border-2 border-purple-400' : 'bg-gray-800 border-2 border-gray-700'}`}><input type="radio" name="paymentMethod" value="Card" checked={paymentMethod === 'Card'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" /><span className="font-semibold">Credit / Debit Card</span></label>
                    <label className={`flex-1 p-4 rounded-lg cursor-pointer transition-all ${paymentMethod === 'Cash on Delivery' ? 'bg-purple-600 border-2 border-purple-400' : 'bg-gray-800 border-2 border-gray-700'}`}><input type="radio" name="paymentMethod" value="Cash on Delivery" checked={paymentMethod === 'Cash on Delivery'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" /><span className="font-semibold">Cash on Delivery</span></label>
                  </div>
                </div>
                {paymentMethod === 'Card' && (
                  <div className="space-y-4 animate-fadeIn">
                    <input type="text" placeholder="Card Number (XXXX XXXX XXXX XXXX)" value={paymentInfo.cardNumber} onChange={handleCardNumberChange} required className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg" />
                    <div className="flex gap-4">
                      <input type="text" placeholder="MM / YY" value={paymentInfo.expiry} onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })} required className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg" />
                      <input type="text" placeholder="CVV" value={paymentInfo.cvv} onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })} required className="w-full p-3 bg-gray-800/70 border border-gray-700 rounded-lg" />
                    </div>
                  </div>
                )}
                <div className="flex gap-4 mt-8"><button type="button" onClick={() => setStep(1)} className="w-full py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-700">Back to Shipping</button><button type="submit" className="w-full py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700">Review Order</button></div>
              </form>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-200">Confirm Your Order</h2>
                <div className="space-y-4 text-gray-300"><p><strong>Shipping to:</strong> {shippingInfo.name}, {shippingInfo.street}, {shippingInfo.city} - {shippingInfo.pincode}</p><p><strong>Payment Method:</strong> {paymentMethod === 'Card' ? `Card ending in **** ${paymentInfo.cardNumber.slice(-4)}` : 'Cash on Delivery'}</p>{paymentMethod === 'Card' && <p className="text-green-400 font-semibold"><LockIcon /> Your payment is secure.</p>}</div>
                <div className="flex gap-4 mt-8"><button type="button" onClick={() => setStep(2)} className="w-full py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-700">Back to Payment</button><button onClick={handleConfirmOrder} disabled={isPlacingOrder} className="w-full py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-800">{isPlacingOrder ? 'Placing Order...' : 'Confirm & Place Order'}</button></div>
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl shadow-lg p-6 sticky top-24">
            <h3 className="text-xl font-bold border-b border-gray-700 pb-3 mb-4 text-gray-100">Order Summary</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">{cartItems.map(item => (<div key={item.productId} className="flex justify-between items-center text-sm"><span className="text-gray-300">{item.name} x{item.quantity}</span><span className="text-gray-200 font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span></div>))}</div>
            <div className="border-t border-gray-700 mt-4 pt-4 space-y-2"><div className="flex justify-between text-lg"><span className="text-gray-300">Subtotal</span><span className="text-gray-100 font-semibold">₹{cartTotal.toLocaleString('en-IN')}</span></div><div className="flex justify-between text-lg"><span className="text-gray-300">Shipping</span><span className="text-green-400 font-semibold">FREE</span></div><div className="flex justify-between text-2xl font-bold text-purple-400 pt-2"><span>Total</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
