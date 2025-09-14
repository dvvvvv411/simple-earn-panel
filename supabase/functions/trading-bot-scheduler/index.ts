import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface TradingBot {
  id: string;
  user_id: string;
  cryptocurrency: string;
  symbol: string;
  start_amount: number;
  current_balance: number;
  leverage: number;
  expected_completion_time: string;
  created_at: string;
}

Deno.serve(async (req) => {
  console.log('🤖 Trading bot scheduler started');
  console.log(`📨 Request method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Reading request body...');
    const body = await req.json();
    console.log(`📊 Request body:`, JSON.stringify(body, null, 2));

    // Find bots that are ready to complete
    console.log('🔍 Searching for bots ready to complete...');
    const { data: readyBots, error: fetchError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('status', 'active')
      .lte('expected_completion_time', new Date().toISOString());

    if (fetchError) {
      console.error('❌ Error fetching ready bots:', fetchError);
      throw fetchError;
    }

    console.log(`📈 Found ${readyBots?.length || 0} bots ready to complete`);

    if (!readyBots || readyBots.length === 0) {
      console.log('✅ No bots ready to complete at this time');
      return new Response(
        JSON.stringify({ message: 'No bots ready to complete', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    
    // Process each ready bot
    for (const bot of readyBots as TradingBot[]) {
      try {
        console.log(`🎯 Processing bot ${bot.id} for ${bot.cryptocurrency}`);
        await simulateTrade(bot);
        processedCount++;
        console.log(`✅ Successfully completed bot ${bot.id}`);
      } catch (error) {
        console.error(`❌ Failed to process bot ${bot.id}:`, error);
      }
    }

    console.log(`🎉 Scheduler completed! Processed ${processedCount}/${readyBots.length} bots`);

    return new Response(
      JSON.stringify({ 
        message: 'Scheduler run completed', 
        processed: processedCount,
        total: readyBots.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in trading bot scheduler:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function simulateTrade(bot: TradingBot) {
  console.log(`🔄 Starting trade simulation for bot ${bot.id}`);
  
  try {
    // Calculate market movement based on bot age
    const botAge = Date.now() - new Date(bot.created_at).getTime();
    const ageHours = botAge / (1000 * 60 * 60);
    
    // Determine trade type and market movement
    const tradeType = Math.random() > 0.5 ? 'long' : 'short';
    let marketMovementPercent = (Math.random() * 10 - 5); // -5% to +5%
    
    // Add slight bias based on bot age for realism
    if (ageHours > 0.5) {
      marketMovementPercent += (Math.random() - 0.5) * 2;
    }
    
    console.log(`📊 Trade type: ${tradeType}, Market movement: ${marketMovementPercent.toFixed(2)}%`);
    
    // Calculate required leverage for good profit
    const targetProfitPercent = Math.random() * 15 + 5; // 5-20% profit
    const requiredLeverage = Math.max(1, Math.ceil(targetProfitPercent / Math.abs(marketMovementPercent)));
    const effectiveLeverage = Math.min(requiredLeverage, bot.leverage || 1);
    
    console.log(`⚡ Target profit: ${targetProfitPercent.toFixed(2)}%, Effective leverage: ${effectiveLeverage}x`);
    
    // Simulate entry and exit prices
    const basePrice = 100; // Normalized base price
    const entryPrice = basePrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% variation
    
    let exitPrice: number;
    if (tradeType === 'long') {
      exitPrice = entryPrice * (1 + marketMovementPercent / 100);
    } else {
      exitPrice = entryPrice * (1 - marketMovementPercent / 100);
    }
    
    // Calculate trade amount and profit
    const tradeAmount = bot.start_amount;
    let profitPercent: number;
    
    if (tradeType === 'long') {
      profitPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * effectiveLeverage;
    } else {
      profitPercent = ((entryPrice - exitPrice) / entryPrice) * 100 * effectiveLeverage;
    }
    
    const profitAmount = (tradeAmount * profitPercent) / 100;
    const finalBalance = tradeAmount + profitAmount;
    
    console.log(`💰 Entry: ${entryPrice.toFixed(4)}, Exit: ${exitPrice.toFixed(4)}`);
    console.log(`📈 Profit: ${profitPercent.toFixed(2)}% (${profitAmount.toFixed(2)})`);
    console.log(`💵 Final balance: ${finalBalance.toFixed(2)}`);
    
    // Insert trade record
    const { error: tradeError } = await supabase
      .from('bot_trades')
      .insert({
        bot_id: bot.id,
        trade_type: tradeType,
        buy_price: tradeType === 'long' ? entryPrice : exitPrice,
        sell_price: tradeType === 'long' ? exitPrice : entryPrice,
        amount: tradeAmount,
        leverage: effectiveLeverage,
        profit_percentage: profitPercent,
        profit_amount: profitAmount,
        status: 'completed',
        started_at: new Date(bot.created_at).toISOString(),
        completed_at: new Date().toISOString()
      });
    
    if (tradeError) {
      console.error('❌ Error inserting trade record:', tradeError);
      throw tradeError;
    }
    
    // Update bot status and balance
    const { error: botUpdateError } = await supabase
      .from('trading_bots')
      .update({
        status: 'completed',
        current_balance: finalBalance,
        buy_price: tradeType === 'long' ? entryPrice : exitPrice,
        sell_price: tradeType === 'long' ? exitPrice : entryPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', bot.id);
    
    if (botUpdateError) {
      console.error('❌ Error updating bot:', botUpdateError);
      throw botUpdateError;
    }
    
    // Update user balance
    try {
      console.log(`💳 Updating user balance for user ${bot.user_id}`);
      const { error: balanceError } = await supabase.rpc('update_user_balance', {
        target_user_id: bot.user_id,
        amount_change: finalBalance,
        transaction_type: 'credit',
        transaction_description: `Trading bot ${bot.cryptocurrency} completed with ${profitPercent.toFixed(2)}% profit`,
        admin_user_id: bot.user_id // Self-credit for bot completion
      });
      
      if (balanceError) {
        console.error('❌ Error updating user balance:', balanceError);
        // Don't throw here - bot trade is still recorded
        console.log('⚠️ Bot trade completed but balance update failed');
      } else {
        console.log('✅ User balance updated successfully');
      }
    } catch (balanceError) {
      console.error('❌ Exception updating user balance:', balanceError);
      // Continue - trade is still valid
    }
    
    console.log(`🎉 Trade simulation completed successfully for bot ${bot.id}`);
    
  } catch (error) {
    console.error(`💥 Error in trade simulation for bot ${bot.id}:`, error);
    
    // Mark bot as completed even if there was an error to prevent infinite retries
    try {
      await supabase
        .from('trading_bots')
        .update({
          status: 'completed',
          current_balance: bot.start_amount, // Return original amount on error
          updated_at: new Date().toISOString()
        })
        .eq('id', bot.id);
    } catch (updateError) {
      console.error('❌ Failed to mark failed bot as completed:', updateError);
    }
    
    throw error;
  }
}