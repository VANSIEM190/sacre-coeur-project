import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

const suggestions = [
  "Comment inscrire mon enfant ?",
  "Quels sont les horaires ?",
  "Comment obtenir un bulletin ?",
];

function getLocalAnswer(question: string) {
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");

  if (/inscri|admission|inscrire|inscription/.test(normalized)) {
    return "L'inscription se fait en ligne depuis le bouton « S'inscrire en tant que parent ». Après l'envoi du dossier, l'administration le vérifie avant de valider l'inscription.";
  }

  if (/horaire|heure|ouvert|secreta|secretariat/.test(normalized)) {
    return "Le secrétariat accueille les familles du lundi au vendredi, de 8 h à 16 h.";
  }

  if (/bulletin|note|resultat|resultats/.test(normalized)) {
    return "Les bulletins sont disponibles en PDF dans l'espace de l'élève lorsque la tranche de minerval correspondante est soldée.";
  }

  if (/paiement|minerval|payer|cout|frais|tarif/.test(normalized)) {
    return "Le minerval se paie à la caisse de l'école. Un reçu numérique est ensuite généré dans l'espace de l'élève. Pour connaître le montant applicable, contactez le secrétariat.";
  }

  if (/enseignant|professeur|matricule|activation/.test(normalized)) {
    return "L'administration remet à chaque enseignant un matricule d'activation. Il permet de choisir un mot de passe avant de se connecter avec son adresse e-mail.";
  }

  if (/contact|telephone|numero|adresse|email|mail|joindre/.test(normalized)) {
    return "Vous pouvez joindre le secrétariat au +243 810 860 751 ou écrire à contact@sacrecoeur.edu. Il est disponible du lundi au vendredi, de 8 h à 16 h.";
  }

  if (/plateforme|connect|connexion|compte|espace/.test(normalized)) {
    return "La plateforme propose un espace pour les familles, les élèves et les enseignants. Si vous avez déjà un compte, utilisez le bouton de connexion du site. Pour un problème d'accès, contactez le secrétariat au +243 810 860 751.";
  }

  return "Je n'ai pas encore cette information dans ma version de démonstration. Le secrétariat peut vous renseigner au +243 810 860 751 ou à contact@sacrecoeur.edu, du lundi au vendredi de 8 h à 16 h.";
}

export function ChatbotPlaceholder() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "Bonjour ! Je peux vous renseigner sur les inscriptions, les horaires et les services de l'école. Que souhaitez-vous savoir ?",
    },
  ]);
  const nextMessageId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  function addMessage(content: string) {
    const question = content.trim();
    if (!question) return;

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      content: question,
    };
    const assistantMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "assistant",
      content: getLocalAnswer(question),
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft("");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addMessage(draft);
  }

  function handleSuggestion(question: string) {
    addMessage(question);
  }

  return (
    <aside
      aria-label="Assistant du Sacré-Cœur"
      className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6"
    >
      {isOpen ? (
        <section
          aria-labelledby="school-chat-title"
          className="flex h-auto max-h-[min(36rem,calc(100dvh-6rem))] w-[calc(100vw-2rem)] min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:max-h-[min(36rem,calc(100dvh-7rem))] sm:w-[min(24rem,calc(100vw-3rem))]"
        >
          <header className="flex shrink-0 items-center gap-3 bg-sacred-red px-4 py-3 text-white">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="school-chat-title"
                className="truncate text-sm font-semibold"
              >
                Assistant Sacré-Cœur
              </h2>
              <p className="text-xs text-white/75">Démo · réponses locales</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer l'assistant"
              className="grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div
            ref={conversationRef}
            aria-label="Conversation"
            aria-live="polite"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[88%] whitespace-pre-line break-words rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-sacred-red text-white"
                      : "rounded-bl-sm bg-background"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          {messages.length === 1 && (
            <div className="flex shrink-0 flex-wrap gap-2 px-4 pb-3">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className="rounded-full border border-border px-3 py-1.5 text-left text-xs transition-colors hover:border-sacred-red hover:text-sacred-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-sacred-red"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={sendMessage}
            className="flex shrink-0 gap-2 border-t border-border p-3"
          >
            <label className="sr-only" htmlFor="school-chat-message">
              Votre message
            </label>
            <input
              ref={inputRef}
              id="school-chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Écrivez votre message…"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sacred-red focus:ring-2 focus:ring-sacred-red/20"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Envoyer le message"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-sacred-red text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir l'assistant Sacré-Cœur"
          className="flex items-center gap-2 rounded-full bg-sacred-red px-4 py-3 text-sm font-semibold text-white shadow-xl transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sacred-red"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          <span>Une question ?</span>
        </button>
      )}
    </aside>
  );
}
