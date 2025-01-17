import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, ShoppingCart, Heart, Home, Package } from 'lucide-react';
import { TEST_BUYER_ID } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { Notification, useNotification } from '../components/Notification';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  quantity: number;
  fresh_until: string;
  seller_id: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  item_needed: string;
  quantity_needed: number;
  quantity_received: number;
  buyer_id: string;
}

interface Order {
  id: string;
  food_item_id: string;
  buyer_id: string;
  quantity: number;
  status: string;
  created_at: string;
  food_item: FoodItem;
}

interface Donation {
  id: string;
  campaign_id: string;
  seller_id: string;
  quantity: number;
  status: string;
  created_at: string;
  campaign: Campaign;
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'items' | 'campaigns' | 'orders' | 'donations'>('items');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({});
  const [showCart, setShowCart] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<{[key: string]: number}>({});
  const { notification, showNotification, hideNotification } = useNotification();
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    item_needed: '',
    quantity_needed: 0
  });

  useEffect(() => {
    fetchFoodItems();
    fetchCampaigns();
    fetchOrders();
    fetchDonations();
  }, []);

  async function fetchFoodItems() {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching food items:', error);
    } else {
      setFoodItems(data || []);
      const quantities: {[key: string]: number} = {};
      data?.forEach(item => {
        quantities[item.id] = 1;
      });
      setItemQuantities(quantities);
    }
  }

  async function fetchCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching campaigns:', error);
    } else {
      setCampaigns(data || []);
    }
  }

  async function fetchDonations() {
    const { data, error } = await supabase
      .from('campaign_donations')
      .select(`
        *,
        campaign:campaigns(*)
      `)
      .eq('campaign.buyer_id', TEST_BUYER_ID)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching donations:', error);
    } else {
      setDonations(data?.filter(d => d.campaign !== null) || []);
    }
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        food_item:food_items(*)
      `)
      .eq('buyer_id', TEST_BUYER_ID)
      .in('status', ['confirmed', 'received'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
  }

  async function addToCart(itemId: string) {
    const quantity = itemQuantities[itemId] || 1;
    const newCartItems = {
      ...cartItems,
      [itemId]: (cartItems[itemId] || 0) + quantity
    };
    setCartItems(newCartItems);
    showNotification('Item added to cart');

    const { error } = await supabase
      .from('cart_items')
      .insert({
        food_item_id: itemId,
        buyer_id: TEST_BUYER_ID,
        quantity: quantity,
        status: 'pending'
      });

    if (error) {
      console.error('Error adding to cart:', error);
    }
  }

  async function updateCartItemQuantity(itemId: string, newQuantity: number) {
    if (newQuantity > 0) {
      const updatedCartItems = { ...cartItems, [itemId]: newQuantity };
      setCartItems(updatedCartItems);
    }
  }

  async function confirmOrder() {
    const updates = Object.entries(cartItems).map(([itemId, quantity]) => ({
      food_item_id: itemId,
      buyer_id: TEST_BUYER_ID,
      quantity,
      status: 'confirmed'
    }));

    const { error } = await supabase
      .from('cart_items')
      .insert(updates);

    if (error) {
      console.error('Error confirming order:', error);
    } else {
      setCartItems({});
      setShowCart(false);
      showNotification('Order confirmed successfully');
      fetchOrders();
    }
  }

  async function markOrderAsReceived(orderId: string) {
    const { error } = await supabase
      .from('cart_items')
      .update({ status: 'received' })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
    } else {
      showNotification('Order marked as received');
      fetchOrders();
    }
  }

  async function markDonationAsReceived(donationId: string) {
    const { error } = await supabase
      .from('campaign_donations')
      .update({ status: 'received' })
      .eq('id', donationId);

    if (error) {
      console.error('Error updating donation status:', error);
    } else {
      showNotification('Donation marked as received');
      fetchDonations();
    }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('campaigns')
      .insert({
        ...newCampaign,
        buyer_id: TEST_BUYER_ID
      });

    if (error) {
      console.error('Error creating campaign:', error);
    } else {
      setNewCampaign({
        title: '',
        description: '',
        item_needed: '',
        quantity_needed: 0
      });
      showNotification('Campaign created successfully');
      fetchCampaigns();
    }
  }

  const filteredFoodItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = Object.entries(cartItems).reduce((total, [itemId, quantity]) => {
    const item = foodItems.find(i => i.id === itemId);
    return total + (item ? item.price * quantity : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Buyer Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'items' && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search food items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowCart(true)}
                  className="relative"
                >
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  {Object.keys(cartItems).length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {Object.values(cartItems).reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'items' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Food Items
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'campaigns' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'orders' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === ' donations' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Campaign Donations
          </button>
        </div>

        {activeTab === 'items' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFoodItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-green-600 font-bold">${item.price}</span>
                    <span className="text-gray-400 line-through ml-2">${item.original_price}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Fresh until: {new Date(item.fresh_until).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <label htmlFor={`quantity-${item.id}`} className="text-sm font-medium text-gray-700">
                    Quantity:
                  </label>
                  <input
                    id={`quantity-${item.id}`}
                    type="number"
                    min="1"
                    max={item.quantity}
                    value={itemQuantities[item.id] || 1}
                    onChange={(e) => setItemQuantities({
                      ...itemQuantities,
                      [item.id]: Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity)
                    })}
                    className="w-20 border rounded-lg px-2 py-1"
                  />
                </div>
                <button
                  onClick={() => addToCart(item.id)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <>
            <form onSubmit={createCampaign} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Create New Campaign</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="campaign-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Title
                  </label>
                  <input
                    id="campaign-title"
                    type="text"
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    id="campaign-description"
                    type="text"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="campaign-item" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Needed
                  </label>
                  <input
                    id="campaign-item"
                    type="text"
                    value={newCampaign.item_needed}
                    onChange={(e) => setNewCampaign({ ...newCampaign, item_needed: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="campaign-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Needed
                  </label>
                  <input
                    id="campaign-quantity"
                    type="number"
                    value={newCampaign.quantity_needed}
                    onChange={(e) => setNewCampaign({ ...newCampaign, quantity_needed: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Heart className="inline-block w-4 h-4 mr-2" />
                Create Campaign
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map(campaign => (
                <div 
                  key={campaign.id} 
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    campaign.buyer_id === TEST_BUYER_ID 
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : ''
                  }`}
                >
                  {campaign.buyer_id === TEST_BUYER_ID && (
                    <div className="mb-2 text-sm font-medium text-green-600">
                      Your Campaign
                    </div>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span>Progress:</span>
                      <span>{campaign.quantity_received} / {campaign.quantity_needed} {campaign.item_needed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 rounded-full h-2"
                        style={{ width: `${(campaign.quantity_received / campaign.quantity_needed) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{order.food_item.name}</h3>
                        <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                        <p className="text-sm text-gray-600">
                          Ordered on: {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          order.status === 'received' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'received' ? 'Received' : 'Confirmed'}
                        </span>
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => markOrderAsReceived(order.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            Mark as Received
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Donations to Your Campaigns</h2>
              <div className="space-y-4">
                {donations.map(donation => (
                  <div key={donation.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{donation.campaign?.title}</h3>
                        <p className="text-sm text-gray-600">
                          Received: {donation.quantity} {donation.campaign?.item_needed}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          donation.status === 'received'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donation.status}
                        </span>
                        {donation.status === 'pending' && (
                          <button
                            onClick={() => markDonationAsReceived(donation.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            Mark as Received
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
              <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
              {Object.entries(cartItems).map(([itemId, quantity]) => {
                const item = foodItems.find(i => i.id === itemId);
                return item ? (
                  <div key={itemId} className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <label htmlFor={`cart-quantity-${itemId}`} className="text-sm text-gray-600">
                          Quantity:
                        </label>
                        <input
                          id={`cart-quantity-${itemId}`}
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={quantity}
                          onChange={(e) => updateCartItemQuantity(itemId, parseInt(e.target.value))}
                          className="w-20 border rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <span className="font-semibold">${(item.price * quantity).toFixed(2)}</span>
                  </div>
                ) : null;
              })}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCart(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    Close
                  </button>
                  <button
                    onClick={confirmOrder}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirm Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {notification && (
          <Notification
            message={notification}
            onClose={hideNotification}
          />
        )}
      </div>
    </div>
  );
}