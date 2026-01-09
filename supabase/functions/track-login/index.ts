import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`📊 Tracking login for user: ${user.id} on ${todayStr}`);

    // Check if already logged in today
    const { data: existingLogin } = await supabaseClient
      .from('user_login_tracking')
      .select('id')
      .eq('user_id', user.id)
      .eq('login_date', todayStr)
      .single();

    if (existingLogin) {
      console.log(`✅ User ${user.id} already tracked for today`);
      return new Response(
        JSON.stringify({ 
          message: 'Login already tracked for today',
          isNewLogin: false,
          newFreeBotEarned: false,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert login tracking record
    const { error } = await supabaseClient
      .from('user_login_tracking')
      .insert([{ user_id: user.id, login_date: todayStr }]);

    if (error) {
      // Check if it's a unique constraint violation (race condition)
      if (error.code === '23505') {
        console.log(`✅ User ${user.id} already tracked for today (race condition)`);
        return new Response(
          JSON.stringify({ 
            message: 'Login already tracked for today',
            isNewLogin: false,
            newFreeBotEarned: false,
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.error('Error tracking login:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Login tracked successfully for user: ${user.id}`);

    // Now calculate if this login grants a free bot
    // Get all login dates to calculate current streak
    const { data: loginDates } = await supabaseClient
      .from('user_login_tracking')
      .select('login_date')
      .eq('user_id', user.id)
      .order('login_date', { ascending: false });

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (loginDates && loginDates.length > 0) {
      const loginDateSet = new Set(loginDates.map(d => d.login_date));
      let checkDate = new Date(today);
      
      while (loginDateSet.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate position in 7-day cycle (1-7)
    const cyclePosition = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : 0;
    
    // Check if this is day 3 or 6 in the cycle = free bot day!
    const isFreeBotDay = cyclePosition === 3 || cyclePosition === 6;
    let newFreeBotEarned = false;

    if (isFreeBotDay) {
      console.log(`🎁 Free Bot day! User ${user.id} is on cycle position ${cyclePosition}`);
      
      // Use service role client to update free_bots
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: updateError } = await serviceClient
        .from('profiles')
        .update({ free_bots: serviceClient.rpc('increment', { x: 1 }) })
        .eq('id', user.id);

      // Alternative: direct increment using raw SQL
      const { error: rpcError } = await serviceClient.rpc('update_user_free_bots', {
        target_user_id: user.id,
        amount_change: 1,
        operation_type: 'add'
      });

      if (rpcError) {
        console.error('Error granting free bot:', rpcError);
      } else {
        newFreeBotEarned = true;
        console.log(`✅ Free bot granted to user ${user.id}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Login tracked successfully',
        isNewLogin: true,
        currentStreak,
        cyclePosition,
        newFreeBotEarned,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in track-login function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
