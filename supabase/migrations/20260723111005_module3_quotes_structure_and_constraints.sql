-- =====================================================================================
-- מודול 3 (הצעות מחיר) — מיגרציה 1: מבנה ואילוצים (structure & constraints)
-- =====================================================================================
-- why (בלופרינט-מ3, אושר ישי 15/07/2026; הוחל 23/07/2026): מביא את 7 טבלאות-הליבה של מודול 3
-- לצורתן המוכרעת **לפני שנכנס נתון** (quotes=0, quote_services=0 אומת חי לפני ההרצה). הכל אדיטיבי
-- למעט בניית-מחדש של מפתח quote_services והחלפת עמודת-השעות — שתיהן על טבלה ריקה => אפס אובדן-נתונים.
--
-- ⚠️ שער typed-echo (פרוטוקול-DB): פרויקט Supabase משותף. הוחל ידנית ע"י ישי דרך Supabase SQL Editor
--    (fallback — ה-MCP החזיר permission-denied בסשן הזה; מדווח במפורש, לא דילוג-בשקט). אומת חי אחרי
--    ההחלה: line_id PK · sku FK ON UPDATE CASCADE · estimated_hours GENERATED · customer_id NOT NULL ·
--    7 אינדקסים · 4 עמודות-projects · אילוצי-quotes. (הגרסה שהודבקה נשאה הערות-אנגלית לבטיחות-הדבקה
--    ועטיפת BEGIN/COMMIT; ה-DDL זהה בייט-לבייט לקובץ הזה — הערות אינן משפיעות על הסכמה.)

-- ─── params: ייחודיות שם-הפרמטר (§7.40ב) — ה-Seed (מיגרציה 2) יעדכן לפי-שם, חייב מפתח ייחודי ───
alter table params add constraint params_param_name_key unique (param_name);

-- ─── products: יחידת-מידה מתוך רשימה סגורה (§7.82/F13) + טיפוסי-כסף מדויקים (§7.74) ───
alter table products add constraint products_unit_check
  check (unit in ('יחידה', 'פרויקט', 'משמרת', 'מטר'));
alter table products alter column base_price type numeric(12,2);
alter table products alter column cost type numeric(12,2);

-- ─── price_tiers: מחיר-מדרגה מדויק (§7.74) + אילוצי-היגיון (§7.41) + FK ל-sku עם ON UPDATE CASCADE (§7.64) ───
alter table price_tiers alter column special_price type numeric(12,2);
alter table price_tiers add constraint price_tiers_min_qty_check check (min_qty > 0);
alter table price_tiers add constraint price_tiers_max_qty_check
  check (max_qty is null or max_qty >= min_qty);
-- החלפת ה-FK כדי להוסיף ON UPDATE CASCADE: sku הוא מפתח-טבעי (§7.64) — שינוי-שם-מוצר עתידי גורר את המדרגות.
alter table price_tiers drop constraint price_tiers_sku_fkey;
alter table price_tiers add constraint price_tiers_sku_fkey
  foreign key (sku) references products(sku) on delete cascade on update cascade;

-- ─── quote_services: בנייה-מחדש (§7.85) — מפתח סינתטי line_id במקום המפתח-המורכב הישן ───
alter table quote_services drop constraint quote_services_pkey;  -- (quote_id, sku, line_number) המורכב
alter table quote_services add column line_id bigint generated always as identity primary key;
-- §7.28: הקפאת עלות-הרכש בשורה (סימטרי ל-closing_unit_price) — מוקפאת ב-RPC-האישור מ-products.cost.
alter table quote_services add column closing_unit_cost numeric(12,2) not null check (closing_unit_cost >= 0);
alter table quote_services alter column closing_unit_price type numeric(12,2);  -- §7.74
-- §7.41: צבע = ריק (ללא) או אחד מ-5 הצבעים המותרים.
alter table quote_services add constraint quote_services_color_check
  check (color is null or color in ('לבן', 'שחור', 'אפור', 'טורקיז', 'כחול'));
-- שלמות-מספור-התצוגה (תוספת-מקומית, לא חלק מ-§7.85): תואם ל-RPC-החלפת-השורות (מחיקה קודמת להוספה באותה טרנזקציה).
alter table quote_services add constraint quote_services_quote_line_key unique (quote_id, line_number);
-- §7.64: sku FK — restrict-במחיקה (אין מחיקת-מוצר-בשימוש) + cascade-בעדכון (שינוי-שם-מק"ט גורר).
alter table quote_services drop constraint quote_services_sku_fkey;
alter table quote_services add constraint quote_services_sku_fkey
  foreign key (sku) references products(sku) on delete restrict on update cascade;
-- ה-FK של quote_id (on delete cascade) נשאר כמות-שהוא: quotes.quote_id הוא serial סינתטי (בלתי-משתנה) — אין צורך ב-ON UPDATE CASCADE.

-- ─── quotes: snapshots, זמנים, אילוצי-מחזור-חיים, הנחות ───
alter table quotes add column vat_rate_snapshot numeric(5,2);       -- §7.51: מוקפא ב-RPC-האישור (NULL עד אז)
alter table quotes add column rejection_notes text;                 -- §7.82/F3
alter table quotes add column estimated_start_time time not null;   -- §7.82/F23
alter table quotes add column estimated_end_time time not null;     -- §7.82/F23
-- LOCAL-2: estimated_hours הופך מעמודה-מוקלדת לעמודה-מחושבת (GENERATED) מהפרש-הזמנים, עם גלגול-חוצה-חצות (+24).
-- הטבלה ריקה => מחיקה+הוספה בטוחות. §7.30 (רב-יומי) נשמר: אירוע-לילה (סיום<התחלה) => +24 שעות.
alter table quotes drop column estimated_hours;
alter table quotes add column estimated_hours numeric(4,2) generated always as (
  case when estimated_end_time > estimated_start_time
       then extract(epoch from (estimated_end_time - estimated_start_time)) / 3600
       else extract(epoch from (estimated_end_time - estimated_start_time)) / 3600 + 24
  end
) stored;
alter table quotes alter column customer_id set not null;             -- §7.62
alter table quotes alter column applied_customer_discount type numeric(12,2);  -- §7.74
alter table quotes alter column manual_discount type numeric(12,2);            -- §7.74
-- §7.26/F7 + A-9: כל הנחה 0–100, וסכום שתי-ההנחות ≤100 (נאכף גם ב-pricing.js — SSOT).
alter table quotes add constraint quotes_applied_discount_range
  check (applied_customer_discount >= 0 and applied_customer_discount <= 100);
alter table quotes add constraint quotes_manual_discount_range
  check (manual_discount >= 0 and manual_discount <= 100);
alter table quotes add constraint quotes_combined_discount_max
  check (applied_customer_discount + manual_discount <= 100);
-- §7.82/F2: 7 סיבות-דחייה מותרות (או NULL כשלא-נדחתה).
alter table quotes add constraint quotes_rejection_reason_check
  check (rejection_reason is null or rejection_reason in
    ('מחיר', 'חוסר זמינות/לו"ז', 'נבחר מתחרה', 'תקציב לקוח', 'האירוע בוטל אצל הלקוח', 'פג תוקף', 'אחר'));
-- §7.82/F3: הסיבה 'אחר' מחייבת טקסט-הסבר.
alter table quotes add constraint quotes_rejection_notes_required
  check (rejection_reason is distinct from 'אחר' or rejection_notes is not null);
-- §7.82/F16: "נדחתה" ⇔ קיימת סיבה (סטטוס-דחייה וסיבת-דחייה נעים יחד).
alter table quotes add constraint quotes_rejected_iff_reason
  check ((quote_status = 'rejected') = (rejection_reason is not null));

-- ─── projects: snapshot-זהות + זמני-אירוע (ה-RPC-האישור ממלא אותם בהמרה) ───
alter table projects add column event_name text;                                      -- §7.76: snapshot שם-האירוע
alter table projects add column customer_id bigint references customers(customer_id);  -- LOCAL-5: snapshot-לקוח (FK חדש)
alter table projects add column final_start_time time;                                -- LOCAL-1: נזרע מההצעה, ניתן-לעריכה על הפרויקט
alter table projects add column final_end_time time;                                  -- LOCAL-1

-- ─── logistics: FK ל-sku עם ON UPDATE CASCADE (§7.64) — ה-RPC-האישור הוא הכותב-הראשון לטבלה ───
alter table logistics drop constraint logistics_sku_fkey;
alter table logistics add constraint logistics_sku_fkey
  foreign key (sku) references products(sku) on delete restrict on update cascade;

-- ─── אינדקסי-כיסוי C-1 (עמודות-FK) + C-6 (סריקת-הפקיעה היומית / מבט "פג-בקרוב") ───
create index if not exists quotes_customer_id_idx      on quotes (customer_id);            -- C-1
create index if not exists quotes_status_updated_idx   on quotes (quote_status, updated_at); -- C-6
create index if not exists quote_services_sku_idx      on quote_services (sku);             -- C-1
create index if not exists quote_services_quote_id_idx on quote_services (quote_id);        -- C-1
create index if not exists projects_customer_id_idx    on projects (customer_id);           -- C-1 (FK חדש, LOCAL-5)
create index if not exists projects_owner_email_idx    on projects (owner_email);           -- C-1 (FK קיים בלי אינדקס; מ3 = first-touch)
create index if not exists logistics_sku_idx           on logistics (sku);                  -- C-1 (FK קיים בלי אינדקס; מ3 = first-touch)
