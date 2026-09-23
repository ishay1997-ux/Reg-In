// ops-l3.mjs — phase B text round 3 (L3), 23/09/2026. Built on the LIVE bodies after L2
// (`bodies.mjs` postL2, md5 == live). Found by the screenshots after L2 and a query over every
// visible payload field (so_what · tile sub/window/compare · chart title/note · meta.notes):
// two compare labels still print statistician's "n=" — and in M17 the browser renders it "97=n" —
// and two M08 footnotes carry internal accounting words ("רצפת-המהותיות", "רווח סופי קפוא").
// 🔒 Deliberately NOT here: M21's "עמודות ואריחי ה-₪ בדף זה כפופים להרשאת מודול כספים." — a question
// for Ishay. ✏️ Corrected 23/09: §7.100 (Ishay, 17/09/2026) ruled only that the masking moves into the DB;
// keeping the sentence was the J3 writer's choice (its SQL comment says so), not Ishay's ruling.
export const OPS = {
  report_m14_hostess_overview: [
    { why: 'gini compare: "n=" is statistician speak; the hint explains the pool changed', find: "'label', 'אשתקד (n=' || v_gini_prev_n || ')',", with: "'label', 'אשתקד'," },
  ],

  report_m17_fairness: [
    { why: 'gini compare: "n=97 מול n=106" renders as "97=n"; the hint carries the pool change', from: "'label', 'אשתקד · ' || v_lri || 'n='", to: "|| ' היום',", with: "'label', 'אשתקד'," },
  ],

  report_m08_profitability: [
    {
      why: 'footnote: "רצפת-המהותיות" is internal; say what it means',
      from: "v_lri || v_floor_n || v_pdi || ' פרויקטים · '",
      to: "|| 'ומחוץ לדירוג בלבד.',",
      with: "v_lri || v_floor_n || v_pdi || ' פרויקטים קטנים (פחות מ-' || v_lri || '4' || v_pdi || ' שעות או מ-'\n          || v_lri || '1,000' || ' ₪' || v_pdi || ' עלות-עבודה) נספרים בסכומים, אבל לא בדירוג החריגות.',",
    },
    {
      why: 'footnote: "רווח סופי קפוא" is internal; say what it means',
      from: "'רווח: ' || v_lri || v_frozen || v_pdi",
      to: "' בתקופה נושאים רווח סופי קפוא; בשאר מוצג הרווח הגולמי המחושב.'),",
      with: "'הרווח סופי ב-' || v_lri || v_frozen || v_pdi || ' מתוך ' || v_lri || v_n || v_pdi\n          || ' הפרויקטים; בשאר הוא מחושב מהעלויות שנרשמו עד היום.'),",
    },
  ],
}
