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

block_migration() {
  echo "🧱 מיגרציה שכבר קומטה היא היסטוריה (append-only) — אסור לערוך, למחוק או להזיז אותה. שינוי-DB חדש או תיקון = קובץ מיגרציה חדש קדימה (fix-forward — ר' פרומפט P15 ופרוטוקול ה-DB ב-CLAUDE.md). טיוטת מיגרציה שטרם קומטה מותרת לעריכה חופשית." >&2
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
    #
    # חריג שני (07/07/2026, אחרי שסשן קריאה-בלבד ננעל בלולאת Stop): קובץ מחוץ לעץ-הריפו
    # (קובץ-תוכנית של Plan Mode תחת ‎~/.claude/plans, קובצי scratchpad ב-Temp וכו') אינו
    # "עריכה בפרויקט" — סימון עליו גורם ל-Stop hook לדרוש תיעוד על סשן שלא נגע בריפו.
    # זיהוי שמרני: מדלגים רק כשהנתיב מוחלט-עם-אות-כונן וזוהה בוודאות מחוץ לשורש הריפו
    # (השוואה case-insensitive, backslashes מנורמלים). נתיב יחסי / לא-מזוהה → מסמנים
    # כרגיל (fail-safe לכיוון האכיפה, לא לכיוון הפטור).
    OUTSIDE_REPO=0
    # נרמול: הסרת עטיפת ה-JSON, כל backslash (בודד או כפול-escaped) → '/', ודחיסת '//'.
    FPV=$(printf '%s' "$FP" | sed 's/^"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//' | tr '\\' '/' | tr -s '/')
    TOP=$(git rev-parse --show-toplevel 2>/dev/null)
    if [ -n "$TOP" ]; then
      case "$FPV" in
        [A-Za-z]:/*)
          FPV_L=$(printf '%s' "$FPV" | tr '[:upper:]' '[:lower:]')
          TOP_L=$(printf '%s' "$TOP" | tr '[:upper:]' '[:lower:]')
          case "$FPV_L" in "$TOP_L"/*) ;; *) OUTSIDE_REPO=1 ;; esac
          ;;
      esac
    fi
    # --- שער-מיגרציות (07/07/2026 ערב): מיגרציה מקומטת = היסטוריה, append-only ---
    # למה: append-only היה עד עכשיו חוק-כתוב בלבד; עריכת מיגרציה שכבר הוחלה על הפרויקט
    # המשותף היא הטעות המסוכנת בריפו. חוסמים עריכת קובץ ‎.sql שכבר עקוב ב-git תחת
    # supabase/migrations/; טיוטה חדשה (לא-עקובה) נשארת חופשית — לולאת-הטיוטה של
    # שער-1.1 (ניסוח→ביקורת→תיקון לפני commit) לא נפגעת. קובצי ‎.md בתיקייה (מצביע) פטורים.
    case "$FPV" in
      *supabase/migrations/*.sql)
        REL="supabase/migrations/${FPV##*supabase/migrations/}"
        git ls-files --error-unmatch "$REL" >/dev/null 2>&1 && block_migration
        ;;
    esac
    if [ "$OUTSIDE_REPO" -eq 0 ] && [ -n "$SESSION_ID" ] && ! printf '%s' "$FP" | grep -Eq 'CLAUDE_CODE_LOG\.md|STATUS\.md'; then
      GITDIR=$(git rev-parse --absolute-git-dir 2>/dev/null)
      MUTDIR="${GITDIR:-${TMPDIR:-/tmp}}/regin-session-mutations"
      mkdir -p "$MUTDIR" 2>/dev/null && printf 'x\n' >> "$MUTDIR/$SESSION_ID"
    fi
    ;;
  Bash)
    # חסימת פקודות מחיקה/הזזה/דריסה שמפנות לקבצים הקפואים.
    if printf '%s' "$INPUT" | grep -Eq "$FROZEN"; then
      printf '%s' "$INPUT" | grep -Eq '(rm |del |Remove-Item|mv |move |sed -i|tee |truncate)' && block
    fi
    # שער-מיגרציות ל-Bash (07/07/2026 ערב): אותם פעלים הרסניים על supabase/migrations.
    # שמרני-במכוון: חוסם גם טיוטה לא-עקובה (מחיקת-טיוטה נעשית ב-git/ידנית, מקרה נדיר);
    # פקודות קריאה/git add/db push לא מכילות את הפעלים ולכן עוברות.
    if printf '%s' "$INPUT" | grep -Eq 'supabase[/\\]+migrations'; then
      printf '%s' "$INPUT" | grep -Eq '(rm |del |Remove-Item|mv |move |sed -i|tee |truncate)' && block_migration
    fi
    ;;
esac
exit 0
