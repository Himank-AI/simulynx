import { Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { JOULE_SUGGESTIONS } from '../services/joule/jouleService.ts'
import { useStore } from '../state/store.tsx'
import { Button } from './ui.tsx'

export function JouleDrawer() {
  const { jouleOpen, closeJoule, messages, askJoule, scenario } = useStore()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const lastJoule = [...messages].reverse().find((message) => message.role === 'joule')?.id

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, jouleOpen])

  if (!jouleOpen) return null

  function send(text: string) {
    const value = text.trim()
    if (!value) return
    askJoule(value)
    setDraft('')
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/35" aria-label="Close Joule" onClick={closeJoule} />
      <aside className="drawer-in glass fixed bottom-3 right-3 top-3 z-50 flex w-[min(420px,calc(100%-1.5rem))] flex-col rounded-2xl" aria-label="Joule">
        <header className="border-b border-white/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-ink-950">
                <Sparkles className="h-4 w-4 text-brand-500" aria-hidden />
                JOULE
              </div>
              <p className="mt-1 text-xs text-ink-500">Workforce intelligence</p>
              <p className="mt-1 text-[11px] leading-5 text-ink-400">Context: {scenario.name}. Mock adapter. Answers use the committed simulation only.</p>
            </div>
            <button type="button" className="rounded-md p-1 text-ink-500 hover:bg-white/5" aria-label="Close Joule" onClick={closeJoule}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <p className="text-sm text-ink-600">What would you like to explore?</p>
          {messages.map((message) => (
            <div key={message.id} className={message.role === 'user' ? 'ml-8' : 'mr-2'}>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">{message.role === 'user' ? 'You' : 'Joule'}</div>
              <div className={message.role === 'user' ? 'rounded-lg bg-brand-500/15 px-3 py-2 text-sm leading-6 text-ink-950' : 'rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm leading-6 text-ink-800'}>
                {message.role === 'joule' && message.id === lastJoule ? <Typed text={message.text} /> : message.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="mb-2 flex flex-col gap-1">
            {JOULE_SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-md px-2 py-1.5 text-left text-xs text-ink-600 hover:bg-white/5 hover:text-brand-700"
                onClick={() => send(suggestion)}
              >
                &gt; {suggestion}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about this simulation"
              aria-label="Ask Joule"
              className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-2.5 text-sm text-ink-950 outline-none focus:border-brand-500"
            />
            <Button type="submit" size="sm">
              Ask
            </Button>
          </form>
        </div>
      </aside>
    </>
  )
}

function Typed({ text }: { text: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length)
      return
    }
    setCount(0)
    const timer = window.setInterval(() => {
      setCount((current) => (current >= text.length ? current : current + 3))
    }, 16)
    return () => window.clearInterval(timer)
  }, [text])
  return <>{text.slice(0, count)}</>
}
