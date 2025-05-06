import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { supabaseAdmin } from '../../../../lib/supabase';
import { authConfig } from '../../../../lib/auth';

export async function GET() {
  try {
    // קבלת פרטי המשתמש המחובר
    const session = await getServerSession(authConfig);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'משתמש לא מאומת' 
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // קבלת נתוני המשתמש והתוכנית שלו מ-Supabase
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, plan, created_at, updated_at')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('שגיאה בקבלת נתוני משתמש:', userError?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'שגיאה בקבלת נתוני משתמש'
      }, { status: 500 });
    }
    
    // קבלת תאריך הפקיעה של התוכנית (אם קיים)
    let subscriptionData = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('expires_at')
        .eq('user_id', userId)
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error) {
        subscriptionData = data;
      }
    } catch (e) {
      // לא נחשב לשגיאה אם אין מנוי
      console.log('אין מידע על מנוי למשתמש זה');
    }
    
    // קבלת מספר הסריקות בחודש הנוכחי
    const currentMonth = new Date().toISOString().slice(0, 7); // פורמט YYYY-MM
    const firstDayOfMonth = `${currentMonth}-01T00:00:00Z`;
    
    const { count: scansThisMonth } = await supabaseAdmin
      .from('scans')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth);
    
    // קבלת מספר הסריקות הפעילות כעת
    const { count: activeScans } = await supabaseAdmin
      .from('scans')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['running', 'pending', 'initializing']);
    
    // קבלת מספר הסריקות הכולל
    const { count: totalScans } = await supabaseAdmin
      .from('scans')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    
    // חישוב תאריך פקיעה ממותק (אם קיים)
    let formattedExpiryDate = null;
    if (subscriptionData?.expires_at) {
      const expiryDate = new Date(subscriptionData.expires_at);
      formattedExpiryDate = expiryDate.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    return NextResponse.json({
      success: true,
      plan: userData.plan || 'free',
      planExpiry: formattedExpiryDate,
      scansThisMonth: scansThisMonth || 0,
      activeScans: activeScans || 0,
      totalScans: totalScans || 0,
      userId,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('שגיאה בקבלת נתוני תוכנית:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'שגיאה בעיבוד הבקשה',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 