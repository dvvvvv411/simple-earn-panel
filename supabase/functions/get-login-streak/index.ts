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

    // Helper function to format date as YYYY-MM-DD
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // Helper function to get German day name
    const getDayName = (date: Date): string => {
      const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      return days[date.getDay()];
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    if (!loginDates || loginDates.length === 0) {
      console.log('ℹ️ No login history found');
      // Return empty streak data
      const streakDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        streakDays.push({
          dayNumber: i + 1,
          date: null,
          dayName: getDayName(date),
          isLoggedIn: false,
          isToday: i === 0,
          grantsFreeBot: (i + 1) === 3 || (i + 1) === 6,
          loginDayNumber: 0,
        });
      }
      
      return new Response(
        JSON.stringify({ 
          currentStreak: 0,
          streakDays,
          currentDayInCycle: 0,
          newFreeBotEarned: false,
          isNewLogin: false,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Convert login dates to Set for fast lookup
    const loginDateSet = new Set(loginDates.map(d => d.login_date));

    // Calculate streak by going backwards from today
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (loginDateSet.has(formatDate(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    console.log(`🎯 Current streak: ${currentStreak} days`);

    // Build 7-day streak window
    // The window shows the current 7-day cycle based on streak position
    const streakDays = [];
    const cyclePosition = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : 0;
    
    // Calculate streak start date (first day of current streak)
    const streakStartDate = new Date(today);
    streakStartDate.setDate(streakStartDate.getDate() - (currentStreak - 1));

    // Build the 7-day window showing the current cycle
    for (let i = 0; i < 7; i++) {
      const dayNumber = i + 1;
      const date = new Date(streakStartDate);
      date.setDate(date.getDate() + i);
      const dateStr = formatDate(date);
      const isLoggedIn = loginDateSet.has(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = date > today;
      
      // Calculate which login day this is within the streak
      // Only count if logged in and not in the future
      let loginDayNumber = 0;
      if (isLoggedIn && !isFuture) {
        // Count consecutive logins up to this date
        let count = 0;
        for (let j = 0; j <= i; j++) {
          const checkDateForCount = new Date(streakStartDate);
          checkDateForCount.setDate(checkDateForCount.getDate() + j);
          if (loginDateSet.has(formatDate(checkDateForCount))) {
            count++;
          }
        }
        loginDayNumber = count;
      }

      streakDays.push({
        dayNumber,
        date: isLoggedIn ? dateStr : null,
        dayName: getDayName(date),
        isLoggedIn: isLoggedIn && !isFuture,
        isToday,
        isFuture,
        grantsFreeBot: dayNumber === 3 || dayNumber === 6,
        loginDayNumber: isLoggedIn && !isFuture ? dayNumber : 0,
      });
    }

    // Check if today is a new login (first time today)
    const isNewLogin = loginDateSet.has(todayStr);
    
    // Check if a new free bot was earned today
    const newFreeBotEarned = isNewLogin && (cyclePosition === 3 || cyclePosition === 6);

    console.log(`📅 Streak days calculated, cycle position: ${cyclePosition}, new free bot: ${newFreeBotEarned}`);

    return new Response(
      JSON.stringify({ 
        currentStreak,
        streakDays,
        currentDayInCycle: cyclePosition,
        newFreeBotEarned,
        isNewLogin,
      }),
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
