import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TradeSimulation {
  bot_id: string;
  current_price: number;
}

serve(async (req) => {
  console.log('🚀 Trading bot simulator function started');
  console.log('📨 Request method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Reading request body...');
    const body = await req.json();
    console.log('📊 Request body:', body);
    
    const { bot_id, current_price }: TradeSimulation = body;
    
    if (!bot_id || !current_price) {
      console.error('❌ Missing required parameters:', { bot_id, current_price });
      return new Response(JSON.stringify({ 
        error: 'Missing bot_id or current_price' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🤖 Starting trade simulation for bot ${bot_id} at price ${current_price}`);

    // Start background trading simulation
    console.log('⏳ Starting background trading loop...');
    EdgeRuntime.waitUntil(startTradingLoop(bot_id, current_price));
    console.log('✅ Background task registered with EdgeRuntime.waitUntil');

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Trade simulation started for bot ${bot_id}`,
      status: 'active',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Critical error in trading-bot-simulator:', error);
    console.error('🔍 Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startTradingLoop(bot_id: string, initial_price: number) {
  console.log(`🔄 Starting one-time trade for bot ${bot_id} with initial price ${initial_price}`);
  let currentPrice = initial_price;
  
  // For testing: Execute first trade after 30 seconds
  console.log('⚡ Scheduling one-time trade in 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    console.log('🎯 Executing one-time trade...');
    await simulateTrade(bot_id, currentPrice);
    console.log(`✅ One-time trade completed for bot ${bot_id}`);
  } catch (error) {
    console.error('❌ Error in one-time trade:', error);
  }
  
  console.log(`🏁 Trading completed for bot ${bot_id}`);
}

async function findOptimalTradePrices(symbol: string, currentPrice: number, botCreatedAt: string) {
  console.log(`🔍 Finding optimal trade prices for ${symbol}`);
  
  // For the 30-second test phase, simulate realistic market movements
  // In production, this would use actual CoinMarketCap OHLCV data
  
  // Calculate time since bot creation (in minutes)
  const botStartTime = new Date(botCreatedAt);
  const currentTime = new Date();
  const timeDifferenceMs = currentTime.getTime() - botStartTime.getTime();
  const timeDifferenceMinutes = Math.max(timeDifferenceMs / (1000 * 60), 0.5); // At least 30 seconds
  
  console.log(`⏰ Bot running time: ${timeDifferenceMinutes.toFixed(1)} minutes`);
  
  // Generate realistic price movements based on timeframe
  // Longer timeframes allow for bigger movements
  const maxMovementPercent = Math.min(timeDifferenceMinutes * 0.1, 2.0); // Max 2% movement
  
  // Simulate historical price range within the timeframe
  const volatility = Math.random() * maxMovementPercent; // 0% to maxMovementPercent
  const direction = Math.random() > 0.5 ? 1 : -1; // Up or down
  
  // Create realistic entry and exit prices
  let entryPrice: number;
  let exitPrice: number;
  let tradeType: 'long' | 'short';
  let marketMovementPercent: number;
  
  if (direction > 0) {
    // Market went up - perfect for LONG position
    entryPrice = currentPrice * (1 - volatility / 100); // Enter at lower price
    exitPrice = currentPrice; // Exit at current higher price
    tradeType = 'long';
    marketMovementPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
  } else {
    // Market went down - perfect for SHORT position  
    entryPrice = currentPrice * (1 + volatility / 100); // Enter at higher price (short sell)
    exitPrice = currentPrice; // Exit at current lower price (buy back)
    tradeType = 'short';
    marketMovementPercent = ((entryPrice - exitPrice) / entryPrice) * 100;
  }
  
  // Ensure minimum movement for leverage calculation
  if (Math.abs(marketMovementPercent) < 0.1) {
    marketMovementPercent = 0.1 * Math.sign(marketMovementPercent);
    if (tradeType === 'long') {
      exitPrice = entryPrice * (1 + marketMovementPercent / 100);
    } else {
      exitPrice = entryPrice * (1 - marketMovementPercent / 100);
    }
  }
  
  console.log(`🎯 Optimal trade found: ${tradeType.toUpperCase()} position`);
  console.log(`📊 Entry: ${entryPrice.toFixed(4)} → Exit: ${exitPrice.toFixed(4)}`);
  console.log(`📈 Market movement: ${marketMovementPercent.toFixed(2)}%`);
  
  return {
    entryPrice,
    exitPrice,
    tradeType,
    marketMovementPercent: Math.abs(marketMovementPercent)
  };
}

async function simulateTrade(bot_id: string, initial_price: number) {
  try {
    console.log(`🎯 Executing time-traveling trade simulation for bot ${bot_id}`);

    // Get bot information
    const { data: bot, error: botError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('id', bot_id)
      .eq('status', 'active')
      .single();

    if (botError || !bot) {
      console.error('❌ Bot not found or not active:', botError);
      return;
    }

    console.log(`📊 Bot found: ${bot.cryptocurrency} (${bot.symbol}), Start Amount: ${bot.start_amount}`);

    // Get historical price data for the bot's timeframe (simulate "time-traveling")
    const { entryPrice, exitPrice, tradeType, marketMovementPercent } = await findOptimalTradePrices(
      bot.symbol, 
      initial_price,
      bot.created_at
    );

    // Calculate target profit (1-3%)
    const targetProfitPercentage = Math.random() * 2 + 1; // 1-3% profit
    
    // Calculate required leverage to achieve target profit from market movement
    const requiredLeverage = Math.abs(targetProfitPercentage / marketMovementPercent);
    const leverage = Math.min(Math.max(requiredLeverage, 1), 10); // Keep leverage between 1x-10x
    
    // Adjust target profit based on capped leverage
    const actualTargetProfit = Math.abs(marketMovementPercent * leverage);

    console.log(`📈 Market Movement: ${marketMovementPercent.toFixed(2)}%, Required Leverage: ${leverage.toFixed(1)}x`);
    console.log(`🎯 Target Profit: ${actualTargetProfit.toFixed(2)}%`);

    // Calculate trade amounts and profits
    const tradeAmount = bot.start_amount; // Use 100% of start amount
    const profitAmount = tradeAmount * (actualTargetProfit / 100);
    const newBalance = bot.start_amount + profitAmount;

    // Determine buy/sell prices based on trade type
    let buyPrice: number, sellPrice: number;
    if (tradeType === 'long') {
      buyPrice = entryPrice;
      sellPrice = exitPrice;
    } else {
      buyPrice = exitPrice; // Short: sell high first, buy back lower
      sellPrice = entryPrice;
    }

    console.log(`💰 Trade details: ${tradeType.toUpperCase()} ${leverage.toFixed(1)}x leverage`);
    console.log(`📊 Entry: ${entryPrice.toFixed(4)}, Exit: ${exitPrice.toFixed(4)}`);
    console.log(`💵 Buy: ${buyPrice.toFixed(4)}, Sell: ${sellPrice.toFixed(4)}`);
    console.log(`📈 Profit: ${actualTargetProfit.toFixed(2)}% (${profitAmount.toFixed(2)})`);

    // Generate realistic trade timestamps within the simulation period
    const tradeStartTime = new Date(Date.now() - Math.random() * 20000); // Started 0-20 seconds ago
    const tradeEndTime = new Date(); // Completed now

    // Create trade record with correct buy/sell prices
    const { data: trade, error: tradeError } = await supabase
      .from('bot_trades')
      .insert({
        bot_id: bot_id,
        trade_type: tradeType,
        buy_price: parseFloat(buyPrice.toFixed(4)),
        sell_price: parseFloat(sellPrice.toFixed(4)),
        leverage: parseFloat(leverage.toFixed(2)),
        amount: parseFloat(tradeAmount.toFixed(2)),
        profit_amount: parseFloat(profitAmount.toFixed(2)),
        profit_percentage: parseFloat(actualTargetProfit.toFixed(2)),
        status: 'completed',
        started_at: tradeStartTime.toISOString(),
        completed_at: tradeEndTime.toISOString()
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating trade record:', tradeError);
      return;
    }

    // Update bot balance and set status to completed
    const { error: updateError } = await supabase
      .from('trading_bots')
      .update({ 
        current_balance: parseFloat(newBalance.toFixed(2)),
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bot_id);

    if (updateError) {
      console.error('Error updating bot balance and status:', updateError);
      return;
    }

    console.log(`Trade completed successfully for bot ${bot_id}. New balance: ${newBalance.toFixed(2)}, Status: completed`);

  } catch (error) {
    console.error('Error in simulateTrade:', error);
  }
}