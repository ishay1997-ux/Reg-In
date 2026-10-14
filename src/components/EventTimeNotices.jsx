// ההערות הרכות על שעות האירוע (`eventTimeNotices` ב-`src/lib/eventTimeChecks.js`) — אותו מראה בשני
// המסכים שקובעים שעות: ענבר, קטן, מתחת לשדה, ולעולם לא חוסם שמירה (S-17). הסגנון הוא זה של
// "האירוע חוצה חצות" שבדיאלוג עריכת פרטי האירוע.
export default function EventTimeNotices({ notices, testId }) {
  if (!notices?.length) return null
  return (
    <div className="mt-1 flex flex-col gap-0.5" data-testid={testId}>
      {notices.map((notice) => (
        <span
          key={notice.key}
          className="text-xs font-semibold text-amber-700"
          data-testid={`${testId}-${notice.key}`}
        >
          {notice.text}
        </span>
      ))}
    </div>
  )
}
