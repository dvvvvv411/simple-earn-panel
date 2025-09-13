import React, { useState, useEffect } from 'react';
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Rectangle } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CryptoCandlestickChartProps {
  symbol: string;
  currentPrice: number;
}

const CryptoCandlestickChart: React.FC<CryptoCandlestickChartProps> = ({ symbol, currentPrice }) => {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [livePrice, setLivePrice] = useState(currentPrice);

  // Generate initial realistic candlestick data
  const generateInitialData = () => {
    const data: CandleData[] = [];
    let price = currentPrice;
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000); // 1-minute intervals
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility * price;
      
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 0.01 * price;
      const low = Math.min(open, close) - Math.random() * 0.01 * price;
      const volume = Math.random() * 1000 + 500;

      data.push({
        time: time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(0))
      });

      price = close;
    }

    return data;
  };

  // Update chart with new candle every 5 seconds
  useEffect(() => {
    const initialData = generateInitialData();
    setChartData(initialData);

    const interval = setInterval(() => {
      setChartData(prevData => {
        const lastCandle = prevData[prevData.length - 1];
        const volatility = 0.015;
        const change = (Math.random() - 0.5) * volatility * lastCandle.close;
        const newPrice = lastCandle.close + change;
        
        setLivePrice(newPrice);
        
        const now = new Date();
        const newCandle: CandleData = {
          time: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          open: lastCandle.close,
          close: parseFloat(newPrice.toFixed(2)),
          high: parseFloat((Math.max(lastCandle.close, newPrice) + Math.random() * 0.005 * newPrice).toFixed(2)),
          low: parseFloat((Math.min(lastCandle.close, newPrice) - Math.random() * 0.005 * newPrice).toFixed(2)),
          volume: parseFloat((Math.random() * 1000 + 500).toFixed(0))
        };

        return [...prevData.slice(1), newCandle];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  const Candlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close > open;
    const bodyHeight = Math.abs(close - open) * height / (payload.high - payload.low);
    const bodyY = y + (Math.max(high - Math.max(open, close), 0) * height / (high - low));
    
    return (
      <g>
        {/* Wick line */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={isGreen ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
          strokeWidth={1}
        />
        {/* Candle body */}
        <Rectangle
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
        />
      </g>
    );
  };

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
            livePrice > currentPrice ? 'text-green-500' : livePrice < currentPrice ? 'text-red-500' : 'text-foreground'
          }`}>
            €{livePrice.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">{symbol}/EUR</div>
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
              y={livePrice} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="2 2" 
              strokeWidth={1}
            />
            {chartData.map((entry, index) => (
              <Candlestick
                key={index}
                payload={entry}
                x={index * (100 / chartData.length)}
                y={0}
                width={100 / chartData.length}
                height={100}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default CryptoCandlestickChart;