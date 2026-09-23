// ops-l5.mjs — text round 5 (L5), 23/09/2026 night. Built on the LIVE bodies after L4 (bodies.mjs postL4,
// md5 13/13 == live, measured the same night). Every op here answers a failure of the density check
// (`e2e/report-density.spec.js`, rules of plan §4ה) or of Ishay's card standard (plan §4ד):
// a card = name · number · comparison · at most one short context line; the period is stated once;
// a claim belongs in the "so what" line, not in a card name; a card value is a number, never a name.
// Nothing here changes a number, a population or a column — only the words around them.
const LOST_OLD =
  "'חובות אבודים: ' || v_lri || v_written_n || v_pdi\n" +
  "          || case when v_written_n = 1 then ' חשבונית · ' else ' חשבוניות · ' end\n" +
  "          || v_lri || to_char(round(v_written_sum), 'FM999,999,999') || ' ₪' || v_pdi\n" +
  "          || ' — מוחרגים מהיתרה ומכל המדרגים.'"
// Same idea, same words in M07 and M09 (data-surfaces §2b, test 2).
const LOST_NEW =
  "v_lri || v_written_n || v_pdi\n" +
  "          || case when v_written_n = 1 then ' חוב אבוד (' else ' חובות אבודים (' end\n" +
  "          || v_lri || to_char(round(v_written_sum), 'FM999,999,999') || ' ₪' || v_pdi\n" +
  "          || ') אינם ביתרה ובמדרגים.'"

export const OPS = {
  report_m07_finance_overview: [
    { why: 'lost-debt note: shorter, same words as M09', find: LOST_OLD, with: LOST_NEW },
    {
      why: 'compare label wrapped to 2 lines in the card',
      find: "'label', 'שנכנסו בפועל ב-30 הימים האחרונים',",
      with: "'label', 'נכנסו ב-30 הימים שחלפו',",
    },
  ],
  report_m08_profitability: [
    {
      why: 'footnote over the page budget (0.9)',
      find:
        "' פרויקטים קטנים (פחות מ-' || v_lri || '4' || v_pdi || ' שעות או מ-'\n" +
        "          || v_lri || '1,000' || ' ₪' || v_pdi || ' עלות-עבודה) נספרים בסכומים, אבל לא בדירוג החריגות.',",
      with:
        "' פרויקטים קטנים (מתחת ל-' || v_lri || '4' || v_pdi || ' שעות או '\n" +
        "          || v_lri || '1,000' || ' ₪' || v_pdi || ') אינם בדירוג החריגות.',",
    },
    {
      why: 'footnote over the page budget (0.9)',
      find: "' הפרויקטים; בשאר הוא מחושב מהעלויות שנרשמו עד היום.' end),",
      with: "' פרויקטים; בשאר — לפי העלויות עד היום.' end),",
    },
  ],
  report_m09_aging: [
    {
      why: 'chart note > 60 (0.6)',
      find: "v_chart_note := 'העמודות הן החוב שכבר איחר, לפי ותק; חוב שמועדו טרם הגיע מופיע באריח שלצד הגרף.';",
      with: "v_chart_note := 'חוב שכבר איחר, לפי ותק. חוב שוטף — באריח שליד הגרף.';",
    },
    { why: 'lost-debt note: shorter, same words as M07', find: LOST_OLD, with: LOST_NEW },
    {
      why: 'oldest-invoice footnote repeats the first table row (R27) and breaks the budget (0.9)',
      from: ",\n        'החשבונית הישנה ביותר: ' || v_lri || coalesce(v_oldest_days, 0) || v_pdi || ' ימי איחור · '",
      to: "|| v_pdi || '.'),",
      with: "),",
    },
  ],
  report_m12_equipment: [
    {
      why: 'period in a card name (0.8) — "כל הזמנים" stays in the ⓘ (window)',
      find: "'label', 'עלות ציוד — כל הזמנים',",
      with: "'label', 'עלות ציוד מצטברת',",
    },
  ],
  report_m16_quality_cost: [
    {
      why: 'chart note > 60 (0.6)',
      find: "' דיילות ללא דירוג אינן בגרף — ראי את השבב ''בלי דירוג בלבד'' בטבלה.',",
      with: "' בלי דירוג אינן בגרף — הן בשבב ''בלי דירוג בלבד''.',",
    },
  ],
  report_m17_fairness: [
    {
      why: 'chart note > 60 (0.6)',
      find: "'note', 'הקו הישר הוא חלוקה שווה; ככל שהעקומה רחוקה ממנו — החלוקה ריכוזית יותר.',",
      with: "'note', 'הקו הישר הוא חלוקה שווה; ככל שהעקומה רחוקה ממנו — ריכוזי יותר.',",
    },
  ],
  report_m19_customers_overview: [
    {
      why: 'claim as card name (0.1) — the claim is already the so_what line',
      find: "'label', 'שביעות-רצון מנבאת חזרה',",
      with: "'label', 'ימים מאז אירוע, מרוצים',",
    },
    {
      why: 'context line > 30 (0.3)',
      find: "'sub', 'ימים מאז האירוע האחרון (חציון) — מרוצים מול לא-מרוצים',",
      with: "'sub', 'חציון · ' || v_lri || to_char(v_in_buckets, 'FM999,999,999') || v_pdi || ' לקוחות',",
    },
    {
      why: 'comparison label: plain words',
      find: "'label', 'לקוחות לא-מרוצים',",
      with: "'label', 'לא-מרוצים',",
    },
    {
      why: 'claim as card name (0.1)',
      find: "'label', 'הסיבה השלילית הגדולה אינה קטגוריה',",
      with: "'label', 'משובים שליליים «אחר»',",
    },
    {
      why: 'context line: base of the number, short',
      find:
        "'sub', 'תויגו \"אחר\" מתוך ' || v_lri || to_char(v_neg_total, 'FM999,999,999') || v_pdi\n" +
        "               || ' משובים שליליים',",
      with: "'sub', 'מתוך ' || v_lri || to_char(v_neg_total, 'FM999,999,999') || v_pdi || ' שליליים',",
    },
    {
      why: 'a per-year breakdown is not a comparison (0.3) — it moves to the ⓘ',
      find:
        "'window', 'כל הזמנים · לכל ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi\n" +
        "                  || ' יש הערה חופשית',\n" +
        "        'compare', jsonb_build_object(\n" +
        "          'value', coalesce(v_other_year_txt, '—'),\n" +
        "          'label', 'פילוח לפי שנה (השנה הנוכחית חלקית)', 'direction', 'flat'),",
      with:
        "'window', 'כל הזמנים · לכל ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi\n" +
        "                  || ' יש הערה חופשית · לפי שנה (השנה הנוכחית חלקית): ' || coalesce(v_other_year_txt, '—'),\n" +
        "        'compare', null,",
    },
    {
      why: 'claim as card name (0.1)',
      find: "'label', 'הריכוזיות והנטישה עוד לא נפגשות',",
      with: "'label', 'גדולים שמתרחקים',",
    },
    {
      why: 'bare 0 needs its base visible (0.2); the percent moves to the ⓘ',
      from: "'sub', v_lri || to_char((v_conc ->> 'top5_drifting')::integer, 'FM999,999,999') || v_pdi",
      to: "|| '%' || v_pdi || ' מההכנסה) מסומנים \"מתרחק\"',",
      with:
        "'sub', 'מתוך ' || v_lri || '5' || v_pdi || ' הלקוחות הגדולים',\n" +
        "        'share', v_lri || coalesce(to_char(round(100 * (v_conc ->> 'top5_revenue')::numeric\n" +
        "                          / nullif((v_conc ->> 'total_revenue')::numeric, 0), 1), 'FM999990.0'), '—')\n" +
        "               || '%' || v_pdi || ' מההכנסה',",
    },
    {
      why: 'a sentence is not a comparison (0.3) — the first drifting customer moves to the ⓘ',
      from: "'compare', case when v_conc -> 'first_drifting' is null then null else jsonb_build_object(",
      to: "' · מקומו ברשימת המניבים',\n          'direction', 'flat') end,",
      with: "'compare', null,",
    },
    {
      why: 'claim as card name (0.1)',
      find: "'label', 'קצב-התשלום תלוי בסוג הלקוח',",
      with: "'label', 'ימים לתשלום, הסוג האיטי',",
    },
    {
      why: 'context line > 30 (0.3)',
      find: "'sub', 'חציון ימים מחשבונית לתשלום, לפי סוג הלקוח',",
      with: "'sub', 'חציון · ' || v_lri || to_char(v_pay_n, 'FM999,999') || v_pdi || ' חשבוניות',",
    },
  ],
  report_m21_drifting: [
    {
      why: 'a date inside a card (0.8)',
      find: "'label', 'לפני חודש (' || v_lri || to_char(v_prev, 'DD/MM/YYYY') || v_pdi || ')',",
      with: "'label', 'לפני חודש',",
    },
    {
      // ⚠️ amends a 🔒 dictionary row (processes-approved.md, "הכנסת 12 החודשים של הלקוחות המסומנים"):
      // the lock is "not 'revenue at risk'", and that stays. Only the period moves to the ⓘ (0.8),
      // where the window already states it. Recorded in processes-approved.md with a ✏️ note.
      why: 'card name 6 words (0.1) + period in a name (0.8)',
      find: "'label', 'הכנסת 12 החודשים של הלקוחות המסומנים',",
      with: "'label', 'הכנסת הלקוחות המסומנים',",
    },
    {
      why: 'comparison repeated the card value; the fact that matters is what the 120-day rule finds',
      from: "'label', 'כלל ' || v_lri || coalesce(v_dormant::text, '—') || v_pdi",
      to: "' לקוחות, ואת אלה הוא מפספס',",
      with: "'label', 'כלל «רדום» מוצא',",
    },
    {
      why: 'card value was a customer name (0.2) — the number is the days, the name is the context line',
      find:
        "'label', 'הוותיק שברשימה',\n" +
        "        'value', v_oldest ->> 'company_name',\n" +
        "        'format', 'text',",
      with:
        "'label', 'הוותיק ברשימה',\n" +
        "        'value', (v_oldest ->> 'days_since')::integer,\n" +
        "        'format', 'days',",
    },
    {
      why: 'context line: the customer, short',
      from: "'sub', case when v_oldest is null then 'אין לקוח מתרחק כרגע'",
      to: "|| v_lri || (v_oldest ->> 'cadence') || v_pdi || ' ימים)' end,",
      with:
        "'sub', case when v_oldest is null then 'אין לקוח מתרחק כרגע'\n" +
        "          else v_oldest ->> 'company_name' end,",
    },
  ],
  report_m22_notes: [
    {
      why: 'card name 5 words (0.1)',
      find: "'label', 'מהן שייכות למשוב שתויג \"אחר\"',",
      with: "'label', 'הערות על «אחר»',",
    },
    {
      why: 'a per-year breakdown is not a comparison (0.3) — it moves to the ⓘ',
      find:
        "'window', 'כל הזמנים · נכון ל-' || v_lri || to_char(v_today, 'DD/MM') || v_pdi,\n" +
        "        'compare', jsonb_build_object(\n" +
        "          'value', coalesce(v_other_yr_txt, '—'),\n" +
        "          'label', 'פילוח לפי שנה (השנה הנוכחית חלקית)', 'direction', 'flat'),",
      with:
        "'window', 'כל הזמנים · לפי שנה (השנה הנוכחית חלקית): ' || coalesce(v_other_yr_txt, '—'),\n" +
        "        'compare', null,",
    },
    {
      why: 'chart title with two subtitles (0.6); plain words instead of "matrix"',
      find: "'title', 'מטריצת ההסכמה · מה הלקוח תייג מול מה המודל מצא · מתוך '",
      with: "'title', 'תגית הלקוח מול המודל · '",
    },
  ],
}
