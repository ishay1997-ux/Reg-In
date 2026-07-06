#!/usr/bin/env bash
# Stop hook — חוסם סיום סשן אם קבצים השתנו בלי שעודכנו היומן ולוח המצב.
# הלוגיקה זהה ל-hook שישב קודם ישירות בתוך .claude/settings.json (הועבר לכאן
# 06/07/2026 כדי ש-Claude יוכל לתחזק את הלוגיקה בלי לגעת ב-settings.json,
# שעריכתו על-ידי Claude חסומה על-ידי ההגנה המובנית של Claude Code).
#
# איך זה עובד: אם יש שינויים ב-git שאינם ביומן/בלוח עצמם, בודקים האם
# docs/CLAUDE_CODE_LOG.md ו-STATUS.md עודכנו אחרי הקובץ ששונה אחרון.
# אם לא — פולטים JSON עם decision:block והסשן לא מסתיים עד שמעדכנים.

LOG="docs/CLAUDE_CODE_LOG.md"
ST="STATUS.md"

# אם היומן לא קיים (ריפו במצב חריג) — לא חוסמים, עדיף סשן שנסגר מאשר נעילה נצחית.
[ -f "$LOG" ] || exit 0

LOG_M=$(stat -c %Y "$LOG" 2>/dev/null || echo 0)
ST_M=$(stat -c %Y "$ST" 2>/dev/null || echo 0)

# כל השינויים חוץ מהיומן ולוח המצב עצמם
CHANGED=$(git status --porcelain -- . ":!$LOG" ":!$ST" 2>/dev/null)
[ -z "$CHANGED" ] && exit 0

# מציאת זמן השינוי של הקובץ העדכני ביותר מבין המשתנים
NEWEST=0
while IFS= read -r line; do
  f=$(printf '%s' "$line" | cut -c4-)
  [ -f "$f" ] || continue
  m=$(stat -c %Y "$f" 2>/dev/null || echo 0)
  [ "$m" -gt "$NEWEST" ] && NEWEST=$m
done <<< "$CHANGED"

MISS=""
[ "$NEWEST" -gt "$LOG_M" ] && MISS="docs/CLAUDE_CODE_LOG.md"
[ "$NEWEST" -gt "$ST_M" ] && MISS="$MISS STATUS.md"

if [ -n "$MISS" ]; then
  echo "{\"decision\":\"block\",\"reason\":\"קבצים השתנו מאז העדכון האחרון של: $MISS. עדכן את היומן (docs/CLAUDE_CODE_LOG.md) ואת לוח המצב (STATUS.md) לפני סיום התור. אם אין שינוי-סטטוס אמיתי — עדכן ב-STATUS.md רק את שורת 'עודכן לאחרונה' אחרי שווידאת שהלוח עדיין נכון.\"}"
fi
exit 0
