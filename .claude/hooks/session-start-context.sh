#!/usr/bin/env bash
# SessionStart hook — באנר-הקשר בפתיחת כל סשן.
# היסטוריה: נוסף 07/07/2026 · פרסונליזציה 08/07 · קריסה למסלול-יחיד 22/07 (מפתח יחיד)
#           · שוכתב 28/07/2026 בשיפוץ-ההקשר.
#
# למה השכתוב (28/07): הבאנר חילץ את הצעד-הפעיל מ-STATUS ואז הורה "קרא את CLAUDE.md + STATUS.md"
# — כלומר עשה את העבודה ואז ביקש לעשות אותה שוב (STATUS היה 35KB). מעכשיו הוא **מזריק** את המצב
# החי, ולא מורה לקרוא: הוראות חיות ב-CLAUDE.md, מצב חי מוזרק כאן (just-in-time context).
# בנוסף: הכותרות ב-STATUS השתנו ("## המסלול" → "## 🫵 הצעד הנוכחי") — החילוץ עודכן בהתאם.
#
# פלט ל-stdout בלבד; לעולם לא חוסם (exit 0 תמיד) — זה הקשר, לא שער.

INPUT=$(cat 2>/dev/null)
SESSION_ID=$(printf '%s' "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0

BRANCH=$(git branch --show-current 2>/dev/null)
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "📍 REG-IN | ענף: ${BRANCH:-?} | קבצים לא-מקומטים: ${DIRTY:-?}"

if [ -f STATUS.md ]; then
  # הצעד הפעיל: הסעיף "## 🫵 הצעד הנוכחי" — שורות מודגשות ושורת ה-➡️ שבתוכו.
  # ‏fail-safe: אם הכותרת השתנתה, נופלים לחיפוש ישיר של שורת ה-➡️ בכל הקובץ.
  STEP=$(awk '/^## .*הצעד הנוכחי/{f=1;next} f&&/^## /{exit} f' STATUS.md 2>/dev/null \
    | grep -E '^(\*\*|➡️)' | head -2 | sed 's/\]([^)]*)//g; s/\[//g; s/\*\*//g')
  [ -z "$STEP" ] && STEP=$(grep -m1 '➡️' STATUS.md 2>/dev/null | sed 's/\]([^)]*)//g; s/\[//g; s/\*\*//g')
  [ -n "$STEP" ] && printf '🫵 %s\n' "$STEP"

  grep -o '^> עודכן לאחרונה:.*' STATUS.md 2>/dev/null | head -1
  grep -o '⏱️ \*\*דדליין-הגשה:[^*]*\*\*' STATUS.md 2>/dev/null | head -1 | sed 's/\*\*//g'
  # תוכנית פעילה (אם רשומה) — סשן מקביל קורא אותה לבד במקום שישי ישמש שליח (כלל 2ג)
  grep -o '🔧 \*\*תוכנית פעילה:[^—]*' STATUS.md 2>/dev/null | head -1 | sed 's/\*\*//g'
fi

# אזהרת-מקביליות מבוססת-ראיה במקום תזכורת סטטית (כלל 16): האם סשן אחר ערך קבצים לאחרונה?
# הסימונים נכתבים ע"י protect-frozen-files.sh, קובץ לכל session_id, mtime = העריכה האחרונה שלו.
GITDIR=$(git rev-parse --absolute-git-dir 2>/dev/null)
MUTDIR="${GITDIR:-/tmp}/regin-session-mutations"
if [ -d "$MUTDIR" ]; then
  OTHERS=$(find "$MUTDIR" -type f -mmin -120 ${SESSION_ID:+! -name "$SESSION_ID"} 2>/dev/null | wc -l | tr -d ' ')
  [ "${OTHERS:-0}" -gt 0 ] && echo "⚠️ סשן אחר ערך קבצים בשעתיים האחרונות — כלל 16: שיחה כותבת אחת בכל רגע. אם אתה לא הכותב, הישאר בקריאה/Plan Mode."
fi

exit 0
