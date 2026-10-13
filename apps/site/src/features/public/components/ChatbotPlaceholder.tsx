import { Bot, Send } from "lucide-react";

export function ChatbotPlaceholder() {
  return (
    <aside
      aria-label="Aperçu de l’assistant scolaire, bientôt disponible"
      className="fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:bottom-6 sm:right-6"
    >
      <div className="flex items-center gap-3 bg-sacred-red px-4 py-3 text-white">
        <span className="grid size-10 place-items-center rounded-full bg-white/15">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold">Assistant Sacré-Cœur</p>
          <p className="text-xs text-white/75">Bientôt disponible</p>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <p className="max-w-[90%] rounded-2xl rounded-tl-sm bg-background p-3 text-sm leading-relaxed">
          Bonjour ! L’assistant de l’école sera bientôt disponible pour répondre à vos questions.
        </p>
        <div className="flex gap-2">
          <input
            disabled
            aria-label="Saisie du message indisponible"
            placeholder="Chat indisponible pour le moment"
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs opacity-70"
          />
          <button
            type="button"
            disabled
            aria-label="Envoyer, bientôt disponible"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-sacred-red text-white opacity-50"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
