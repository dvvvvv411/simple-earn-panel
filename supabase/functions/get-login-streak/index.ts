import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📊 Calculating login streak for user: ${user.id}`);

    // Get all login dates for this user, ordered by date descending
    const { data: loginDates, error: queryError } = await supabaseClient
      .from('user_login_tracking')
      .select('login_date')
      .eq('user_id', user.id)
      .order('login_date', { ascending: false });

    if (queryError) {
      console.error('❌ Error fetching login dates:', queryError);
      throw queryError;
    }

    if (!loginDates || loginDates.length === 0) {
      console.log('ℹ️ No login history found');
      return new Response(
        JSON.stringify({ currentStreak: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate streak by going backwards from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Convert login dates to Date objects for comparison
    const loginDateSet = new Set(
      loginDates.map(d => {
        const date = new Date(d.login_date);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    console.log(`🔍 Checking streak starting from today: ${today.toISOString().split('T')[0]}`);
    console.log(`📅 Total login dates found: ${loginDateSet.size}`);

    // Count consecutive days backwards from today
    while (loginDateSet.has(checkDate.getTime())) {
      currentStreak++;
      console.log(`✅ Login found for: ${checkDate.toISOString().split('T')[0]}`);
      
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }

    console.log(`🎯 Final streak calculated: ${currentStreak} days`);

    return new Response(
      JSON.stringify({ currentStreak }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
