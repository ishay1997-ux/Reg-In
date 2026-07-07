#!/usr/bin/env bash
# Stop hook — חוסם סיום סשן אם קבצים השתנו בלי שעודכן התיעוד המחייב.
# הלוגיקה ישבה קודם ישירות בתוך .claude/settings.json (הועברה לכאן 06/07/2026
# כדי ש-Claude יוכל לתחזק אותה בלי לגעת ב-settings.json, שעריכתו על-ידי Claude
# חסומה על-ידי ההגנה המובנית של Claude Code).
#
# שתי אכיפות, לפי סדר פרוטוקול סוף-הסשן ב-CLAUDE.md:
# (0) מדריך-מיקרו חי (כלל ברזל 15): קוד של מודול (src/modules/NN_*/) שהשתנה
#     מחייב שמדריך המיקרו שלו (docs/micro_guides/module-N.md) יעודכן אחריו.
# (1-3) היומן ולוח המצב: docs/CLAUDE_CODE_LOG.md + STATUS.md חייבים להתעדכן
#     אחרי הקובץ ששונה אחרון.
# אם משהו חסר — פולטים JSON עם decision:block והסשן לא מסתיים עד שמעדכנים.
#
# מודעות-לסשן (נוסף 07/07/2026, כלל ברזל 16): הבדיקה חלה רק על סשן שערך קבצים
# בעצמו. סשן קריאה-בלבד (שלא ביצע Edit/Write/NotebookEdit) פטור לגמרי — גם אם
# סשן כותב אחר "מלכלך" את עץ-העבודה המשותף. את "מי ערך ומתי" קובע קובץ-הסימון
# שכותב protect-frozen-files.sh (mtime = זמן העריכה האחרונה של הסשן).

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

# כל השינויים חוץ מהיומן ולוח המצב עצמם
CHANGED=$(git status --porcelain -- . ":!$LOG" ":!$ST" 2>/dev/null)
[ -z "$CHANGED" ] && exit 0

# --- אכיפה 0: מדריך-מיקרו חי ---
# לכל קובץ ששונה תחת src/modules/NN_*/ נגזר מספר המודול N ונבדק שהמדריך
# docs/micro_guides/module-N.md עודכן אחריו. מודול שעדיין אין לו מדריך-מיקרו
# (טרם נוצר בפתיחתו) — לא חוסמים; האכיפה חלה רק ממרגע שהמדריך קיים.
MG_STALE=""
NEWEST=0
while IFS= read -r line; do
  f=$(printf '%s' "$line" | cut -c4-)
  [ -f "$f" ] || continue
  m=$(stat -c %Y "$f" 2>/dev/null || echo 0)
  [ "$m" -gt "$NEWEST" ] && NEWEST=$m
  case "$f" in
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
        case " $MG_STALE " in *" $mg "*) ;; *) MG_STALE="$MG_STALE $mg" ;; esac
      fi
      ;;
  esac
done <<< "$CHANGED"

# --- אכיפה 1-3: יומן ולוח מצב ---
# משווים מול זמן העריכה של *הסשן הזה* (mtime של הסימון), לא מול NEWEST הגלובלי —
# כך שינויים לא-מקומיטים של סשן מקביל לא נספרים. בלי session_id → נשארים על NEWEST.
if [ -n "$SESSION_ID" ] && [ -s "$MARK" ]; then
  EDIT_TS=$(stat -c %Y "$MARK" 2>/dev/null || echo 0)
else
  EDIT_TS=$NEWEST
fi

MISS=""
[ "$EDIT_TS" -gt "$LOG_M" ] && MISS="docs/CLAUDE_CODE_LOG.md"
[ "$EDIT_TS" -gt "$ST_M" ] && MISS="$MISS STATUS.md"

REASON=""
if [ -n "$MG_STALE" ]; then
  REASON="קוד מודול השתנה בלי שמדריך המיקרו שלו עודכן אחריו:$MG_STALE. עדכן בו את כותרת המצב, טבלת הצעדים והסטיות (כלל ברזל 15, צעד 0 בפרוטוקול סוף-סשן). "
fi
if [ -n "$MISS" ]; then
  REASON="${REASON}הסשן הזה ערך קבצים אחרי העדכון האחרון של: $MISS. עדכן את היומן (docs/CLAUDE_CODE_LOG.md) ואת לוח המצב (STATUS.md) לפני סיום התור. אם אין שינוי-סטטוס אמיתי — עדכן ב-STATUS.md רק את שורת 'עודכן לאחרונה' אחרי שווידאת שהלוח עדיין נכון."
fi

if [ -n "$REASON" ]; then
  # תיוג ברור: זו בדיקה אוטומטית של הריפו, לא הודעה אנושית — כדי שלא יתבלבלו
  # (המשתמש חשב פעם שההודעות מגיעות ממנו/מ-Claude).
  PREFIX="🤖 בדיקה אוטומטית של הריפו (Stop hook — לא הודעה מ-Claude או מהמשתמש): "
  echo "{\"decision\":\"block\",\"reason\":\"${PREFIX}${REASON}\"}"
fi
exit 0
