'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Sep', revenue: 0, sales: 0 },
  { name: 'Oct', revenue: 20, sales: 15 },
  { name: 'Nov', revenue: 45, sales: 30 },
  { name: 'Dec', revenue: 30, sales: 45 },
  { name: 'Jan', revenue: 55, sales: 35 },
  { name: 'Feb', revenue: 40, sales: 55 },
  { name: 'Mar', revenue: 65, sales: 45 },
  { name: 'Apr', revenue: 50, sales: 60 },
  { name: 'May', revenue: 75, sales: 50 },
  { name: 'Jun', revenue: 60, sales: 70 },
  { name: 'Jul', revenue: 80, sales: 65 },
  { name: 'Aug', revenue: 70, sales: 80 }
];

const ChartOne: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Week');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue And Sales</h3>
          <p className="text-sm text-gray-500">Last 12 months performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('Day')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              selectedPeriod === 'Day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setSelectedPeriod('Week')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              selectedPeriod === 'Week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedPeriod('Month')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              selectedPeriod === 'Month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-sm text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Sales</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartOne;