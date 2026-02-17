// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // Get the user object from AuthContext
  const [cartItems, setCartItems] = useState([]);

  // This useEffect triggers whenever the user logs in or out.
  useEffect(() => {
    const fetchCart = async () => {
      // If there is no user, clear the cart and do nothing else.
      if (!user || !user.id) {
        setCartItems([]);
        return;
      }

      // If there IS a user, fetch their specific cart from the backend.
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/cart/${user.id}`);
        setCartItems(res.data.products || []);
      } catch (err) {
        console.error("Error fetching cart:", err);
        // It's possible a new user doesn't have a cart yet, so we reset to empty.
        setCartItems([]);
      }
    };
    fetchCart();
  }, [user]); // The dependency array ensures this runs when `user` changes.

  const addToCart = async (product) => {
    if (!user || !user.id) return false;
    try {
      // Send the request to the user-specific endpoint
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/cart/${user.id}`, {
        productId: product._id || product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        quantity: 1,
      });
      setCartItems(res.data.products || []);
      return true;
    } catch (err) {
      console.error("Error adding to cart:", err);
      return false;
    }
  };

  // ... (updateQuantity and removeFromCart functions also use user.id)
  const updateQuantity = async (productId, newQuantity) => {
    if (!user || !user.id) return;
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/cart/${user.id}/${productId}`,
        { quantity: newQuantity }
      );
      setCartItems(res.data.products || []);
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeFromCart = async (productId) => {
    if (!user || !user.id) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/cart/${user.id}/${productId}`
      );
      setCartItems(res.data.products || []);
    } catch (err) {
      console.error("Error removing product:", err);
    }
  };


  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeFromCart, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};