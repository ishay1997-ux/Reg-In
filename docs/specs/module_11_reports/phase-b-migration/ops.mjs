// The phase-B text migration, as data. Every op is either { find, with } (exact text, once;
// `all: true` = every occurrence) or { from, to, back?, with } (a span, `to` inclusive).
// The rules each op serves (plan 2026-09-17-module-11-typography.md, Ishay's rulings 23/09):
// mode 0 = name · number · comparison · one scope chip (population.summary) · one action line;
// no "אינו מושפע" disclaimers, no design statements (כ7), no internal codes (כ4) on screen.
export const FILES = {
  report_m02_exec_overview: '20260917105300_module11_j3_money_gate_grants_rank_months.sql',
  report_m07_finance_overview: '20260917105300_module11_j3_money_gate_grants_rank_months.sql',
  report_m14_hostess_overview: '20260917105300_module11_j3_money_gate_grants_rank_months.sql',
  report_m19_customers_overview: '20260917105300_module11_j3_money_gate_grants_rank_months.sql',
  report_m21_drifting: '20260917105300_module11_j3_money_gate_grants_rank_months.sql',
  report_m08_profitability: '20260917021500_module11_j2_rpc_round5.sql',
  report_m09_aging: '20260917021500_module11_j2_rpc_round5.sql',
  report_m12_equipment: '20260917021500_module11_j2_rpc_round5.sql',
  report_m15_reliability: '20260917021500_module11_j2_rpc_round5.sql',
  report_m17_fairness: '20260917021500_module11_j2_rpc_round5.sql',
  report_m20_satisfaction: '20260917021500_module11_j2_rpc_round5.sql',
  report_m22_notes: '20260917021500_module11_j2_rpc_round5.sql',
  report_m16_quality_cost: '20260917005500_module11_j1_rpc_round4.sql',
}

const DRILL_NOTE = "'הדף אינו דוח-קידוח (📐13) — פרמטר הקידוח לא הופעל.'"
const DRILL_NOTE_NEW = "'הדוח הזה אינו תומך בקידוח.'"

export const OPS = {
  report_m02_exec_overview: [
    {
      why: 'so_what: no prior year',
      from: "v_so_what := 'לשים לב שאין טווח מקביל אשתקד למדוד מולו — ' ||",
      to: "'%' || v_pdi || '.';",
      with: "v_so_what := 'לשים לב שאין טווח מקביל אשתקד להשוואה; שולי-הרווח עומדים על ' ||\n      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || '.';",
    },
    {
      why: 'so_what: growth, margin up',
      from: "v_so_what := 'לשים לב שהצמיחה השנה לא באה על חשבון הרווח — ' ||",
      to: "'. הפירוט בדוח «מגמות רב-שנתיות».';",
      with: "v_so_what := 'לשים לב שההכנסות גבוהות ב-' ||\n      v_lri || to_char(round(v_growth, 1), 'FM990.0') || '%' || v_pdi || ' מאשתקד, ושולי-הרווח עלו ל-' ||\n      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || '.';",
    },
    {
      why: 'so_what: growth, margin down',
      from: "v_so_what := 'לשים לב שהצמיחה השנה באה על חשבון הרווח — ' ||",
      to: "'. הפירוט בדוח «מגמות רב-שנתיות».';",
      with: "v_so_what := 'לשים לב שההכנסות גבוהות ב-' ||\n      v_lri || to_char(round(v_growth, 1), 'FM990.0') || '%' || v_pdi || ' מאשתקד, אך שולי-הרווח ירדו ל-' ||\n      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || ' מ-' ||\n      v_lri || to_char(round(v_prev_margin, 1), 'FM990.0') || '%' || v_pdi || '.';",
    },
    {
      why: 'so_what: decline',
      from: "v_so_what := 'לשים לב שההכנסות נמוכות מאותו טווח אשתקד — ' ||",
      to: "'. הפירוט בדוח «מגמות רב-שנתיות».';",
      with: "v_so_what := 'לשים לב שההכנסות נמוכות ב-' ||\n      v_lri || to_char(round(-v_growth, 1), 'FM990.0') || '%' || v_pdi || ' מאשתקד; שולי-הרווח עומדים על ' ||\n      v_lri || to_char(round(v_margin, 1), 'FM990.0') || '%' || v_pdi || '.';",
    },
    {
      why: 'scope chip + readable population sentence',
      from: "'label', 'אוכלוסייה: אירועים שכבר התקיימו וסגורים תפעולית",
      to: "' אירועים של הלקוח).' end,",
      with: "'summary', v_lri || to_char(v_n, 'FM999,999,999') || v_pdi || ' אירועים שהסתיימו · מתוך ' ||\n        v_lri || to_char(v_projects_all, 'FM999,999,999') || v_pdi,\n      'label', 'נכללים אירועים שכבר התקיימו: הסתיים, ממתין לסגירה, ממתין לחשבונית או ממתין לתשלום. לא נכללים אירועים עתידיים, בתהליך או מבוטלים.',",
    },
    { why: 'tile revenue: sub → chip', find: "'sub', v_lri || to_char(v_n, 'FM999,999,999') || v_pdi || ' אירועים שהסתיימו',", with: "'sub', null," },
    { why: 'tile revenue: compare note', find: "'note', v_lri || to_char(v_prev_n, 'FM999,999,999') || v_pdi || ' אירועים',", with: "'note', null," },
    { why: 'tile margin: definition sub', from: "'sub', v_lri || to_char(round(v_prof), 'FM999,999,999') || ' ₪' || v_pdi || ' רווח מתוך ' ||", to: "' הכנסה',", with: "'sub', null," },
    { why: 'tile events: definition sub', find: "'sub', 'ארבעת המצבים — פרויקט הסתיים · ממתין לסגירה · ממתין לחשבונית · ממתין לתשלום',", with: "'sub', null," },
    { why: 'tile top5: amounts → definitions', from: "'sub', v_lri || to_char(round(v_top5), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך ' ||", to: "' רשומים)',", with: "'sub', null," },
    { why: 'tile top5: fact instead of disclaimer', find: "'window', 'כל הזמנים · אינו מושפע ממסנן התקופה',", with: "'window', case when p_customer_id is null then 'כל הזמנים' else 'כל הזמנים · כל הלקוחות' end," },
    { why: 'tile top5: compare note', from: "'note', 'אז ' || v_lri || to_char(v_prev_ncust, 'FM999,999,999')", to: "' לקוחות עם הכנסה',", with: "'note', null," },
    { why: 'note: customer disclaimer (the tile window says it)', from: "'אריח «נתח 5 הלקוחות הגדולים» נמדד על כל הלקוחות", back: 'if p_customer_id is not null then', to: 'end if;', with: '-- ✏️ פזה ב׳ 23/09/2026: הסייג עבר לחלון-האריח ("כל הזמנים · כל הלקוחות").' },
    { why: 'note: internal code', find: "'מבט-על הנהלה אינו דוח-קידוח (📐13) — פרמטר הקידוח מתעלמים ממנו.'", with: DRILL_NOTE_NEW },
    {
      why: 'definitions: + the top-5 amounts that left the tile',
      from: "'definitions', 'שולי-רווח = סך הרווח הגולמי חלקי סך ההכנסה",
      to: "בשנה שעברה.',",
      with: "'definitions', 'שולי-רווח = סך הרווח הגולמי חלקי סך ההכנסה, על כל האירועים יחד · רווח גולמי = הכנסה פחות עלויות ישירות (דיילות, ציוד, נסיעות), בלי הוצאות משרד · נתח 5 הלקוחות הגדולים = ' ||\n      v_lri || to_char(round(v_top5), 'FM999,999,999') || ' ₪' || v_pdi || ' מתוך ' ||\n      v_lri || to_char(round(v_total_rev), 'FM999,999,999') || ' ₪' || v_pdi || ', על כל ההיסטוריה · \"אשתקד\" = אותם ימים בדיוק בשנה שעברה.',",
    },
  ],

  report_m07_finance_overview: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · הוצאו: חובות אבודים ('",
      with: "'summary', v_lri || v_open_n || v_pdi || case when v_open_n = 1 then ' חשבונית פתוחה' else ' חשבוניות פתוחות' end,\n      'label', 'אוכלוסייה: חשבוניות שנשלחו וטרם שולמו · הוצאו: חובות אבודים ('",
    },
    { why: 'population: disclaimer', find: "' חשבוניות, נכון להיום — צילום-רגע שאינו מושפע ממסנן התקופה. '", with: "' חשבוניות, נכון להיום. '" },
    {
      why: 'so_what: one action, the balance is on its tile',
      from: "|| ', אצל ' || coalesce(v_oldest_name, '—') || '; יתרת-החוב כולה עומדת על '",
      to: "' ₪' || v_pdi || '.' end,",
      with: "|| ', אצל ' || coalesce(v_oldest_name, '—') || '.'\n  else 'אין חוב מעל ' || v_lri || '60' || v_pdi || ' יום.' end,",
    },
    { why: 'tile open_debt: fact', find: "'window', 'נכון להיום · אינו מושפע ממסנן התקופה',", with: "'window', 'נכון להיום'," },
    { why: 'tile open_debt: count → chip', from: "'sub', v_lri || v_open_n || v_pdi", to: "' חשבוניות פתוחות' end,", with: "'sub', null," },
    { why: 'tile expected: keep the caveat, short', find: "' · הערכה לפי התנהגות-תשלום היסטורית, לא התחייבות של הלקוח'", with: "' · הערכה, לא התחייבות'" },
    { why: 'tile expected: compare note short', find: "'אינה אותה נוסחה — השוואה רטרוספקטיבית; התחזית של לפני חודש לא שוחזרה'", with: "'לא אותה נוסחה'" },
    {
      why: 'note: disclaimer',
      from: "'העמודה האחרונה בגרף היא נכון ל-'",
      to: "ואינן זזות עם מסנן התקופה.'),",
      with: "'העמודה האחרונה בגרף היא נכון ל-' || v_lri || to_char(v_to, 'DD/MM') || v_pdi || ' ואינה סוף-חודש.'),",
    },
  ],

  report_m08_profitability: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · '",
      with: "'summary', v_lri || v_n || v_pdi || ' פרויקטים שהתקיימו וחויבו',\n      'label', 'אוכלוסייה: אירועים שהתקיימו ויצאה להם חשבונית — פרויקט הסתיים · ממתין לסגירה · '",
    },
    {
      why: 'so_what: one project, one number',
      from: "|| ' מעל התכנון); בסך-הכול חרגו '",
      to: "' ₪' || v_pdi || ' אשתקד.'",
      with: "|| ' מעל התכנון).'",
    },
    { why: 'tile projects: sub → chip', find: "'sub', 'אירועים שהתקיימו ויצאה להם חשבונית',", with: "'sub', null," },
    { why: 'tile over: compare note', from: "'note', v_lri || to_char(round(100.0 * v_prev_over / nullif(v_prev_n, 0), 1)", to: "' מהאירועים',", with: "'note', null," },
    { why: 'tile sum: caveat, short', find: "'חריגה כלפי-מעלה בלבד — חיסכון בפרויקט אחד אינו מקזז חריגה באחר'", with: "'חריגה כלפי-מעלה בלבד'" },
    { why: 'tile margin: definition', find: "'sub', 'סך הרווח חלקי סך ההכנסה, על אותה אוכלוסייה',", with: "'sub', null," },
    { why: 'tile median: definition', from: "'sub', 'החציון של כל ' ||", to: "' הפרויקטים בתקופה — חצי מעליו וחצי מתחתיו',", with: "'sub', null," },
  ],

  report_m09_aging: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ('",
      with: "'summary', v_lri || v_total_n || v_pdi || ' חשבוניות פתוחות',\n      'label', 'אוכלוסייה: חשבוניות שנשלחו, טרם שולמו ולא נמחקו כחוב-אבוד · הוצאו: חוב אבוד ('",
    },
    { why: 'population: disclaimer', find: "' · נכון להיום — זהו צילום-רגע ולא סיכום-תקופה, ואינו מושפע ממסנן התקופה. '", with: "' · נכון להיום. '" },
    { why: 'tiles: fact', all: true, find: "'נכון להיום · אינו מושפע ממסנן התקופה'", with: "'נכון להיום'" },
    { why: 'tiles: fact', all: true, find: "'כל הזמנים · אינו מושפע ממסנן התקופה'", with: "'כל הזמנים'" },
    { why: 'tile median: DSO aside → definitions', all: true, from: "' חשבוניות ששולמו, כל הזמנים · אינו '", to: "|| v_lri || 'DSO' || v_pdi,", with: "' חשבוניות ששולמו'," },
    {
      why: 'chart note: ~600 chars → one sentence',
      from: 'v_chart_note :=',
      to: "'גובה העמודה = הסכום שממתין באותו מדרג; המספר שמתחת לשם המדרג = כמה חשבוניות.';",
      with: "v_chart_note := 'העמודות הן החוב שכבר איחר, לפי ותק; חוב שמועדו טרם הגיע מופיע באריח שלצד הגרף.';",
    },
    { why: 'chart datum: the same door the row uses', find: "jsonb_build_object('bucket', b.l, 'bucket_key', b.k,", with: "jsonb_build_object('bucket', b.l, 'bucket_key', b.k, 'drill_key', jsonb_build_object('bucket', b.k)," },
    {
      why: 'note: disclaimer',
      from: "|| v_lri || coalesce(to_char(v_oldest_sent, 'DD/MM/YYYY'), '—') || v_pdi || '.',",
      to: "מסנן-התקופה אינו מזיז אותם.'),",
      with: "|| v_lri || coalesce(to_char(v_oldest_sent, 'DD/MM/YYYY'), '—') || v_pdi || '.'),",
    },
  ],

  report_m12_equipment: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: כל ' || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi",
      with: "'summary', v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi || ' שורות ציוד',\n      'label', 'אוכלוסייה: כל ' || v_lri || to_char(v_total_rows, 'FM999,999,999') || v_pdi",
    },
    { why: 'tile cost: count', from: "'sub', v_lri || v_rows_window || v_pdi", to: "' שורות-לוגיסטיקה בתקופה' end,", with: "'sub', null," },
    { why: 'tile all-time: aside', from: "'sub', 'סכום ' || v_lri || v_sku_n || v_pdi", to: "' המוצרים בטבלה למטה',", with: "'sub', null," },
    {
      why: 'notes: two repeat a tile and a hint',
      from: "' — בשאר, \"הגיע בפועל\" הועתק מהמתוכנן ולא נמדד.',",
      to: "'\"כמות להזמנה\" היא תקרה עליונה: יש להפחית ממנה הזמנות-רכש שכבר יצאו.'),",
      with: "' — בשאר, \"הגיע בפועל\" הועתק מהמתוכנן ולא נמדד.'),",
    },
  ],

  report_m14_hostess_overview: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: שיבוצים שסומנה בהם נוכחות, באירוע שכבר התקיים ובפרויקט שלא בוטל · n=' ||",
      with: "'summary', to_char(coalesce(v_pop_n, 0), 'FM999,999,999') || ' שיבוצים · ' || to_char(coalesce(v_pop_hosts, 0), 'FM999,999,999') || ' דיילות',\n      'label', 'אוכלוסייה: שיבוצים שסומנה בהם נוכחות, באירוע שכבר התקיים ובפרויקט שלא בוטל · n=' ||",
    },
    { why: 'note: customer disclaimer (the filter bar states the fact)', from: "'הדף אינו מושפע ממסנן הלקוח — ציון-האמינות", back: 'if p_customer_id is not null then', to: 'end if;', with: '-- ✏️ פזה ב׳ 23/09/2026: שורת-המסננים אומרת "לקוח · כל הלקוחות"; הסייג ירד.' },
    { why: 'note: the tile window already says it', from: "('אריח \"דיילות אדומות\" נמדד תמיד על 12 החודשים", back: 'v_notes := v_notes || to_jsonb(', to: ')::text);', with: '-- ✏️ פזה ב׳ 23/09/2026: חלון-האריח ("חלון קבוע · 12 חודשים") אומר זאת; ההערה ירדה.' },
  ],

  report_m15_reliability: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: דיילות עם ' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') ||",
      with: "'summary', to_char(coalesce(v_in_report, 0), 'FM999,999,999') || ' דיילות עם ' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') || ' משמרות ומעלה',\n      'label', 'אוכלוסייה: דיילות עם ' || coalesce(to_char(v_min_sample, 'FM999,999,999'), '—') ||",
    },
    { why: 'window: the fact label shown instead of dead pills', find: "'label', 'חלון קבוע · 12 החודשים האחרונים'", with: "'label', '12 החודשים האחרונים'" },
    { why: 'meta: declare the period is ignored (dead pills until now)', find: "'customer_filter_ignored', true,", with: "'customer_filter_ignored', true,\n      'period_filter_ignored', true," },
    { why: 'note: period disclaimer', from: "'החלון כאן קבוע על 12 חודשים ואינו זז", back: 'if p_from is not null or p_to is not null then', to: 'end if;', with: '-- ✏️ פזה ב׳ 23/09/2026: שורת-המסננים אומרת "תקופה · 12 החודשים האחרונים"; הסייג ירד.' },
    { why: 'note: customer disclaimer', from: "'הדף אינו מושפע ממסנן הלקוח — הציון והספים", back: 'if p_customer_id is not null then', to: 'end if;', with: '-- ✏️ פזה ב׳ 23/09/2026: שורת-המסננים אומרת "לקוח · כל הלקוחות"; הסייג ירד.' },
    { why: 'tile on_time: window = page period now', find: "'window', 'חלון קבוע · 12 חודשים',", all: true, with: "'window', null," },
  ],

  report_m16_quality_cost: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: דיילות פעילות בלבד — n=' ||",
      with: "'summary', to_char(coalesce(v_active, 0), 'FM999,999,999') || ' דיילות פעילות · מתוך ' || to_char(coalesce(v_registered, 0), 'FM999,999,999'),\n      'label', 'אוכלוסייה: דיילות פעילות בלבד — n=' ||",
    },
    {
      why: 'so_what: shorter',
      from: "else 'להוריד את התעריף של '",
      to: "' הפעילות שאין להן דירוג.' end,",
      with: "else 'להוריד את התעריף של ' || to_char(coalesce(v_expensive, 0), 'FM999,999,999') || ' הדיילות היקרות בדירוג 3 ומטה, ולדרג את ' ||\n       to_char(coalesce(v_no_rating, 0), 'FM999,999,999') || ' שאין להן דירוג.' end,",
    },
    { why: 'note: customer disclaimer', from: "'הדף אינו מושפע ממסנן הלקוח — התעריף והדירוג", back: 'if p_customer_id is not null then', to: 'end if;', with: '-- ✏️ פזה ב׳ 23/09/2026: שורת-המסננים אומרת "לקוח · כל הלקוחות"; הסייג ירד.' },
  ],

  report_m17_fairness: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: כל דיילת עם משמרת מאושרת אחת לפחות בחלון — ' ||",
      with: "'summary', v_lri || coalesce(v_n, 0) || v_pdi || ' דיילות · ' || v_lri || to_char(coalesce(v_invites, 0), 'FM999,999') || v_pdi || ' זימונים',\n      'label', 'אוכלוסייה: כל דיילת עם משמרת מאושרת אחת לפחות בחלון — ' ||",
    },
    { why: 'note: customer disclaimer', from: "'הדף אינו מושפע ממסנן הלקוח — ההוגנות", back: 'if p_customer_id is not null then', to: 'end if;', with: '-- ✏️ פזה ב׳ 23/09/2026: שורת-המסננים אומרת "לקוח · כל הלקוחות"; הסייג ירד.' },
    { why: 'note: repeats the tile', from: "'אימוץ המלצת Smart Match — אין עדיין נתון", back: 'if coalesce(v_rank_total, 0) = 0 then', to: 'end if;', with: '-- ✏️ פזה ב׳ 23/09/2026: האריח עצמו אומר "טרם נמדד"; ההערה ירדה.' },
    {
      why: 'note: repeats the hint',
      from: "'notes', v_notes || to_jsonb(",
      to: "קצר מהזמן שבאמת חיכית.')::text),",
      with: "'notes', v_notes,",
    },
    {
      why: 'tile rank1: short state',
      from: "then 'טרם נמדד · אין עדיין נתון:",
      to: "v_lri || '0%' || v_pdi",
      with: "then 'טרם נמדד — הרישום התחיל רק עכשיו'",
    },
    { why: 'tile p90: aside', find: "'שעות · אחת מכל עשר תשובות מגיעה לאט מזה — שם יושב הכאב של איוש שנתקע, לא בחציון'", with: "'שעות'" },
    { why: 'tile gini: compare note (the hint says it)', find: "'חלק מהשינוי הוא שינוי-אוכלוסייה ולא שינוי-התנהגות'", with: 'null' },
    {
      why: 'chart note: one sentence',
      from: "'note', 'הקו הישר הוא חלוקה שווה לגמרי.",
      to: "'משמאל לעמוסה-ביותר מימין.',",
      with: "'note', 'הקו הישר הוא חלוקה שווה; ככל שהעקומה רחוקה ממנו — החלוקה ריכוזית יותר.',",
    },
  ],

  report_m19_customers_overview: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: משובים שנשלחו ולא נענו ('",
      with: "'summary', v_lri || to_char(v_pop_n, 'FM999,999,999') || v_pdi || ' משובים · מתוך ' || v_lri || to_char(v_pop_sent, 'FM999,999,999') || v_pdi || ' שנשלחו',\n      'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: משובים שנשלחו ולא נענו ('",
    },
    {
      why: 'so_what: one line',
      from: "else 'לפתוח את \"שביעות רצון\" ולראות מה מכעיס את '",
      to: "'4.5+' || v_pdi || ').' end,",
      with: "else 'לפתוח את \"שביעות רצון\" — ' || v_lri || to_char(v_uns_cnt, 'FM999,999,999') || v_pdi\n       || ' הלקוחות הלא-מרוצים לא הזמינו כבר ' || v_lri || v_uns_med || v_pdi || ' ימים, מול '\n       || v_lri || v_sat_med || v_pdi || ' אצל המרוצים.' end,",
    },
    { why: 'tile windows: disclaimer suffix', all: true, find: ' · אינו מושפע ממסנן התקופה', with: '' },
    {
      why: 'notes: two disclaimers',
      from: "|| to_jsonb('ארבעת האריחים נמדדים על כל הזמנים",
      to: "ואינם מושפעים ממסנן הלקוח.'::text)",
      with: '',
    },
    { why: 'note: internal code', find: DRILL_NOTE, with: DRILL_NOTE_NEW },
    {
      why: 'tile satisfaction: sub short',
      from: "'sub', 'חציון ימים מאז האירוע האחרון: לקוחות מרוצים",
      to: "' ימים',",
      with: "'sub', 'ימים מאז האירוע האחרון (חציון) — מרוצים מול לא-מרוצים',",
    },
  ],

  report_m20_satisfaction: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: ' || v_lri || to_char(v_no_resp, 'FM999,999,999') || v_pdi",
      with: "'summary', v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים שמולאו · מתוך ' || v_lri || to_char(v_held, 'FM999,999,999') || v_pdi || ' אירועים',\n      'label', 'אוכלוסייה: משובים שהלקוח מילא · הוצאו: ' || v_lri || to_char(v_no_resp, 'FM999,999,999') || v_pdi",
    },
    {
      why: 'so_what: shorter',
      from: "then 'לפתוח את ' || v_lri || to_char(v_other_n, 'FM999,999,999') || v_pdi",
      to: "'), ואיש לא קרא את הטקסט שבהם.'",
      with: "then 'לקרוא את ' || v_lri || to_char(v_other_n, 'FM999,999,999') || v_pdi\n         || ' המשובים שתויגו \"אחר\" — יותר מכל הסיבות האחרות יחד, ואיש עוד לא קרא אותם.'",
    },
    {
      why: 'charts: delete "מה מכעיס" and "שיעור המרוצים לפי שנה" (Ishay, plan §6)',
      from: "'title', 'מה מכעיס · '",
      back: "'filter_key', false),",
      to: "'filter_key', false))",
      with: "'filter_key', false))",
    },
    {
      why: 'chart "מה משמח": the note compared it to the deleted chart',
      from: "'note', 'הסולם כאן עצמאי ואינו משותף לגרף השלילי שלצידו",
      to: "'אחד אינו מייצג את אותו מספר בגרף השני.',",
      with: '',
    },
    {
      why: 'notes: the deleted chart + a design statement',
      from: "|| to_jsonb('גרף המגמה השנתית",
      to: "ולא באחוזים.'::text)",
      with: '',
    },
    { why: 'note: internal code', find: DRILL_NOTE, with: DRILL_NOTE_NEW },
  ],

  report_m21_drifting: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: ' || v_lri || to_char(v_elig, 'FM999,999,999') || v_pdi || ' לקוחות שקיימו '",
      with: "'summary', v_lri || to_char(v_elig, 'FM999,999,999') || v_pdi || ' לקוחות עם 3+ אירועים · מתוך ' || v_lri || to_char((v_counts ->> 'customers')::integer, 'FM999,999,999') || v_pdi,\n      'label', 'אוכלוסייה: ' || v_lri || to_char(v_elig, 'FM999,999,999') || v_pdi || ' לקוחות שקיימו '",
    },
    {
      why: 'so_what: two calls, no second sum',
      from: "|| ' ופי ' || v_lri || (v_call #>> '{1,ratio}') || v_pdi || ' מהקצב שלהן, יחד '",
      to: "' בשנה האחרונה, ושתיהן עדיין לא נחשבות \"רדומות\".' end,",
      with: "|| ' ופי ' || v_lri || (v_call #>> '{1,ratio}') || v_pdi || ' מהקצב שלהן.' end,",
    },
    { why: 'tile window: disclaimer suffix', find: " || ' · אינו מושפע ממסנן התקופה'", with: '' },
    {
      why: 'note: disclaimer',
      from: "|| to_jsonb('האריחים וההיסטוגרמה נמדדים",
      to: "הטבלה כן.'::text)",
      with: '',
    },
    { why: 'note: internal code', find: DRILL_NOTE, with: DRILL_NOTE_NEW },
  ],

  report_m22_notes: [
    {
      why: 'scope chip',
      find: "'label', 'אוכלוסייה: הערות חופשיות שלקוחות כתבו בטופס המשוב · '",
      with: "'summary', v_lri || to_char(v_with_note, 'FM999,999,999') || v_pdi || ' הערות · מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים',\n      'label', 'אוכלוסייה: הערות חופשיות שלקוחות כתבו בטופס המשוב · '",
    },
    { why: 'population: disclaimer', find: " הדף אינו מגיב למסנן התקופה — הוא מציג את תוצאת כל ריצות-הניתוח שאושרו.'", with: "'" },
    {
      why: 'tile other_vs_categories: the same v_other twice (Ishay, plan §6)',
      from: "'key', 'other_vs_categories',",
      back: 'jsonb_build_object(',
      to: "'target', null),",
      with: '',
    },
    { why: 'meta: the deleted tile', find: "'free_notes', 'other_tagged_notes', 'other_vs_categories'),", with: "'free_notes', 'other_tagged_notes')," },
    {
      why: 'notes: two disclaimers',
      from: "|| to_jsonb('הדף אינו מגיב למסנן התקופה",
      to: "הטבלה כן מושפעים ממנו.'::text)",
      with: '',
    },
    { why: 'tile free_notes: compare label', find: "'אין תקופה קודמת להשוואה — זהו המצאי המצטבר, לא מדד תקופתי'", with: "'אין תקופה קודמת להשוואה'" },
    { why: 'note: internal code', find: DRILL_NOTE, with: DRILL_NOTE_NEW },
  ],
}
