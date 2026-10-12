import { useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ListSearch({ value, onChange, label, placeholder, testId }) {
  const input = useRef(null)
  return (
    <div className="relative w-full max-w-md">
      <Search
        aria-hidden="true"
        className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none"
      />
      <Input
        ref={input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="h-9 pr-9 pl-10 text-sm text-right rounded-lg border-slate-300"
        data-testid={testId}
      />
      {value !== '' && (
        <Button
          type="button"
          variant="link"
          aria-label={`נקה ${label}`}
          onClick={() => {
            onChange('')
            input.current?.focus()
          }}
          className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-500"
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      )}
    </div>
  )
}
