# מערכת ניהול אימונים רפואיים

מערכת ניהול ומעקב אחר ביצועי אימונים רפואיים במבנה צבאי - תומכת בעברית מלאה עם RTL, מותאמת למובייל, עם ניהול תפקידים וחריגים חכמים.

## 🎯 תכונות עיקריות

- **הזנת נתונים מהירה במובייל** - ממשק מותאם למובייל עם מקלדת מספרית וחישובים בזמן אמת
- **היררכיה ארגונית** - מגמה → פלוגה → מחלקה → כיתה → חייל
- **ניהול תפקידים** - מנהל מערכת, מ״פ, מ״מ, מכ״י עם הרשאות מבוססות RLS
- **מעקב אחר חריגים** - זיהוי אוטומטי של חיילים עם ביצועים נמוכים או חסר תרגול
- **ניתוחים וסטטיסטיקות** - דשבורדים מבוססי תפקיד עם מטריקות מפורטות
- **RTL מלא** - ממשק בעברית בלבד עם תמיכה מלאה ב-RTL

## 🛠️ טכנולוגיות

- **Frontend**: Next.js 16, TypeScript, TailwindCSS v4
- **Backend**: Supabase (Postgres + Auth + RLS)
- **Deployment**: Vercel
- **Authentication**: Supabase Auth (email/password)

## 📋 דרישות מקדימות

- Node.js 18+ ו-npm
- חשבון Supabase (חינם)
- חשבון Vercel (חינם, אופציונלי לפריסה)

## 🚀 התקנה מקומית

### 1. התקן תלויות

```bash
npm install
```

### 2. הגדר Supabase

1. צור פרויקט חדש ב-[Supabase](https://app.supabase.com)
2. המתן עד שהפרויקט יסיים להיבנות
3. עבור ל-Settings → API ושמור:
   - Project URL
   - anon/public key
   - service_role key (סודי!)

### 3. הרץ SQL Migrations

פתח את ה-SQL Editor בפאנל של Supabase והרץ את הקבצים בתיקיית `supabase/` **לפי הסדר**:

1. `01_schema.sql` - יצירת טבלאות
2. `02_rls_functions.sql` - פונקציות אבטחה
3. `03_rls_policies.sql` - מדיניות RLS
4. `04_indexes.sql` - אינדקסים לביצועים (**קריטי!**)
5. `05_seed_data.sql` - נתוני התחלה (סוגי אימונים)

ראה `supabase/README.md` לפרטים מלאים.

### 4. הגדר משתני סביבה

```bash
cp .env.example .env.local
```

ערוך את `.env.local` והזן את פרטי ה-Supabase שלך:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

### 5. צור משתמש מנהל ראשון

1. עבור ל-Authentication → Users ב-Supabase
2. לחץ "Add User" ← צור משתמש חדש עם אימייל/סיסמה
3. העתק את ה-UUID של המשתמש
4. הרץ ב-SQL Editor:

```sql
INSERT INTO user_profiles (user_id, role)
VALUES ('paste-user-uuid-here', 'system_admin');
```

### 6. הרץ בפיתוח

```bash
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000) והתחבר עם המשתמש שיצרת.

## 🌐 פריסה ל-Vercel

### אוטומטי (מומלץ)

1. התחבר ל-[Vercel](https://vercel.com)
2. Import את הפרויקט מ-Git
3. הוסף משתני סביבה:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

### CLI

```bash
npm install -g vercel
vercel --prod
```

## 👥 תפקידים והרשאות

### מנהל מערכת (System Admin)
- גישה לכל הנתונים
- יצירת מבנה ארגוני (מגמות, פלוגות, מחלקות, כיתות)
- יצירת משתמשי מ״פ ומ״מ

### מפקד פלוגה (MP / Company)
- גישה לכל המחלקות והכיתות בפלוגה
- הזנת נתונים
- צפייה בניתוחים וחריגים ברמת הפלוגה

### מפקד מחלקה (MM / Department)
- גישה לכל הכיתות במחלקה
- הזנת נתונים
- הוספת חיילים
- יצירת משתמשי מכ״י

### מכ״י (Class Leader)
- גישה רק לכיתה שלו
- הזנת נתונים
- הוספת חיילים לכיתה

## 📖 מבנה הפרויקט

```
soldier_training/
├── app/                     # Next.js App Router
│   ├── login/              # עמוד התחברות
│   ├── dashboard/          # דשבורד מבוסס תפקיד
│   ├── data-entry/        # הזנת נתונים
│   ├── soldiers/          # ניהול חיילים
│   └── api/               # API Routes
├── components/
│   ├── Common/            # רכיבים כלליים
│   ├── Layout/            # Header, Navigation
│   ├── Forms/             # טפסים
│   └── DataDisplay/       # תצוגת נתונים
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── auth.ts           # Auth helpers
│   ├── analytics.ts      # חישובי ניתוחים
│   └── constants.ts      # קבועים
├── supabase/              # SQL migrations
└── styles/
    └── globals.css       # Tailwind + RTL
```

## 🔒 אבטחה

- **Row Level Security (RLS)** מופעל על כל הטבלאות
- משתמשים רואים **רק** נתונים בהיקף שלהם
- Service role key **אף פעם** לא נחשף לדפדפן
- כל ה-mutations דרך Server Actions או API Routes

## 🚨 פתרון בעיות

### RLS לא עובד
- וודא ש-`02_rls_functions.sql` רץ לפני `03_rls_policies.sql`
- בדוק שיש רשומה ב-`user_profiles` למשתמש

### שאילתות איטיות
- וודא ש-`04_indexes.sql` רץ בהצלחה
- אינדקסים הם **קריטיים** לביצועים

### שגיאות build
- הרץ `npm run build` לבדיקה
- וודא שכל ה-types נכונים

## 📝 רישיון

MIT
