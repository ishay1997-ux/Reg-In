#!/usr/bin/env bash
# PreToolUse hook — מגן על קבצי האפיון הקפואים מפני עריכה/מחיקה בטעות.
# הקבצים המוגנים (כלל ברזל 2 בהיררכיית מקורות האמת, CLAUDE.md):
#   docs/reference_spec/C5_Processes_And_Screens.md
#   docs/reference_spec/C6_DB_Tables.md
# חסימה = exit 2 + הסבר ב-stderr (Claude מקבל את ההסבר וממשיך אחרת).
# שים לב: קריאה מהקבצים מותרת תמיד — נחסמות רק עריכה (Edit/Write) ומחיקה/הזזה (Bash).
#
# תפקיד שני (נוסף 07/07/2026): כשהסשן מבצע Edit/Write/NotebookEdit מותרת, רושמים
# "סימון עריכה" פר-session_id בתיקייה תחת .git. ה-mtime של הסימון = זמן העריכה
# האחרונה של הסשן. ה-Stop hook (check-docs-updated.sh) משתמש בזה כדי להבחין בין
# סשן שערך (חייב לתעד) לבין סשן קריאה-בלבד שרץ במקביל לסשן כותב אחר (כלל ברזל 16),
# ולהשוות אכיפת-תיעוד מול העריכה של *הסשן הזה* בלבד — לא מול עץ-העבודה המשותף.

INPUT=$(cat)
FROZEN='C5_Processes_And_Screens|C6_DB_Tables'

# שליפת שם הכלי + מזהה הסשן מתוך ה-JSON שמגיע ב-stdin (בלי תלות ב-jq)
TOOL=$(printf '%s' "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
SESSION_ID=$(printf '%s' "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

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
    # הגענו לכאן = העריכה מותרת (לא קובץ קפוא) → מסמנים שהסשן ערך.
    # תיקיית הסימונים מעוגנת ב-.git (מחושבת זהה ב-check-docs-updated.sh, לא מזהמת git status).
    # append מעדכן את ה-mtime של הסימון בכל עריכה → mtime = זמן העריכה האחרונה של הסשן.
    # חריג: לא מסמנים עריכות של קובצי-התיעוד עצמם (CLAUDE_CODE_LOG.md / STATUS.md) —
    # אחרת עדכון היומן/הלוח היה "מקדם" את זמן-העריכה של הסשן וגורם ל-Stop hook לחשוב שהם
    # התיישנו (self-reference). זהה לסמנטיקה המקורית שהחריגה את שני הקבצים מ-NEWEST.
    if [ -n "$SESSION_ID" ] && ! printf '%s' "$FP" | grep -Eq 'CLAUDE_CODE_LOG\.md|STATUS\.md'; then
      GITDIR=$(git rev-parse --absolute-git-dir 2>/dev/null)
      MUTDIR="${GITDIR:-${TMPDIR:-/tmp}}/regin-session-mutations"
      mkdir -p "$MUTDIR" 2>/dev/null && printf 'x\n' >> "$MUTDIR/$SESSION_ID"
    fi
    ;;
  Bash)
    # חסימת פקודות מחיקה/הזזה/דריסה שמפנות לקבצים הקפואים.
    printf '%s' "$INPUT" | grep -Eq "$FROZEN" || exit 0
    printf '%s' "$INPUT" | grep -Eq '(rm |del |Remove-Item|mv |move |sed -i|tee |truncate)' && block
    ;;
esac
exit 0
