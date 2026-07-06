#!/usr/bin/env bash
# PreToolUse hook — מגן על קבצי האפיון הקפואים מפני עריכה/מחיקה בטעות.
# הקבצים המוגנים (כלל ברזל 2 בהיררכיית מקורות האמת, CLAUDE.md):
#   docs/reference_spec/C5_Processes_And_Screens.md
#   docs/reference_spec/C6_DB_Tables.md
# חסימה = exit 2 + הסבר ב-stderr (Claude מקבל את ההסבר וממשיך אחרת).
# שים לב: קריאה מהקבצים מותרת תמיד — נחסמות רק עריכה (Edit/Write) ומחיקה/הזזה (Bash).

INPUT=$(cat)
FROZEN='C5_Processes_And_Screens|C6_DB_Tables'

# שליפת שם הכלי מתוך ה-JSON שמגיע ב-stdin (בלי תלות ב-jq)
TOOL=$(printf '%s' "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

block() {
  echo "❄️ הקובץ הזה קפוא (אפיון מאושר, פרקים 5–6) — אסור לערוך או למחוק אותו לעולם. סטייה מהאפיון מתועדת בתיעוד החי בלבד (PROJECT_MASTER / מדריך המודול / CHANGELOG) עם הערת 'סטייה מ-5.x'. ראו היררכיית מקורות האמת ב-CLAUDE.md." >&2
  exit 2
}

case "$TOOL" in
  Edit|Write|NotebookEdit)
    # בודקים רק את שדה נתיב הקובץ — לא את כל הקלט, כדי לא לחסום עריכה של
    # מסמכים אחרים שרק *מזכירים* את שמות הקבצים הקפואים (למשל PROJECT_MASTER).
    FP=$(printf '%s' "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1)
    printf '%s' "$FP" | grep -Eq "$FROZEN" && block
    ;;
  Bash)
    # חסימת פקודות מחיקה/הזזה/דריסה שמפנות לקבצים הקפואים.
    printf '%s' "$INPUT" | grep -Eq "$FROZEN" || exit 0
    printf '%s' "$INPUT" | grep -Eq '(rm |del |Remove-Item|mv |move |sed -i|tee |truncate)' && block
    ;;
esac
exit 0
