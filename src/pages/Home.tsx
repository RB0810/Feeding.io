import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ShoppingBag } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-green-800 mb-2">Feeding.io</h1>
        <p className="text-gray-600">Reducing food waste, one meal at a time</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <button
          onClick={() => navigate('/buyer')}
          className="flex items-center px-8 py-4 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
        >
          <ShoppingBag className="mr-2" />
          Buyer
        </button>
        
        <button
          onClick={() => navigate('/seller')}
          className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Store className="mr-2" />
          Seller
        </button>
      </div>
    </div>
  );
}

export default Home;