import re, hashlib, sys, glob
files = sorted(glob.glob('supabase/migrations/20260916*module11_[defg]*.sql'))
pat = re.compile(r'create\s+or\s+replace\s+function\s+public\.(report_m\d+_\w+|approve_feedback_ai_run)\s*\(', re.I)
for f in files:
    txt = open(f, encoding='utf-8', newline='').read()
    cr = txt.count('\r')
    print(f"== {f}  bytes={len(txt)} CR={cr}")
    for m in pat.finditer(txt):
        name = m.group(1)
        # find dollar-quote tag after 'as' following the signature
        rest = txt[m.end():]
        dm = re.search(r'\bas\s+(\$[A-Za-z_]*\$)', rest, re.I)
        if not dm: print("   ", name, "NO TAG"); continue
        tag = dm.group(1)
        start = dm.end()
        end = rest.find(tag, start)
        body = rest[start:end]
        print(f"   {name:32s} n={len(body):6d} md5={hashlib.md5(body.encode('utf-8')).hexdigest()}")
