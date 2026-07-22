import React from 'react';
import { Vendor, WeddingSettings } from '../types';
import { calculateVendorTotalCost, getCategoryStyle, getCategoryDisplayName, formatCurrency } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface BudgetChartProps {
  vendors: Vendor[];
  settings: WeddingSettings;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ vendors, settings }) => {
  const selectedVendors = vendors.filter((v) => v.isSelected);

  const categoryTotals: Record<string, number> = {};
  selectedVendors.forEach((vendor) => {
    const cost = calculateVendorTotalCost(vendor, settings.estimatedGuests);
    categoryTotals[vendor.category] = (categoryTotals[vendor.category] || 0) + cost;
  });

  const chartData = Object.keys(categoryTotals).map((catKey) => {
    const style = getCategoryStyle(catKey, settings.customCategories);
    return {
      name: getCategoryDisplayName(catKey, settings.customCategories),
      rawKey: catKey,
      value: categoryTotals[catKey],
      color: style.accent,
    };
  });

  const totalCost = selectedVendors.reduce(
    (sum, v) => sum + calculateVendorTotalCost(v, settings.estimatedGuests),
    0
  );

  if (selectedVendors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-orange-500" />
          類別預算占比分析
        </h3>
        <span className="text-xs text-slate-500">
          總計：{formatCurrency(totalCost, settings.currencySymbol)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value) || 0, settings.currencySymbol)}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {chartData.map((item) => {
            const percentage = totalCost > 0 ? Math.round((item.value / totalCost) * 100) : 0;
            return (
              <div
                key={item.rawKey}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate font-medium text-slate-700">
                    {item.name}
                  </span>
                </div>
                <div className="text-right font-bold text-slate-900 ml-2">
                  {formatCurrency(item.value, settings.currencySymbol)}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
