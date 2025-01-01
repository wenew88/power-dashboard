import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUp, ArrowDown, DollarSign, Clock, Zap } from 'lucide-react';

const Dashboard = () => {
  const [inputs, setInputs] = useState({
    basePrice: 4400,
    gasPrice: 0,
    efficiency: 0,
    heatOutput: 0,
    heatPrice: 0,
    gasConsumption: 0,
    expenses: 195324,
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Existing calculation functions...
  const calculateDerivedValues = () => {
    const gasConsumptionHour = inputs.gasConsumption * 3.6;
    const gasCostHour = gasConsumptionHour * inputs.gasPrice;
    const heatRevenue = inputs.heatOutput * inputs.heatPrice;
    const operatingCostHour = gasCostHour - heatRevenue;
    return { gasConsumptionHour, gasCostHour, heatRevenue, operatingCostHour };
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet2 = workbook.Sheets['Sheet2'];
        const jsonData = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
        
        const derived = calculateDerivedValues();
        let profitable_hours = 0;
        let total_revenue = 0;
        let hourly_data = [];
        let daily_profits = Array(31).fill(0);
        let peak_price = 0;
        let peak_hour = '';

        for (let row = 1; row < jsonData.length; row++) {
          for (let col = 1; col < jsonData[row].length; col++) {
            const price = jsonData[row][col];
            const hourlyProfit = price - inputs.basePrice - derived.operatingCostHour;
            
            if (price > 5000) {
              profitable_hours++;
              total_revenue += hourlyProfit;
              hourly_data.push({
                hour: `Day ${row} Hour ${col}`,
                price: price,
                profit: hourlyProfit
              });
              daily_profits[row-1] += hourlyProfit;
              
              if (price > peak_price) {
                peak_price = price;
                peak_hour = `Day ${row} Hour ${col}`;
              }
            }
          }
        }

        const net_profit = total_revenue - inputs.expenses;
        
        setResults({
          profitable_hours,
          total_revenue,
          net_profit,
          hourly_data,
          daily_profits: daily_profits.map((profit, index) => ({
            day: index + 1,
            profit: profit
          })),
          peak_price,
          peak_hour,
          derived
        });
      } catch (err) {
        setError('Error processing file');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Power Plant Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Profitable Hours</p>
                  <p className="text-2xl font-bold">{results?.profitable_hours || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Net Profit</p>
                  <p className="text-2xl font-bold">{results?.net_profit?.toFixed(2) || 0}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Peak Price</p>
                  <p className="text-2xl font-bold">{results?.peak_price || 0}</p>
                  <p className="text-xs text-gray-400">{results?.peak_hour || ''}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Operating Cost/h</p>
                  <p className="text-2xl font-bold">{results?.derived?.operatingCostHour?.toFixed(2) || 0}</p>
                </div>
                <ArrowDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Hourly Profits Above 5000</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results?.hourly_data?.slice(0, 24) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Daily Profit Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results?.daily_profits || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="profit" stroke="#4f46e5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-lg mb-8">
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(inputs).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </label>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setInputs(prev => ({...prev, [key]: Number(e.target.value)}))}
                    className="w-full"
                  />
                </div>
              ))}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Excel File</label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Dashboard;