FROM node:18-alpine

WORKDIR /app

# התקנת חבילות בסיסיות
RUN apk add --no-cache libc6-compat

# התקנת pnpm
RUN npm install -g pnpm

# העתקת קבצי הפרויקט
COPY package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/package.json

# התקנת חבילות
RUN pnpm install

# העתקת שאר הקבצים
COPY . .

# בניית האפליקציה
RUN pnpm --filter=web build

# הגדרת הרשאות
RUN chmod -R 755 /app

# פתיחת פורט
EXPOSE 3000

# הרצת השירות
CMD ["pnpm", "--filter=web", "start"] 