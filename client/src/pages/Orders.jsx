// src/pages/Orders.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

// --- MODAL COMPONENTS ---

// InvoiceModal: Displays a detailed breakdown of the order for printing.
const InvoiceModal = ({ order, onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 text-white rounded-lg shadow-xl p-8 max-w-2xl w-full animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Invoice for Order ...{order._id.slice(-8)}</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div><strong>Billed to:</strong><p>{order.shippingInfo.name}</p></div>
                <div><strong>Shipping to:</strong><p>{order.shippingInfo.address}, {order.shippingInfo.city}</p></div>
                <div><strong>Order Date:</strong><p>{new Date(order.orderDate).toLocaleDateString()}</p></div>
                <div><strong>Payment:</strong><p>{order.paymentMethod}</p></div>
            </div>
            <table className="w-full text-left mb-6">
                <thead><tr className="border-b border-gray-600"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2 text-right">Price</th></tr></thead>
                <tbody>{order.products.map(p => <tr key={p.productId}><td className="p-2">{p.name}</td><td className="p-2">{p.quantity}</td><td className="p-2 text-right">₹{p.price.toLocaleString('en-IN')}</td></tr>)}</tbody>
            </table>
            <p className="text-right text-2xl font-bold text-purple-400">Total: ₹{order.totalAmount.toLocaleString('en-IN')}</p>
            <div className="flex gap-4 mt-6"><button onClick={onClose} className="flex-1 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">Close</button><button onClick={() => window.print()} className="flex-1 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Print</button></div>
        </div>
    </div>
);

// TrackingModal: Shows a visual timeline of the order's status.
const TrackingModal = ({ order, onClose }) => {
    const statuses = ['Processing', 'Shipped', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(order.status);
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fadeIn">
                <h2 className="text-2xl font-bold mb-6">Track Package</h2>
                <div className="space-y-4">
                    {statuses.map((status, index) => (
                        <div key={status} className={`flex items-center ${index <= currentStatusIndex ? 'text-green-400' : 'text-gray-500'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${index <= currentStatusIndex ? 'border-green-400 bg-green-400' : 'border-gray-500'}`}>
                                {index <= currentStatusIndex && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="ml-4 font-semibold">{status}</span>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="w-full mt-8 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">Close</button>
            </div>
        </div>
    );
};

// CancelConfirmModal: Asks the user for confirmation before deleting an order.
const CancelConfirmModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl text-center animate-fadeIn">
            <h3 className="text-xl font-bold mb-4">Are you sure?</h3>
            <p className="text-gray-300 mb-6">This action cannot be undone. The order will be permanently deleted.</p>
            <div className="flex gap-4"><button onClick={onCancel} className="flex-1 py-2 bg-gray-600 rounded-lg hover:bg-gray-700">Keep Order</button><button onClick={onConfirm} className="flex-1 py-2 bg-red-600 rounded-lg hover:bg-red-700">Yes, Delete</button></div>
        </div>
    </div>
);


function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modal, setModal] = useState(null); // 'invoice', 'track', 'cancel'

    useEffect(() => {
        if (user?.id) {
            axios.get(`${import.meta.env.VITE_API_URL}/api/orders/${user.id}`)
                .then(res => { setOrders(res.data); setLoading(false); })
                .catch(err => { console.error("Failed to fetch orders:", err); setLoading(false); });
        } else {
            navigate("/login");
        }
    }, [user, navigate]);

    const handleDeleteOrder = async () => {
        if (!selectedOrder) return;
        try {
            // This now sends a DELETE request, matching your updated backend route
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/orders/${selectedOrder._id}`);

            // Update the UI by removing the deleted order from the state
            setOrders(orders.filter(o => o._id !== selectedOrder._id));
            setModal(null);
        } catch (err) {
            alert("Failed to delete order. It may have already been shipped or deleted.");
            console.error("Failed to delete order:", err);
        }
    };

    const openModal = (type, order) => {
        setSelectedOrder(order);
        setModal(type);
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl text-purple-400">Loading Your Orders...</div>;

    return (
        <div className="min-h-screen w-full pt-24 pb-12 px-4 bg-gray-900 text-white">
            {/* New Subtle Background */}
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4c1d95 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            {modal === 'invoice' && <InvoiceModal order={selectedOrder} onClose={() => setModal(null)} />}
            {modal === 'track' && <TrackingModal order={selectedOrder} onClose={() => setModal(null)} />}
            {modal === 'cancel' && <CancelConfirmModal onConfirm={handleDeleteOrder} onCancel={() => setModal(null)} />}

            <div className="relative z-10 max-w-5xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-extrabold text-center text-purple-400 mb-10">Your Orders</h1>

                {orders.length === 0 ? (
                    <div className="text-center bg-gray-800/50 backdrop-blur-md rounded-lg p-10">
                        <p className="text-xl text-gray-300 mb-4">You have no past orders.</p>
                        <Link to="/products" className="text-purple-500 font-semibold hover:underline">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const isCancellable = order.status === 'Processing';
                            const statusStyles = {
                                Processing: "bg-blue-600/30 text-blue-300",
                                Shipped: "bg-yellow-600/30 text-yellow-300",
                                Delivered: "bg-green-600/30 text-green-300",
                            };
                            return (
                                <div key={order._id} className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg border border-purple-500/20 p-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-700 pb-4 mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-100">Order ...{order._id.slice(-8)}</h2>
                                            <p className="text-gray-400 text-sm">Placed on: {formatDate(order.orderDate)}</p>
                                        </div>
                                        <div className="text-left sm:text-right mt-4 sm:mt-0">
                                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusStyles[order.status]}`}>{order.status}</span>
                                            <p className="text-2xl font-bold text-purple-400 mt-2">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-4">
                                        {order.products.map(item => <div key={item.productId} className="flex justify-between items-center text-sm"><span className="text-gray-300">{item.name} (x{item.quantity})</span><span className="text-gray-400">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span></div>)}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
                                        <button onClick={() => openModal('invoice', order)} className="flex-1 py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition">View Invoice</button>
                                        <button onClick={() => openModal('track', order)} className="flex-1 py-2 bg-gray-600 rounded-lg font-semibold hover:bg-gray-700 transition">Track Package</button>
                                        {isCancellable && <button onClick={() => openModal('cancel', order)} className="flex-1 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition">Cancel Order</button>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Orders;
