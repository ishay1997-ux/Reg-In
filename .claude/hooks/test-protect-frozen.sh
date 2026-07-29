#!/usr/bin/env bash
# בדיקות ל-protect-frozen-files.sh (נוסף 08/07/2026, מועצת-llm-council).
# למה: עד עכשיו לא היו בדיקות ל-hooks — באג ה-Bash-branch חי חודש בלי שנתפס.
# איך זה עוקף את ה-meta-problem (אי-אפשר לבדוק hook-שחוסם-rm-של-frozen ע"י הרצת
# פקודה שמכילה "rm frozen", כי ה-PreToolUse ירוץ על פקודת-הבדיקה עצמה):
#   ה-fixtures הם heredocs בתוך הסקריפט; ה-hook מורץ עליהם כ-subprocess פנימי,
#   שאינו עובר דרך PreToolUse. פקודת-ה-Bash-tool החיצונית היא רק `bash <this>`,
#   שאין בה frozen/destructive → עוברת נקי.
# הרצה: bash .claude/hooks/test-protect-frozen.sh   (מתיקיית-השורש של הריפו)

HOOK="$(dirname "$0")/protect-frozen-files.sh"
COMMITTED_MIG="supabase/migrations/20260629000000_baseline_schema.sql"  # עקובה ב-git
PASS=0; FAIL=0

# run_case <תיאור> <exit-צפוי> <JSON-קלט>
run_case() {
  desc="$1"; want="$2"; json="$3"
  printf '%s' "$json" | bash "$HOOK" >/dev/null 2>&1
  got=$?
  if [ "$got" -eq "$want" ]; then PASS=$((PASS+1)); printf '  ✅ %s (exit %s)\n' "$desc" "$got"
  else FAIL=$((FAIL+1)); printf '  ❌ %s — ציפינו exit %s, קיבלנו %s\n' "$desc" "$want" "$got"; fi
}

echo "=== הגנת-קפואים (exit 2 = חסום) ==="
run_case "Edit על C5 קפוא → חסום" 2 '{"tool_name":"Edit","session_id":"t","tool_input":{"file_path":"docs/reference_spec/C5_clean_transcript.md"}}'
run_case "Edit על קובץ רגיל → עובר" 0 '{"tool_name":"Edit","session_id":"t","tool_input":{"file_path":"src/App.jsx"}}'
run_case "Bash rm על C5 → חסום" 2 '{"tool_name":"Bash","session_id":"t","tool_input":{"command":"rm docs/reference_spec/C5_clean_transcript.md"}}'
run_case "Bash cat על C5 (קריאה, אין פועל) → עובר" 0 '{"tool_name":"Bash","session_id":"t","tool_input":{"command":"cat docs/reference_spec/C5_clean_transcript.md"}}'

echo "=== באג ה-Bash-branch שתוקן (frozen בהודעה, פועל על קובץ אחר) ==="
run_case "git commit עם C5_clean_transcript בהודעה → עובר (היה נחסם!)" 0 '{"tool_name":"Bash","session_id":"t","tool_input":{"command":"git commit -m \"note about C5_clean_transcript typo\""}}'

echo "=== מיגרציות append-only (🧱) ==="
run_case "Edit על מיגרציה מקומטת → חסום" 2 "{\"tool_name\":\"Edit\",\"session_id\":\"t\",\"tool_input\":{\"file_path\":\"$COMMITTED_MIG\"}}"
run_case "Write על מיגרציה חדשה לא-עקובה → עובר" 0 '{"tool_name":"Write","session_id":"t","tool_input":{"file_path":"supabase/migrations/29990101000000_draft.sql"}}'
run_case "Bash rm על מיגרציה מקומטת → חסום" 2 "{\"tool_name\":\"Bash\",\"session_id\":\"t\",\"tool_input\":{\"command\":\"rm $COMMITTED_MIG\"}}"

echo "=== חור-הכלים שנסגר (PowerShell + Desktop-Commander) ==="
run_case "PowerShell Remove-Item על C5 → חסום" 2 '{"tool_name":"PowerShell","session_id":"t","tool_input":{"command":"Remove-Item docs/reference_spec/C5_clean_transcript.md"}}'
run_case "DC write_file על C6 → חסום" 2 '{"tool_name":"mcp__Desktop_Commander__write_file","session_id":"t","tool_input":{"path":"docs/reference_spec/C6_clean_transcript.md"}}'
run_case "DC move_file source=מיגרציה מקומטת → חסום" 2 "{\"tool_name\":\"mcp__Desktop_Commander__move_file\",\"session_id\":\"t\",\"tool_input\":{\"source\":\"$COMMITTED_MIG\",\"destination\":\"x.sql\"}}"
run_case "DC write_file על קובץ רגיל → עובר" 0 '{"tool_name":"mcp__Desktop_Commander__write_file","session_id":"t","tool_input":{"path":"src/foo.js"}}'

echo "=== רישום marker (החור: DC לא רשם → Stop hook חשב קריאה-בלבד) ==="
MUTDIR="$(git rev-parse --absolute-git-dir 2>/dev/null)/regin-session-mutations"
SID="test-marker-$$"
rm -f "$MUTDIR/$SID" 2>/dev/null
printf '{"tool_name":"mcp__Desktop_Commander__write_file","session_id":"%s","tool_input":{"path":"src/bar.js"}}' "$SID" | bash "$HOOK" >/dev/null 2>&1
if [ -s "$MUTDIR/$SID" ]; then PASS=$((PASS+1)); echo "  ✅ DC write רשם marker פר-סשן"; else FAIL=$((FAIL+1)); echo "  ❌ DC write לא רשם marker"; fi
rm -f "$MUTDIR/$SID" 2>/dev/null
# קובץ-תוכנית מחוץ-לעץ לא אמור לרשום marker
SID2="test-plan-$$"
rm -f "$MUTDIR/$SID2" 2>/dev/null
printf '{"tool_name":"Write","session_id":"%s","tool_input":{"file_path":"C:\\\\Users\\\\x\\\\.claude\\\\plans\\\\p.md"}}' "$SID2" | bash "$HOOK" >/dev/null 2>&1
if [ ! -s "$MUTDIR/$SID2" ]; then PASS=$((PASS+1)); echo "  ✅ קובץ-תוכנית מחוץ-לעץ לא רשם marker"; else FAIL=$((FAIL+1)); echo "  ❌ קובץ-תוכנית רשם marker בטעות"; fi
rm -f "$MUTDIR/$SID2" 2>/dev/null

echo "=== ייחוס-נתיב פר-סשן (נוסף 29/07/2026 — תקרית LoginPage.jsx) ==="
TOP="$(git rev-parse --show-toplevel)"
SID3="test-path-$$"
rm -f "$MUTDIR/$SID3" 2>/dev/null
printf '{"tool_name":"Edit","session_id":"%s","tool_input":{"file_path":"%s/src/modules/01_auth/LoginPage.jsx"}}' "$SID3" "$TOP" | bash "$HOOK" >/dev/null 2>&1
if grep -qxF 'src/modules/01_auth/loginpage.jsx' "$MUTDIR/$SID3" 2>/dev/null; then
  PASS=$((PASS+1)); echo "  ✅ נתיב-מוחלט נשמר כיחסי+lowercase (לא 'x' גנרי)"
else
  FAIL=$((FAIL+1)); echo "  ❌ הנתיב לא נשמר כמצופה — תוכן: $(cat "$MUTDIR/$SID3" 2>/dev/null)"
fi
rm -f "$MUTDIR/$SID3" 2>/dev/null

SID4="test-relpath-$$"
rm -f "$MUTDIR/$SID4" 2>/dev/null
printf '{"tool_name":"mcp__Desktop_Commander__write_file","session_id":"%s","tool_input":{"path":"src/Foo.js"}}' "$SID4" | bash "$HOOK" >/dev/null 2>&1
if grep -qxF 'src/foo.js' "$MUTDIR/$SID4" 2>/dev/null; then
  PASS=$((PASS+1)); echo "  ✅ נתיב-יחסי-מראש (DC) נשמר lowercase כמו-שהוא"
else
  FAIL=$((FAIL+1)); echo "  ❌ נתיב-יחסי לא נשמר כמצופה — תוכן: $(cat "$MUTDIR/$SID4" 2>/dev/null)"
fi
rm -f "$MUTDIR/$SID4" 2>/dev/null

echo ""
echo "=== סיכום: $PASS עברו · $FAIL נכשלו ==="
[ "$FAIL" -eq 0 ]
