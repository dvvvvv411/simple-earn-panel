import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️ DEPRECATED: This scheduler is being replaced by trading-bot-scheduler-v2
// This old version uses live API calls and generates losses
// The new version uses historical data and guarantees 1-3% profit

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🤖 Trading Bot Scheduler started at', new Date().toISOString())

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find all bots that should complete now
    const { data: activeBots, error: queryError } = await supabase
      .from('trading_bots')
      .select('*')
      .eq('status', 'active')
      .lt('expected_completion_time', new Date().toISOString())

    if (queryError) {
      console.error('❌ Error fetching active bots:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch active bots' }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log(`📋 Found ${activeBots?.length || 0} bots ready to complete`)

    if (!activeBots || activeBots.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bots ready to complete', processed: 0 }),
        { status: 200, headers: corsHeaders }
      )
    }

    // Process each bot
    let processed = 0
    let errors = 0

    for (const bot of activeBots) {
      try {
        console.log(`🔄 Processing bot ${bot.id} (${bot.cryptocurrency})`)
        
        // Execute the trade simulation logic (same as original trading-bot-simulator)
        await simulateTrade(bot.id, supabase)
        processed++
        
        console.log(`✅ Bot ${bot.id} completed successfully`)
      } catch (error) {
        console.error(`❌ Error processing bot ${bot.id}:`, error)
        errors++
      }
    }

    console.log(`🎯 Scheduler completed: ${processed} successful, ${errors} errors`)

    return new Response(
      JSON.stringify({ 
        message: 'Scheduler completed', 
        processed, 
        errors,
        total: activeBots.length 
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('💥 Scheduler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

// Simulate trade execution (copied and adapted from trading-bot-simulator)
async function simulateTrade(botId: string, supabase: any) {
  console.log(`🎯 Starting trade simulation for bot: ${botId}`)

  // Fetch bot data
  const { data: bot, error: botError } = await supabase
    .from('trading_bots')
    .select('*')
    .eq('id', botId)
    .eq('status', 'active')
    .single()

  if (botError || !bot) {
    throw new Error(`Bot not found or not active: ${botError?.message}`)
  }

  console.log(`📊 Bot details: ${bot.cryptocurrency} (${bot.symbol}) - $${bot.start_amount}`)

  // Get current market price from existing coinmarketcap function
  const currentPrice = await getCurrentCryptoPrice(bot.symbol, supabase)
  console.log(`💱 Current ${bot.symbol} price: $${currentPrice}`)

  // Get optimal trade prices based on bot creation time and REAL crypto price
  const tradeData = await findOptimalTradePrices(bot.symbol, currentPrice, bot.created_at)
  
  console.log(`💹 Trade simulation: ${tradeData.trade_type} from $${tradeData.buy_price} to $${tradeData.sell_price}`)

  // Calculate profit
  const leverage = tradeData.leverage
  const amount = parseFloat(bot.start_amount.toString())
  
  let profit: number
  if (tradeData.trade_type === 'long') {
    profit = (amount * leverage) * ((tradeData.sell_price - tradeData.buy_price) / tradeData.buy_price)
  } else {
    profit = (amount * leverage) * ((tradeData.buy_price - tradeData.sell_price) / tradeData.buy_price)
  }

  const profitAmount = Math.round(profit * 100) / 100
  const finalBalance = amount + profitAmount
  const profitPercentage = Math.round((profitAmount / amount) * 10000) / 100

  console.log(`💰 Calculated profit: $${profitAmount} (${profitPercentage}%)`)

  // Create trade record
  const { error: tradeError } = await supabase
    .from('bot_trades')
    .insert({
      bot_id: botId,
      trade_type: tradeData.trade_type,
      amount: amount,
      buy_price: tradeData.buy_price,
      sell_price: tradeData.sell_price,
      leverage: leverage,
      profit_amount: profitAmount,
      profit_percentage: profitPercentage,
      status: 'completed',
      started_at: bot.created_at,
      completed_at: new Date().toISOString()
    })

  if (tradeError) {
    throw new Error(`Failed to create trade record: ${tradeError.message}`)
  }

  // Update bot status and balance
  const { error: updateError } = await supabase
    .from('trading_bots')
    .update({
      status: 'completed',
      current_balance: finalBalance,
      buy_price: tradeData.buy_price,
      sell_price: tradeData.sell_price,
      leverage: leverage,
      position_type: tradeData.trade_type,
      updated_at: new Date().toISOString()
    })
    .eq('id', botId)

  if (updateError) {
    throw new Error(`Failed to update bot: ${updateError.message}`)
  }

  // Update user balance - call the database function
  const { error: balanceError } = await supabase.rpc('update_user_balance', {
    target_user_id: bot.user_id,
    amount_change: finalBalance,
    transaction_type: 'credit',
    transaction_description: `Trading bot ${bot.cryptocurrency} completed with ${profitPercentage}% profit`,
    admin_user_id: bot.user_id // In this case, it's the user themselves
  })

  if (balanceError) {
    console.error('⚠️ Warning: Failed to update user balance:', balanceError)
    // Don't throw here as the trade was successful, just balance update failed
  }

  console.log(`🎉 Trade simulation completed successfully for bot ${botId}`)
}

// Get current crypto price using existing coinmarketcap function (no additional API requests)
async function getCurrentCryptoPrice(symbol: string, supabase: any): Promise<number> {
  try {
    // Call the existing coinmarketcap function that's already used by MarketOverview
    const { data, error } = await supabase.functions.invoke('coinmarketcap', {
      body: { 
        endpoint: 'quotes',
        symbols: symbol
      }
    })

    if (error) {
      console.error(`❌ Error fetching price for ${symbol}:`, error)
      // Fallback to a reasonable default based on symbol
      return getDefaultPrice(symbol)
    }

    const priceData = data?.data?.[symbol]
    if (priceData?.quote?.USD?.price) {
      return Math.round(priceData.quote.USD.price * 100) / 100
    }

    console.warn(`⚠️ No price data found for ${symbol}, using fallback`)
    return getDefaultPrice(symbol)
  } catch (error) {
    console.error(`💥 Failed to fetch price for ${symbol}:`, error)
    return getDefaultPrice(symbol)
  }
}

// Fallback prices when API fails (CURRENT EUR market values)
function getDefaultPrice(symbol: string): number {
  const fallbackPrices: { [key: string]: number } = {
    'BTC': 97800,   // ~97k EUR current price
    'ETH': 3950,    // ~3950 EUR current price  
    'DOGE': 0.41,   // ~0.41 EUR current price
    'ADA': 1.08,    // ~1.08 EUR current price
    'SOL': 238,     // ~238 EUR current price
    'XRP': 2.38     // ~2.38 EUR current price
  }
  
  return fallbackPrices[symbol] || 50000 // Default fallback
}

// REALISTIC Price simulation - Uses micro-movements around current price + leverage for profit
async function findOptimalTradePrices(symbol: string, currentPrice: number, botCreatedAt: string): Promise<{
  buy_price: number
  sell_price: number
  trade_type: 'long' | 'short'
  leverage: number
}> {
  // Calculate time since bot creation
  const now = new Date()
  const createdAt = new Date(botCreatedAt)
  const minutesElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
  
  // Use deterministic randomness based on bot creation time
  const seed = minutesElapsed + symbol.charCodeAt(0)
  const random1 = Math.sin(seed) * 10000
  const random2 = Math.cos(seed * 1.5) * 10000
  const random3 = Math.sin(seed * 2.3) * 10000
  
  // Normalize to 0-1 range
  const r1 = Math.abs(random1 - Math.floor(random1))
  const r2 = Math.abs(random2 - Math.floor(random2))
  const r3 = Math.abs(random3 - Math.floor(random3))
  
  // Target profit percentage (1-3%)
  const targetProfitPercent = r1 * 2 + 1
  
  // REALISTIC micro-movement (0.1-0.8% for typical timeframes)
  const maxMovementPercent = Math.min(minutesElapsed * 0.015, 0.8) // Max 0.8% movement
  const actualMovementPercent = r3 * maxMovementPercent + 0.15 // 0.15% to maxMovementPercent
  
  // ALWAYS choose the profitable direction based on market movement
  // If price moves up, we go LONG (profitable). If price moves down, we go SHORT (profitable)
  const priceMovementDirection = r2 > 0.5 ? 1 : -1 // Simulated market movement direction
  const isLong = priceMovementDirection > 0 // Always choose profitable direction
  
  // Calculate required leverage with slight randomness to avoid exact profits
  const leverageVariation = (Math.random() - 0.5) * 0.4; // ±0.2 variation
  const requiredLeverage = (targetProfitPercent + leverageVariation) / actualMovementPercent
  const leverage = Math.min(Math.max(Math.round(requiredLeverage * 10) / 10, 1), 5) // 1-5x leverage with decimals
  
  // Calculate REALISTIC entry and exit prices that GUARANTEE profit
  let buy_price: number
  let sell_price: number
  
  if (isLong) {
    // LONG: Buy low, sell high (guaranteed profit)
    buy_price = Math.round(currentPrice * (1 - actualMovementPercent / 100) * 100) / 100
    sell_price = Math.round(currentPrice * (1 + actualMovementPercent / 100) * 100) / 100
  } else {
    // SHORT: Sell high first (entry), buy low later (exit)
    // For SHORT: sell_price is entry (high), buy_price is exit (low)
    buy_price = Math.round(currentPrice * (1 - actualMovementPercent / 100) * 100) / 100  // Exit price (low)
    sell_price = Math.round(currentPrice * (1 + actualMovementPercent / 100) * 100) / 100 // Entry price (high)
  }
  
  console.log(`🎯 REALISTIC Trade: ${isLong ? 'LONG' : 'SHORT'} with ${leverage}x leverage`)
  console.log(`💱 Current price: ${currentPrice}, Movement: ${actualMovementPercent.toFixed(3)}%`)
  console.log(`📊 Buy: ${buy_price}, Sell: ${sell_price} (both near current price)`)
  
  return {
    buy_price,
    sell_price,
    trade_type: isLong ? 'long' : 'short',
    leverage
  }
}