import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCoinGecko } from '@/contexts/CoinGeckoContext';
import { useCoinMarketCap } from '@/contexts/CoinMarketCapContext';

interface ChartData {
  time: string;
  timestamp: number;
  price: number;
}

interface CryptoCandlestickChartProps {
  symbol: string;
}

const CryptoCandlestickChart: React.FC<CryptoCandlestickChartProps> = ({ symbol }) => {
  // Use CoinGecko for chart data
  const { getChartData, chartLoading } = useCoinGecko();
  // Use CoinMarketCap for live price data (red box)
  const { getPriceData } = useCoinMarketCap();
  
  const coinGeckoData = getChartData(symbol);
  const livePriceData = getPriceData(symbol);

  const chartData = useMemo(() => {
    if (!coinGeckoData || coinGeckoData.length === 0) return [];
    
    // Use CoinGecko chart data for natural curves
    const data = coinGeckoData.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: item.timestamp,
      price: item.price
    }));
    
    console.log(`Chart data points from CoinGecko: ${data.length}`);
    if (data.length > 0) {
      console.log(`Price range: ${Math.min(...data.map(d => d.price)).toFixed(2)} - ${Math.max(...data.map(d => d.price)).toFixed(2)}`);
    }
    
    return data;
  }, [coinGeckoData]);

  // Use live price from CoinMarketCap for the red price box
  const currentPrice = livePriceData?.price || 0;
  const priceChange24h = livePriceData?.change24h || 0;
  
  // Determine if trend is positive or negative
  const isPositiveTrend = useMemo(() => {
    if (chartData.length < 2) return true;
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    return lastPrice >= firstPrice;
  }, [chartData]);

  if (chartLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded"></div>
        <div className="h-[120px] bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  // Apple-style colors for iPhone Stocks app look
  const positiveColor = "hsl(142, 76%, 36%)"; // Apple green
  const negativeColor = "hsl(0, 84%, 60%)"; // Apple red
  const currentColor = isPositiveTrend ? positiveColor : negativeColor;

  const chartConfig = {
    price: {
      label: "Preis",
      color: currentColor,
    },
    volume: {
      label: "Volumen", 
      color: "hsl(var(--muted))",
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">LIVE</span>
        </div>
        <div className="text-right">
          <div className={`text-lg font-mono font-bold transition-colors duration-300 ${
            priceChange24h > 0 
              ? 'text-green-500' 
              : priceChange24h < 0 
                ? 'text-red-500' 
                : 'text-foreground'
          }`}>
            €{currentPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">{symbol}/EUR</div>
          {priceChange24h !== 0 && (
            <div className={`text-xs ${
              priceChange24h > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
      
      <ChartContainer config={chartConfig} className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={currentColor} 
                  stopOpacity={0.8}
                />
                <stop 
                  offset="100%" 
                  stopColor={currentColor} 
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval={Math.floor(chartData.length / 6) || 1}
            />
            <YAxis 
              hide 
              domain={['dataMin', 'dataMax']}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: any) => [
                `€${parseFloat(value).toFixed(2)}`,
                "Preis"
              ]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={currentColor}
              strokeWidth={2}
              fill={`url(#gradient-${symbol})`}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
              activeDot={{ 
                r: 4, 
                fill: currentColor,
                strokeWidth: 2,
                stroke: "hsl(var(--background))"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default CryptoCandlestickChart;