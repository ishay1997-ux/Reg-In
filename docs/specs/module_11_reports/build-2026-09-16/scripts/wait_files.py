import os, sys, time
d = sys.argv[1]; limit = int(sys.argv[2]); names = sys.argv[3:]
t0 = time.time(); last = None
while time.time() - t0 < limit:
    present = [n for n in names if os.path.exists(os.path.join(d, n))]
    sizes = {n: os.path.getsize(os.path.join(d, n)) for n in present}
    if sizes != last:
        print(f'{int(time.time()-t0):4d}s  present={sizes}', flush=True); last = sizes
    if len(present) == len(names):
        print('ALL PRESENT'); sys.exit(0)
    time.sleep(15)
print('timeout'); sys.exit(3)
