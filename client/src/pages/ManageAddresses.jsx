// src/pages/ManageAddresses.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Background from "../components/Background";
import axios from "axios";

function ManageAddresses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", pincode: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.id) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`)
        .then(res => setAddresses(res.data.addresses || []))
        .catch(err => console.error("Could not fetch addresses", err));
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleNewAddressChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleAddNewAddress = () => {
    if (newAddress.street && newAddress.city && newAddress.pincode) {
      setAddresses([...addresses, newAddress]);
      setNewAddress({ street: "", city: "", pincode: "" });
    }
  };

  const handleDeleteAddress = (indexToDelete) => {
    setAddresses(addresses.filter((_, index) => index !== indexToDelete));
  };

  const handleSaveChanges = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, { addresses });
      setMessage("Addresses saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Failed to save addresses.");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0"><Background /></div>
      <div className="relative z-10 w-full max-w-4xl p-6 bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-lg border border-purple-500/30">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">Manage Your Addresses</h1>
        {message && <p className="text-center text-green-400 mb-4">{message}</p>}
        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
          {addresses.map((addr, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-800/70 p-3 rounded-lg">
              <p className="text-gray-300">{addr.street}, {addr.city}, {addr.pincode}</p>
              <button onClick={() => handleDeleteAddress(index)} className="text-red-500 hover:text-red-400 text-2xl font-bold">&times;</button>
            </div>
          ))}
          {addresses.length === 0 && <p className="text-center text-gray-500">No saved addresses.</p>}
        </div>
        <div className="border-t border-gray-700 pt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Add a New Address</h2>
          <div className="space-y-4">
            <input type="text" name="street" placeholder="Street Address" value={newAddress.street} onChange={handleNewAddressChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
            <div className="flex gap-4">
              <input type="text" name="city" placeholder="City" value={newAddress.city} onChange={handleNewAddressChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
              <input type="text" name="pincode" placeholder="Pincode" value={newAddress.pincode} onChange={handleNewAddressChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
            </div>
            <button onClick={handleAddNewAddress} className="w-full py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700">Add Address</button>
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          <button onClick={() => navigate("/account")} className="flex-1 py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-700">Back to Account</button>
          <button onClick={handleSaveChanges} className="flex-1 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700">Save All Changes</button>
        </div>
      </div>
    </div>
  );
}

export default ManageAddresses;
