import { NextResponse } from 'next/server';
import { RedisClientType, createClient as createRedisClient } from 'redis';
import { headers } from 'next/headers';

// יצירת חיבור ל-Redis לקבלת עדכוני התקדמות
let redisClient: RedisClientType | null = null;

const getRedisClient = async () => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createRedisClient({ url: redisUrl });
    await redisClient.connect();
  }
  return redisClient;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scanId = searchParams.get('id');

  if (!scanId) {
    return NextResponse.json(
      { error: 'נדרש מזהה סריקה' },
      { status: 400 }
    );
  }

  try {
    const redis = await getRedisClient();
    const redisKey = `scan:progress:${scanId}`;
    const progressData = await redis.get(redisKey);

    if (!progressData) {
      return NextResponse.json(
        { error: 'לא נמצאו נתוני התקדמות' },
        { status: 404 }
      );
    }

    // החזרת נתוני ההתקדמות כ-JSON
    return NextResponse.json(JSON.parse(progressData));
  } catch (error) {
    console.error('שגיאה בקבלת נתוני התקדמות:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת בקבלת נתוני התקדמות' },
      { status: 500 }
    );
  }
}

// פונקציה זו מיועדת לעובדי מערכת (Workers) לעדכון סטטוס הסריקה
export async function POST(request: Request) {
  // בדיקת אימות API key
  const headersList = headers();
  const apiKey = headersList.get('x-api-key');
  
  if (!apiKey || apiKey !== process.env.WORKER_API_KEY) {
    return NextResponse.json(
      { error: 'אין הרשאה' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { scanId, progress } = body;

    if (!scanId || !progress) {
      return NextResponse.json(
        { error: 'חסרים נתונים נדרשים' },
        { status: 400 }
      );
    }

    // שמירת נתוני ההתקדמות ב-Redis
    const redis = await getRedisClient();
    const redisKey = `scan:progress:${scanId}`;
    await redis.set(redisKey, JSON.stringify(progress));

    // פרסום אירוע עדכון להודעה למנויים
    await redis.publish('scan:updates', JSON.stringify({
      scanId,
      type: 'progress_update',
      data: progress
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('שגיאה בעדכון התקדמות סריקה:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת בעדכון התקדמות סריקה' },
      { status: 500 }
    );
  }
} 