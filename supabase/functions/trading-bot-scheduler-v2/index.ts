import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradingBot {
  id: string;
  user_id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  status: string;
  created_at: string;
  expected_completion_time: string;
}

interface HistoricalPrice {
  symbol: string;
  price: number;
  change_24h: number;
  volume: number;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Trading Bot Scheduler V2 started at', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find bots that are ready to complete (past their expected completion time)
    const { data: readyBots, error: botsError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('status', 'active')
      .lt('expected_completion_time', new Date().toISOString());

    if (botsError) {
      console.error('❌ Error fetching ready bots:', botsError);
      throw botsError;
    }

    console.log(`📋 Found ${readyBots?.length || 0} bots ready to complete`);

    let processedCount = 0;
    const results = [];

    if (readyBots && readyBots.length > 0) {
      for (const bot of readyBots) {
        try {
          console.log(`🔄 Processing bot ${bot.id} for ${bot.symbol}...`);
          
          const result = await simulateTradeWithHistoricalData(supabase, bot);
          results.push(result);
          processedCount++;
          
          console.log(`✅ Successfully processed bot ${bot.id}`);
        } catch (error) {
          console.error(`❌ Error processing bot ${bot.id}:`, error);
          results.push({
            bot_id: bot.id,
            success: false,
            error: error.message
          });
        }
      }
    }

    console.log(`🎯 Processed ${processedCount} bots successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_bots: processedCount,
        total_ready_bots: readyBots?.length || 0,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('💥 Error in trading bot scheduler:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function simulateTradeWithHistoricalData(supabase: any, bot: TradingBot) {
  console.log(`📊 Analyzing historical data for bot ${bot.id} (${bot.symbol})...`);

  // Calculate bot runtime in minutes
  const botStartTime = new Date(bot.created_at);
  const now = new Date();
  const runtimeMinutes = Math.floor((now.getTime() - botStartTime.getTime()) / (1000 * 60));
  
  console.log(`⏱️ Bot has been running for ${runtimeMinutes} minutes`);

  // Get historical price data for the bot's runtime period
  const startAnalysisTime = new Date(botStartTime.getTime());
  const endAnalysisTime = new Date(now.getTime());

  const { data: historicalPrices, error: priceError } = await supabase
    .from('crypto_price_history')
    .select('*')
    .eq('symbol', bot.symbol)
    .gte('timestamp', startAnalysisTime.toISOString())
    .lte('timestamp', endAnalysisTime.toISOString())
    .order('timestamp', { ascending: true });

  if (priceError) {
    console.error('❌ Error fetching historical prices:', priceError);
    throw new Error(`Failed to fetch historical data for ${bot.symbol}`);
  }

  if (!historicalPrices || historicalPrices.length < 2) {
    console.log(`⚠️ Insufficient historical data for ${bot.symbol}, using fallback...`);
    return await simulateTradeWithFallback(supabase, bot);
  }

  console.log(`📈 Found ${historicalPrices.length} historical price points for analysis`);

  // Analyze price movements and find optimal entry/exit points
  const tradeAnalysis = analyzeHistoricalPrices(historicalPrices, bot);
  
  console.log(`📊 Historical analysis result:`, tradeAnalysis.isprofitable ? 'PROFITABLE' : 'USING FALLBACK');
  
  let tradeResult;
  if (tradeAnalysis.isprofitable) {
    // Execute the profitable trade with historical data
    tradeResult = await executeHistoricalTrade(supabase, bot, tradeAnalysis);
    console.log(`✅ Used historical analysis for bot ${bot.id}: ${tradeResult.profit_percentage.toFixed(2)}% profit`);
  } else {
    // Use fallback but guarantee profit
    console.log(`🔄 No historical profit found, using guaranteed fallback for bot ${bot.id}`);
    tradeResult = await simulateTradeWithFallback(supabase, bot);
  }
  
  return {
    bot_id: bot.id,
    success: true,
    action: 'completed',
    profit_percentage: tradeResult.profit_percentage,
    profit_amount: tradeResult.profit_amount
  };
}

function analyzeHistoricalPrices(prices: HistoricalPrice[], bot: TradingBot) {
  console.log('🔍 Analyzing historical price movements...');
  
  const minPrice = Math.min(...prices.map(p => p.price));
  const maxPrice = Math.max(...prices.map(p => p.price));
  const priceRange = maxPrice - minPrice;
  const averagePrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
  
  console.log(`📊 Price analysis: Min=${minPrice.toFixed(4)}, Max=${maxPrice.toFixed(4)}, Avg=${averagePrice.toFixed(4)}`);

  // Find optimal scenarios for both LONG and SHORT positions
  const longScenarios = [];
  const shortScenarios = [];

  // For LONG: Buy low, sell high
  for (let buyIndex = 0; buyIndex < prices.length - 1; buyIndex++) {
    for (let sellIndex = buyIndex + 1; sellIndex < prices.length; sellIndex++) {
      const buyPrice = prices[buyIndex].price;
      const sellPrice = prices[sellIndex].price;
      
      // Test different leverage levels (1x to 5x)
      for (let leverage = 1; leverage <= 5; leverage++) {
        const profitPercent = ((sellPrice - buyPrice) / buyPrice) * leverage * 100;
        
        if (profitPercent >= 1.0 && profitPercent <= 3.0) {
          longScenarios.push({
            buyPrice,
            sellPrice,
            leverage,
            profitPercent,
            tradeType: 'long'
          });
        }
      }
    }
  }

  // For SHORT: Sell high, buy low
  for (let sellIndex = 0; sellIndex < prices.length - 1; sellIndex++) {
    for (let buyIndex = sellIndex + 1; buyIndex < prices.length; buyIndex++) {
      const sellPrice = prices[sellIndex].price;
      const buyPrice = prices[buyIndex].price;
      
      // Test different leverage levels (1x to 5x)
      for (let leverage = 1; leverage <= 5; leverage++) {
        const profitPercent = ((sellPrice - buyPrice) / sellPrice) * leverage * 100;
        
        if (profitPercent >= 1.0 && profitPercent <= 3.0) {
          shortScenarios.push({
            buyPrice,
            sellPrice,
            leverage,
            profitPercent,
            tradeType: 'short'
          });
        }
      }
    }
  }

  // Combine all profitable scenarios
  const allScenarios = [...longScenarios, ...shortScenarios];
  
  if (allScenarios.length === 0) {
    console.log('❌ No profitable scenarios found in historical data');
    return { isprofitable: false };
  }

  // Pick the most optimal scenario (closest to 2% profit)
  const optimalScenario = allScenarios.reduce((best, current) => {
    const bestDistance = Math.abs(best.profitPercent - 2.0);
    const currentDistance = Math.abs(current.profitPercent - 2.0);
    return currentDistance < bestDistance ? current : best;
  });

  console.log(`🎯 Found optimal scenario: ${optimalScenario.tradeType.toUpperCase()} ${optimalScenario.leverage}x for ${optimalScenario.profitPercent.toFixed(2)}% profit`);

  return {
    isprofitable: true,
    ...optimalScenario
  };
}

async function executeHistoricalTrade(supabase: any, bot: TradingBot, analysis: any) {
  const { buyPrice, sellPrice, leverage, profitPercent, tradeType } = analysis;
  
  // Calculate profit amounts
  const profitAmount = (bot.start_amount * profitPercent) / 100;
  const finalBalance = bot.start_amount + profitAmount;

  console.log(`💰 Executing trade: ${tradeType.toUpperCase()} ${leverage}x`);
  console.log(`📈 Buy: €${buyPrice.toFixed(4)}, Sell: €${sellPrice.toFixed(4)}`);
  console.log(`💵 Profit: €${profitAmount.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

  // Record the completed trade
  const { error: tradeError } = await supabase
    .from('bot_trades')
    .insert({
      bot_id: bot.id,
      amount: bot.start_amount,
      buy_price: buyPrice,
      sell_price: sellPrice,
      trade_type: tradeType,
      leverage: leverage,
      profit_amount: profitAmount,
      profit_percentage: profitPercent,
      status: 'completed',
      started_at: bot.created_at,
      completed_at: new Date().toISOString()
    });

  if (tradeError) {
    console.error('❌ Error recording trade:', tradeError);
    throw tradeError;
  }

  // Update the bot status and balance
  const { error: botUpdateError } = await supabase
    .from('trading_bots')
    .update({
      status: 'completed',
      current_balance: finalBalance,
      buy_price: buyPrice,
      sell_price: sellPrice,
      leverage: leverage
    })
    .eq('id', bot.id);

  if (botUpdateError) {
    console.error('❌ Error updating bot:', botUpdateError);
    throw botUpdateError;
  }

  // Update user balance - add the initial investment back plus profit
  const totalReturn = bot.start_amount + profitAmount;
  console.log(`💰 Returning ${totalReturn.toFixed(2)} EUR to user balance (${bot.start_amount} investment + ${profitAmount.toFixed(2)} profit)`);
  
  const { error: balanceError } = await supabase.rpc('update_user_balance', {
    target_user_id: bot.user_id,
    amount_change: totalReturn,
    transaction_type: 'credit',
    transaction_description: `Trading Bot Completed - ${bot.cryptocurrency} (${profitPercent.toFixed(2)}% profit)`,
    admin_user_id: bot.user_id // Using user as admin for trading profits
  });

  if (balanceError) {
    console.error('❌ Error updating user balance:', balanceError);
    console.error('Balance error details:', balanceError);
    // Don't throw here, trade was already recorded
  } else {
    console.log(`✅ Successfully updated user balance with ${totalReturn.toFixed(2)} EUR`);
  }

  return {
    profit_amount: profitAmount,
    profit_percentage: profitPercent,
    final_balance: finalBalance
  };
}

async function simulateTradeWithFallback(supabase: any, bot: TradingBot) {
  console.log(`🔄 Using fallback simulation for bot ${bot.id}`);
  
  // Generate realistic random profit between 1.01% and 2.99% with decimals
  const profitPercent = 1.01 + Math.random() * 1.98; // 1.01% - 2.99%
  const currentPrice = getDefaultPrice(bot.symbol);
  
  // Generate realistic prices with proper decimals
  const leverage = Math.floor(Math.random() * 5) + 1; // 1-5x
  const tradeType = Math.random() > 0.5 ? 'long' : 'short';
  
  // Add small random fluctuation to base price for realism
  const priceFluctuation = 0.95 + Math.random() * 0.1; // 0.95 - 1.05 multiplier
  const adjustedPrice = currentPrice * priceFluctuation;
  
  let buyPrice, sellPrice;
  
  if (tradeType === 'long') {
    // LONG: Buy slightly lower, sell higher
    buyPrice = adjustedPrice * (1 - (profitPercent / leverage / 100));
    sellPrice = adjustedPrice * (1 + (profitPercent / leverage / 100));
  } else {
    // SHORT: Sell higher, buy lower
    sellPrice = adjustedPrice * (1 + (profitPercent / leverage / 100));
    buyPrice = adjustedPrice * (1 - (profitPercent / leverage / 100));
  }
  
  console.log(`🎲 Fallback trade: ${tradeType.toUpperCase()} ${leverage}x for ${profitPercent.toFixed(2)}% profit`);

  return await executeHistoricalTrade(supabase, bot, {
    buyPrice,
    sellPrice,
    leverage,
    profitPercent,
    tradeType
  });
}

function getDefaultPrice(symbol: string): number {
  // Fallback prices for major cryptocurrencies (EUR)
  const defaultPrices: Record<string, number> = {
    'BTC': 95000,
    'ETH': 3500,
    'USDT': 0.95,
    'BNB': 650,
    'SOL': 220,
    'USDC': 0.95,
    'XRP': 2.5,
    'DOGE': 0.38,
    'ADA': 1.1,
    'TRX': 0.25,
    'AVAX': 42,
    'SHIB': 0.000025,
    'DOT': 8.5,
    'LINK': 22,
    'BCH': 485,
    'NEAR': 6.8,
    'MATIC': 0.55,
    'ICP': 12,
    'LTC': 110,
    'UNI': 15,
    'PEPE': 0.000018
  };

  return defaultPrices[symbol] || 100; // Default fallback
}