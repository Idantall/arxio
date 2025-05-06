import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// יצירת חיבור ל-Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'חסרים פרטי התחברות ל-Supabase' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // בדיקה של מבנה הטבלה scan_queue
    const { data: scanQueueMetadata, error: scanQueueError } = await supabase
      .from('scan_queue')
      .select('*')
      .limit(1);

    if (scanQueueError) {
      console.error('שגיאה בקבלת מידע על טבלת scan_queue:', scanQueueError);
    }

    // בדיקה של מבנה הטבלה scans
    const { data: scansMetadata, error: scansError } = await supabase
      .from('scans')
      .select('*')
      .limit(1);

    if (scansError) {
      console.error('שגיאה בקבלת מידע על טבלת scans:', scansError);
    }

    // קבלת מידע על העמודות של הטבלאות
    const { data: tableInfo, error: tableInfoError } = await supabase
      .rpc('pgql', {
        query: `
          SELECT table_name, column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name IN ('scans', 'scan_queue')
          ORDER BY table_name, ordinal_position
        `
      });

    if (tableInfoError) {
      console.error('שגיאה בקבלת מידע על מבנה הטבלאות:', tableInfoError);
    }

    return NextResponse.json({
      scanQueueSample: scanQueueMetadata || [],
      scansSample: scansMetadata || [],
      tableStructure: tableInfo || []
    });
  } catch (error) {
    console.error('שגיאה בבדיקת מבנה טבלאות:', error);
    return NextResponse.json(
      { error: 'שגיאה בבדיקת מבנה טבלאות', details: String(error) },
      { status: 500 }
    );
  }
} 