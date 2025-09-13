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

    // Calculate profit amount - Use full start amount for single trade
    const tradeAmount = bot.start_amount; // Use 100% of start amount
    const actualProfitPercentage = tradeType === 'long' 
      ? ((exitPrice - currentPrice) / currentPrice) * 100 * leverage
      : ((currentPrice - exitPrice) / currentPrice) * 100 * leverage;
    
    const profitAmount = tradeAmount * (actualProfitPercentage / 100);
    const newBalance = bot.start_amount + profitAmount;

    console.log(`Trade details: ${tradeType} ${leverage.toFixed(1)}x leverage, Entry: ${currentPrice.toFixed(4)}, Exit: ${exitPrice.toFixed(4)}, Profit: ${actualProfitPercentage.toFixed(2)}%`);

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