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

  // Use bot's actual runtime window for analysis
  const analysisStartTime = new Date(bot.created_at);
  const endAnalysisTime = new Date(now.getTime());

  console.log(`🕐 Analyzing bot runtime price history from ${analysisStartTime.toISOString()} to ${endAnalysisTime.toISOString()}`);

  const { data: historicalPrices, error: priceError } = await supabase
    .from('crypto_price_history')
    .select('*')
    .eq('symbol', bot.symbol)
    .gte('timestamp', analysisStartTime.toISOString())
    .lte('timestamp', endAnalysisTime.toISOString())
    .order('timestamp', { ascending: true });

  if (priceError) {
    console.error('❌ Error fetching historical prices:', priceError);
    throw new Error(`Failed to fetch historical data for ${bot.symbol}`);
  }

  if (!historicalPrices || historicalPrices.length < 2) {
    console.error(`❌ Critical: No historical data available for ${bot.symbol}`);
    throw new Error(`No historical data available for ${bot.symbol} - cannot process without real data`);
  }

  console.log(`📈 Found ${historicalPrices.length} historical price points for analysis`);

  // Analyze price movements and find optimal entry/exit points with 100x leverage
  const tradeAnalysis = analyzeHistoricalPrices(historicalPrices, bot);
  
  if (!tradeAnalysis.isprofitable) {
    console.error(`❌ Critical: No profitable scenario found for ${bot.symbol} even with 100x leverage`);
    throw new Error(`No profitable scenario possible for ${bot.symbol} - this should be impossible with 100x leverage`);
  }

  // Execute the profitable trade with historical data
  const tradeResult = await executeHistoricalTrade(supabase, bot, tradeAnalysis);
  console.log(`✅ Used historical analysis for bot ${bot.id}: ${tradeResult.profit_percentage.toFixed(2)}% profit`);
  
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
  const priceMovementPercent = (priceRange / averagePrice) * 100;
  
  console.log(`📊 Price analysis: Min=${minPrice.toFixed(4)}, Max=${maxPrice.toFixed(4)}, Avg=${averagePrice.toFixed(4)}, Movement=${priceMovementPercent.toFixed(2)}%`);

  // Find optimal scenarios for both LONG and SHORT positions
  const longScenarios = [];
  const shortScenarios = [];

  // For LONG: Buy low, sell high
  for (let buyIndex = 0; buyIndex < prices.length - 1; buyIndex++) {
    for (let sellIndex = buyIndex + 1; sellIndex < prices.length; sellIndex++) {
      const buyPrice = prices[buyIndex].price;
      const sellPrice = prices[sellIndex].price;
      const naturalMovement = ((sellPrice - buyPrice) / buyPrice) * 100;
      
      // Filter: Minimum 0.1% natural price movement required
      if (naturalMovement < 0.1) continue;
      
      // Test different leverage levels (1x to 100x)
      for (let leverage = 1; leverage <= 100; leverage++) {
        const profitPercent = naturalMovement * leverage;
        
        if (profitPercent >= 1.0 && profitPercent <= 3.0) {
          const score = calculateTradeScore(buyPrice, sellPrice, leverage, naturalMovement, 'long');
          longScenarios.push({
            buyPrice,
            sellPrice,
            leverage,
            profitPercent,
            naturalMovement,
            tradeType: 'long',
            score
          });
        }
      }
    }
  }

  // For SHORT: Sell high first, then buy low later
  for (let sellIndex = 0; sellIndex < prices.length - 1; sellIndex++) {
    for (let buyIndex = sellIndex + 1; buyIndex < prices.length; buyIndex++) {
      const sellPrice = prices[sellIndex].price; // Entry price (high)
      const buyPrice = prices[buyIndex].price;   // Exit price (low)
      const naturalMovement = ((sellPrice - buyPrice) / sellPrice) * 100;
      
      // Filter: Minimum 0.1% natural price movement required
      if (naturalMovement < 0.1) continue;
      
      // SHORT only profitable if sellPrice > buyPrice
      if (sellPrice > buyPrice) {
        // Test different leverage levels (1x to 100x)
        for (let leverage = 1; leverage <= 100; leverage++) {
          const profitPercent = naturalMovement * leverage;
          
          if (profitPercent >= 1.0 && profitPercent <= 3.0) {
            const score = calculateTradeScore(buyPrice, sellPrice, leverage, naturalMovement, 'short');
            shortScenarios.push({
              buyPrice,
              sellPrice,
              leverage,
              profitPercent,
              naturalMovement,
              tradeType: 'short',
              score
            });
          }
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

  console.log(`📈 Found ${allScenarios.length} total profitable scenarios`);

  // Sort by score (best first) and select from top 10%
  allScenarios.sort((a, b) => b.score - a.score);
  const top10PercentCount = Math.max(1, Math.ceil(allScenarios.length * 0.1));
  const topScenarios = allScenarios.slice(0, top10PercentCount);
  
  // Select randomly from the top 10% of best trades
  const randomIndex = Math.floor(Math.random() * topScenarios.length);
  const optimalScenario = topScenarios[randomIndex];

  console.log(`🎯 Selected BEST trade from top ${top10PercentCount} scenarios (top 10%)`);
  console.log(`💎 Trade: ${optimalScenario.tradeType} ${optimalScenario.leverage}x, ${optimalScenario.profitPercent.toFixed(2)}% profit, Natural movement: ${optimalScenario.naturalMovement.toFixed(3)}%, Score: ${optimalScenario.score.toFixed(2)}`);

  return {
    isprofitable: true,
    ...optimalScenario
  };
}

// Calculate trade quality score (higher is better)
function calculateTradeScore(buyPrice: number, sellPrice: number, leverage: number, naturalMovement: number, tradeType: string): number {
  // Base score from natural price movement (rewards bigger movements)
  let score = naturalMovement * 10;
  
  // Leverage penalty - prefer lower leverage for same profit
  const leveragePenalty = Math.log(leverage) * 5;
  score -= leveragePenalty;
  
  // Bonus for realistic leverage ranges based on movement
  if (naturalMovement >= 1.0 && leverage <= 5) {
    score += 20; // Big movement with low leverage = excellent
  } else if (naturalMovement >= 0.5 && leverage <= 10) {
    score += 10; // Good movement with medium leverage = good
  } else if (naturalMovement >= 0.2 && leverage <= 20) {
    score += 5; // Medium movement with higher leverage = acceptable
  }
  
  // Penalty for extreme leverage on small movements
  if (naturalMovement < 0.1 && leverage > 50) {
    score -= 30; // Very small movement with extreme leverage = bad
  }
  
  return score;
}

async function executeHistoricalTrade(supabase: any, bot: TradingBot, analysis: any) {
  const { buyPrice, sellPrice, leverage, profitPercent, tradeType } = analysis;
  
  // Calculate profit amounts
  const profitAmount = (bot.start_amount * profitPercent) / 100;
  const finalBalance = bot.start_amount + profitAmount;

  console.log(`💰 Executing trade: ${tradeType.toUpperCase()} ${leverage}x`);
  console.log(`📈 Buy: €${buyPrice.toFixed(4)}, Sell: €${sellPrice.toFixed(4)}`);
  console.log(`💵 Profit: €${profitAmount.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

  // Calculate entry and exit prices based on trade type
  const entryPrice = tradeType === 'long' ? buyPrice : sellPrice;
  const exitPrice = tradeType === 'long' ? sellPrice : buyPrice;
  
  // Record the completed trade
  const { error: tradeError } = await supabase
    .from('bot_trades')
    .insert({
      bot_id: bot.id,
      amount: bot.start_amount,
      buy_price: buyPrice,
      sell_price: sellPrice,
      entry_price: entryPrice,
      exit_price: exitPrice,
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

// FALLBACK FUNCTIONS REMOVED - V4 uses only real historical data with 100x leverage