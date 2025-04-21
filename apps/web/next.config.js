/** @type {import('next').NextConfig} */
const nextConfig = {
  // הגדרת התמיכה בexperimental בתוספים
  transpilePackages: ["@arxio/ui", "@arxio/types"],
  
  // הסרנו את תצורת i18n הישנה שאינה תואמת לגרסאות חדשות של Next.js
  // במקום זה, ניתן להשתמש ב-internationalization API של app router
  
  reactStrictMode: true,
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
    serverComponentsExternalPackages: ['@mapbox/node-pre-gyp', 'argon2']
  }
}

module.exports = nextConfig; 