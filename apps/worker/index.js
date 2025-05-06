/**
 * Worker ראשי למערכת הסריקות
 * מאזין לבקשות סריקה חדשות ומעביר אותן לסורקים המתאימים
 */

const Redis = require('redis');
const { promisify } = require('util');
const { randomUUID } = require('crypto');

// הגדרת רמת הלוג
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// יצירת מחלקת לוגר פשוטה
class Logger {
  constructor(name, level = LOG_LEVEL) {
    this.name = name;
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  _log(level, message, data) {
    if (this.levels[level] <= this.levels[this.level]) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        name: this.name,
        message
      };

      if (data) {
        logEntry.data = data;
      }

      console.log(JSON.stringify(logEntry));
    }
  }

  error(message, data) {
    this._log('error', message, data);
  }

  warn(message, data) {
    this._log('warn', message, data);
  }

  info(message, data) {
    this._log('info', message, data);
  }

  debug(message, data) {
    this._log('debug', message, data);
  }
}

const logger = new Logger('scan-worker');

// ניהול חיבור ל-Redis
class RedisManager {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;

    try {
      logger.info(`מתחבר לרדיס: ${this.redisUrl}`);
      
      // יצירת חיבור ללקוח רגיל
      this.client = Redis.createClient({ url: this.redisUrl });
      
      // יצירת חיבור ל-Subscriber
      this.subscriber = this.client.duplicate();
      
      // טיפול באירועי חיבור וניתוק
      this.client.on('connect', () => {
        logger.info('מחובר לרדיס');
        this.connected = true;
      });
      
      this.client.on('error', (err) => {
        logger.error('שגיאה בחיבור לרדיס', err);
        this.connected = false;
      });
      
      this.client.on('end', () => {
        logger.info('החיבור לרדיס נסגר');
        this.connected = false;
      });
      
      // פתיחת החיבורים
      await this.client.connect();
      await this.subscriber.connect();
      
      // Promisify methods
      this.getAsync = this.client.get.bind(this.client);
      this.setAsync = this.client.set.bind(this.client);
      this.publishAsync = this.client.publish.bind(this.client);
      
      logger.info('החיבור לרדיס הושלם בהצלחה');
    } catch (error) {
      logger.error('שגיאה ביצירת חיבור לרדיס', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.connected) return;

    try {
      await this.client.quit();
      await this.subscriber.quit();
      this.connected = false;
      logger.info('נותק מרדיס');
    } catch (error) {
      logger.error('שגיאה בניתוק מרדיס', error);
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          logger.error(`שגיאה בעיבוד הודעה מערוץ ${channel}`, error);
        }
      });
      
      logger.info(`נרשם לערוץ: ${channel}`);
    } catch (error) {
      logger.error(`שגיאה ברישום לערוץ ${channel}`, error);
    }
  }

  async publish(channel, data) {
    try {
      await this.publishAsync(channel, JSON.stringify(data));
    } catch (error) {
      logger.error(`שגיאה בפרסום לערוץ ${channel}`, error);
    }
  }

  async updateScanProgress(scanId, status, message, progress = null) {
    try {
      const progressKey = `scan:progress:${scanId}`;
      
      // קריאת המידע הקיים
      const currentDataStr = await this.getAsync(progressKey);
      let progressData = {};
      
      if (currentDataStr) {
        progressData = JSON.parse(currentDataStr);
      } else {
        progressData = {
          scanId,
          status: 'running',
          steps: [],
          overallProgress: 0,
          logs: []
        };
      }
      
      // הוספת לוג חדש
      const timestamp = new Date().toISOString();
      progressData.logs.push({
        timestamp,
        level: 'info',
        message
      });
      
      // עדכון סטטוס והתקדמות
      if (status) {
        progressData.status = status;
      }
      
      if (progress !== null) {
        progressData.overallProgress = progress;
      }
      
      // שמירת הנתונים המעודכנים
      await this.setAsync(progressKey, JSON.stringify(progressData));
      
      logger.debug(`עודכנה התקדמות סריקה ${scanId}: ${message}, התקדמות: ${progress}`);
    } catch (error) {
      logger.error(`שגיאה בעדכון התקדמות סריקה ${scanId}`, error);
    }
  }
}

// מנהל הסריקות הראשי
class ScanManager {
  constructor() {
    this.redis = new RedisManager();
    this.activeScans = new Map();
  }

  async initialize() {
    try {
      // התחברות לרדיס
      await this.redis.connect();
      
      // הרשמה לבקשות סריקה חדשות
      await this.redis.subscribe('scan:requests', this.handleScanRequest.bind(this));
      
      // הרשמה לעדכוני סטטוס מהסורקים
      await this.redis.subscribe('scan:status', this.handleScanStatus.bind(this));
      
      logger.info('מנהל הסריקות אותחל בהצלחה');
    } catch (error) {
      logger.error('שגיאה באתחול מנהל הסריקות', error);
    }
  }

  async handleScanRequest(data) {
    try {
      logger.info('התקבלה בקשת סריקה חדשה', data);
      
      const { action, scanId, scanType, target, parameters } = data;
      
      if (action !== 'start_scan') {
        logger.warn(`פעולה לא נתמכת: ${action}`);
        return;
      }
      
      if (!scanId || !scanType || !target) {
        logger.error('נתוני סריקה חסרים', data);
        await this.updateScanError(scanId, 'נתוני סריקה חסרים');
        return;
      }
      
      // שמירת הסריקה הפעילה
      this.activeScans.set(scanId, {
        scanId,
        scanType,
        target,
        parameters,
        startTime: new Date().toISOString(),
        status: 'initializing'
      });
      
      // עדכון התקדמות ראשוני
      await this.redis.updateScanProgress(
        scanId,
        'initializing',
        `מאתחל סריקת ${scanType}`,
        5
      );
      
      // העברת הבקשה לסורק המתאים
      switch (scanType.toUpperCase()) {
        case 'SAST':
          await this.forwardToScanner(scanId, 'sast', data);
          break;
        case 'DAST':
          await this.forwardToScanner(scanId, 'dast', data);
          break;
        case 'API':
          await this.forwardToScanner(scanId, 'api', data);
          break;
        default:
          logger.error(`סוג סריקה לא נתמך: ${scanType}`);
          await this.updateScanError(scanId, `סוג סריקה לא נתמך: ${scanType}`);
      }
    } catch (error) {
      logger.error('שגיאה בטיפול בבקשת סריקה', error);
      if (data && data.scanId) {
        await this.updateScanError(data.scanId, 'שגיאה פנימית בטיפול בבקשת הסריקה');
      }
    }
  }

  async handleScanStatus(data) {
    try {
      const { scanId, status, message, progress } = data;
      
      if (!scanId) {
        logger.warn('התקבלה הודעת סטטוס ללא מזהה סריקה', data);
        return;
      }
      
      // עדכון סטטוס הסריקה
      const scan = this.activeScans.get(scanId);
      
      if (scan) {
        scan.status = status;
        
        if (status === 'completed' || status === 'error') {
          scan.completedAt = new Date().toISOString();
          this.activeScans.delete(scanId);
        }
      }
      
      // עדכון התקדמות
      await this.redis.updateScanProgress(scanId, status, message, progress);
      
      logger.info(`עדכון סטטוס סריקה ${scanId}: ${status}, ${message}`);
    } catch (error) {
      logger.error('שגיאה בטיפול בעדכון סטטוס סריקה', error);
    }
  }

  async forwardToScanner(scanId, scannerType, data) {
    try {
      // פרסום בקשת הסריקה לערוץ הספציפי
      const message = `העברת בקשת סריקה ${scanId} לסורק ${scannerType}`;
      logger.info(message);
      
      // עדכון התקדמות
      await this.redis.updateScanProgress(scanId, 'queued', message, 10);
      
      // פרסום בקשת הסריקה
      await this.redis.publish('scan:requests', data);
    } catch (error) {
      logger.error(`שגיאה בהעברת בקשת סריקה לסורק ${scannerType}`, error);
      await this.updateScanError(scanId, `שגיאה בהעברת בקשת סריקה לסורק ${scannerType}`);
    }
  }

  async updateScanError(scanId, errorMessage) {
    try {
      if (!scanId) return;
      
      logger.error(`שגיאה בסריקה ${scanId}: ${errorMessage}`);
      
      // עדכון סטטוס שגיאה
      await this.redis.updateScanProgress(scanId, 'error', errorMessage, 0);
      
      // הסרת הסריקה מהמעקב
      this.activeScans.delete(scanId);
    } catch (error) {
      logger.error(`שגיאה בעדכון סטטוס שגיאה לסריקה ${scanId}`, error);
    }
  }
}

// פונקציה ראשית להפעלת השירות
async function main() {
  try {
    logger.info('מאתחל שירות סריקות...');
    const scanManager = new ScanManager();
    await scanManager.initialize();
    logger.info('שירות סריקות פעיל ומאזין לבקשות חדשות');
    
    // טיפול בסיום תהליך
    process.on('SIGINT', async () => {
      logger.info('קבלת אות SIGINT, סוגר חיבורים...');
      await scanManager.redis.disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('קבלת אות SIGTERM, סוגר חיבורים...');
      await scanManager.redis.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('שגיאה באתחול שירות הסריקות', error);
    process.exit(1);
  }
}

// הפעלת השירות
main(); 