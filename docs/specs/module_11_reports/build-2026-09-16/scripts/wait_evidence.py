import os, sys, time, glob
RES = sys.argv[1]
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 560
TABS = ['exec', 'finance', 'hostesses', 'customers']
t0 = time.time()
last = None
while time.time() - t0 < limit:
    done = [t for t in TABS if os.path.exists(os.path.join(RES, f'p3-evidence-{t}.json'))]
    runs = [t for t in TABS if os.path.exists(os.path.join(RES, f'evidence-run-{t}.json'))]
    pngs = len(glob.glob(os.path.join(RES, 'evidence', '*.png')))
    state = (tuple(done), tuple(runs), pngs)
    if state != last:
        print(f'{int(time.time()-t0):4d}s  reports={done}  runner_json={runs}  pngs={pngs}', flush=True)
        last = state
    if len(done) == 4:
        print('ALL FOUR REPORTS PRESENT'); sys.exit(0)
    time.sleep(10)
print('timeout — still waiting'); sys.exit(3)
