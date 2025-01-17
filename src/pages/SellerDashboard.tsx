import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Gift, PlusCircle, List, Home } from 'lucide-react';
import { TEST_SELLER_ID } from '../lib/constants';
import { useNavigate } from 'react-router-dom';
import { Notification, useNotification } from '../components/Notification';

interface Campaign {
  id: string;
  title: string;
  description: string;
  item_needed: string;
  quantity_needed: number;
  quantity_received: number;
  buyer_id: string;
}

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

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'items' | 'campaigns' | 'orders' | 'donations'>('items');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const { notification, showNotification, hideNotification } = useNotification();
  const [donationQuantities, setDonationQuantities] = useState<{[key: string]: number}>({});
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    quantity: '',
    fresh_until: ''
  });

  useEffect(() => {
    fetchCampaigns();
    fetchFoodItems();
    fetchOrders();
    fetchDonations();
  }, []);

  async function fetchCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching campaigns:', error);
    } else {
      setCampaigns(data || []);
      const quantities: {[key: string]: number} = {};
      data?.forEach(campaign => {
        quantities[campaign.id] = 1;
      });
      setDonationQuantities(quantities);
    }
  }

  async function fetchDonations() {
    const { data, error } = await supabase
      .from('campaign_donations')
      .select(`
        *,
        campaign:campaigns(*)
      `)
      .eq('seller_id', TEST_SELLER_ID)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching donations:', error);
    } else {
      setDonations(data || []);
    }
  }

  async function fetchFoodItems() {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('seller_id', TEST_SELLER_ID)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching food items:', error);
    } else {
      setFoodItems(data || []);
    }
  }

  async function fetchOrders() {
    const { data: sellerItems, error: itemsError } = await supabase
      .from('food_items')
      .select('id')
      .eq('seller_id', TEST_SELLER_ID);

    if (itemsError) {
      console.error('Error fetching seller items:', itemsError);
      return;
    }

    const sellerItemIds = sellerItems.map(item => item.id);

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        food_item:food_items(*)
      `)
      .in('food_item_id', sellerItemIds)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
  }

  async function donateToCampaign(campaignId: string) {
    const quantity = donationQuantities[campaignId] || 1;
    const { error } = await supabase
      .from('campaign_donations')
      .insert({
        campaign_id: campaignId,
        seller_id: TEST_SELLER_ID,
        quantity: quantity,
        status: 'pending'
      });

    if (error) {
      console.error('Error donating to campaign:', error);
    } else {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ quantity_received: campaign.quantity_received + quantity })
          .eq('id', campaignId);

        if (!updateError) {
          showNotification(`Donated ${quantity} items successfully`);
          fetchCampaigns();
          fetchDonations();
        }
      }
    }
  }

  async function addFoodItem(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('food_items')
      .insert({
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        original_price: parseFloat(newItem.original_price),
        quantity: parseInt(newItem.quantity),
        fresh_until: newItem.fresh_until,
        seller_id: TEST_SELLER_ID
      });

    if (error) {
      console.error('Error adding food item:', error);
    } else {
      setNewItem({
        name: '',
        description: '',
        price: '',
        original_price: '',
        quantity: '',
        fresh_until: ''
      });
      showNotification('Food item added successfully');
      fetchFoodItems();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Seller Dashboard</h1>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Food Items
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'campaigns' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'donations' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            My Donations
          </button>
        </div>

        {activeTab === 'items' && (
          <div>
            <form onSubmit={addFoodItem} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Add New Food Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    id="item-name"
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="item-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    id="item-description"
                    type="text"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="item-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Discounted Price ($)
                  </label>
                  <input
                    id="item-price"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="item-original-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price ($)
                  </label>
                  <input
                    id="item-original-price"
                    type="number"
                    step="0.01"
                    value={newItem.original_price}
                    onChange={(e) => setNewItem({ ...newItem, original_price: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Available
                  </label>
                  <input
                    id="item-quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="item-fresh-until" className="block text-sm font-medium text-gray-700 mb-1">
                    Fresh Until
                  </label>
                  <input
                    id="item-fresh-until"
                    type="datetime-local"
                    value={newItem.fresh_until}
                    onChange={(e) => setNewItem({ ...newItem, fresh_until: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="inline-block w-4 h-4 mr-2" />
                Add Item
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foodItems.map(item => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    item.seller_id === TEST_SELLER_ID 
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : ''
                  }`}
                >
                  {item.seller_id === TEST_SELLER_ID && (
                    <div className="mb-2 text-sm font-medium text-blue-600">
                      Your Item
                    </div>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-blue-600 font-bold">${item.price}</span>
                      <span className="text-gray-400 line-through ml-2">${item.original_price}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Fresh until: {new Date(item.fresh_until).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Quantity available: {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
                <p className="text-gray-600 mb-4">{campaign.description}</p>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span>Progress:</span>
                    <span>{campaign.quantity_received} / {campaign.quantity_needed} {campaign.item_needed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2"
                      style={{ width: `${(campaign.quantity_received / campaign.quantity_needed) * 100}%` }}
                    ></div>
                  </div>
                </div>
                {campaign.quantity_received < campaign.quantity_needed && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <label htmlFor={`donation-${campaign.id}`} className="text-sm font-medium text-gray-700">
                        Donation Quantity:
                      </label>
                      <input
                        id={`donation-${campaign.id}`}
                        type="number"
                        min="1"
                        max={campaign.quantity_needed - campaign.quantity_received}
                        value={donationQuantities[campaign.id] || 1}
                        onChange={(e) => setDonationQuantities({
                          ...donationQuantities,
                          [campaign.id]: Math.min(
                            Math.max(1, parseInt(e.target.value) || 1),
                            campaign.quantity_needed - campaign.quantity_received
                          )
                        })}
                        className="w-20 border rounded-lg px-2 py-1"
                      />
                    </div>
                    <button
                      onClick={() => donateToCampaign(campaign.id)}
                      className="w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Donate
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Orders for Your Items</h2>
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
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        order.status === 'received'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status === 'received' ? 'Received' : 'Confirmed'}
                      </span>
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
              <h2 className="text-xl font-semibold mb-4">My Donations</h2>
              <div className="space-y-4">
                {donations.map(donation => (
                  <div key={donation.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{donation.campaign.title}</h3>
                        <p className="text-sm text-gray-600">
                          Donated: {donation.quantity} {donation.campaign.item_needed}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {donation.status}
                      </span>
                    </div>
                  </div>
                ))}
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