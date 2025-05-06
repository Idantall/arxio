/** @type {import('next').NextConfig} */
const nextConfig = {
  // הגדרת התמיכה בexperimental בתוספים
  transpilePackages: ["@arxio/ui", "@arxio/types"],
  
  // הסרנו את תצורת i18n הישנה שאינה תואמת לגרסאות חדשות של Next.js
  // במקום זה, ניתן להשתמש ב-internationalization API של app router
  
  reactStrictMode: false,
  
  // מונע שגיאות לגבי תכונות HTML נוספות
  compiler: {
    // אפשרויות לדחיית אזהרות בזמן קומפילציה
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    removeConsole: process.env.NODE_ENV === 'production',
    // סובלנות לתכונות נוספות ב-HTML 
    styledComponents: true,
  },
  
  // התעלמות מחבילות בעייתיות בזמן בנייה
  webpack: (config, { isServer }) => {
    // הוספת תמיכה ב-argon2 וחבילות אחרות שעלולות לגרום לבעיות
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
      };
    }

    // התעלמות מקבצי HTML בתוך חבילות
    config.module.rules.push({
      test: /\.html$/,
      loader: 'ignore-loader'
    });

    return config;
  },
  // רשימת חבילות חיצוניות שעלינו לדלג עליהן
  experimental: {
    serverComponentsExternalPackages: ['@mapbox/node-pre-gyp', 'argon2'],
    // אפשור אי התאמה בין צד שרת וצד לקוח
    allowedAtomicPreload: false, // מונע אזהרות על טעינת סקריפטים
    optimizeServerReact: true, // אופטימיזציה של רינדור בצד שרת
    // מנטרל את אימות ההידרציה בסביבת פיתוח כדי למנוע את האזהרות
    suppressHydrationWarning: true,
  }
}

module.exports = nextConfig; 