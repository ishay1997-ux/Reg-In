// ops-l6.mjs — text round 6 (L6), 23/09/2026 night. Built on the LIVE bodies after L5 (bodies.mjs postL5).
// The second pass of the density check after L5 found four more card lines that wrap to two lines,
// one bare 0 with no base on screen, and one comparison that the L5 value change re-formatted as days.
export const OPS = {
  report_m07_finance_overview: [
    {
      why: 'comparison wrapped to 2 lines (0.3)',
      find: "'label', 'נכנסו ב-30 הימים שחלפו',",
      with: "'label', 'נכנסו בפועל',",
    },
    {
      why: 'a bare 0 needs its base visible (0.2) — the month and the "nobody" sentence move to the ⓘ',
      find:
        "else 'מתוך ' || v_lri || v_dev_den || v_pdi || ' אירועים שהתקיימו ב'\n" +
        "                         || v_months_he[extract(month from v_to)::integer]\n" +
        "                         || case when v_dev_n = 0 then ' — אף אחד לא חרג' else '' end end,",
      with: "else 'מתוך ' || v_lri || v_dev_den || v_pdi || ' אירועים' end,",
    },
  ],
  report_m08_profitability: [
    {
      why: 'page budget (0.9) still over after L5',
      find:
        "' פרויקטים קטנים (מתחת ל-' || v_lri || '4' || v_pdi || ' שעות או '\n" +
        "          || v_lri || '1,000' || ' ₪' || v_pdi || ') אינם בדירוג החריגות.',",
      with:
        "' פרויקטים מתחת ל-' || v_lri || '4' || v_pdi || ' שעות או '\n" +
        "          || v_lri || '1,000' || ' ₪' || v_pdi || ' אינם מדורגים.',",
    },
  ],
  report_m17_fairness: [
    {
      why: 'context line wrapped to 2 lines (0.3)',
      find:
        "'sub', v_lri || to_char(coalesce(v_answered, 0), 'FM999,999') || v_pdi || ' ענו מתוך ' ||\n" +
        "               v_lri || to_char(coalesce(v_invites, 0), 'FM999,999') || v_pdi || ' שזומנו',",
      with:
        "'sub', v_lri || to_char(coalesce(v_answered, 0), 'FM999,999') || v_pdi || ' מתוך ' ||\n" +
        "               v_lri || to_char(coalesce(v_invites, 0), 'FM999,999') || v_pdi,",
    },
    {
      why: 'chart note > 60 (0.6)',
      find: "'note', 'הקו הישר הוא חלוקה שווה; ככל שהעקומה רחוקה ממנו — ריכוזי יותר.',",
      with: "'note', 'הקו הישר הוא חלוקה שווה; עקומה רחוקה ממנו — חלוקה ריכוזית.',",
    },
  ],
  report_m21_drifting: [
    {
      why: 'L5 made the card value "days", so the score comparison inherited "days" — it is a score',
      from: "'label', 'ממוצע המשוב שלו על ' || v_lri || to_char((v_oldest ->> 'feedback_n')::integer, 'FM999,999,999') || v_pdi || ' משובים'",
      to: "then ' — הנמוך ברשימה' else '' end,",
      with: "'label', 'ממוצע המשוב', 'format', 'text',",
    },
  ],
}
