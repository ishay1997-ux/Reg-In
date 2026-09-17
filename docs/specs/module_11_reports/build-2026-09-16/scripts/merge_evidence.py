# merge_evidence.py — merges the four per-tab evidence reports into the brief's single
# p3-evidence.json and the four contact sheets into one index.html. Read-only on inputs.
# Usage: python merge_evidence.py <results-dir>
import json, os, re, sys, glob

results = sys.argv[1]
ev = os.path.join(results, 'evidence')
TABS = ['exec', 'finance', 'hostesses', 'customers']
SLUGS = {
    'exec': ['exec-overview', 'trends', 'discounts', 'staffing'],
    'finance': ['finance-overview', 'profitability', 'aging', 'equipment'],
    'hostesses': ['hostess-overview', 'reliability', 'quality-cost', 'fairness'],
    'customers': ['customers-overview', 'satisfaction', 'drifting', 'notes'],
}
IDS = ['CEO', 'FINANCE', 'RECRUIT', 'STAFF']

merged = {
    'written_by': 'merge_evidence.py (orchestrator), 16/09/2026',
    'base_url': None,
    'screenshots': 0,
    'expected_matrix_pngs': 128,
    'missing_matrix_pngs': [],
    'surfaces': [],
    'extras': {},
    'anomalies': [],
    'not_verified': [],
    'blind_spot': {},
    'login': {},
    'runner_failures': {},
    'per_tab_reports': {},
}

pngs = sorted(os.listdir(ev)) if os.path.isdir(ev) else []
merged['screenshots'] = len([p for p in pngs if p.endswith('.png')])
for tab in TABS:
    for slug in SLUGS[tab]:
        for ident in IDS:
            for mode in (0, 2):
                name = f'{ident}-m{mode}-{slug}.png'
                if name not in pngs:
                    merged['missing_matrix_pngs'].append(name)

for tab in TABS:
    rf = os.path.join(results, f'p3-evidence-{tab}.json')
    runf = os.path.join(results, f'evidence-run-{tab}.json')
    merged['per_tab_reports'][tab] = {'report': os.path.exists(rf), 'runner': os.path.exists(runf)}
    if os.path.exists(runf):
        run = json.load(open(runf, encoding='utf-8'))
        merged['base_url'] = merged['base_url'] or run.get('base_url')
        merged['login'][tab] = run.get('login')
        merged['runner_failures'][tab] = run.get('failures', [])
        if run.get('extras'):
            merged['extras'][tab] = run['extras']
    if os.path.exists(rf):
        rep = json.loads(open(rf, encoding='utf-8').read(), strict=False)
        for s in rep.get('surfaces', []):
            s = dict(s)
            s['tab'] = tab
            merged['surfaces'].append(s)
        for a in rep.get('anomalies', []):
            a = dict(a)
            a['tab'] = tab
            merged['anomalies'].append(a)
        merged['not_verified'].extend(f'[{tab}] {x}' for x in rep.get('not_verified', []))
        merged['blind_spot'][tab] = rep.get('blind_spot')

# --- orchestrator review of the harness-level findings (measured after the agents reported) ---
reshoot_dir = os.path.join(os.path.dirname(results), 'results-reshoot')
reshoot = {}
for tab in TABS:
    f = os.path.join(reshoot_dir, f'evidence-run-{tab}.json')
    if os.path.exists(f):
        run = json.load(open(f, encoding='utf-8'))
        for slug, s in run['surfaces'].items():
            for ident, modes in s['identities'].items():
                for mk, entry in modes.items():
                    m = entry.get('measure') or {}
                    reshoot[f'{ident}-{mk}-{slug}'] = {'state': entry.get('state'), 'hints_visible': m.get('hints_visible'), 'console_errors': entry.get('console_errors'), 'scroll_overflow_px': m.get('scroll_overflow_px')}
probe_f = os.path.join(results, 'probe-staffing', 'probe-staffing.json')
probe = json.load(open(probe_f, encoding='utf-8')) if os.path.exists(probe_f) else None
merged['orchestrator_review'] = {
    'written_at': '17/09/2026 00:0X',
    'mode2_intercept_fix': {
        'finding': 'FINANCE and RECRUIT have no notification_preferences row; the intercept mapped an empty array and AuthContext fell back to mode 0 (reported by all four agents).',
        'fix': 'evidence-common.mjs forceOnboardingMode: an empty array becomes one synthetic {onboarding_mode: level} row — still no DB write.',
        'reshoot': 'FINANCE m2 on exec/finance/customers and RECRUIT m2 on hostesses (16 PNGs) replaced in results/evidence; the originals kept under evidence/stale-before-intercept-fix/.',
        'reshoot_measures': reshoot,
    },
    'staffing_blocker_review': {
        'agent_claim': 'exec agent: both charts of מ6 render empty at CEO mode 2 (blocker).',
        'orchestrator_measure': 'probe-staffing.mjs at a FIXED 1280×800 viewport (no fullPage): DOM counts + element screenshots at modes 2 and 0.',
        'result': probe['runs'] if probe else 'probe not run',
        'verdict': 'capture artifact, not a product defect — 717 scatter symbols and 8 histogram bars are in the DOM and visible at a fixed viewport in both modes; the full-page capture re-measures ResponsiveContainer and restarts the recharts animation at frame 0 (the exec agent\'s own blind spot). Severity downgraded blocker ⇒ harness. Durable lesson for the runner: element screenshots or animations disabled for chart evidence.',
    },
}
for a in merged['anomalies']:
    if a.get('severity') == 'blocker' and 'staffing' in str(a.get('surface')):
        a['severity_original'] = 'blocker'
        a['severity'] = 'harness'
        a['orchestrator_verdict'] = 'capture artifact — see orchestrator_review.staffing_blocker_review'
    if 'mode 2' in str(a.get('what', '')).lower() or 'mode-2' in str(a.get('what', '')).lower() or 'onboarding mode 2' in str(a.get('what', '')):
        if a.get('owner', '').startswith(('harness', 'runner', 'doc')) and ('FINANCE' in str(a.get('what')) or 'RECRUIT' in str(a.get('what'))):
            a['severity_original'] = a.get('severity')
            a['severity'] = 'harness-fixed'
            a['orchestrator_verdict'] = 'harness limitation, fixed and re-shot — see orchestrator_review.mode2_intercept_fix'

sev = {}
for a in merged['anomalies']:
    sev[a.get('severity', '?')] = sev.get(a.get('severity', '?'), 0) + 1
merged['anomaly_totals'] = {'total': len(merged['anomalies']), 'by_severity': sev}

json.dump(merged, open(os.path.join(results, 'p3-evidence.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=2)

# contact sheet: concatenate the four per-tab sheets' bodies
parts = []
for tab in TABS:
    f = os.path.join(ev, f'index-{tab}.html')
    if os.path.exists(f):
        html = open(f, encoding='utf-8').read()
        m = re.search(r'<body[^>]*>(.*)</body>', html, re.S | re.I)
        parts.append(f'<section id="{tab}"><h2>{tab}</h2>' + (m.group(1) if m else html) + '</section>')
    else:
        parts.append(f'<section id="{tab}"><h2>{tab}</h2><p>index-{tab}.html missing</p></section>')
out = ('<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>m11 evidence 16/09/2026</title>'
       '<style>body{font-family:system-ui;margin:16px;background:#F8FAFC;color:#0f172a}img{max-width:100%;border:1px solid #cbd5e1;border-radius:6px}figure{margin:12px 0}figcaption{font-size:13px;color:#334155}h2{color:#0F766E}</style>'
       '</head><body><h1>מודול 11 — ראיות-מסך 16/09/2026</h1>'
       f'<p>PNG: {merged["screenshots"]} · חסרים במטריצה: {len(merged["missing_matrix_pngs"])} · חריגות: {merged["anomaly_totals"]["total"]}</p>'
       + ''.join(parts) + '</body></html>')
open(os.path.join(ev, 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)
print(json.dumps({'screenshots': merged['screenshots'], 'missing_matrix_pngs': merged['missing_matrix_pngs'], 'surfaces': len(merged['surfaces']), 'anomalies': merged['anomaly_totals'], 'per_tab': merged['per_tab_reports']}, ensure_ascii=False, indent=1))
