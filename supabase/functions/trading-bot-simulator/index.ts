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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bot_id, current_price }: TradeSimulation = await req.json();
    
    console.log(`Starting trade simulation for bot ${bot_id} at price ${current_price}`);

    // Simulate trade execution after random delay (30-60 minutes in reality, but 30-60 seconds for demo)
    const tradeDelayMs = Math.random() * (60000 - 30000) + 30000; // 30-60 seconds for demo
    console.log(`Trade will execute in ${tradeDelayMs / 1000} seconds`);

    // Schedule the trade execution
    setTimeout(async () => {
      await simulateTrade(bot_id, current_price);
    }, tradeDelayMs);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Trade simulation started for bot ${bot_id}`,
      estimated_execution_time: new Date(Date.now() + tradeDelayMs).toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in trading-bot-simulator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function simulateTrade(bot_id: string, entry_price: number) {
  try {
    console.log(`Executing trade for bot ${bot_id}`);

    // Get bot information
    const { data: bot, error: botError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('id', bot_id)
      .eq('status', 'active')
      .single();

    if (botError || !bot) {
      console.error('Bot not found or not active:', botError);
      return;
    }

    // Generate trade parameters
    const tradeType = Math.random() > 0.5 ? 'long' : 'short';
    const targetProfitPercentage = Math.random() * 2 + 1; // 1-3% profit
    const leverage = Math.random() * 9 + 1; // 1-10x leverage
    
    // Calculate realistic price movement
    const priceVariance = Math.random() * 0.02 - 0.01; // -1% to +1% natural movement
    const currentPrice = entry_price * (1 + priceVariance);
    
    // Calculate exit price based on trade type and desired profit
    let exitPrice: number;
    if (tradeType === 'long') {
      exitPrice = currentPrice * (1 + (targetProfitPercentage / 100) / leverage);
    } else {
      exitPrice = currentPrice * (1 - (targetProfitPercentage / 100) / leverage);
    }

    // Calculate profit amount
    const tradeAmount = bot.current_balance * 0.1; // Use 10% of balance per trade
    const actualProfitPercentage = tradeType === 'long' 
      ? ((exitPrice - currentPrice) / currentPrice) * 100 * leverage
      : ((currentPrice - exitPrice) / currentPrice) * 100 * leverage;
    
    const profitAmount = tradeAmount * (actualProfitPercentage / 100);
    const newBalance = bot.current_balance + profitAmount;

    console.log(`Trade details: ${tradeType} ${leverage}x leverage, Entry: ${currentPrice}, Exit: ${exitPrice}, Profit: ${actualProfitPercentage.toFixed(2)}%`);

    // Create trade record
    const { data: trade, error: tradeError } = await supabase
      .from('bot_trades')
      .insert({
        bot_id: bot_id,
        trade_type: tradeType,
        buy_price: tradeType === 'long' ? currentPrice : exitPrice,
        sell_price: tradeType === 'long' ? exitPrice : currentPrice,
        leverage: parseFloat(leverage.toFixed(2)),
        amount: parseFloat(tradeAmount.toFixed(2)),
        profit_amount: parseFloat(profitAmount.toFixed(2)),
        profit_percentage: parseFloat(actualProfitPercentage.toFixed(2)),
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating trade record:', tradeError);
      return;
    }

    // Update bot balance
    const { error: updateError } = await supabase
      .from('trading_bots')
      .update({ 
        current_balance: parseFloat(newBalance.toFixed(2)),
        updated_at: new Date().toISOString()
      })
      .eq('id', bot_id);

    if (updateError) {
      console.error('Error updating bot balance:', updateError);
      return;
    }

    console.log(`Trade completed successfully for bot ${bot_id}. New balance: ${newBalance.toFixed(2)}`);

    // Schedule next trade if bot is still active
    const { data: updatedBot } = await supabase
      .from('trading_bots')
      .select('status')
      .eq('id', bot_id)
      .single();

    if (updatedBot?.status === 'active') {
      // Schedule next trade in 30-60 minutes (for demo: 2-5 minutes)
      const nextTradeDelay = Math.random() * (300000 - 120000) + 120000; // 2-5 minutes for demo
      console.log(`Scheduling next trade in ${nextTradeDelay / 1000} seconds`);
      
      setTimeout(async () => {
        // Fetch current price (simulate price movement)
        const newCurrentPrice = exitPrice * (1 + (Math.random() * 0.04 - 0.02)); // ±2% movement
        await simulateTrade(bot_id, newCurrentPrice);
      }, nextTradeDelay);
    }

  } catch (error) {
    console.error('Error in simulateTrade:', error);
  }
}