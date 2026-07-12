#!/usr/bin/env bash
# SessionStart hook — באנר-הקשר בפתיחת כל סשן (נוסף 07/07/2026 ערב; פרסונליזציה 08/07).
# למה: "תמיד לדעת איפה אנחנו" היה עד עכשיו תלוי-משמעת (לקרוא STATUS ידנית);
# הבאנר הופך את זה למכני — ענף, השלב הפעיל של כל מסלול, ותזכורת-מקביליות.
# פלט ל-stdout בלבד; לעולם לא חוסם (exit 0 תמיד) — זה הקשר, לא שער.

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0

BRANCH=$(git branch --show-current 2>/dev/null)
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

echo "📍 REG-IN | ענף: ${BRANCH:-?} | קבצים לא-מקומטים בעץ: ${DIRTY:-?}"

# --- זיהוי-מכונה (08/07/2026): לפי git config user.name — קיים ממילא לקומיטים ---
# תצוגה בלבד! זהות להכרעות נשארת "אני [ישי/עמית]" + כלל ברזל 1 (הבאנר מזכיר זאת למטה).
# לא-חד-משמעי/ריק ⇒ נופלים לפורמט הניטרלי, בלי לנחש. REGIN_WHOAMI_OVERRIDE = לבדיקות בלבד.
UNAME=$(printf '%s' "${REGIN_WHOAMI_OVERRIDE:-$(git config user.name 2>/dev/null)}" | tr '[:upper:]' '[:lower:]')
ME=""
case "$UNAME" in
  *amit*)  ME="עמית" ;;
  *ishay*) ME="ישי" ;;
esac

# חילוץ שורת "השלב הנוכחי" של כל מסלול מ-STATUS.md (לוח-המצב היחיד) —
# מציגים רק את נתיב-מדריך-השלב (לפני סוגר-הלינק), לא את כל שורת-ההסבר.
track_line() {  # $1 = שם המסלול בכותרת ("ישי"/"עמית")
  awk -v who="$1" 'index($0, "## המסלול של " who){f=1; next} f && /^\*\*השלב הנוכחי/{print; exit}' STATUS.md 2>/dev/null \
    | sed 's/\](.*//; s/\[//; s/\*\*//g'
}

if [ -f STATUS.md ]; then
  ISHAY_T=$(track_line "ישי"); AMIT_T=$(track_line "עמית")
  if [ "$ME" = "ישי" ] && [ -n "$ISHAY_T" ]; then
    echo "🫵 המסלול שלך (ישי): ${ISHAY_T#השלב הנוכחי: }"
    [ -n "$AMIT_T" ] && echo "👥 עמית: ${AMIT_T#השלב הנוכחי: }"
  elif [ "$ME" = "עמית" ] && [ -n "$AMIT_T" ]; then
    echo "🫵 המסלול שלך (עמית): ${AMIT_T#השלב הנוכחי: }"
    [ -n "$ISHAY_T" ] && echo "👥 ישי: ${ISHAY_T#השלב הנוכחי: }"
  else
    # ניטרלי — זיהוי לא-חד-משמעי או ש-STATUS שינה מבנה (fail-safe לתצוגה המלאה)
    grep '^\*\*השלב הנוכחי' STATUS.md 2>/dev/null | head -2 | sed 's/\](.*//; s/\[//; s/\*\*//g; s/^/🎯 /'
  fi
  grep -o '^> עודכן לאחרונה:.*' STATUS.md 2>/dev/null | head -1
fi

echo "ℹ️ קרא את CLAUDE.md + STATUS.md לפני עבודה. זיהוי-המכונה = תצוגה בלבד — להכרעות אומרים \"אני ישי/עמית\" (כלל 1). סשן שני במקביל לכותב? Plan Mode או P8 — כלל 16."
exit 0
