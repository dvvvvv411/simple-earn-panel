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

interface TradeScenario {
  buyPrice: number;
  sellPrice: number;
  leverage: number;
  profitPercent: number;
  naturalMovement: number;
  tradeType: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Admin Complete Bot function started');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { bot_id, trade_type, target_profit_percent, is_unlucky, preview } = await req.json();
    const isUnlucky = is_unlucky === true;

    console.log(`📋 Request: bot_id=${bot_id}, trade_type=${trade_type}, target=${target_profit_percent}%, unlucky=${isUnlucky}, preview=${preview}`);

    // Validate inputs
    if (!bot_id || !trade_type || target_profit_percent === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!['long', 'short'].includes(trade_type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid trade_type. Must be "long" or "short"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (target_profit_percent < 1.0 || target_profit_percent > 3.0) {
      return new Response(
        JSON.stringify({ success: false, error: 'target_profit_percent must be between 1.0 and 3.0' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch the bot
    const { data: bot, error: botError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('id', bot_id)
      .eq('status', 'active')
      .single();

    if (botError || !bot) {
      console.error('❌ Bot not found or not active:', botError);
      return new Response(
        JSON.stringify({ success: false, error: 'Bot not found or not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`📊 Found bot: ${bot.id} for ${bot.symbol}, amount: ${bot.start_amount}`);

    // Fetch price history for the bot's entire runtime
    const { data: priceHistory, error: priceError } = await supabase
      .from('crypto_price_history')
      .select('*')
      .eq('symbol', bot.symbol)
      .gte('timestamp', bot.created_at)
      .order('timestamp', { ascending: true });

    if (priceError || !priceHistory || priceHistory.length < 2) {
      console.error('❌ Insufficient price data:', priceError);
      return new Response(
        JSON.stringify({ success: false, error: `Insufficient price data for ${bot.symbol}. Need at least 2 data points.` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`📈 Found ${priceHistory.length} price points from ${bot.created_at} to now`);

    // Find optimal trade scenario based on trade_type, target_profit, and unlucky mode
    const scenario = isUnlucky 
      ? findOptimalLossScenario(priceHistory, trade_type, target_profit_percent)
      : findOptimalScenario(priceHistory, trade_type, target_profit_percent);

    if (!scenario) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Kein passendes Trade-Szenario gefunden. Die Marktbewegung ist möglicherweise zu gering für den gewünschten Gewinn.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`🎯 Found scenario: ${scenario.tradeType} ${scenario.leverage}x, profit: ${scenario.profitPercent.toFixed(2)}%`);

    // Calculate final amounts
    const profitAmount = (bot.start_amount * scenario.profitPercent) / 100;
    const finalBalance = bot.start_amount + profitAmount;

    // Calculate entry and exit prices based on trade type
    const entryPrice = trade_type === 'long' ? scenario.buyPrice : scenario.sellPrice;
    const exitPrice = trade_type === 'long' ? scenario.sellPrice : scenario.buyPrice;

    const tradeData = {
      trade_type: scenario.tradeType,
      buy_price: scenario.buyPrice,
      sell_price: scenario.sellPrice,
      entry_price: entryPrice,
      exit_price: exitPrice,
      natural_movement: scenario.naturalMovement,
      leverage: scenario.leverage,
      profit_percent: scenario.profitPercent,
      profit_amount: profitAmount,
      final_balance: finalBalance,
      price_data_from: priceHistory[0].timestamp,
      price_data_to: priceHistory[priceHistory.length - 1].timestamp,
      price_points_analyzed: priceHistory.length
    };

    // If preview mode, just return the trade data
    if (preview === true) {
      console.log('👀 Preview mode - returning trade data without executing');
      return new Response(
        JSON.stringify({ success: true, preview: true, trade: tradeData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Execute the trade
    console.log('💰 Executing trade...');

    // Record the completed trade
    const { error: tradeError } = await supabase
      .from('bot_trades')
      .insert({
        bot_id: bot.id,
        amount: bot.start_amount,
        buy_price: scenario.buyPrice,
        sell_price: scenario.sellPrice,
        entry_price: entryPrice,
        exit_price: exitPrice,
        trade_type: scenario.tradeType,
        leverage: scenario.leverage,
        profit_amount: profitAmount,
        profit_percentage: scenario.profitPercent,
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
        buy_price: scenario.buyPrice,
        sell_price: scenario.sellPrice,
        leverage: scenario.leverage,
        position_type: scenario.tradeType.toUpperCase()
      })
      .eq('id', bot.id);

    if (botUpdateError) {
      console.error('❌ Error updating bot:', botUpdateError);
      throw botUpdateError;
    }

    // Update user balance
    const totalReturn = bot.start_amount + profitAmount;
    console.log(`💰 Returning ${totalReturn.toFixed(2)} EUR to user balance`);
    
    const description = profitAmount < 0
      ? `Trading Bot abgeschlossen - ${bot.cryptocurrency} (${scenario.profitPercent.toFixed(2)}% Verlust)`
      : `Trading Bot abgeschlossen - ${bot.cryptocurrency} (+${scenario.profitPercent.toFixed(2)}% Gewinn)`;
    
    const { error: balanceError } = await supabase.rpc('credit_balance_from_bot', {
      target_user_id: bot.user_id,
      amount: totalReturn,
      description
    });

    if (balanceError) {
      console.error('❌ Error updating user balance:', balanceError);
      // Don't throw - trade was already recorded
    } else {
      console.log(`✅ Successfully updated user balance`);
    }

    // Send email notification (non-blocking)
    try {
      console.log('📧 Sending trade notification...');
      await supabase.functions.invoke('send-trade-notification', {
        body: {
          user_id: bot.user_id,
          bot_id: bot.id,
          cryptocurrency: bot.cryptocurrency,
          symbol: bot.symbol,
          trade_type: scenario.tradeType,
          buy_price: scenario.buyPrice,
          sell_price: scenario.sellPrice,
          leverage: scenario.leverage,
          start_amount: bot.start_amount,
          profit_amount: profitAmount,
          profit_percent: scenario.profitPercent,
          started_at: bot.created_at,
          completed_at: new Date().toISOString()
        }
      });
      console.log('✅ Trade notification sent');
    } catch (emailError) {
      console.error('⚠️ Failed to send notification (non-critical):', emailError);
    }

    console.log('✅ Trade executed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        preview: false,
        trade: tradeData,
        message: 'Trade successfully executed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('💥 Error in admin-complete-bot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function findOptimalScenario(
  prices: HistoricalPrice[], 
  tradeType: string, 
  targetProfit: number
): TradeScenario | null {
  console.log(`🔍 Finding optimal ${tradeType.toUpperCase()} scenario for ${targetProfit}% profit...`);

  const scenarios: TradeScenario[] = [];

  if (tradeType === 'long') {
    // LONG: Buy low, sell high
    for (let buyIndex = 0; buyIndex < prices.length - 1; buyIndex++) {
      for (let sellIndex = buyIndex + 1; sellIndex < prices.length; sellIndex++) {
        const buyPrice = prices[buyIndex].price;
        const sellPrice = prices[sellIndex].price;
        
        if (sellPrice <= buyPrice) continue; // Must have positive movement for LONG
        
        const naturalMovement = ((sellPrice - buyPrice) / buyPrice) * 100;
        
        if (naturalMovement < 0.01) continue; // Minimum movement required
        
        // Calculate required leverage for target profit (allow up to 100x)
        for (let leverage = 1; leverage <= 100; leverage++) {
          const profitPercent = naturalMovement * leverage;
          
          // Accept trades within ±0.5% of target, preferring closer matches
          if (profitPercent >= targetProfit - 0.5 && profitPercent <= targetProfit + 0.5) {
            const diff = Math.abs(profitPercent - targetProfit);
            scenarios.push({
              buyPrice,
              sellPrice,
              leverage,
              profitPercent,
              naturalMovement,
              tradeType: 'long'
            });
          }
        }
      }
    }
  } else {
    // SHORT: Sell high first, buy low later
    for (let sellIndex = 0; sellIndex < prices.length - 1; sellIndex++) {
      for (let buyIndex = sellIndex + 1; buyIndex < prices.length; buyIndex++) {
        const sellPrice = prices[sellIndex].price; // Entry (high)
        const buyPrice = prices[buyIndex].price;   // Exit (low)
        
        if (sellPrice <= buyPrice) continue; // Must have negative movement for SHORT profit
        
        const naturalMovement = ((sellPrice - buyPrice) / sellPrice) * 100;
        
        if (naturalMovement < 0.01) continue; // Minimum movement required
        
        // Calculate required leverage for target profit (allow up to 100x)
        for (let leverage = 1; leverage <= 100; leverage++) {
          const profitPercent = naturalMovement * leverage;
          
          // Accept trades within ±0.5% of target
          if (profitPercent >= targetProfit - 0.5 && profitPercent <= targetProfit + 0.5) {
            scenarios.push({
              buyPrice,
              sellPrice,
              leverage,
              profitPercent,
              naturalMovement,
              tradeType: 'short'
            });
          }
        }
      }
    }
  }

  console.log(`📊 Found ${scenarios.length} possible scenarios`);

  if (scenarios.length === 0) {
    // Try to find ANY scenario, even if not close to target
    console.log('⚠️ No close matches found, trying to find best available scenario...');
    
    return findBestAvailableScenario(prices, tradeType, targetProfit);
  }

  // Sort by: closest to target profit, then by lower leverage (more natural)
  scenarios.sort((a, b) => {
    const diffA = Math.abs(a.profitPercent - targetProfit);
    const diffB = Math.abs(b.profitPercent - targetProfit);
    
    if (Math.abs(diffA - diffB) < 0.1) {
      // If profit difference is similar, prefer lower leverage
      return a.leverage - b.leverage;
    }
    
    return diffA - diffB;
  });

  console.log(`🎯 Best scenario: ${scenarios[0].tradeType} ${scenarios[0].leverage}x, ${scenarios[0].profitPercent.toFixed(2)}% profit`);

  return scenarios[0];
}

function findBestAvailableScenario(
  prices: HistoricalPrice[],
  tradeType: string,
  targetProfit: number
): TradeScenario | null {
  console.log('🔍 Searching for best available scenario with maximum leverage...');

  let bestScenario: TradeScenario | null = null;
  let smallestDiff = Infinity;

  if (tradeType === 'long') {
    // Find the best LONG scenario
    let maxMovement = 0;
    let bestBuyPrice = 0;
    let bestSellPrice = 0;

    for (let buyIndex = 0; buyIndex < prices.length - 1; buyIndex++) {
      for (let sellIndex = buyIndex + 1; sellIndex < prices.length; sellIndex++) {
        const buyPrice = prices[buyIndex].price;
        const sellPrice = prices[sellIndex].price;
        
        if (sellPrice > buyPrice) {
          const movement = ((sellPrice - buyPrice) / buyPrice) * 100;
          if (movement > maxMovement) {
            maxMovement = movement;
            bestBuyPrice = buyPrice;
            bestSellPrice = sellPrice;
          }
        }
      }
    }

    if (maxMovement > 0) {
      // Use maximum 100x leverage
      const leverage = Math.min(100, Math.ceil(targetProfit / maxMovement));
      const profitPercent = maxMovement * leverage;
      
      bestScenario = {
        buyPrice: bestBuyPrice,
        sellPrice: bestSellPrice,
        leverage,
        profitPercent,
        naturalMovement: maxMovement,
        tradeType: 'long'
      };
    }
  } else {
    // Find the best SHORT scenario
    let maxMovement = 0;
    let bestBuyPrice = 0;
    let bestSellPrice = 0;

    for (let sellIndex = 0; sellIndex < prices.length - 1; sellIndex++) {
      for (let buyIndex = sellIndex + 1; buyIndex < prices.length; buyIndex++) {
        const sellPrice = prices[sellIndex].price;
        const buyPrice = prices[buyIndex].price;
        
        if (sellPrice > buyPrice) {
          const movement = ((sellPrice - buyPrice) / sellPrice) * 100;
          if (movement > maxMovement) {
            maxMovement = movement;
            bestBuyPrice = buyPrice;
            bestSellPrice = sellPrice;
          }
        }
      }
    }

    if (maxMovement > 0) {
      // Use maximum 100x leverage
      const leverage = Math.min(100, Math.ceil(targetProfit / maxMovement));
      const profitPercent = maxMovement * leverage;
      
      bestScenario = {
        buyPrice: bestBuyPrice,
        sellPrice: bestSellPrice,
        leverage,
        profitPercent,
        naturalMovement: maxMovement,
        tradeType: 'short'
      };
    }
  }

  if (bestScenario) {
    console.log(`🎯 Best available: ${bestScenario.tradeType} ${bestScenario.leverage}x, ${bestScenario.profitPercent.toFixed(2)}% profit (natural: ${bestScenario.naturalMovement.toFixed(3)}%)`);
  }

  return bestScenario;
}

// Find optimal LOSS scenario for unlucky mode
function findOptimalLossScenario(
  prices: HistoricalPrice[], 
  tradeType: string, 
  targetLoss: number
): TradeScenario | null {
  console.log(`🔍 Finding optimal ${tradeType.toUpperCase()} LOSS scenario for -${targetLoss}% loss...`);

  const lossScenarios: TradeScenario[] = [];

  if (tradeType === 'long') {
    // LONG Loss: Buy HIGH, sell LOW (price dropped after buying)
    for (let buyIndex = 0; buyIndex < prices.length - 1; buyIndex++) {
      for (let sellIndex = buyIndex + 1; sellIndex < prices.length; sellIndex++) {
        const buyPrice = prices[buyIndex].price;
        const sellPrice = prices[sellIndex].price;
        
        if (sellPrice >= buyPrice) continue; // Need price drop for LONG loss
        
        const naturalMovement = ((buyPrice - sellPrice) / buyPrice) * 100;
        if (naturalMovement < 0.01) continue;
        
        for (let leverage = 1; leverage <= 100; leverage++) {
          const lossPercent = naturalMovement * leverage;
          
          if (lossPercent >= targetLoss - 0.5 && lossPercent <= targetLoss + 0.5) {
            lossScenarios.push({
              buyPrice,
              sellPrice,
              leverage,
              profitPercent: -lossPercent, // Negative for loss!
              naturalMovement,
              tradeType: 'long'
            });
          }
        }
      }
    }
  } else {
    // SHORT Loss: Sell LOW, buy HIGH (price rose instead of falling)
    for (let sellIndex = 0; sellIndex < prices.length - 1; sellIndex++) {
      for (let buyIndex = sellIndex + 1; buyIndex < prices.length; buyIndex++) {
        const sellPrice = prices[sellIndex].price;
        const buyPrice = prices[buyIndex].price;
        
        if (buyPrice <= sellPrice) continue; // Need price rise for SHORT loss
        
        const naturalMovement = ((buyPrice - sellPrice) / sellPrice) * 100;
        if (naturalMovement < 0.01) continue;
        
        for (let leverage = 1; leverage <= 100; leverage++) {
          const lossPercent = naturalMovement * leverage;
          
          if (lossPercent >= targetLoss - 0.5 && lossPercent <= targetLoss + 0.5) {
            lossScenarios.push({
              buyPrice,
              sellPrice,
              leverage,
              profitPercent: -lossPercent, // Negative for loss!
              naturalMovement,
              tradeType: 'short'
            });
          }
        }
      }
    }
  }

  console.log(`📉 Found ${lossScenarios.length} loss scenarios`);

  if (lossScenarios.length === 0) {
    return findBestAvailableLossScenario(prices, tradeType, targetLoss);
  }

  // Sort by closest to target loss, then by lower leverage
  lossScenarios.sort((a, b) => {
    const diffA = Math.abs(Math.abs(a.profitPercent) - targetLoss);
    const diffB = Math.abs(Math.abs(b.profitPercent) - targetLoss);
    
    if (Math.abs(diffA - diffB) < 0.1) {
      return a.leverage - b.leverage;
    }
    
    return diffA - diffB;
  });

  console.log(`🎯 Best loss scenario: ${lossScenarios[0].tradeType} ${lossScenarios[0].leverage}x, ${lossScenarios[0].profitPercent.toFixed(2)}% loss`);

  return lossScenarios[0];
}

// Fallback for loss scenarios
function findBestAvailableLossScenario(
  prices: HistoricalPrice[],
  tradeType: string,
  targetLoss: number
): TradeScenario | null {
  console.log('🔍 Searching for best available loss scenario with maximum leverage...');

  let bestScenario: TradeScenario | null = null;

  if (tradeType === 'long') {
    // Find the biggest price DROP for LONG loss
    let maxDrop = 0;
    let bestBuyPrice = 0;
    let bestSellPrice = 0;

    for (let buyIndex = 0; buyIndex < prices.length - 1; buyIndex++) {
      for (let sellIndex = buyIndex + 1; sellIndex < prices.length; sellIndex++) {
        const buyPrice = prices[buyIndex].price;
        const sellPrice = prices[sellIndex].price;
        
        if (sellPrice < buyPrice) {
          const drop = ((buyPrice - sellPrice) / buyPrice) * 100;
          if (drop > maxDrop) {
            maxDrop = drop;
            bestBuyPrice = buyPrice;
            bestSellPrice = sellPrice;
          }
        }
      }
    }

    if (maxDrop > 0) {
      const leverage = Math.min(100, Math.ceil(targetLoss / maxDrop));
      const lossPercent = maxDrop * leverage;
      
      bestScenario = {
        buyPrice: bestBuyPrice,
        sellPrice: bestSellPrice,
        leverage,
        profitPercent: -lossPercent, // Negative for loss
        naturalMovement: maxDrop,
        tradeType: 'long'
      };
    }
  } else {
    // Find the biggest price RISE for SHORT loss
    let maxRise = 0;
    let bestBuyPrice = 0;
    let bestSellPrice = 0;

    for (let sellIndex = 0; sellIndex < prices.length - 1; sellIndex++) {
      for (let buyIndex = sellIndex + 1; buyIndex < prices.length; buyIndex++) {
        const sellPrice = prices[sellIndex].price;
        const buyPrice = prices[buyIndex].price;
        
        if (buyPrice > sellPrice) {
          const rise = ((buyPrice - sellPrice) / sellPrice) * 100;
          if (rise > maxRise) {
            maxRise = rise;
            bestBuyPrice = buyPrice;
            bestSellPrice = sellPrice;
          }
        }
      }
    }

    if (maxRise > 0) {
      const leverage = Math.min(100, Math.ceil(targetLoss / maxRise));
      const lossPercent = maxRise * leverage;
      
      bestScenario = {
        buyPrice: bestBuyPrice,
        sellPrice: bestSellPrice,
        leverage,
        profitPercent: -lossPercent, // Negative for loss
        naturalMovement: maxRise,
        tradeType: 'short'
      };
    }
  }

  if (bestScenario) {
    console.log(`🎯 Best available loss: ${bestScenario.tradeType} ${bestScenario.leverage}x, ${bestScenario.profitPercent.toFixed(2)}% loss (natural: ${bestScenario.naturalMovement.toFixed(3)}%)`);
  }

  return bestScenario;
}
