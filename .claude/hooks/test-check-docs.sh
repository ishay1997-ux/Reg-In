#!/usr/bin/env bash
# בדיקות ל-check-docs-updated.sh (נוסף 24/09/2026, עם שני התיקונים של אותו יום).
# למה: שני התיקונים (stop_hook_active · מדידת LOG/STATUS רק על קבצים בתיקייה הזו שבסימון) הם
# התנהגות של hook, ואין להם בדיקה אחרת. בלי הרצה חוזרת, "תוקן" הוא טענה ולא ראיה.
# איך: כל מקרה רץ בריפו-זמני משלו (mktemp -d), עם קובץ-סימון מדומה ב-.git שלו. הסימונים של הריפו
# האמיתי לא נקראים ולא נכתבים.
# הרצה: bash .claude/hooks/test-check-docs.sh            (מתיקיית-השורש של הריפו)
#       HOOK=/path/to/old-hook.sh bash .claude/hooks/test-check-docs.sh   (להשוות לגרסה אחרת)

HOOK="${HOOK:-$(cd "$(dirname "$0")" && pwd)/check-docs-updated.sh}"
SID="test-session"
PASS=0
FAIL=0
TMP_ROOTS=""

# ריפו-זמני: LOG + STATUS + שני קבצים מקומטים, כולם עם mtime של לפני 100 שניות.
fresh_repo() {
  R=$(mktemp -d)
  TMP_ROOTS="$TMP_ROOTS $R"
  cd "$R" || exit 1
  git init -q
  git config user.email test@example.invalid
  git config user.name test
  git config core.autocrlf false # שקט ב-Windows; הריפו-הזמני אינו יורש .gitattributes
  mkdir -p docs src
  echo log >docs/CLAUDE_CODE_LOG.md
  echo status >STATUS.md
  echo a >src/a.js
  echo other >other.txt
  git add -- docs STATUS.md src other.txt
  git commit -qm init
  touch -d '-100 seconds' docs/CLAUDE_CODE_LOG.md STATUS.md src/a.js other.txt
  MUT="$(git rev-parse --absolute-git-dir)/regin-session-mutations"
  mkdir -p "$MUT"
  MARK="$MUT/$SID"
}

# run_case <תיאור> <block|pass> <JSON-קלט>
run_case() {
  desc="$1"
  want="$2"
  json="$3"
  out=$(printf '%s' "$json" | bash "$HOOK" 2>/dev/null)
  if printf '%s' "$out" | grep -qF '"decision":"block"'; then got=block; else got=pass; fi
  printf '\n▶ %s\n' "$desc"
  printf '   קלט:    %s\n' "$json"
  printf '   סימון:  %s\n' "$(tr '\n' ' ' <"$MARK" 2>/dev/null)"
  printf '   שינויים: %s\n' "$(git status --porcelain -uall | tr '\n' ' ')"
  if [ -n "$out" ]; then
    printf '   פלט:    %s\n' "$(printf '%s' "$out" | sed 's/.*Stop hook[^:]*: //' | cut -c1-110)"
  else
    printf '   פלט:    (ריק — הסיום עובר)\n'
  fi
  if [ "$got" = "$want" ]; then
    PASS=$((PASS + 1))
    printf '   ✅ %s\n' "$got"
  else
    FAIL=$((FAIL + 1))
    printf '   ❌ ציפינו %s, קיבלנו %s\n' "$want" "$got"
  fi
}

echo "hook: $HOOK"

# 1 · עריכה כאן, בלי LOG/STATUS ⇒ חוסם.
fresh_repo
echo "src/a.js" >"$MARK"
echo edited >src/a.js
run_case "1 · עריכה בתיקייה הזו, LOG/STATUS לא עודכנו" block "{\"session_id\":\"$SID\"}"

# 2 · עריכה כאן, ואחריה LOG + STATUS ⇒ עובר.
fresh_repo
echo "src/a.js" >"$MARK"
echo edited >src/a.js
touch -d '-50 seconds' src/a.js
echo "log entry" >>docs/CLAUDE_CODE_LOG.md
echo "status line" >>STATUS.md
run_case "2 · עריכה בתיקייה הזו, LOG + STATUS עודכנו אחריה" pass "{\"session_id\":\"$SID\"}"

# 3 · אותו מצב כמו 1, אבל Claude כבר ממשיך בגלל חסימה קודמת ⇒ עובר (לא לולאה).
fresh_repo
echo "src/a.js" >"$MARK"
echo edited >src/a.js
run_case "3 · כמו 1, עם stop_hook_active" pass "{\"session_id\":\"$SID\",\"stop_hook_active\":true}"

# 4 · התקרית של 24/09: הסימון מחזיק רק נתיבים של תיקיית-עבודה אחרת, ובתיקייה הזו יש קובץ
#     לא-מקומט של מישהו אחר ⇒ עובר (קודם: חסם על LOG/STATUS של התיקייה הזו).
fresh_repo
printf '%s\n' ".claude/worktrees/agent-x/docs/db_roadmap.md" \
  ".claude/worktrees/agent-x/supabase/migrations/29990101000000_x.sql" >"$MARK"
echo "someone else" >other.txt
run_case "4 · סימון עם נתיבים של תיקייה אחרת בלבד" pass "{\"session_id\":\"$SID\"}"

# 5 · '*' בסימון (היקף לא-ידוע) ⇒ ההתנהגות הישנה, המחמירה ⇒ חוסם.
fresh_repo
echo "*" >"$MARK"
echo "someone else" >other.txt
run_case "5 · סימון '*' (היקף לא-ידוע) — נשאר מחמיר" block "{\"session_id\":\"$SID\"}"

# 6 · הכרעת-ישי 12/08/2026: אין שינויים לא-מקומטים ⇒ יציאה מוקדמת, לא השתנתה ⇒ עובר.
fresh_repo
echo "src/a.js" >"$MARK"
run_case "6 · אין שינויים לא-מקומטים (היציאה המוקדמת, ללא שינוי)" pass "{\"session_id\":\"$SID\"}"

cd / || true
for r in $TMP_ROOTS; do rm -rf -- "$r"; done

printf '\nעברו %s · נכשלו %s\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
