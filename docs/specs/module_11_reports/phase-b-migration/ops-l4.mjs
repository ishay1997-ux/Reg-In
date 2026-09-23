// ops-l4.mjs — phase B text round 4 (L4), 23/09/2026. Built on the LIVE bodies after L3.
// Found by calling M08 on 2025 right after L3: "הרווח סופי ב-286 מתוך 286 הפרויקטים; בשאר הוא מחושב…"
// — there is no "rest" when every project is final (the pre-L3 sentence had the same flaw).
// The note now reads by case: all final · none final · some final.
export const OPS = {
  report_m08_profitability: [
    {
      why: 'footnote: "N מתוך N … בשאר" when nothing is left',
      from: "'הרווח סופי ב-' || v_lri || v_frozen || v_pdi",
      to: "' הפרויקטים; בשאר הוא מחושב מהעלויות שנרשמו עד היום.'),",
      with:
        "case when v_frozen >= v_n then 'הרווח סופי בכל ' || v_lri || v_n || v_pdi || ' הפרויקטים.'\n" +
        "               when coalesce(v_frozen, 0) = 0 then 'הרווח בכל ' || v_lri || v_n || v_pdi || ' הפרויקטים מחושב מהעלויות שנרשמו עד היום.'\n" +
        "               else 'הרווח סופי ב-' || v_lri || v_frozen || v_pdi || ' מתוך ' || v_lri || v_n || v_pdi\n" +
        "                    || ' הפרויקטים; בשאר הוא מחושב מהעלויות שנרשמו עד היום.' end),",
    },
  ],
}
