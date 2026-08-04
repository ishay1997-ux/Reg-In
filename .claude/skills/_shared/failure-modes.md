# Five failure modes — how this project actually fails

Measured across two arenas, 01–02/08/2026. Twelve symptoms collapsed into five causes.
Every failure recorded in this project has been one of these wearing a costume — which
is why patching symptoms one at a time never reduced the rate.

🅰️ **No layer can audit the layer above it.** Ishay cannot read code; the session that
writes it is the same one that reviews it; nobody comes after.
**Counter — not more trust, but outputs shaped so a SKIP IS VISIBLE:** one line per
check performed, including an explicit "אין הערות". A missing line is the only audit
available to someone who cannot read the work itself.

🅱️ **Intent degrades at every handoff, and only the last link is measured.** Tests
compare code to spec. Nothing compares spec to what Ishay meant. *(Anchor: the save⇄send
gap was not a bug — it was the architecture working as designed, and he found it only by
sending a real email.)*
**Counter: close both ends** — an understanding-declaration before building (a concrete
scenario in his world, invited for correction), and a real user walk before "done".

🅲 **A mechanism that fires when "someone notices" never fires** — and whoever should
notice is precisely the one whose attention is already on the next thing. *(Four
consecutive shifts had the same headline: the mechanism existed, nobody ran it.)*
**Counter: hang the trigger on an artifact** — a commit, a required output shape, an
outside reader. Never on memory.

🅳 **The system slows down as it learns.** Every lesson becomes text, and text is read
every session. Nothing here removes anything.
**Counter: subtraction is a job, not a side effect.** Before adding: what does this make
unnecessary? A mistake earns a rule only on its second or third occurrence; the first
lives as a dated note.

🅴 **The instruments lie, and nothing checks the instruments.** Five occurrences in one
shift: a growth metric measured before the data it measures was written · a velocity
formula that counted inherited history (24 instead of 8) · "zero of six exist" that was
a measurement of one file · a claim about a module made without opening its guide.
**Counter: before quoting a measurement, state in one line what it measures and what
would make it wrong.** And an absence-claim is only as wide as the set of places
searched — name the places first, and search the way the SOURCE writes it, not the way
you remember writing it.

---

## Six self-review questions — the ones that measurably found something

Run them against a real, named event; an answer with no anchor is a vibe.

1. **Who caught the mistakes — me, or someone else?** *(Measured across five shifts in
   two arenas, the self-catch count was 0 every time. Treat 0 as the expected answer and
   as proof that an outside reader is not optional.)*
2. **What is the general shape of these misses — how many are really the same one?**
   *(This question produced the five modes above; it collapsed ~12 symptoms into 5.)*
3. **Which of my actions got no check at all this round?** Recorded misses are only the
   ones that were caught.
4. **Where did I look for confirmation instead of refutation?** — including: did I verify
   the way the reporter searched, or the way the source writes?
5. **Did I hand a checker the expected answer?** An expected number bends a count toward
   confirmation instead of measurement.
6. **How many rules were born this round versus how many incidents?** A ratio near 1:1 is
   a patch factory. For each new rule, the inverse test: would it have been HARMFUL in
   some earlier round?
