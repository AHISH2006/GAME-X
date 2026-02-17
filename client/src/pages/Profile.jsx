// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function Profile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({ name: "", mobile: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, mobile: user.mobile || "" });
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
        name: formData.name,
        mobile: formData.mobile,
      });

      // To update the context everywhere, we can re-trigger the login logic
      // This is a simple way to refresh the user state globally
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      await login(user.email, null, true); // Special flag to bypass password check in context

      setMessage("Profile updated successfully!");
      setTimeout(() => navigate("/account"), 1500);
    } catch (err) {
      setMessage("Failed to update profile.");
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="relative  w-full flex items-center justify-center p-4 min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white overflow-hidden" >
 
      <div className="relative z-10 w-full max-w-lg p-6 bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-lg border border-purple-500/30">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-6">Edit Your Profile</h1>
        {message && <p className="text-center text-green-400 mb-4">{message}</p>}
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-300">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"/>
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-300">Mobile Number</label>
            <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"/>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => navigate("/account")} className="flex-1 py-3 bg-gray-600 rounded-lg font-semibold hover:bg-gray-700">Back</button>
            <button type="submit" className="flex-1 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
