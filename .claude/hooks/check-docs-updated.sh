#!/usr/bin/env bash
# Stop hook — חוסם סיום סשן אם קבצים השתנו בלי שעודכן התיעוד המחייב.
# הלוגיקה ישבה קודם ישירות בתוך .claude/settings.json (הועברה לכאן 06/07/2026
# כדי ש-Claude יוכל לתחזק אותה בלי לגעת ב-settings.json, שעריכתו על-ידי Claude
# חסומה על-ידי ההגנה המובנית של Claude Code).
#
# שלוש אכיפות, לפי סדר פרוטוקול סוף-הסשן ב-CLAUDE.md:
# (0) מדריך-מיקרו חי (כלל ברזל 15): קוד של מודול (src/modules/NN_*/) שהשתנה
#     מחייב שמדריך המיקרו שלו (docs/micro_guides/module-N.md) יעודכן אחריו.
# (0ב) מפת ה-DB (נוסף 08/07/2026 — המקבילה של כלל 15 ל-DB): מיגרציה שהשתנתה
#     (supabase/migrations/**) מחייבת ש-docs/db_roadmap.md יעודכן אחריה —
#     כך המפה המרוכזת של שינויי-הסכמה מתעדכנת תוך-כדי-עבודה, לא בדיעבד.
# (1-3) היומן ולוח המצב: docs/CLAUDE_CODE_LOG.md + STATUS.md חייבים להתעדכן
#     אחרי הקובץ ששונה אחרון.
# אם משהו חסר — פולטים JSON עם decision:block והסשן לא מסתיים עד שמעדכנים.
#
# מודעות-לסשן (נוסף 07/07/2026, כלל ברזל 16): הבדיקה חלה רק על סשן שערך קבצים
# בעצמו. סשן קריאה-בלבד (שלא ביצע Edit/Write/NotebookEdit) פטור לגמרי — גם אם
# סשן כותב אחר "מלכלך" את עץ-העבודה המשותף. את "מי ערך ומתי" קובע קובץ-הסימון
# שכותב protect-frozen-files.sh (mtime = זמן העריכה האחרונה של הסשן).
#
# ייחוס פר-קובץ (נוסף 29/07/2026, אכיפה 0 בלבד — ר' הביקורת+תקרית-LoginPage.jsx ב-
# CLAUDE_CODE_LOG.md): קודם, כל קובץ-מודול ששונה בעץ נספר כ"טעון עדכון-מדריך", בלי
# קשר למי נגע בו — סשן שלא כתב שורת-קוד אחת נחסם על עבודת סשן אחר. עכשיו קובץ-הסימון
# מכיל את הנתיבים המדויקים (לא רק "נגעתי במשהו"), ואכיפה 0 סופרת קובץ רק אם הוא
# מופיע שם (או שהסימון מכיל '*' — "סשן זה עשה שינוי-בהיקף-לא-ידוע", למשל דרך shell).

# --- קריאת stdin וזיהוי הסשן ---
INPUT=$(cat)
SESSION_ID=$(printf '%s' "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
GITDIR=$(git rev-parse --absolute-git-dir 2>/dev/null)
MUTDIR="${GITDIR:-${TMPDIR:-/tmp}}/regin-session-mutations"
MARK="$MUTDIR/$SESSION_ID"

# ניקוי סימונים ישנים (מעל יומיים) כדי שהתיקייה לא תיפוח. לא נוגע בסשן הנוכחי.
find "$MUTDIR" -type f -mmin +2880 -delete 2>/dev/null

# דילוג קריאה-בלבד: session_id ידוע ואין לו קובץ סימון = הסשן הזה לא ערך כלום
# בעצמו. עוברים נקי בלי לחסום. (session_id לא זמין → לא מדלגים; ממשיכים לבדיקה
# המלאה כ-fail-safe שמשמר את ההתנהגות הישנה.)
[ -n "$SESSION_ID" ] && [ ! -s "$MARK" ] && exit 0

LOG="docs/CLAUDE_CODE_LOG.md"
ST="STATUS.md"

# אם היומן לא קיים (ריפו במצב חריג) — לא חוסמים, עדיף סשן שנסגר מאשר נעילה נצחית.
[ -f "$LOG" ] || exit 0

LOG_M=$(stat -c %Y "$LOG" 2>/dev/null || echo 0)
ST_M=$(stat -c %Y "$ST" 2>/dev/null || echo 0)

# כל השינויים חוץ מהיומן ולוח המצב עצמם.
# ‏-uall (נוסף 08/07/2026): בלעדיו git מקבץ קבצים לא-מוכרים לתיקייה ("?? dir/")
# והבדיקות פר-קובץ מפספסות את הקובץ הראשון בתיקייה חדשה (מודול חדש / מיגרציה ראשונה).
CHANGED=$(git status --porcelain -uall -- . ":!$LOG" ":!$ST" 2>/dev/null)
# 🔴 מוקש מתועד (נמצא 12/08/2026, שוחזר מדחיסת-יומן — ההתנהגות **מכוונת ולא שונתה**):
# השורה הבאה יוצאת 0 **לחלוטין** כשאין שינויים לא-מקומטים ⇒ סשן שקימט הכול לפני הסיום
# **עוקף את כל אכיפות-התיעוד למטה בשקט** (0, 0ג, 0ד ואת דרישת ה-mtime). זה לא באג —
# בלי זה כל סשן קריאה-בלבד היה נחסם — אבל זו הסיבה שאכיפה כאן אינה תחליף למשמעת:
# ⚠️ מי שמקמט ואז מסיים לא ייחסם, גם אם לא נגע ביומן ובלוח-המצב.
# 🔑 ומכאן גם סדר-הפעולות הנכון: **מעדכנים את היומן ואת STATUS אחרונים** — האכיפה למטה
# דורשת שהם יהיו בעלי ה-mtime החדש ביותר, ועריכת קובץ אחר אחריהם מפילה את הבדיקה.
# 🔴 **הכרעת-ישי 12/08/2026: לא משנים את ההתנהגות — הפער נסגר בתיעוד בלבד.**
#    ⇒ סשן עתידי שרואה כאן "עקיפה" **אינו מתקן אותה מיוזמתו.** הנימוק: היציאה המוקדמת
#    מגינה על כל סשן קריאה-בלבד מפני חסימה, והמחיר (מי שקימט ואז סיים אינו נבדק) התקבל
#    ביודעין. שינוי כאן = הכרעת-ישי מחודשת, לא שיפור.
[ -z "$CHANGED" ] && exit 0

# --- אכיפה 0: מדריך-מיקרו חי ---
# לכל קובץ ששונה תחת src/modules/NN_*/ נגזר מספר המודול N ונבדק שהמדריך
# docs/micro_guides/module-N.md עודכן אחריו. מודול שעדיין אין לו מדריך-מיקרו
# (טרם נוצר בפתיחתו) — לא חוסמים; האכיפה חלה רק ממרגע שהמדריך קיים.
MG_STALE=""
RM_STALE=""
NEWEST=0
while IFS= read -r line; do
  f=$(printf '%s' "$line" | cut -c4-)
  [ -f "$f" ] || continue
  m=$(stat -c %Y "$f" 2>/dev/null || echo 0)
  [ "$m" -gt "$NEWEST" ] && NEWEST=$m
  case "$f" in
    src/modules/*/CLAUDE.md)
      # מצביע-תיקייה (קובץ המוקשים של המודול) אינו קוד — עריכתו לבדה לא מחייבת עדכון מדריך-מיקרו.
      # אותה מלכודת בדיוק שתוקנה 08/07/2026 בתיקיית המיגרציות (שם צומצם ל-*.sql בלבד):
      # בלי החרגה זו, כתיבת src/modules/NN_*/CLAUDE.md מפעילה false-positive. (נוסף 28/07/2026.)
      continue
      ;;
    src/modules/*)
      dir=${f#src/modules/}
      dir=${dir%%/*}
      nn=${dir%%_*}
      case "$nn" in '' | *[!0-9]*) continue ;; esac
      n=$((10#$nn))
      mg="docs/micro_guides/module-$n.md"
      [ -f "$mg" ] || continue
      mgm=$(stat -c %Y "$mg" 2>/dev/null || echo 0)
      if [ "$m" -gt "$mgm" ]; then
        # ייחוס-לסשן: נספר רק אם *הסשן הזה* נגע ב-$f בדיוק (case-insensitive — Windows),
        # או שיש סנטינל '*' (היקף-לא-ידוע — נשארים שמרניים, לא מפספסים). session_id חסר
        # או אין marker בכלל → נשארים על ההתנהגות הישנה (סופרים תמיד), אותו fail-safe
        # שכבר קיים לאכיפה 1-3 למטה.
        COUNT_IT=1
        if [ -n "$SESSION_ID" ] && [ -s "$MARK" ]; then
          f_l=$(printf '%s' "$f" | tr '[:upper:]' '[:lower:]')
          if grep -qxF '*' "$MARK" 2>/dev/null || grep -qxF "$f_l" "$MARK" 2>/dev/null; then
            COUNT_IT=1
          else
            COUNT_IT=0
          fi
        fi
        [ "$COUNT_IT" -eq 1 ] &&
          case " $MG_STALE " in *" $mg "*) ;; *) MG_STALE="$MG_STALE $mg" ;; esac
      fi
      ;;
    supabase/migrations/*.sql)
      # אכיפה 0ב: מיגרציה חדשה/ששונתה מחייבת עדכון של מפת ה-DB אחריה.
      # ‏*.sql בלבד — בתיקייה יושב גם CLAUDE.md (מצביע-תיקייה) שאינו מיגרציה
      # (עריכתו הפעילה false-positive ביום ההוספה — 08/07/2026).
      # אם המפה עוד לא קיימת (ריפו במצב מעבר) — לא חוסמים.
      rm_f="docs/db_roadmap.md"
      [ -f "$rm_f" ] || continue
      rmm=$(stat -c %Y "$rm_f" 2>/dev/null || echo 0)
      [ "$m" -gt "$rmm" ] && RM_STALE=1
      ;;
  esac
done <<< "$CHANGED"

# --- אכיפה 0ג: חוב חוצה-מודולים (🚧) ---
# מדריך-מיקרו שהשתנה ומכיל טוקן "🚧 מN" (מודול-יעד) מחייב שורה תואמת "🚧 מN"
# ב-PROJECT_MASTER §6 — הרשם שסשן-עתידי קורא בפתיחת מודול N כדי לדעת אילו חובות
# הושארו לו. 🚧 במדריך בלי תאום ב-§6 = חוב שקט (Session-Blindness). אותו דפוס
# fail-open כמו 0/0ב: אם PM לא קיים או אין מדריך שהשתנה — לא חוסמים. (כלל ברזל 15.)
PM="docs/PROJECT_MASTER.md"
HG_MISS=""
if [ -f "$PM" ]; then
  while IFS= read -r line; do
    f=$(printf '%s' "$line" | cut -c4-)
    case "$f" in
      docs/micro_guides/module-*.md)
        [ -f "$f" ] || continue
        # כל טוקן "🚧 מN" ייחודי במדריך → חייב "🚧 מN" תואם ב-§6.
        for tgt in $(grep -oE '🚧 מ[0-9]+' "$f" 2>/dev/null | grep -oE '[0-9]+' | sort -u); do
          grep -qF "🚧 מ$tgt" "$PM" 2>/dev/null || HG_MISS="$HG_MISS ${f##*/}→מ$tgt"
        done
        ;;
    esac
  done <<< "$CHANGED"
fi

# --- אכיפה 0ד: תוכנית ב-docs/plans/ בלי מצביע (נוסף 07/08/2026) ---
# תוכנית שנערכה/נוצרה *בסשן הזה* חייבת אזכור-שם-קובץ באחד מהקבצים ש-Discovery/
# בלופרינט/בנייה/סגירה בפועל קוראים — אחרת היא בדיוק המחלה שנמצאה 07/08: "תוכנית
# מתה עם המיזוג" הפך ל"תוכנית מתה בלי שהתוכן שלה עבר לשום מקום שנקרא שוב".
# בכוונה לא בודקים את כל docs/plans/* בכל סשן (זה היה false-positive מובנה — רוב
# התוכניות הישנות כבר מתו כמו-שצריך, וזה בדיוק מה שהתיקייה נועדה לעשות) — רק
# תוכנית שנגעו בה *עכשיו*, כי זה מצמצם את הבדיקה ל"תוכנית פעילה שנשכחת", לא
# "כל היסטוריית-הפרויקט". STATUS.md בכוונה לא ברשימת-התקן: הוא יומן-נרטיב שמזכיר
# כמעט כל קובץ אי-פעם — אזכור שם שם אינו הוכחה שמישהו יקרא וייפעל, ובדיקה נגד זה
# הייתה מחזירה false-negative בדיוק על התקרית שהולידה את האכיפה הזאת (נבדק בפועל
# לפני הכתיבה: two-weeks-2026-08-06.md כן הופיע ב-STATUS.md כהיסטוריה, ועדיין
# 3.1 בתוכו מעולם לא רץ). escape hatch: תוכנית שמכריזה "תוכנית סגורה" בתוכה —
# כל תוכנה כבר עבר למקום קבוע — אינה נחסמת.
PLAN_STD="docs/guides/prompt_module_discovery.md docs/PROJECT_MASTER.md .claude/skills/module-blueprint/template.md .claude/skills/module-build/SKILL.md .claude/skills/module-close/template.md"
PLAN_MISS=""
while IFS= read -r line; do
  f=$(printf '%s' "$line" | cut -c4-)
  case "$f" in
    docs/plans/*.md)
      [ -f "$f" ] || continue
      grep -qF "תוכנית סגורה" "$f" 2>/dev/null && continue
      bn=$(basename "$f")
      found=0
      for std in $PLAN_STD; do
        [ -f "$std" ] || continue
        grep -qF "$bn" "$std" 2>/dev/null && { found=1; break; }
      done
      [ "$found" -eq 0 ] && PLAN_MISS="$PLAN_MISS $bn"
      ;;
  esac
done <<< "$CHANGED"

# --- זיהוי סוכני-רקע חיים (נוסף 19/08/2026, הכרעת-ישי — תקריות 14/08 ו-18/08 ביומן) ---
# קריאות-הכלים של סוכן-רקע עוברות דרך ה-hooks עם ה-session_id של סשן-האב (נמדד חי
# 19/08/2026: עריכת סוכן נרשמה לקובץ-הסימון של האב), ולכן כל כתיבה שלו מקפיצה את
# mtime של הסימון — ואכיפה 1-3 חוזרת ונורית כל תור בלי שיש מה לתעד (נורתה ×6 ב-14/08
# ו-×4 ב-18/08, והתשובה "רענון-חותמות בלי תוכן" היא בדיוק padding שהמדיניות אוסרת).
# האות נגזר מה-harness, לא מדגל שקלוד כותב: תמליל-הסשן (transcript_path, נכתב ע"י
# ה-harness בלבד) מכיל רשומת tool_result של "Async agent launched successfully" עם
# agentId לכל שיגור-רקע, ורשומת <task-notification><task-id> לכל סיום. שוגר ולא
# הסתיים ⇒ סוכן חי עכשיו. אימות-צולב: subagents/agent-<id>.meta.json (שרק ה-harness
# יוצר, ליד התמליל) חייב להתקיים — כך ציטוט מקרי של טקסט-שיגור בתוך תוצאת-כלי (למשל
# דף-אינטרנט שנשלף) אינו מייצר "סוכן חי" פיקטיבי שמכבה את האכיפה.
# כיוון-הכשל שמרני בכוונה: כל כשל-חילוץ/קריאה ⇒ LIVE_BG=0 ⇒ ההתנהגות הישנה בדיוק.
# סוכן שקיבל notification וחודש (SendMessage) ייקרא "הסתיים" — גם זה לכיוון המחמיר.
# גבול ידוע: סוכני Workflow אינם מזוהים (מנגנון שיגור אחר) — אם תימדד שם תקרית, זו
# הרחבה נפרדת, לא תיקון של הבלוק הזה.
TRANSCRIPT=$(printf '%s' "$INPUT" | grep -o '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' | sed 's|\\\\|/|g')
LIVE_BG=0
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  SUBAG_DIR="${TRANSCRIPT%.jsonl}/subagents"
  for aid in $(grep -F '"type":"tool_result"' -- "$TRANSCRIPT" 2>/dev/null | grep -F 'Async agent launched successfully' | grep -oE 'agentId: [a-f0-9]+' | awk '{print $2}' | sort -u); do
    [ -f "$SUBAG_DIR/agent-$aid.meta.json" ] || continue
    grep -qF "<task-id>$aid</task-id>" -- "$TRANSCRIPT" 2>/dev/null || { LIVE_BG=1; break; }
  done
fi

# --- אכיפה 1-3: יומן ולוח מצב ---
# משווים מול זמן העריכה של *הסשן הזה* (mtime של הסימון), לא מול NEWEST הגלובלי —
# כך שינויים לא-מקומיטים של סשן מקביל לא נספרים. בלי session_id → נשארים על NEWEST.
if [ -n "$SESSION_ID" ] && [ -s "$MARK" ]; then
  EDIT_TS=$(stat -c %Y "$MARK" 2>/dev/null || echo 0)
else
  EDIT_TS=$NEWEST
fi

MISS=""
# סוכן-רקע חי ⇒ מדלגים על אכיפה 1-3 *בלבד* לתור הזה: ה-mtime של הסימון נע כל עוד
# הסוכן כותב, ואי-אפשר לתעד עבודה שעוד נכתבת. החוב אינו נמחק — הסימון שומר את
# ה-mtime, ובעצירה הראשונה בלי סוכנים חיים (וכל סשן מגיע לכזו: ה-notification מעיר
# את הסשן לתור נוסף) האכיפה נורית כרגיל. אכיפות 0/0ב/0ג/0ד נשארות פעילות גם עכשיו —
# ב-18/08 ירייה של אכיפה 0 באמצע ריצת-סוכנים הייתה נכונה (module-4.md) ותועדה ככזו.
if [ "$LIVE_BG" -eq 0 ]; then
  [ "$EDIT_TS" -gt "$LOG_M" ] && MISS="docs/CLAUDE_CODE_LOG.md"
  [ "$EDIT_TS" -gt "$ST_M" ] && MISS="$MISS STATUS.md"
fi

# הודעות קצרות ופעולתיות (קוצרו 28/07/2026 בשיפוץ-ההקשר): שורת-פעולה + הפניה, לא פסקת-הסבר.
# הנימוקים המלאים חיים ב-CLAUDE.md (כלל 15) וב-docs/CLAUDE.md — לא צריך לשכפל אותם בכל חסימה.
REASON=""
if [ -n "$MG_STALE" ]; then
  REASON="עדכן את מדריך המיקרו (כותרת-מצב · טבלת-צעדים · סטיות):$MG_STALE. "
fi
if [ -n "$RM_STALE" ]; then
  REASON="${REASON}מיגרציה השתנתה — עדכן את docs/db_roadmap.md §10 (שורות-המפה + Done). "
fi
if [ -n "$HG_MISS" ]; then
  REASON="${REASON}חוב 🚧 בלי רישום ב-PROJECT_MASTER §6 —$HG_MISS. הוסף שורה '🚧 מN ← מ<מקור> · מה · מקור: micro_guides/module-<מקור>.md'. "
fi
if [ -n "$PLAN_MISS" ]; then
  REASON="${REASON}תוכנית ב-docs/plans/ בלי מצביע משום קובץ-תקן —$PLAN_MISS. הוסף אזכור-שם-קובץ ב-prompt_module_discovery.md / PROJECT_MASTER.md / module-blueprint/module-build/module-close, או סמן בתוכנית עצמה 'תוכנית סגורה' אם כל תוכנה כבר עבר למקום קבוע. "
fi
if [ -n "$MISS" ]; then
  REASON="${REASON}עדכן לפני סיום: $MISS. (אורך רשומת-היומן — לפי המדיניות שבראש CLAUDE_CODE_LOG.md עצמו, שם היא נקבעת; אם אין שינוי-סטטוס — ב-STATUS רק שורת 'עודכן לאחרונה', אחרי שווידאת שהלוח נכון.)"
fi

if [ -n "$REASON" ]; then
  # תיוג ברור: זו בדיקה אוטומטית של הריפו, לא הודעה אנושית — כדי שלא יתבלבלו
  # (המשתמש חשב פעם שההודעות מגיעות ממנו/מ-Claude).
  PREFIX="🤖 בדיקה אוטומטית של הריפו (Stop hook — לא הודעה מ-Claude או מהמשתמש): "
  echo "{\"decision\":\"block\",\"reason\":\"${PREFIX}${REASON}\"}"
fi
exit 0
