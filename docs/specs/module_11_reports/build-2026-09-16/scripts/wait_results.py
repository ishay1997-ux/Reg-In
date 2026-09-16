import os, sys, time, glob
RES = 'C:/Users/ishay/AppData/Local/Temp/claude/C--Users-ishay-Reg-In/719c2c51-1224-4dc9-87d1-19cd2ad34298/scratchpad/results'
TASKS = 'C:/Users/ishay/AppData/Local/Temp/claude/C--Users-ishay-Reg-In/719c2c51-1224-4dc9-87d1-19cd2ad34298/tasks'
limit = int(sys.argv[1]) if len(sys.argv) > 1 else 560
def snap():
    return set(p for p in glob.glob(RES + '/*') if os.path.isfile(p))
def outs():
    # an agent's transcript stops growing when it finishes; report sizes for context
    return {os.path.basename(p): os.path.getsize(p) for p in glob.glob(TASKS + '/*.output')}
base = snap(); o0 = outs(); t0 = time.time()
while time.time() - t0 < limit:
    time.sleep(5)
    now = snap()
    if now != base:
        print('NEW RESULTS:', sorted(os.path.relpath(p, RES) for p in now - base))
        sys.exit(0)
print('timeout; no new results. agent transcripts (bytes):', {k: v for k, v in outs().items()})
