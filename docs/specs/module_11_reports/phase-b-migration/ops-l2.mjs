// ops-l2.mjs — phase B text round 2 (L2), 23/09/2026. Built on the LIVE bodies after L1
// (`bodies.mjs` postL1). Why a second round: after L1 was applied, the live measurement of the 12
// reports (tools/shoot.mjs + ev-m02.js, 1536/1024, modes 0/2) showed the tile sub-lines — which L1
// did not cover — as the main visible text left: definitions on the tile, repeats of the scope chip
// or of "so what", internal words ("הדלי", "מדד משני", "נספרות במכנה"), and one fragment L1 itself
// left behind ("לא אותה נוסחה" with no subject). Rule applied (Ishay's ruling 2, "תחליט אתה"):
// a sub-line that is the BASE of the number stays ("1,466 מתוך 1,682"); a definition, a repeat, or a
// design explanation goes. Same op shape as ops.mjs: { find, with } or { from, to, with }.
export const OPS = {
  report_m07_finance_overview: [
    // L1 cut "אינה אותה נוסחה — השוואה רטרוספקטיבית…" to "לא אותה נוסחה" — a fragment with no subject.
    // The compare label already says what it is ("שנכנסו בפועל ב-30 הימים האחרונים").
    { why: 'compare note: a fragment L1 left behind', find: "'note', 'לא אותה נוסחה',", with: "'note', null," },
  ],

  report_m14_hostess_overview: [
    { why: 'gini sub: no jargon on the tile', find: "'sub', 'מדד ג''יני · רבע הדיילות העמוסות ביותר מקבלות ' ||", with: "'sub', 'רבע הדיילות העמוסות ביותר מקבלות ' ||" },
    { why: 'gini sub: one fact, not two', find: "'% מהמשמרות; מחצית המאגר מקבלת ' || coalesce(v_bottom_pct::text, '—') || '%'),", with: "'% מהמשמרות'),", },
    { why: 'red sub: "N active" is the so-what sentence itself', find: "' בענבר · ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') || ' מהאדומות פעילות'),", with: "' בענבר'),", },
  ],

  report_m15_reliability: [
    { why: 'flagged sub: "N active" is the so-what sentence itself', find: " || ' · ' || to_char(coalesce(v_red_active, 0), 'FM999,999,999') || ' מהאדומות פעילות'))", with: '))' },
  ],

  report_m16_quality_cost: [
    { why: 'no_rating sub: the scope chip already says "50 דיילות פעילות"', find: "'sub', 'מתוך ' || to_char(coalesce(v_active, 0), 'FM999,999,999') || ' הדיילות הפעילות'),", with: "'sub', null)," },
    { why: 'median_rate sub: same repeat', find: "'sub', 'על ' || to_char(coalesce(v_active, 0), 'FM999,999,999') || ' הדיילות הפעילות'),", with: "'sub', null)," },
    { why: 'blocked sub: keep what it means, drop the repeat', find: "'sub', 'אצל לקוח אחד לפחות, מתוך ' || to_char(coalesce(v_active, 0), 'FM999,999,999') || ' הפעילות')),", with: "'sub', 'אצל לקוח אחד לפחות')),", },
  ],

  report_m17_fairness: [
    // The scale stays — without it "0.46" cannot be read. The word "ג'יני" goes to the hint.
    { why: 'gini sub: the scale, without the jargon', find: "'sub', 'מדד ג''יני · ' || v_lri || '0' || v_pdi || ' = חלוקה שווה בין הדיילות · ' ||\n               v_lri || '1' || v_pdi || ' = דיילת אחת מקבלת הכול',", with: "'sub', v_lri || '0' || v_pdi || ' = חלוקה שווה · ' ||\n               v_lri || '1' || v_pdi || ' = הכול אצל דיילת אחת'," },
    { why: 'top_quarter sub: the half-pool share is the so-what sentence; the decile is a second story', from: "|| ' · מחצית המאגר מקבלת ' ||", to: "coalesce(v_top_dec_pct::text, '—') || '%' || v_pdi,", with: ',' },
    { why: 'rank1 sub: the label says what it is', find: "'sub', 'דרג ' || v_lri || '1' || v_pdi || ' = הדיילת שהמערכת דירגה ראשונה · ' ||", with: "'sub'," },
    { why: 'rank1 sub: the tile window already says "טרם נמדד"', find: "then 'טרם נמדד — הרישום התחיל רק עכשיו'", with: "then 'הרישום התחיל רק עכשיו'" },
    { why: 'median_response sub: the definition is the hint', find: "'sub', 'שעות, מרגע שליחת הזימון האחרון ועד שהדיילת ענתה · ' ||", with: "'sub', 'שעות · על ' ||" },
    { why: 'response_rate sub: base only', from: "|| ' שזומנו · ' ||", to: "' לא ענו כלל — והן נספרות במכנה',", with: "|| ' שזומנו'," },
  ],

  report_m19_customers_overview: [
    { why: 'other tile sub: plain words', find: "'sub', 'משובים שליליים שתויגו \"אחר\" מתוך ' ||", with: "'sub', 'תויגו \"אחר\" מתוך ' ||" },
    { why: 'other tile sub: no "bucket" jargon', find: "|| ' — הדלי הגדול מכל ארבע הקטגוריות',", with: "|| ' משובים שליליים'," },
    { why: 'concentration sub: one sentence', find: "|| ' מחמשת הלקוחות הגדולים — יחד '", with: "|| ' מחמשת הגדולים ('" },
    { why: 'concentration sub: one sentence (tail)', from: "|| '%' || v_pdi || ' מהכנסת ' || v_lri || '12' || v_pdi", to: "' החודשים — מסומנים \"מתרחק\"',", with: "|| '%' || v_pdi || ' מההכנסה) מסומנים \"מתרחק\"'," },
  ],

  report_m20_satisfaction: [
    { why: 'average sub: "secondary metric" is a design note', find: "' משובים · מדד משני לשיעור-המרוצים',", with: "' משובים'," },
    { why: 'negative sub: base only; the positive count is its own chart title', from: "' — ו-'", to: "' סימנו סיבה חיובית',", with: "' משובים'," },
  ],

  report_m22_notes: [
    { why: 'free_notes sub: the scope chip already says "N הערות · מתוך M משובים"', from: "'sub', 'מתוך ' || v_lri || to_char(v_completed, 'FM999,999,999') || v_pdi || ' משובים שהושלמו ('", to: "' נוסחים שונים',", with: "'sub', null," },
    { why: 'other_tagged sub: plain words', find: "then 'לכל ' || v_lri || to_char(v_other, 'FM999,999,999') || v_pdi || ' יש טקסט — אין ולו אחת ריקה'", with: "then 'כולן עם טקסט'" },
    { why: 'red_flags sub (no run yet): a design explanation', find: "then 'טרם אושרה ריצה — לא 0. אפס כאן היה נקרא \"אין בעיות\", וזו אמירה שאיש לא בדק'", with: "then 'טרם אושרה ריצה'" },
    { why: 'red_flags sub: the tile window already counts the runs', from: "|| case when v_run_cnt > 1", to: "else '' end end,", with: 'end,' },
  ],
}
