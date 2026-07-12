-- מעבר התוסף moddatetime מ-public ל-schema extensions (advisor extension_in_public)
-- why: Supabase ממליץ להחזיק תוספים ב-schema ייעודי `extensions` ולא ב-`public` — מפריד
-- את התוסף מהאובייקטים של האפליקציה ומקטין משטח-חשיפה ב-API. הכרעת-ישי (10/07): לבצע —
-- לא שובר כלום ולא מסבך: 11 הטריגרים (_set_updated_at) נקשרים ל-OID של הפונקציה, לא לשם/schema,
-- ולכן נשארים תקינים אחרי המעבר, בלי drop/recreate. הפיך טריוויאלית (set schema public).
-- הערה: התוסף הותקן ב-public במיגרציה 20260710160735; זו מיגרציית fix-forward.
alter extension moddatetime set schema extensions;
