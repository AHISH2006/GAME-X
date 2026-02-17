// src/pages/Account.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // Import cart context to get cart data
import axios from "axios";


// Helper component for displaying stats in a stylish card
const StatCard = ({ title, value, icon }) => (
  <div className="p-4 rounded-lg bg-gray-800/60 hover:bg-gray-700/70 transition transform hover:scale-105">
    <div className="flex items-center">
      <div className="p-3 bg-purple-600/50 rounded-lg mr-4 text-2xl">{icon}</div>
      <div>
        <span className="block font-semibold text-gray-400">{title}</span>
        <span className="text-2xl font-bold text-gray-100">{value}</span>
      </div>
    </div>
  </div>
);

function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartItems } = useCart(); // Get cart items to display the count
  const [orderCount, setOrderCount] = useState(0);
  const [savedAddressesCount, setSavedAddressesCount] = useState(0);

  // This effect runs when the user logs in to fetch their data
  useEffect(() => {
    if (user?.id) {
      // Fetch the user's orders to get the total count
      axios.get(`${import.meta.env.VITE_API_URL}/api/orders/${user.id}`)
        .then(res => setOrderCount(res.data.length))
        .catch(err => {
          console.error("Could not fetch orders", err);
          setOrderCount(0); // If there's an error, default to 0
        });

      // Fetch the user's profile to get the address count
      axios.get(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`)
        .then(res => setSavedAddressesCount(res.data.addresses?.length || 0))
        .catch(err => {
          console.error("Could not fetch addresses", err);
          setSavedAddressesCount(0); // If there's an error, default to 0
        });
    }
  }, [user]); // Re-run this logic whenever the user object changes

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // This is the view shown to users who are NOT logged in
  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6">

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-purple-400 mb-4">Welcome!</h1>
          <p className="text-gray-300 mb-6 max-w-xl">Login or register to manage your account.</p>
          <div className="flex space-x-4 justify-center">
            <Link to="/login" className="bg-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition">Login</Link>
            <Link to="/register" className="bg-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  // This is the main dashboard view for LOGGED-IN users
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white overflow-hidden">

      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-purple-400 mb-10">Account Dashboard</h1>
        <div className="relative bg-gray-900/70 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start border-b border-gray-700 pb-6 mb-6">
            <div className="bg-purple-600 text-white text-4xl font-bold w-20 h-20 rounded-full flex items-center justify-center shadow-md">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-100">{user.name}</h2>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* Dynamic Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg mb-8">
            <StatCard title="Items in Cart" value={cartItems.length} icon={"🛒"} />
            <StatCard title="Total Orders" value={orderCount} icon={"📦"} />
            <StatCard title="Saved Addresses" value={savedAddressesCount} icon={"🏠"} />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/orders" className="bg-purple-600 text-center py-3 rounded-lg font-semibold hover:bg-purple-700 transition">View My Orders</Link>
            <Link to="/profile" className="bg-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Edit Profile</Link>
            <Link to="/manage-addresses" className="bg-green-600 text-center py-3 rounded-lg font-semibold hover:bg-green-700 transition">Manage Addresses</Link>
            <button onClick={handleLogout} className="bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition sm:col-span-3">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
