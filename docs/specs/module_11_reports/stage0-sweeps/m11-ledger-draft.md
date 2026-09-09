# Module 11 (Reports) — Stage 0 Atomic Requirement Ledger

Extracted mechanically from:
- `docs/specs/module_11_reports/research/reports-architecture-draft-v3.1.md` (973 lines) — read in full.
- `docs/specs/module_11_reports/research/review-2026-09-06.md` (319 lines) — read in full.

This is extraction only — no ruling, no recommendation, no scope judgment.

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|

### draft §1 — principles

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 1 | "הימנעות מוחלטת מ-Over-engineering... המערכת מנצלת את כוח המחשוב הקיים ב-PostgreSQL ובדפדפן" — לא שרתי Python/ML | draft §1 principle 1 | data-requirement | — |
| 2 | "כל הנתונים הפיננסיים נשאבים ישירות מפונקציית השרת המאומתת finance_project_money... שום מספר אינו מחושב מחדש בצד הלקוח" | draft §1 principle 2 | data-requirement | — |
| 3 | "תובנות החיזוי... מוזרקות ישירות למסכי העבודה השוטפים (מסך שיבוץ דיילות, עריכת הצעת מחיר, ומסך הגבייה)" ולא נשארות רק בלשונית דוחות | draft §1 principle 3 | UI-element | — |
| 4 | "מודל השפה (Google Gemini) אינו מחשב מתמטיקה או כספים... מבצע סינתזה אנושית, ניתוח סנטימנט... והפקת טיוטות שימור" | draft §1 principle 4 | AI | — |
| 5 | מודול הדוחות "מודד את שיעור אימוץ המלצות דרג 1, את גמישות משקולת המרחק, ואת מדד ג'יני... ומייצר המלצות כיול אוטומטיות לפאנל ההגדרות (SmartMatchPane.jsx)" | draft §1 principle 5 | data-requirement | — |

### draft §2 — data mapping

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 6 | טבלת projects נדרשת עם: project_id, customer_id, event_name, final_event_date, actual_hours, actual_guests, project_status, invoice_sent_at, payment_date, feedback_score, feedback_notes, reasons[], written_off, operationally_closed_at, lat/lng | draft §2 | data-requirement | — |
| 7 | טבלת customers נדרשת עם: customer_id, company_name, company_number, customer_type, status | draft §2 | data-requirement | — |
| 8 | טבלת hostesses נדרשת עם: hostess_id, full_name, city, address, hourly_rate, rating, lat/lng, has_car, status | draft §2 | data-requirement | — |
| 9 | טבלת assignments נדרשת עם: project_id, hostess_id, hourly_rate_snapshot, actual_hours, personal_bonus, attendance_status, lateness_level, no_show_reason, travel_amount, is_shift_lead | draft §2 | data-requirement | — |
| 10 | טבלת quotes נדרשת עם: quote_id, customer_id, quote_status, applied_customer_discount, manual_discount, rejection_reason/notes | draft §2 | data-requirement | — |
| 11 | טבלת quote_services נדרשת עם: quote_id, sku, qty, closing_unit_price, closing_unit_cost | draft §2 | data-requirement | — |
| 12 | טבלת project_changes נדרשת עם: project_id, sku, delta_qty, unit_price_snapshot, unit_cost_snapshot | draft §2 | data-requirement | — |
| 13 | טבלת salary_reports נדרשת עם: report_id, period, send_status, sent_date, total_amount | draft §2 | data-requirement | — |
| 14 | טבלת salary_report_lines נדרשת עם: report_id, hostess_id, hours, rate, bonus, travel, line_total | draft §2 | data-requirement | — |

### draft §3 דוח 1 — מגמות צמיחה, רווחיות ושולי תרומה

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 15 | שאלת החלטה: "האם הגידול בהכנסות שומר על שולי רווחיות יציבים, ובאיזה סגמנט מושג ה-ROI הגבוה ביותר?" | draft §3 דוח 1 | UI-element | — |
| 16 | KPI: סך הכנסות | draft §3 דוח 1 | KPI | — |
| 17 | KPI: רווח גולמי ישיר (Direct Margin) | draft §3 דוח 1 | KPI | — |
| 18 | KPI: שולי רווח גולמי % | draft §3 דוח 1 | KPI | — |
| 19 | KPI: גידול YoY | draft §3 דוח 1 | KPI | — |
| 20 | ויזואליזציה: Bar & Line Combo — עמודות הכנסה/רווח, קו לשולי הרווח | draft §3 דוח 1 | visualization | — |
| 21 | סינון: טווח שנים (2024–2026) | draft §3 דוח 1 | filter | — |
| 22 | סינון: סגמנט לקוח (חברות/עיריות) | draft §3 דוח 1 | filter | — |
| 23 | סינון: סוג אירוע | draft §3 דוח 1 | filter | — |
| 24 | מקרה קצה: הצגת YTD (ינואר–אוגוסט 2025 מול 2026) וקצב שנתי (Run-Rate) כדי למנוע מצג-שווא של שנה שטרם הסתיימה | draft §3 דוח 1 | edge-rule | — |

### draft §3 דוח 2 — מבנה הנחות ויעילות תמחור

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 25 | שאלת החלטה: "מהו עומק ההנחות הממוצע... והאם הנחות עמוקות הובילו לשחיקת שולי הרווח בפועל?" | draft §3 דוח 2 | UI-element | — |
| 26 | KPI: עומק הנחה ממוצע (Discount Depth %) | draft §3 דוח 2 | KPI | — |
| 27 | KPI: הכנסה מנוכה | draft §3 דוח 2 | KPI | — |
| 28 | KPI: יחס המרה של הצעות מאושרות מול שנדחו | draft §3 דוח 2 | KPI | — |
| 29 | ויזואליזציה: היסטוגרמת מדרגי הנחות (0%, 1–5%, 6–10%, 10%+) מול שולי רווח בפועל | draft §3 דוח 2 | visualization | — |
| 30 | סינון: מדרג תקציב | draft §3 דוח 2 | filter | — |
| 31 | סינון: סגמנט לקוח | draft §3 דוח 2 | filter | — |
| 32 | סינון: רבעון קלנדרי | draft §3 דוח 2 | filter | — |
| 33 | מקרה קצה: נרמול הנחות שקליות (manual_discount) והנחות אחוזיות (applied_customer_discount) לאחוז אפקטיבי אחיד | draft §3 דוח 2 | edge-rule | §א3 — manual_discount הוא אחוז לא שקלים; "יעוות" |

### draft §3 דוח 3 — צווארי בקבוק במחזור חיי הפרויקט

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 34 | שאלת החלטה: "היכן מתעכבים הפרויקטים במעבר מביצוע בשטח לסגירה חשבונאית, וכמה הון מושהה קיים בכל שלב?" | draft §3 דוח 3 | UI-element | §ח8 row 3 (בנה בתוך דוח 7) |
| 35 | KPI: משך שהייה ממוצע בכל שלב (מאירוע לסגירה תפעולית, מחשבונית לתשלום) | draft §3 דוח 3 | KPI | — |
| 36 | KPI: הון מושהה (Trapped WIP Capital) | draft §3 דוח 3 | KPI | — |
| 37 | ויזואליזציה: Horizontal Stage Funnel עם מחוון ימי יעד מול בפועל | draft §3 דוח 3 | visualization | §א7 — "משפך" ברשימת המטאפורות האסורות |
| 38 | סינון: מנהל פרויקט | draft §3 דוח 3 | filter | — |
| 39 | סינון: לקוח | draft §3 דוח 3 | filter | — |
| 40 | סינון: חריגה מיעד סגירה (>7 ימים) | draft §3 דוח 3 | filter | §ח8 row 3 — בזריעה הסף מחזיר 0 שורות, צריך פרמטר |
| 41 | מקרה קצה: פישוט ל-funnel אופקי מבוסס operationally_closed_at, invoice_sent_at, payment_date | draft §3 דוח 3 | edge-rule | — |

### draft §3 דוח 4 — מטריצת פארטו וריכוזיות לקוחות

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 42 | שאלת החלטה: "האם החברה תלויה במספר מצומצם של לקוחות, ומהי תרומת 20% הלקוחות הגדולים?" | draft §3 דוח 4 | UI-element | — |
| 43 | KPI: אחוז הכנסות מצטבר (פארטו 80/20) | draft §3 דוח 4 | KPI | — |
| 44 | KPI: רווח גולמי מצטבר ללקוח | draft §3 דוח 4 | KPI | — |
| 45 | KPI: מדד ריכוזיות | draft §3 דוח 4 | KPI | — |
| 46 | ויזואליזציה: גרף פארטו + תרשים עץ (Treemap) לפי הכנסה ורווח | draft §3 דוח 4 | visualization | — |
| 47 | סינון: סגמנט לקוח | draft §3 דוח 4 | filter | — |
| 48 | סינון: שנת פעילות | draft §3 דוח 4 | filter | — |
| 49 | סינון: סטטוס לקוח (פעיל/רדום) | draft §3 דוח 4 | filter | — |
| 50 | מקרה קצה: סינון לקוחות ללא פעילות בשנה החולפת ופרויקטים שבוטלו | draft §3 דוח 4 | edge-rule | — |

### draft §3 דוח 5 — רווחיות ישירה לפרויקט: תכנון מול ביצוע

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 51 | שאלת החלטה: "אילו פרויקטים סטו מעלויות היעד של שכר, ציוד ונסיעות, ומהו היקף הזליגה?" | draft §3 דוח 5 | UI-element | — |
| 52 | KPI: הכנסה סופית | draft §3 דוח 5 | KPI | — |
| 53 | KPI: שכר בפועל | draft §3 דוח 5 | KPI | — |
| 54 | KPI: עלות נסיעות (₪22.60) | draft §3 דוח 5 | KPI | §7.69 — ₪22.60 הוא פרמטר סכום_נסיעות_למשמרת, ערך-בדין, עדיין 🟠 |
| 55 | KPI: עלות סחורות | draft §3 דוח 5 | KPI | — |
| 56 | KPI: שולי רווח גולמי | draft §3 דוח 5 | KPI | §7.52 — רווח סופי קפוא ב-₪ ב-project_finance.final_profit; % נגזר לתצוגה בלבד |
| 57 | ויזואליזציה: טבלת סטיות רב-ממדית + תרשים עמודות מול יעד (59.2%) | draft §3 דוח 5 | visualization | §א5 — "59.2% יעד" אינו יעד שמישהו קבע, זה הממוצע |
| 58 | סינון: פרויקט | draft §3 דוח 5 | filter | — |
| 59 | סינון: לקוח | draft §3 דוח 5 | filter | — |
| 60 | סינון: חריגה מרווח גולמי יעד (<50%) | draft §3 דוח 5 | filter | — |
| 61 | סינון: סוג עלות חורגת | draft §3 דוח 5 | filter | — |
| 62 | מקרה קצה: הגנה מפני חלוקה באפס בפרויקטי חסות/אירוע פנימי (Revenue=0) | draft §3 דוח 5 | edge-rule | — |

### draft §3 דוח 6 — גיול חובות דינמי ומעקב פיגורים

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 63 | שאלת החלטה: "מהי החשיפה הפיננסית לפי קבוצות פיגור, ואילו לקוחות חורגים מתנאי האשראי?" | draft §3 דוח 6 | UI-element | — |
| 64 | KPI: יתרת חוב פתוחה | draft §3 דוח 6 | KPI | §א5 — "יתרות חוב ₪105K" נמדד ≈₪75.8K |
| 65 | KPI: חלוקה למדרגים (שוטף, 1–30, 31–60, 61–90, 90+ יום) | draft §3 דוח 6 | KPI | — |
| 66 | KPI: DSO | draft §3 דוח 6 | KPI | §ח8 row 6 — "DSO" נקרא בפועל "ימים לתשלום (חציון)" (35), לא DSO אמיתי |
| 67 | ויזואליזציה: עמודות מוערמות לפי מדרגי פיגור + טבלת חובות פתוחים | draft §3 דוח 6 | visualization | — |
| 68 | סינון: סגמנט לקוח (עיריות מול חברות) | draft §3 דוח 6 | filter | — |
| 69 | סינון: ימי פיגור בפועל | draft §3 דוח 6 | filter | — |
| 70 | סינון: סטטוס חשבונית | draft §3 דוח 6 | filter | — |
| 71 | מקרה קצה: הפרדה בין יתרות חוב פתוחות כעת לבין מדד DSO היסטורי | draft §3 דוח 6 | edge-rule | — |
| 72 | מקרה קצה: החרגה מוחלטת של חובות אבודים (written_off) למניעת הטיה | draft §3 דוח 6 | edge-rule | — |

### draft §3 דוח 7 — תזרים מזומנים חזוי

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 73 | שאלת החלטה: "מהם תקבולי המזומנים הצפויים בשבועות הקרובים על סמך מועדי פירעון אמפיריים?" | draft §3 דוח 7 | UI-element | §7.93 — מ11 מקבל תזרים-מזומנים במקום רווח-נטו |
| 74 | KPI: תקבולים לפי מועד חוזי | draft §3 דוח 7 | KPI | — |
| 75 | KPI: תקבולים לפי מועד פירעון חזוי | draft §3 דוח 7 | KPI | — |
| 76 | KPI: פיגור ממוצע (ADD) | draft §3 דוח 7 | KPI | — |
| 77 | ויזואליזציה: גרף שטח כפול (Dual Area) — תזרים חוזי מול תחזית ריאלית | draft §3 דוח 7 | visualization | — |
| 78 | סינון: טווח תאריכים קדימה (30/60/90 יום) | draft §3 דוח 7 | filter | — |
| 79 | סינון: רמת ודאות חיזוי | draft §3 דוח 7 | filter | — |
| 80 | סינון: לקוחות מעל ₪20,000 | draft §3 דוח 7 | filter | — |
| 81 | מקרה קצה: פרויקטים שהסתיימו וטרם חויבו (awaiting_invoice) נכנסים לפי Event Date + 3 ימים | draft §3 דוח 7 | edge-rule | §א8 — נמדד חציון 5 ימים לא 3 |
| 82 | מקרה קצה: הצמדה לימי עסקים וסבבי תשלום (עיריות ל-10 בחודש, שישי/שבת מקודמים לראשון) | draft §3 דוח 7 | edge-rule | §א8 — נמדד 1/56 תשלומי-government נחתו ב-10; המודל הנכון הוא חציון-פר-לקוח |

### draft §3 דוח 8 — תוספות שטח ושינויי היקף

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 83 | שאלת החלטה: "האם תוספות שבוצעו בזמן אמת באירוע חויבו במלואן, ומהו שיעור ההכנסה הנוספת?" | draft §3 דוח 8 | UI-element | — |
| 84 | KPI: סך הכנסה משינויי היקף (project_changes) | draft §3 דוח 8 | KPI | — |
| 85 | KPI: אחוז תוספת מהמחזור | draft §3 דוח 8 | KPI | — |
| 86 | KPI: רווחיות | draft §3 דוח 8 | KPI | — |
| 87 | ויזואליזציה: מד יחס תוספות (Gauge) + טבלת 10 התוספות המובילות | draft §3 דוח 8 | visualization | — |
| 88 | סינון: מנהל פרויקט | draft §3 דוח 8 | filter | — |
| 89 | סינון: סוג שירות שנוסף (דיילות/עמדות/שעות) | draft §3 דוח 8 | filter | — |
| 90 | סינון: לקוח | draft §3 דוח 8 | filter | — |
| 91 | מקרה קצה: התבססות מלאה על project_changes (delta_qty, unit_price_snapshot, reason) | draft §3 דוח 8 | edge-rule | §א3 — project_changes היא deny-all RLS, דורש RPC חדש |

### draft §3 דוח 9 — בקרת שעות כוח אדם: מתוכנן מול מבוצע

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 92 | שאלת החלטה: "באילו אירועים נרשמו חריגות שעות עבודה של דיילות, ומהי העלות הכספית שלהן?" | draft §3 דוח 9 | UI-element | — |
| 93 | KPI: שעות מתוכננות | draft §3 דוח 9 | KPI | — |
| 94 | KPI: שעות בפועל (actual_hours) | draft §3 דוח 9 | KPI | — |
| 95 | KPI: אחוז סטיית שעות | draft §3 דוח 9 | KPI | §7.58 — כבר מוחזר כ-budget_deviation |
| 96 | KPI: עלות חריגה | draft §3 דוח 9 | KPI | — |
| 97 | ויזואליזציה: Bullet Graph + טבלת חריגות מעל 10% | draft §3 דוח 9 | visualization | — |
| 98 | סינון: פרויקט פעיל/סגור | draft §3 דוח 9 | filter | — |
| 99 | סינון: סוג אירוע | draft §3 דוח 9 | filter | — |
| 100 | סינון: מנהל פרויקט | draft §3 דוח 9 | filter | — |
| 101 | מקרה קצה: החרגה מוחלטת של פרויקטים מבוטלים (שעות=0) | draft §3 דוח 9 | edge-rule | — |

### draft §3 דוח 10 — חריגות קהל ויחס כיסוי דיילות

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 102 | שאלת החלטה: "באיזו מידה כמות האורחים בשטח חורגת מהערכת הלקוח, וכיצד השפיעה על העומס בעמדות הכניסה?" | draft §3 דוח 10 | UI-element | — |
| 103 | KPI: מוזמנים צפויים | draft §3 דוח 10 | KPI | — |
| 104 | KPI: אורחים בפועל (actual_guests) | draft §3 דוח 10 | KPI | — |
| 105 | KPI: יחס אורחים לדיילת | draft §3 דוח 10 | KPI | — |
| 106 | ויזואליזציה: Scatter Plot עם קו רגרסיה בין כמות קהל לסטיית שעות | draft §3 דוח 10 | visualization | — |
| 107 | סינון: סוג כנס | draft §3 דוח 10 | filter | §א8 — "סוג אירוע/כנס" אין עמודה כזו בשום טבלה |
| 108 | סינון: לקוח | draft §3 דוח 10 | filter | — |
| 109 | סינון: מיקום גיאוגרפי | draft §3 דוח 10 | filter | — |
| 110 | מקרה קצה: סינון אירועים קטנים (מתחת ל-50 איש) שבהם כמות האורחים לא נמדדה | draft §3 דוח 10 | edge-rule | — |

### draft §3 דוח 11 — צריכת ציוד וחומרים מתכלים

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 111 | שאלת החלטה: "מהו היקף הצריכה של ציוד מתכלה, ומהי העלות הכוללת?" | draft §3 דוח 11 | UI-element | — |
| 112 | KPI: כמות פריטים שנצרכה (quote_services.qty) | draft §3 דוח 11 | KPI | §7.22 — בסיס-העלות planned_qty/actual_qty לא הוכרע, מ11 חייב להכריע |
| 113 | KPI: עלות יחידה סופית | draft §3 דוח 11 | KPI | — |
| 114 | KPI: goods_cost | draft §3 דוח 11 | KPI | — |
| 115 | ויזואליזציה: עמודות מקובצות (Grouped Bar) של עלות חומרים לפי סוג אירוע | draft §3 דוח 11 | visualization | — |
| 116 | סינון: סוג פריט | draft §3 דוח 11 | filter | — |
| 117 | סינון: לקוח | draft §3 דוח 11 | filter | — |
| 118 | סינון: מנהל פרויקט | draft §3 דוח 11 | filter | — |
| 119 | מקרה קצה: הפרדה בין "שירותי כוח אדם בלבד" לבין "אירועי רישום ומיתוג מלא" | draft §3 דוח 11 | edge-rule | — |

### draft §3 דוח 12 — עמידה בלוחות זמנים ופתיחת עמדות

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 120 | שאלת החלטה: "האם צוותי הדיילות פתחו את עמדות הרישום בזמן שנקבע לתדריך?" | draft §3 דוח 12 | UI-element | §ז1 — 12 (צ'ק-אין) מוכרע-החוצה כתהליך שאינו קיים, לא כדחייה (06/09/2026) |
| 121 | KPI: שעת התייצבות בפועל מול שעת תחילת משמרת | draft §3 דוח 12 | KPI | — |
| 122 | KPI: אחוז אירועים ללא איחור | draft §3 דוח 12 | KPI | — |
| 123 | ויזואליזציה: מד מהירות (Gauge) + תרשים עמודות עמידה בזמנים חודשית | draft §3 דוח 12 | visualization | — |
| 124 | סינון: אזור גיאוגרפי | draft §3 דוח 12 | filter | — |
| 125 | סינון: שעת פתיחה (בוקר מוקדם/ערב) | draft §3 דוח 12 | filter | — |
| 126 | סינון: לקוח | draft §3 דוח 12 | filter | — |
| 127 | מקרה קצה: השוואת שעת הצ'ק-אין מול שעת תחילת המשמרת (Call Time) ולא מול פתיחת הדלתות | draft §3 דוח 12 | edge-rule | §א8 — אין צ'ק-אין ואין חותמת-הגעה במערכת; הנוכחות היא תווית ידנית |

### draft §3 דוח 13 — מדד אמינות והתייצבות

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 128 | שאלת החלטה: "מהו שיעור אי-ההגעה והאיחורים במערך הדיילות, ואילו משמרות מועדות לפורענות?" | draft §3 דוח 13 | UI-element | — |
| 129 | KPI: שיעור אי-הגעה (No-Show Rate %) | draft §3 דוח 13 | KPI | — |
| 130 | KPI: שיעור איחורים (assignments.lateness_level) | draft §3 דוח 13 | KPI | §א5 — נמדד 85.4% הגעה-ללא-איחור לא 98.2%/96% |
| 131 | ויזואליזציה: מפת חום (Heatmap) לפי ימי שבוע ושעות התייצבות + תרשים מגמת איחורים | draft §3 דוח 13 | visualization | — |
| 132 | סינון: טווח תאריכים | draft §3 דוח 13 | filter | — |
| 133 | סינון: סוג משמרת (בוקר מוקדם/לילה) | draft §3 דוח 13 | filter | — |
| 134 | סינון: ותק עובדת | draft §3 דוח 13 | filter | — |
| 135 | מקרה קצה: הצגת רייטינג אישי רק לדיילות עם לפחות 3 משמרות (N≥3) | draft §3 דוח 13 | edge-rule | קיים כפרמטר מינימום_תשובות_להצגת_ציון=3 (§א6) |

### draft §3 דוח 14 — מטריצת איכות, מצטיינות ועלות שעה

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 136 | שאלת החלטה: "אילו דיילות מציגות ביצועים עקביים באירועים מורכבים מול רמת השכר שלהן?" | draft §3 דוח 14 | UI-element | — |
| 137 | KPI: התפלגות תגיות איכות ("דיילת מצטיינת", "תקין", "לא לשלוח שוב") | draft §3 דוח 14 | KPI | §ח8 row 4 — כלל-הצבירה הוכרע: rating גלובלי + ספירת-תגיות פר-לקוח |
| 138 | KPI: עלות שעה | draft §3 דוח 14 | KPI | — |
| 139 | ויזואליזציה: מפת פיזור ארבעת-רבעונים (Quad Matrix) עלות מול איכות | draft §3 דוח 14 | visualization | — |
| 140 | סינון: תגית איכות | draft §3 דוח 14 | filter | — |
| 141 | סינון: סטטוס דיילת | draft §3 דוח 14 | filter | — |
| 142 | סינון: ותק בחברה | draft §3 דוח 14 | filter | — |
| 143 | סינון: עיר מגורים | draft §3 דוח 14 | filter | — |
| 144 | מקרה קצה: הצגת תעריף בסיס שעתי חוזי בנפרד מבונוסים חריגים חד-פעמיים | draft §3 דוח 14 | edge-rule | — |

### draft §3 דוח 14א — Smart Match Efficacy

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 145 | שאלת החלטה: "האם שקלול המשקולות הנוכחי מוביל לשיבוצים אופטימליים... או שנוצרת הטיית דיילות כוכבות ושחיקה?" | draft §3 דוח 14א | UI-element | — |
| 146 | KPI: שיעור אימוץ המלצות דרג 1 (Tier-1 Adoption Rate) | draft §3 דוח 14א | KPI | §א8 — אין שום רישום של דרג-ההמלצה בפועל; ריק בכנס |
| 147 | KPI: גמישות משקולת המרחק (Proximity Elasticity) | draft §3 דוח 14א | KPI | — |
| 148 | KPI: מדד אי-שוויון ג'יני (Gini Fairness Coefficient) | draft §3 דוח 14א | KPI | §ח8 row 1 — אוכלוסייה ומדרגים הוכרעו |
| 149 | KPI: זמן ממוצע לאיוש משמרת (Time-to-Fill) | draft §3 דוח 14א | KPI | — |
| 150 | ויזואליזציה: דונאט התפלגות שיבוצים לפי דרג המלצה + עקומת לורנץ מול קו שוויון | draft §3 דוח 14א | visualization | §ח8 row 1 — בלי מדרגי-צבע, מספר + לורנץ + השוואה ל-12 חודשים קודמים |
| 151 | סינון: סוג אירוע | draft §3 דוח 14א | filter | — |
| 152 | סינון: מנהלת משבצת | draft §3 דוח 14א | filter | — |
| 153 | סינון: אזור גיאוגרפי (צפון/מרכז/דרום) | draft §3 דוח 14א | filter | §א8 — "אזור" אין עמודה, אפשר לגזור מ-lat/lng |
| 154 | סינון: קבוצת ותק | draft §3 דוח 14א | filter | — |
| 155 | מקרה קצה: החרגת דיילות בסטטוס 'הקפאה/מבחנים' (Dormant) מחישוב מדד ג'יני | draft §3 דוח 14א | edge-rule | — |
| 156 | מקרה קצה: נרמול ציוני קרבה כאשר כתובת האירוע נפלה לרמת-עיר בלבד (תווית ניטרלית ללא ענישה) | draft §3 דוח 14א | edge-rule | — |

### draft §3 דוח 15 — שימור כוח אדם ושחיקה עונתית

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 157 | שאלת החלטה: "מתי נרשמת שחיקה במאגר הדיילות, וכיצד משפיעות תקופות מבחנים על הזמינות?" | draft §3 דוח 15 | UI-element | — |
| 158 | KPI: שיעור עזיבה (Attrition %) | draft §3 דוח 15 | KPI | — |
| 159 | KPI: ותק ממוצע בחודשים | draft §3 דוח 15 | KPI | — |
| 160 | KPI: אחוז עובדות פעילות | draft §3 דוח 15 | KPI | — |
| 161 | ויזואליזציה: עקומת שרידות עובדים (Survival Curve) + תרשים מרווחי ימים ממשמרת | draft §3 דוח 15 | visualization | — |
| 162 | סינון: קבוצת ותק (עד 3 חודשים, 3–12, מעל שנה) | draft §3 דוח 15 | filter | — |
| 163 | סינון: עיר מגורים | draft §3 דוח 15 | filter | — |
| 164 | מקרה קצה: עובדת שלא עבדה 60 יום בתקופת מבחנים מסווגת "רדומה/בהקפאה" ולא "עזבה" | draft §3 דוח 15 | edge-rule | §א8 — אין תאריך-עזיבה ואין היסטוריית-סטטוס במסד |

### draft §3 דוח 16 — ריכוז עלויות שכר, נסיעות ובונוסים

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 165 | שאלת החלטה: "מהי ההתפלגות של רכיבי השכר במאגר, וכיצד משפיעים הבונוסים והנסיעות?" | draft §3 דוח 16 | UI-element | — |
| 166 | KPI: סך שכר שעות | draft §3 דוח 16 | KPI | — |
| 167 | KPI: סך בונוסים | draft §3 דוח 16 | KPI | §א8 — personal_bonus>0 = 0 שורות בזריעה כיום |
| 168 | KPI: הוצאות נסיעה (assignments.travel_amount, ₪22.60) | draft §3 דוח 16 | KPI | §7.69 |
| 169 | ויזואליזציה: תרשים עמודות מוערמות (Stacked Bar) מרכיבי השכר לפי חודשים | draft §3 דוח 16 | visualization | — |
| 170 | סינון: חודש שכר | draft §3 דוח 16 | filter | — |
| 171 | סינון: מנהל שאישר בונוס | draft §3 דוח 16 | filter | — |
| 172 | סינון: מדרג שכר שעתי | draft §3 דוח 16 | filter | — |
| 173 | מקרה קצה: מתג מעבר בין "תצוגת הוצאה תפעולית" (מועד האירוע) לבין "תצוגת דוח שכר סגור" (salary_reports.period) | draft §3 דוח 16 | edge-rule | §7.68 — דוח-שכר בנוי ומוזג במ8; מ11 קורא-בלבד |

### draft §3 דוח 17 — ניתוח שביעות רצון וסיבות שורש

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 174 | שאלת החלטה: "מהם המנועים של שביעות רצון גבוהה, ואילו כשלים תפעוליים מסבירים ציונים נמוכים (1–3)?" | draft §3 דוח 17 | UI-element | — |
| 175 | KPI: ממוצע CSAT (4.13→4.25→4.41) | draft §3 דוח 17 | KPI | — |
| 176 | KPI: שיעור היענות (Response Rate %) | draft §3 דוח 17 | KPI | §ח8 row 6 — היענות = נענו÷(נענו+לא-נענו) לפי feedback_status = 77.5%, לא 67% |
| 177 | KPI: שכיחות תגיות סיבה חיוביות מול שליליות | draft §3 דוח 17 | KPI | — |
| 178 | ויזואליזציה: תרשים עמודות דו-כיווני (Tornado Chart) + גרף קו מגמה רב-שנתי | draft §3 דוח 17 | visualization | — |
| 179 | סינון: סוג אירוע | draft §3 דוח 17 | filter | — |
| 180 | סינון: מנהל פרויקט | draft §3 דוח 17 | filter | — |
| 181 | סינון: מועד אירוע | draft §3 דוח 17 | filter | — |
| 182 | סינון: סגמנט לקוח | draft §3 דוח 17 | filter | — |
| 183 | מקרה קצה: חישוב ממוצע CSAT רק מפרויקטים שבהם התקבל משוב בפועל (feedback_score IS NOT NULL); היענות כמדד נפרד | draft §3 דוח 17 | edge-rule | §7.79/§7.96 — ממוצע-משוב על feedback_status='completed'; מבוטלים-שנפתרו נשארים עם תג |

### draft §3 דוח 18 — מדד סיכון נטישת לקוחות

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 184 | שאלת החלטה: "אילו לקוחות מציגים תסמיני התרחקות, שחיקת שביעות רצון או הפחתת תדירות?" | draft §3 דוח 18 | UI-element | — |
| 185 | KPI: ציון סיכון נטישה (0–100) | draft §3 דוח 18 | KPI | §ח7 — "אין ציון 0–100"; הוחלף בדגל "מתרחק" עם עובדות |
| 186 | KPI: חריגת מרווח ימים מהקצב האישי | draft §3 דוח 18 | KPI | §ח7 — נשמר, נגזר ממחזור-אישי (≥3 אירועים, מכפיל 1.5) |
| 187 | KPI: מגמת ציוני משוב | draft §3 דוח 18 | KPI | §ח7 — "עובדה ליד, לא משקולת" |
| 188 | ויזואליזציה: מטריצת סיכון 2x2 (היקף הכנסה מול סיכון) | draft §3 דוח 18 | visualization | §ח7 — הוחלף ברשימת "מי מתרחק" עם 4 עובדות, לא מטריצת-ציון |
| 189 | סינון: לקוחות בסיכון גבוה (>70) | draft §3 דוח 18 | filter | — |
| 190 | סינון: סגמנט לקוח | draft §3 דוח 18 | filter | — |
| 191 | סינון: היקף פעילות | draft §3 דוח 18 | filter | — |
| 192 | מקרה קצה: התאמה למחזור החיים האישי של הלקוח (לקוח שנתי לא יסומן כנוטש) | draft §3 דוח 18 | edge-rule | §ח7 — הוכרע: דגל "מתרחק" נגזר ממכפיל_מרווח_מתרחק (1.5) × מרווח-חציוני-אישי |

### draft §3 דוח 19 — תדירות הזמנות חוזרות ומחזורי פעילות

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 193 | שאלת החלטה: "מהו מחזור ההזמנה הטיפוסי של כל קבוצת לקוחות, ומתי לקוח חורג מדפוסו?" | draft §3 דוח 19 | UI-element | — |
| 194 | KPI: ממוצע ימים בין אירועים עוקבים לאותו לקוח | draft §3 דוח 19 | KPI | — |
| 195 | KPI: שיעור לקוחות חוזרים שנתי | draft §3 דוח 19 | KPI | — |
| 196 | ויזואליזציה: תרשים עוקבות (Cohort Retention Chart) + גרף קווי מחזורי זמן | draft §3 דוח 19 | visualization | — |
| 197 | סינון: שנת הצטרפות הלקוח | draft §3 דוח 19 | filter | — |
| 198 | סינון: קטגוריית לקוח (עיריות, מפיקים, הייטק) | draft §3 דוח 19 | filter | §א8 — "הייטק" אינו קיים כסגמנט; הקיימים: private_company/production_company/government/nonprofit |
| 199 | מקרה קצה: איחוד לקוחות לפי customer_id ולא לפי שם חברה טקסטואלי | draft §3 דוח 19 | edge-rule | — |

### draft §3 דוח 20 — ניתוח סנטימנט והערות חופשיות (Gemini)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 200 | שאלת החלטה: "אילו תובנות ונושאים עולים מטקסט המשוב החופשי שלא נלכדו בתגיות המובנות?" | draft §3 דוח 20 | UI-element | §ח4 — ניתוח-ההערות הוכרע כחובה (לא v2) |
| 201 | KPI: ציון סנטימנט מילולי | draft §3 דוח 20 | KPI | §ח4 — הוחלף בטקסונומיה-קיימת + סנטימנט 1–5, לא "ציון חופשי" |
| 202 | KPI: מקבצי נושאים (סורקים, איחור, שירותיות) | draft §3 דוח 20 | KPI | §ח4 — הוחלף בטקסונומיית negative/positive_feedback_reasons הקיימת במסד |
| 203 | KPI: Red Flags | draft §3 דוח 20 | KPI | §ח4 — נשמר, כעמודה בטבלת feedback_ai_insights |
| 204 | ויזואליזציה: ענן נושאים סמנטי (Topic Clusters) + כרטיסיות ציטוטים קריטיים | draft §3 דוח 20 | visualization | — |
| 205 | סינון: לקוחות עם משוב טקסטואלי | draft §3 דוח 20 | filter | — |
| 206 | סינון: ציון משוב ≤3 | draft §3 דוח 20 | filter | — |
| 207 | סינון: מנהל לקוח | draft §3 דוח 20 | filter | — |
| 208 | מקרה קצה: שליחה ל-Gemini רק של הערות מעל 3 מילים או ציון נמוך ≤3, למניעת בזבוז טוקנים | draft §3 דוח 20 | edge-rule | §ח4 — הוחלף: אצווה חד-פעמית על כל ההערות, לא סינון בזמן-אמת |

### draft §4 מודל 1 — סיכון אי-הגעה (No-Show Risk Score)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 209 | נוסחה: RiskScore = min(100, max(0, 40·(Lates+1)/(Shifts+5) + 25·E_shift + 20·D_city + 20·T_fatigue − 30·S_tag)) | draft §4 מודל 1 | formula | — |
| 210 | מקרה קצה: דיילת חדשה — Laplace Smoothing מונע חלוקה באפס, מתחילה מציון מאוזן | draft §4 מודל 1 | edge-rule | — |
| 211 | מקרה קצה: עייפות (T_fatigue) — פער של פחות מ-8 שעות בין משמרת לילה למשמרת בוקר הבאה | draft §4 מודל 1 | edge-rule | §א8 — נמדד ב-1.8% מהזוגות בלבד; "כמעט לעולם לא נדלק" |
| 212 | מקרה קצה: מרחק (D_city) נשען על התאמת עיר (hostesses.city מול projects.final_location) ללא תלות במפות חיצוניות | draft §4 מודל 1 | data-requirement | — |
| 213 | מקרה קצה: RiskScore הוא מודל אמינות שני, נפרד מ-reliabilityScore הקיים | draft §4 מודל 1 | edge-rule | §ח8 row 3 — הוכרע להשתמש ב-reliabilityScore הקיים, לא במודל שני |

### draft §4 מודל 2 — חיזוי תאריך פירעון ותזרים מזומנים

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 214 | נוסחה: Expected Date = Invoice Date + Terms Days + Clean Median Delay | draft §4 מודל 2 | formula | — |
| 215 | נוסחה: Expected Date = RollForwardToBusinessDay(Expected Date) | draft §4 מודל 2 | formula | — |
| 216 | מקרה קצה: חובות אבודים מוחרגים ב-100% מחישוב החציון (written_off=false) | draft §4 מודל 2 | edge-rule | — |
| 217 | מקרה קצה: לקוחות עיריות מעוגלים ל-10 בחודש הבא, ימי שישי/שבת מקודמים ליום ראשון | draft §4 מודל 2 | edge-rule | §א8 — נמדד 1/56 בלבד ב-10 לחודש; חציון-פר-לקוח נכון יותר |

### draft §4 מודל 3 — חריגות שעות בהצעת המחיר (Budget Bias Predictor)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 218 | נוסחה: Historical Bias % = Σ(Actual Unbilled Hours − Planned Hours) / ΣPlanned Hours, לכל סטטוס ≠ 'cancelled' | draft §4 מודל 3 | formula | — |
| 219 | מקרה קצה: אירועים שבוטלו מסוננים מהחישוב | draft §4 מודל 3 | edge-rule | — |
| 220 | מקרה קצה: תוספות ששולמו דרך project_changes אינן נחשבות כחריגה תקציבית | draft §4 מודל 3 | edge-rule | — |

### draft §4 מודל 4 — מדד סיכון נטישת לקוחות (Customer Churn Risk)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 221 | נוסחה: ChurnScore = min(100, max(0, 35·CSAT_Drop + 30·(T_since_last/Personal Cadence) + 25·N_neg_tags − 30·N_future)) | draft §4 מודל 4 | formula | §ח7 — נדחה: "אין ציון 0–100", הוחלף בדגל "מתרחק" ללא ציון-משוקלל |
| 222 | מקרה קצה: לכל לקוח מחושב מחזור אישי (אירוע בחודש לעומת אירוע בשנה) | draft §4 מודל 4 | edge-rule | §ח7 — הרעיון אומץ, "מכפיל_מרווח_מתרחק" חדש (1.5) |
| 223 | מקרה קצה: היעדר משוב מוזן כ-3.5 (ניטרלי) במקום 0 שגוי | draft §4 מודל 4 | edge-rule | — |

### draft §4 מודל 5 — ביקושים עונתיים וזמינות כוח אדם

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 224 | נוסחה: Expected Shifts_m = Baseline_m · S_Hebrew(Holidays_m) · S_Academic(Exams_m) | draft §4 מודל 5 | formula | — |
| 225 | מקרה קצה: חגים עבריים נעים דרך @hebcal/core, ביקוש +45% בספטמבר–אוקטובר/מרץ–אפריל | draft §4 מודל 5 | edge-rule | §א8 — נמדד שהשיא בפועל הוא נובמבר–דצמבר, לא הטווחים שהוצעו |
| 226 | מקרה קצה: תקופות מבחנים (ינואר–פברואר, יוני–יולי) מקטינות זמינות דיילות סטודנטיות ב-35% | draft §4 מודל 5 | edge-rule | §א8 — אין נתון בפועל (5 שורות hostess_unavailability בכל המאגר) |
| 227 | מקרה קצה: החרגת רבעוני משבר ביטחוני מאימון המודל | draft §4 מודל 5 | edge-rule | — |

### draft §4 מודל 6 — כיול Smart Match ומדד ג'יני (Closed-Loop Tuning)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 228 | נוסחה: PassesGate = (active) ∧ (¬SameDayEvent) ∧ (pref≠'לא_לשלוח') ∧ (available) ∧ (d≤gateKm) ∧ (d≤goalpostKm ∨ has_car) | draft §4 מודל 6א שכבה 1 | formula | — |
| 229 | מקרה קצה: בהיעדר קואורדינטות (d=null) המועמדת אינה נפסלת | draft §4 מודל 6א שכבה 1 | edge-rule | — |
| 230 | כלל: דיילת שסומנה 'מצוינת' עבור הלקוח צפה אוטומטית לראש הרשימה (Pinned Preferences) | draft §4 מודל 6א שכבה 2 | formula | — |
| 231 | נוסחה: נרמול משקולות בזמן ריצה כאשר מרכיב כבוי — w_i' = w_i/Σ(Active w_j) | draft §4 מודל 6א שכבה 3 | formula | — |
| 232 | נוסחה: BaseScore = w_resp'·P̂_resp + w_rel'·P̂_rel + w_prox'·S_prox | draft §4 מודל 6א שכבה 3 | formula | — |
| 233 | נוסחה: הערכת הסתברות בייסיאנית מרוסנת — P̂ = (k+m·C)/(n+m), m=3 | draft §4 מודל 6א שכבה 3 | formula | קיים, הוכרע m=3 במ4 (§ו) |
| 234 | נוסחה: ציון קרבה רציף חתום בגולפוסט — S_prox = 1 − min(max(d,0), goalpostKm)/goalpostKm | draft §4 מודל 6א שכבה 3 | formula | — |
| 235 | נוסחה: Leverage = 1 + ratePerWeek · min(max(weeksSinceWorked,0), weeksCap) | draft §4 מודל 6א שכבה 4 | formula | — |
| 236 | נוסחה: FinalScore = round(BaseScore · Leverage, 2) | draft §4 מודל 6א שכבה 4 | formula | — |
| 237 | נוסחה: מדד ג'יני G = Σi Σj \|yi−yj\| / (2n·Σyi) | draft §4 מודל 6ב | formula | — |
| 238 | מדרגי ג'יני תפעוליים: <0.25 שוויון-יתר · 0.25–0.40 טווח-אופטימלי · 0.40–0.50 אזהרת-ריכוזיות · >0.50 ריכוזיות-קריטית/הטיית-כוכבות | draft §4 מודל 6ב | edge-rule | §ח8 row 1 — "בלי מדרגי-צבע" הוכרע; המדרגים האלה נדחו |
| 239 | כלל כיול: אם G>0.45 ועזיבת-ותיקות עלתה >15% ⇒ המלצה להעלות שיעור_בונוס_הוגנות_לשבוע מ-0.02 ל-0.05 | draft §4 מודל 6ג #1 | edge-rule | §א6 — 0.05 נבחן ונדחה ע"י ישי (08/08/2026) לטובת 0.02; הטיוטה ממליצה לחזור למה שנפסל |
| 240 | כלל כיול: אם <65% מהשיבוצים נבחרו מ-3 המועמדות המובילות ⇒ המלצה לכייל משקולת_אמינות או משקולת_קרבה | draft §4 מודל 6ג #2 | edge-rule | §א8 — אין רישום של דרג-המלצה בפועל כדי לחשב את זה |
| 241 | כלל כיול: אם >25% מהאיחורים הבינוניים/כבדים במרחק >25 ק"מ ⇒ להעלות משקולת_קרבה מ-0.30 ל-0.40 ולהקשיח גולפוסט מ-40 ל-30 ק"מ | draft §4 מודל 6ג #3 | edge-rule | §7.14/§7.15 — הערך החי הוא 0.25 לא 0.30; 40→30 הוכרע ל-40→ בלי מקור ל-30 |

### draft §5 — שכבת AI (Google Gemini)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 242 | Gemini מקבל תוצרי JSON מסוכמים מ-PostgreSQL בלבד; לא נוגע בחישובי כספים | draft §5 | AI | — |
| 243 | פיצ'ר: Executive Summary — 3 נקודות מפתח | draft §5 | AI | — |
| 244 | פיצ'ר: Sentiment & Root Causes מהערות עבריות חופשיות | draft §5 | AI | §ח4 — הוכרע חובה |
| 245 | פיצ'ר: Retention Strategy Draft — טיוטת מייל מותאמת ללקוח | draft §5 | AI | — |
| 246 | תוכן פרומפט נקודה 1: ביצועי הכנסות ורווחיות מול יעד 59% | draft §5 | AI | §א5/§א6 — "59%" הוא ממוצע לא יעד שנקבע |
| 247 | תוכן פרומפט נקודה 2: חריגות תפעוליות או דיילות שדורשות תשומת לב | draft §5 | AI | — |
| 248 | תוכן פרומפט נקודה 3: המלצה עסקית אופרטיבית לשבוע הבא | draft §5 | AI | — |
| 249 | כלל ברזל בפרומפט: "אל תבצע חישובים מתמטיים בעצמך – הסתמך אך ורק על המספרים שסופקו" | draft §5 | AI | — |

### draft §6.1 — מבנה המסך (Wireframe)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 250 | כותרת עליונה: "מרכז דוחות ואנליטיקה" | draft §6.1 | UI-element | §ח8 row 9 — הכותרת צריכה להיות השאלה, לא מונח-BI |
| 251 | בורר טווח גלובלי (למשל שנת 2026) | draft §6.1 | filter | — |
| 252 | כפתור ייצוא אקסל בסרגל העליון | draft §6.1 | export | — |
| 253 | שורת Gemini: "שאל שאלה עסקית בשפה חופשית" | draft §6.1 | AI | §ח4 — "בלי שורת-שאלה-חופשית (text-to-SQL)" נאסר במפורש |
| 254 | באנר תובנות שבועיות (AI Executive Digest) בצבע סגול אלגנטי | draft §6.1 | UI-element | §א7 — סגול #8B5CF6 "AI Sparkle" לא בשפת-העיצוב המאושרת |
| 255 | סרגל 5 לשוניות: הנהלה ואסטרטגיה / כספים ותזרים / תפעול / כוח אדם / לקוחות, מותנה RBAC | draft §6.1 | UI-element | — |
| 256 | אזור תוכן ב-3 רבדים: כרטיסיות KPI / גרפים / טבלה אופרטיבית עם Drill-Down | draft §6.1 | UI-element | — |
| 257 | כפתורי פעולה בשורת הטבלה האופרטיבית: "פתח כרטיס פרויקט" ו-"שיבוץ גיבוי" | draft §6.1 | UI-element | — |

### draft §6.2 — הרשאות (RBAC & Silent Tab Filtering)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 258 | עיקרון: "הסתרה שקטה" — לשונית חסומה אינה מופיעה כלל בסרגל, בלי הודעת שגיאה ובלי ניסיון קריאה ל-DB | draft §6.2 | permission | §א2 — ישי הכריע פעמיים (§7.97, FilterPill במ4): מציגים וממסכים "לא זמין בתפקידך", לא מעלימים |
| 259 | מטריצה: מנכ"ל — גלוי מלא בכל 5 הלשוניות | draft §6.2 | permission | — |
| 260 | מטריצה: מנהלת גיוס — גלוי מלא רק בלשונית "כוח אדם וגיוס"; שאר 4 מוסתרות | draft §6.2 | permission | §ח2/§ח8 סוף — הוכרע: view על 'דו"חות', רואה לשונית "דיילות ו-Smart Match" |
| 261 | מטריצה: מנהלת כספים ולקוחות — גלוי מלא ב"כספים ותזרים" ו"לקוחות ושימור"; שאר 3 מוסתרות; חסומה ב-RLS לשכר אישי | draft §6.2 | permission | — |
| 262 | מטריצה: מנהלת לוגיסטיקה — גלוי מלא ב"תפעול ולוגיסטיקה"; צפייה מוגבלת בלקוחות (מדדי שירות/ציוד בלבד); שאר מוסתרות | draft §6.2 | permission | — |

### draft §6.3 — חשיפה מדורגת וזרימת המשתמש

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 263 | רובד 1 (10 שניות): כרטיסיות KPI עם ערך, אחוז שינוי YoY/MoM, וצבע סטטוס סמנטי | draft §6.3 | UI-element | — |
| 264 | רובד 2: גרפי מגמה/התפלגות/משפכים שמסבירים את הגורמים | draft §6.3 | UI-element | — |
| 265 | רובד 3 זרימה: לחיצה על עמודה בגרף מסננת את הטבלה האופרטיבית להצגת השורות הרלוונטיות בלבד | draft §6.3 | UI-element | §ח3 — cross-filter מגרף לטבלה = "רמה 1 חובה" |
| 266 | רובד 3 כפתורי-פעולה בשורה: "פתח כרטיס פרויקט" / "שלח תזכורת גבייה" / "צור טיוטת שימור מ-Gemini" | draft §6.3 | UI-element | §7.68 — "דוחות = קריאה בלבד"; "תזכורת גבייה" מהדוחות נשלל |

### draft §6.4 — טוקנים וצבעים סמנטיים

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 267 | Status Critical #DC2626 (אדום): חריגת תקציב>15%, חוב בפיגור>60 יום, סיכון אי-הגעה>55 | draft §6.4 | UI-element | §א7 — #DC2626 שונה מהאדום המאושר (~#EF4444) |
| 268 | Status Warning #F59E0B (ענבר): חריגה מתונה 5–15%, סיכון נטישה 50–70, איחור צפוי | draft §6.4 | UI-element | — |
| 269 | Status Success #10B981 (ירוק): רווח גולמי ≥58%, ציון משוב ≥4.5, שיבוץ מאומת | draft §6.4 | UI-element | §א7 — #10B981 שונה מהירוק המאושר (~#22C55E); "רווח≥58% ירוק" סותר את כלל-המילוי (07/08) |
| 270 | Status AI Sparkle #8B5CF6 (סגול): תובנות מנהלים, סנטימנט, המלצות Gemini | draft §6.4 | UI-element | §א7 — אין סגול/כתום בשפת-העיצוב; סגול = קטגוריית-גרף בלבד ב-§4 |
| 271 | Neutral Surface #F8FAFC / #0F172A: רקעים ומסגרות | draft §6.4 | UI-element | §א7 — משטח כהה #0F172A; אין מצב-כהה במערכת |

### draft §6.5 — מפרט חוויית משתמש פרסונלית

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 272 | תצוגת מנכ"ל: מיקוד ניהולי כולל "אישור מחיקת חובות אבודים" | draft §6.5 א | permission | — |
| 273 | תצוגת מנהלת גיוס: כרטיסיית "כמות משמרות שבועיות לאיוש" | draft §6.5 ב | KPI | — |
| 274 | תצוגת מנהלת כספים: "הפקת דוחות שכר חודשיים סגורים לרו"ח" מתוך מסך הדוחות | draft §6.5 ג | export | §7.68 — דוח-השכר בנוי ומוזג במ8; מ11 קורא-בלבד |
| 275 | תצוגת מנהלת לוגיסטיקה: כרטיסיית "כמות פרויקטים המתקרבים לסף לוגיסטיקה" (סף_לוגיסטיקה_ימי_עסקים) | draft §6.5 ד | KPI | — |
| 276 | תצוגת מנהלת לוגיסטיקה: מפת חום עומסי קהל בעמדות רישום (Throughput מוזמנים לדקה לפי עמדה) | draft §6.5 ד | visualization | §ח8 row 10-אזור — "אין מוזמנים-לדקה-לעמדה", המדד למחיקה |
| 277 | תצוגת מנהלת לוגיסטיקה: מעקב סטטוס צ'ק-ליסטים לוגיסטיים לאירועים קרובים | draft §6.5 ד | visualization | — |
| 278 | תצוגת מנהלת לוגיסטיקה: כפתור "פתח צ'ק-ליסט לוגיסטי" בטבלה האופרטיבית | draft §6.5 ד | UI-element | — |

### draft §6.6 — ווידג'טים במודולים סגורים (Cross-Module Touchpoints)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 279 | ווידג'ט במודול 03 (QuoteBuilderPage): "חלונית ייעוץ תמחור חכמה" — מזהה סטיות עבר ומציע מקדם ביטחון | draft §6.6 widget מ3 | widget-in-other-module | ⏳ §ג/§ח — "6 הווידג'טים... 2 לכל היותר" (המלצה, לא ריק) |
| 280 | ווידג'ט במודול 04/06 (SmartMatchPage): "מחוון סיכון אי-הגעה" (No-Show Risk Badge) + "שבץ דיילת גיבוי מאותה עיר" | draft §6.6 widget מ4/6 | widget-in-other-module | §ח8 row 3 — נשען על reliabilityScore הקיים, נכלל כ-1 מ-2 הווידג'טים המומלצים |
| 281 | ווידג'ט במודול 06 (ClosingTab): "זיהוי איחור תדריך אוטומטי" — משווה הגעה ל-Call Time ומסווג אוטומטית assignments.lateness | draft §6.6 widget מ6 | widget-in-other-module | §א8 — אין צ'ק-אין ואין חותמת-הגעה, הנוכחות היא תווית ידנית |
| 282 | ווידג'ט במודול 08 (FinancePage): "עמודת תאריך פירעון חזוי" (Expected Payment Date & Empirical Delay Badge) | draft §6.6 widget מ8 | widget-in-other-module | נכלל כ-1 מ-2 הווידג'טים המומלצים (§ג/§ח) |
| 283 | ווידג'ט במודול 02 (CustomersPage): "כרטיסיית בריאות לקוח" (0–100) + "צור טיוטת שימור אישית מ-Gemini" | draft §6.6 widget מ2 | widget-in-other-module | §ח7 — "אין ציון 0–100" הוכרע לדוח 18; משליך גם על הכרטיס הזה |
| 284 | ווידג'ט במודול 09 (SmartMatchPane): "תג ביצועי שיבוץ חכם והמלצת כיול משקולות" — "אימוץ דרג 1: 78%, ג'יני: 0.34" | draft §6.6 widget מ9 | widget-in-other-module | §א5 — נמדד ג'יני 0.45–0.60 בפועל, לא 0.34; ואין רישום דרג-אימוץ כלל |

### draft §6.7 — הנחיות הנדסיות במקרי-קצה תפעוליים

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 285 | מצב-אפס: כשסינון מחזיר 0 רשומות, מוצג רכיב Empty State ייעודי + הודעה + כפתור "אפס את כל הסינונים" | draft §6.7 #1 | UI-element | רכיב PermissionAwareEmpty קיים כבר, כלל-מילוי (§א7) |
| 286 | ביצועים: Client-Side Aggregation ב-useMemo, ללא קריאות שרת חוזרות במיון | draft §6.7 #2 | edge-rule | — |
| 287 | Caching: תקציר Gemini נשמר ב-sessionStorage/DB למשך 6 שעות | draft §6.7 #2 | AI | — |
| 288 | Debouncing: שורת החיפוש החופשית מוגנת ב-300ms | draft §6.7 #2 | edge-rule | — |
| 289 | חותמת עדכניות: "עודכן לאחרונה 10:45" + כפתור "רענן נתונים" | draft §6.7 #3 | UI-element | §א7 — Date.now() ב-render אסור (react-hooks/purity); "מטעה" מעל דוחות-חיים |
| 290 | רספונסיביות מלאה למובייל/טאבלט (grid-cols-1 sm:2 lg:4, overflow-x-auto, sticky header) | draft §6.7 #4 | UI-element | C5:62/§א6 — "המערכת מותאמת לדסקטופ בלבד"; המעטפת (mr-60) אינה רספונסיבית |
| 291 | הדפסה/PDF: כללי print:hidden מסתירים סרגלים/כפתורים; A4 עם break-inside-avoid | draft §6.7 #5 | export | ⏳ — "אקסל בלבד" הומלץ, PDF/הדפסה נדחה |

### draft §7 — ערוצי הפצה וצריכת מידע

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 292 | ערוץ: דשבורד חי במערכת — אינטראקטיבי, סינונים מהירים, מעבר ישיר לכרטיס פרויקט | draft §7 #1 | UI-element | — |
| 293 | ערוץ: ייצוא אקסל — דוח שכר חודשי לרואה חשבון (שעות, תעריף נעול, נסיעות, בונוסים) | draft §7 #2 | export | §7.68 — דוח-שכר מופק במ8, מ11 קורא-בלבד |
| 294 | ערוץ: ייצוא אקסל — דוח P&L פרויקטלי מלא (הכנסה, שכר, נסיעות, ציוד, רווח גולמי) | draft §7 #2 | export | — |
| 295 | ערוץ: ייצוא אקסל — דוח גיול חובות מלא מבוסס חשבוניות ופיגורים | draft §7 #2 | export | — |
| 296 | ערוץ: תקציר מנהלים שבועי — נשלח אוטומטית בימי ראשון 07:30 לתיבת המנכ"ל | draft §7 #3 | schedule | §7.57/§7.33/§7.36 — "דו"ח-מתוזמן = gold-plating"; אין pg_net; מנגנון אמיתי במ10 |
| 297 | תוכן המייל: תמצית ביצועים מנוסחת ע"י Gemini | draft §7 #3 | AI | §7.57/§7.33/§7.36 | 
| 298 | תוכן המייל: צפי שבועי | draft §7 #3 | data-requirement | §7.57/§7.33/§7.36 |
| 299 | תוכן המייל: 3 התראות קריטיות | draft §7 #3 | KPI | §7.57/§7.33/§7.36 |

### draft §9 — Developer Blueprint (product-level requirements only)

| # | Requirement | Source anchor | Kind | Already-ruled pointer |
|---|---|---|---|---|
| 300 | State: dateRange presets — last_30_days / this_quarter / year_to_date / custom | draft §9.3 | filter | — |
| 301 | KpiCard: delta עם percent + direction + isPositive (עלייה אינה תמיד חיובית עסקית, למשל בחובות) | draft §9.4 KpiCard | UI-element | — |
| 302 | KpiCard: progress כלפי יעד (current/target/label) | draft §9.4 KpiCard | UI-element | — |
| 303 | ReportChartCard: description בתור Tooltip עם הסבר מתודולוגי | draft §9.4 ReportChartCard | UI-element | — |
| 304 | ReportChartCard: onExportExcel לייצוא נתוני הגרף הספציפי | draft §9.4 ReportChartCard | export | — |
| 305 | ReportsTable: מיון עמודות (sortable) + קיבוע כותרת (sticky) | draft §9.4 ReportsTable | UI-element | תואם ListWindow הקיים (§א7) |
| 306 | DrillDownDrawer: נפתח בלחיצה על פרויקט/לקוח/דיילת ומציג פירוט מלא | draft §9.4 DrillDownDrawer | UI-element | §ה — תואם C5 §5.7.3 ודפוס "פתח כרטיס פרויקט" הקיים |
| 307 | RTL: ציר X הפוך — הזמן זורם מימין לשמאל | draft §9.5 #1 | UI-element | §ח8 row 5 — הוכרע ההפך: משמאל לימין (כמו אקסל/בנק-ישראל) |
| 308 | RTL: ציר Y בצד שמאל עם פורמט he-IL | draft §9.5 #2 | UI-element | — |
| 309 | RTL: בועת מידע (Tooltip) מיושרת לימין, dir-rtl | draft §9.5 #3 | UI-element | — |
| 310 | ניתוב: `<ProtectedRoute allow='דו"חות'>` על נתיב `/reports` | draft §9.6 | permission | §ה — "§9.6 ניתוב... מילה-במילה נכון" |
| 311 | פריט סרגל-ניווט קיים: {name:'דו"חות', path:'/reports', group:'כספים ודוחות'} | draft §9.6 | UI-element | §ה — קיים כבר בקוד |
| 312 | AI fallback: בשגיאה/היעדר מפתח API מוצג תקציר מחושב מבוסס-חוקים במקום מסך תקוע | draft §9.7 | AI | — |
| 313 | AI privacy: שליחת נתוני מקרו מעובדים בלבד, ללא מידע מזהה אישי או שורות בודדות | draft §9.7 | data-requirement | §ח4 — פרטיות סגורה כלא-חוסמת, אך הכלל הטכני עצמו לא בוטל |

---

## Per-section row counts

| Section | Rows |
|---|---|
| draft §1 principles | 5 |
| draft §2 data mapping | 9 |
| draft §3 דוח 1 | 10 |
| draft §3 דוח 2 | 9 |
| draft §3 דוח 3 | 8 |
| draft §3 דוח 4 | 9 |
| draft §3 דוח 5 | 12 |
| draft §3 דוח 6 | 10 |
| draft §3 דוח 7 | 10 |
| draft §3 דוח 8 | 9 |
| draft §3 דוח 9 | 10 |
| draft §3 דוח 10 | 9 |
| draft §3 דוח 11 | 9 |
| draft §3 דוח 12 | 8 |
| draft §3 דוח 13 | 8 |
| draft §3 דוח 14 | 9 |
| draft §3 דוח 14א | 12 |
| draft §3 דוח 15 | 8 |
| draft §3 דוח 16 | 9 |
| draft §3 דוח 17 | 10 |
| draft §3 דוח 18 | 9 |
| draft §3 דוח 19 | 7 |
| draft §3 דוח 20 | 9 |
| draft §4 מודל 1 | 5 |
| draft §4 מודל 2 | 4 |
| draft §4 מודל 3 | 3 |
| draft §4 מודל 4 | 3 |
| draft §4 מודל 5 | 4 |
| draft §4 מודל 6 | 14 |
| draft §5 AI | 8 |
| draft §6.1 layout | 8 |
| draft §6.2 permissions | 5 |
| draft §6.3 flow | 4 |
| draft §6.4 colors | 5 |
| draft §6.5 personas | 7 |
| draft §6.6 widgets | 6 |
| draft §6.7 mechanisms | 7 |
| draft §7 distribution | 8 |
| draft §9 developer blueprint | 14 |
| **TOTAL** | **313** |

Sections read in full and yielding no additional atomic product-level requirements beyond what's captured above: draft §8 (Gap Analysis — pure infra/code-structure: module folder path, `VITE_GEMINI_API_KEY` env var, wiring `App.jsx`; no product-facing requirement not already covered) and draft §10 (closing remarks, no new content). Review sections §ד (timeline/estimate), §ה (what survived clean), §ו (research-depth questions), and §ח1/§ח1א/§ח3/§ח5/§ח6/§ח9 were read in full and used only as sources for the "Already-ruled pointer" column and cross-checks — they do not themselves state module-11 screen/data requirements beyond what the draft already specifies.

## Sentences I could not split with confidence

1. Model 1 formula terms `25·E_shift` and `−30·S_tag` (draft §4 מודל 1, the RiskScore formula) — the draft never defines `E_shift` ("shift-type" factor?) or `S_tag` ("quality-tag" deduction?) in prose anywhere in the 973 lines. I extracted the whole formula as one row (#209) and the two terms that ARE explained in prose (Laplace smoothing, fatigue) as separate edge-rules, but could not confidently carve `E_shift`/`S_tag` into their own atomic requirement rows without inventing what they mean.
2. Model 4 formula term `−30·N_future` (draft §4 מודל 4, the ChurnScore formula) — "N_future" is never defined in prose (number of future bookings? a boolean flag?). Kept inside the whole-formula row (#221) rather than split into its own row.
