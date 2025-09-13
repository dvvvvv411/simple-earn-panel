import React, { useState, useEffect, useMemo } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCoinGeckoOHLC } from '@/hooks/useCoinGeckoOHLC';
import { useCoinGeckoData } from '@/hooks/useCoinGeckoData';

interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CryptoCandlestickChartProps {
  symbol: string;
}

const CryptoCandlestickChart: React.FC<CryptoCandlestickChartProps> = ({ symbol }) => {
  const { ohlcData, loading: ohlcLoading } = useCoinGeckoOHLC(symbol);
  const { coins, loading: coinsLoading } = useCoinGeckoData();
  
  const currentCoin = useMemo(() => {
    return coins.find(coin => coin.symbol.toUpperCase() === symbol.toUpperCase());
  }, [coins, symbol]);

  const chartData = useMemo(() => {
    if (!ohlcData || ohlcData.length === 0) return [];
    
    return ohlcData.slice(-24).map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      timestamp: item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close
    }));
  }, [ohlcData]);

  const currentPrice = currentCoin?.current_price || 0;

  const Candlestick = (props: any) => {
    const { index } = props;
    if (!chartData[index]) return null;
    
    const data = chartData[index];
    const { open, high, low, close } = data;
    const isGreen = close >= open;
    
    // Calculate positions
    const chartHeight = 120;
    const minPrice = Math.min(...chartData.map(d => d.low));
    const maxPrice = Math.max(...chartData.map(d => d.high));
    const priceRange = maxPrice - minPrice;
    
    const x = (index / chartData.length) * 100;
    const width = 100 / chartData.length * 0.6;
    
    const highY = ((maxPrice - high) / priceRange) * chartHeight;
    const lowY = ((maxPrice - low) / priceRange) * chartHeight;
    const openY = ((maxPrice - open) / priceRange) * chartHeight;
    const closeY = ((maxPrice - close) / priceRange) * chartHeight;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(openY - closeY);
    
    return (
      <g transform={`translate(${x}%, 0)`}>
        {/* Wick line */}
        <line
          x1="50%"
          y1={highY}
          x2="50%"
          y2={lowY}
          stroke={isGreen ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
          strokeWidth={1}
        />
        {/* Candle body */}
        <rect
          x="20%"
          y={bodyTop}
          width="60%"
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
        />
      </g>
    );
  };

  if (ohlcLoading || coinsLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded"></div>
        <div className="h-[120px] bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  const chartConfig = {
    price: {
      label: "Preis",
      color: "hsl(var(--chart-1))",
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
            currentCoin?.price_change_percentage_24h && currentCoin.price_change_percentage_24h > 0 
              ? 'text-green-500' 
              : currentCoin?.price_change_percentage_24h && currentCoin.price_change_percentage_24h < 0 
                ? 'text-red-500' 
                : 'text-foreground'
          }`}>
            €{currentPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">{symbol}/EUR</div>
          {currentCoin?.price_change_percentage_24h && (
            <div className={`text-xs ${
              currentCoin.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {currentCoin.price_change_percentage_24h > 0 ? '+' : ''}{currentCoin.price_change_percentage_24h.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
      
      <ChartContainer config={chartConfig} className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              width={40}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: any, name: string) => [
                `€${parseFloat(value).toFixed(2)}`,
                name
              ]}
            />
            <ReferenceLine 
              y={currentPrice} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="2 2" 
              strokeWidth={1}
            />
            {chartData.map((_, index) => (
              <Candlestick
                key={index}
                index={index}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default CryptoCandlestickChart;