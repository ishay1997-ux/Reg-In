#!/usr/bin/env bash
# PreToolUse hook — הגנת קבצי-האפיון הקפואים (C5/C6) + CHANGELOG שהוקפא + מיגרציות
# append-only + סימון-עריכה פר-סשן. חסימה = exit 2 + הסבר ב-stderr (Claude מקבל את
# ההסבר וממשיך אחרת). קריאה מהקבצים מותרת תמיד.
#
# תפקידים: (א) חסימת עריכה/מחיקה של C5/C6 הקפואים · (ב) חסימת עריכה/מחיקה של
# docs/CHANGELOG.md שהוקפא 23/07/2026 (נוסף אז — עד אז הייתה זו הקפאה תיעודית-בלבד
# בלי אכיפה בפועל; ישי שאל "האם זה חסום כמו שצריך?" והתשובה הייתה לא) ·
# (ג) חסימת עריכה/מחיקה של מיגרציה שכבר קומטה (append-only) · (ד) רישום "סימון
# עריכה" פר-session_id (ה-Stop hook מבחין בעזרתו בין סשן-שערך לסשן-קריאה — כלל ברזל 16).
#
# עדכון 08/07/2026 (מועצת-llm-council — סגירת שני ממצאי-המבקר):
#  (1) באג ה-Bash-branch תוקן: בודקים את שדה-הפקודה בלבד, לא את כל הקלט. קודם: שם-קפוא
#      בהודעת-commit + פועל-הרסני על קובץ *אחר* גרמו חסימת-שווא (זה מה שחסם את סשן-הבדיקות).
#  (2) חור-הכלים נסגר: קודם רק Edit/Write/NotebookEdit/Bash עברו דרך ה-hook — PowerShell
#      ו-Desktop-Commander (write_file/edit_block/move_file) עקפו גם את ההגנה על הקפואים
#      וגם את רישום-ה-marker, כך שסשן שכתב דרכם נראה ל-Stop hook כקריאה-בלבד.
#  עקרון-מילוט (תקציב-החבלים של המועצה): fail-open — חילוץ-שדה שנכשל ⇒ לא חוסמים
#      (עדיף החמצה נדירה על חסימת-שווא שתלמד את המשתמש לעקוף את ה-hooks).
#  ⚠️ מגבלה מודעת: `>` (redirect-דורס) לא נכלל בפעלים ההרסניים — הוא נפוץ מדי בפקודות
#      לגיטימיות שמזכירות שם-קפוא (למשל `cat C5.. > /tmp/x`), וכלילתו הייתה מייצרת חסימות-שווא.

INPUT=$(cat)
FROZEN='C5_clean_transcript|C6_clean_transcript'
# CHANGELOG.md תחת docs/ — לא כל CHANGELOG.md בעולם (node_modules מלא בהם, ולא נוגעים בהם ממילא).
CHANGELOG_FROZEN='CHANGELOG\.md'
# פעלים הרסניים על קובץ (shell + PowerShell). cp/copy נוספו 08/07 (ממצא-מבקר).
DESTRUCTIVE='rm |del |mv |move |cp |copy |Remove-Item|Move-Item|Copy-Item|sed -i|tee |truncate'

TOOL=$(printf '%s' "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
SESSION_ID=$(printf '%s' "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

block() {
  echo "❄️ הקובץ הזה קפוא (אפיון מאושר, פרקים 5–6) — אסור לערוך או למחוק אותו לעולם. סטייה מהאפיון מתועדת בתיעוד החי בלבד (PROJECT_MASTER / מדריך המודול / CLAUDE_CODE_LOG) עם הערת 'סטייה מ-5.x'. ראו היררכיית מקורות האמת ב-CLAUDE.md." >&2
  exit 2
}
block_changelog() {
  echo "⛔ docs/CHANGELOG.md הוקפא 23/07/2026 (הכרעת-ישי) — ארכיון-קריאה-בלבד, אסור לכתוב/למחוק בו. המשך ציר-הזמן: git log + CLAUDE_CODE_LOG · שינויי-DB: db_roadmap+migrations · חובות: PROJECT_MASTER §6. אם באמת נדרש לתקן משהו בבאנר-ההקפאה עצמו — זה שינוי-מדיניות, לא עדכון-תוכן: תשאל את ישי קודם ותעדכן את ההוק הזה, לא לעקוף אותו." >&2
  exit 2
}
block_migration() {
  echo "🧱 מיגרציה שכבר קומטה היא היסטוריה (append-only) — אסור לערוך, למחוק או להזיז אותה. שינוי-DB חדש או תיקון = קובץ מיגרציה חדש קדימה (fix-forward — ר' פרומפט P15 ופרוטוקול ה-DB ב-CLAUDE.md). טיוטת מיגרציה שטרם קומטה מותרת לעריכה חופשית." >&2
  exit 2
}

# רושם סימון-עריכה פר-סשן עבור נתיב שיושב בתוך עץ-הריפו (מלבד LOG/STATUS — self-reference).
# נרמול: backslashes → '/', case-insensitive מול שורש-הריפו. נתיב מחוץ-לעץ (תוכנית/scratchpad)
# לא מסומן. זהה לסמנטיקה שהיתה ב-Edit-branch, מוצא לפונקציה לשימוש חוזר בכל כלי-כתיבה.
#
# עדכון 29/07/2026 (ביקורת-עמיתים חיצונית + תקרית-חיה: `LoginPage.jsx` חסם סשן שלא נגע בו —
# ר' CLAUDE_CODE_LOG.md): במקום שורת-סימון גנרית ('x'), נכתב הנתיב-היחסי-לריפו עצמו
# (lowercase, '/'). כך check-docs-updated.sh יודע בדיוק אילו קבצים *הסשן הזה* נגע בהם, ולא
# רק "מישהו נגע במשהו". נתיב שלא ניתן לנרמל בבטחה (POSIX מוחלט כמו /c/…, או תבנית לא-מוכרת)
# נופל לסנטינל '*' — "היקף לא-ידוע" — ו-check-docs-updated.sh מתייחס אליו שמרנית, כמו לפני
# התיקון (לא מפספס קובץ; ר' הביקורת שם המליצה על נפילה-לאחור פר-קובץ, לא פר-סשן).
record_marker() {
  FP="$1"
  OUTSIDE_REPO=0
  FPV=$(printf '%s' "$FP" | tr '\\' '/' | tr -s '/')
  TOP=$(git rev-parse --show-toplevel 2>/dev/null)
  REL=""
  if [ -n "$TOP" ]; then
    FPV_L=$(printf '%s' "$FPV" | tr '[:upper:]' '[:lower:]')
    TOP_L=$(printf '%s' "$TOP" | tr '[:upper:]' '[:lower:]')
    case "$FPV_L" in
      [a-z]:/*)
        case "$FPV_L" in
          "$TOP_L"/*) REL="${FPV_L#"$TOP_L"/}" ;;
          *) OUTSIDE_REPO=1 ;;
        esac
        ;;
      /*) ;; # נתיב-POSIX מוחלט (למשל /c/… ב-git-bash) — לא ננחש; סנטינל למטה.
      *) REL="$FPV_L" ;; # כבר נראה יחסי (חלק מכלי Desktop-Commander שולחים כך) — נלקח כמו-שהוא.
    esac
  fi
  if [ "$OUTSIDE_REPO" -eq 0 ] && [ -n "$SESSION_ID" ] && ! printf '%s' "$FP" | grep -Eq 'CLAUDE_CODE_LOG\.md|STATUS\.md'; then
    GITDIR=$(git rev-parse --absolute-git-dir 2>/dev/null)
    MUTDIR="${GITDIR:-${TMPDIR:-/tmp}}/regin-session-mutations"
    mkdir -p "$MUTDIR" 2>/dev/null
    if [ -n "$REL" ]; then
      printf '%s\n' "$REL" >> "$MUTDIR/$SESSION_ID"
    else
      printf '*\n' >> "$MUTDIR/$SESSION_ID"
    fi
  fi
}

# חוסם אם נתיב הוא מיגרציה שכבר עקובה ב-git (מקומטת).
check_migration_path() {
  case "$1" in
    *supabase/migrations/*.sql)
      REL="supabase/migrations/${1##*supabase/migrations/}"
      git ls-files --error-unmatch "$REL" >/dev/null 2>&1 && block_migration
      ;;
  esac
}

case "$TOOL" in
  # --- כלי כתיבת-קובץ ישירה (Claude Code + Desktop-Commander) ---
  Edit | Write | NotebookEdit | mcp__Desktop_Commander__write_file | mcp__Desktop_Commander__edit_block | mcp__Desktop_Commander__move_file | mcp__Desktop_Commander__create_directory)
    # כל שדות-הנתיב האפשריים — כלים שונים משתמשים בשמות שונים (file_path/path/source/destination).
    PATH_FIELDS=$(printf '%s' "$INPUT" | grep -oE '"(file_path|path|source|destination)"[[:space:]]*:[[:space:]]*"[^"]*"')
    # קפוא — כל נתיב שנמצא. (grep על ערך-ריק = אין התאמה, לא חוסם.)
    printf '%s' "$PATH_FIELDS" | grep -Eq "$FROZEN" && block
    # CHANGELOG.md שהוקפא — לא node_modules (חבילות-npm רבות מכילות CHANGELOG.md משלהן).
    printf '%s' "$PATH_FIELDS" | grep -Eq "$CHANGELOG_FROZEN" && ! printf '%s' "$PATH_FIELDS" | grep -qi 'node_modules' && block_changelog
    # מיגרציות + marker — פר-נתיב; ה-marker נרשם פעם אחת (הנתיב הראשון בתוך-הריפו מספיק).
    FIRST_MARKED=0
    while IFS= read -r field; do
      [ -z "$field" ] && continue
      val=$(printf '%s' "$field" | sed 's/^"[^"]*"[[:space:]]*:[[:space:]]*"//; s/"$//')
      fpv=$(printf '%s' "$val" | tr '\\' '/' | tr -s '/')
      check_migration_path "$fpv"
      [ "$FIRST_MARKED" -eq 0 ] && { record_marker "$val"; FIRST_MARKED=1; }
    done <<< "$PATH_FIELDS"
    ;;
  # --- כלי shell (Bash + PowerShell + Desktop-Commander start_process) ---
  Bash | PowerShell | mcp__Desktop_Commander__start_process)
    # תיקון-הבאג: בודקים את שדה-הפקודה בלבד. חילוץ שנכשל ⇒ fail-open (exit 0).
    CMD=$(printf '%s' "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1)
    [ -z "$CMD" ] && exit 0
    if printf '%s' "$CMD" | grep -Eq "$FROZEN"; then
      printf '%s' "$CMD" | grep -Eq "$DESTRUCTIVE" && block
    fi
    if printf '%s' "$CMD" | grep -Eq "$CHANGELOG_FROZEN" && ! printf '%s' "$CMD" | grep -qi 'node_modules'; then
      printf '%s' "$CMD" | grep -Eq "$DESTRUCTIVE" && block_changelog
    fi
    if printf '%s' "$CMD" | grep -Eq 'supabase[/\\]+migrations'; then
      printf '%s' "$CMD" | grep -Eq "$DESTRUCTIVE" && block_migration
    fi
    ;;
esac
exit 0
