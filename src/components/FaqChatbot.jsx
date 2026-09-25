import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, X } from 'lucide-react';
import { navigate } from '../router';
import {
  FAQ_SUGGESTIONS,
  getFaqById,
  matchFaq,
  tryOptionalLlmAnswer,
} from '../lib/faqKnowledge';

/**
 * Floating FAQ assistant for public / visitor routes only.
 * Answers from local knowledge base; optional LLM key is a future hook.
 */
export default function FaqChatbot() {
  const { t } = useTranslation();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', kind: 'welcome' }]);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    inputRef.current?.focus();
  }, [open, messages, busy]);

  const pushBot = (text, links) => {
    setMessages((m) => [...m, { role: 'bot', text, links: links || undefined }]);
  };

  const answerFromEntry = (entry) => {
    if (!entry) {
      pushBot(t('faq.fallback'), undefined);
      return;
    }
    pushBot(entry.answer, entry.links);
  };

  const handleSuggestion = (id) => {
    const sug = FAQ_SUGGESTIONS.find((s) => s.id === id);
    const label = sug?.label || id;
    setMessages((m) => [...m, { role: 'user', text: label }]);
    answerFromEntry(getFaqById(id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const llm = await tryOptionalLlmAnswer(text);
      if (llm) {
        pushBot(llm);
        return;
      }
      const { entry, answer } = matchFaq(text);
      pushBot(answer, entry?.links);
    } finally {
      setBusy(false);
    }
  };

  const onLink = (href) => {
    setOpen(false);
    navigate(href);
  };

  const renderText = (msg) => {
    if (msg.kind === 'welcome') return t('faq.welcome');
    return msg.text;
  };

  return (
    <div className="ml-faq" data-open={open ? '1' : '0'}>
      {open && (
        <div
          className="ml-faq-panel"
          id={panelId}
          role="dialog"
          aria-label={t('faq.panelAria')}
        >
          <header className="ml-faq-head">
            <div>
              <b>{t('faq.title')}</b>
              <small>{t('faq.offline')}</small>
            </div>
            <button
              type="button"
              className="ml-faq-iconbtn"
              aria-label={t('faq.closeAria')}
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </header>

          <div className="ml-faq-body" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={'ml-faq-msg ' + msg.role}>
                <p>{renderText(msg)}</p>
                {msg.links?.length ? (
                  <div className="ml-faq-links">
                    {msg.links.map((l) => (
                      <button key={l.href} type="button" className="ml-faq-link" onClick={() => onLink(l.href)}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? <div className="ml-faq-msg bot muted">{t('faq.thinking')}</div> : null}
            <div ref={endRef} />
          </div>

          <div className="ml-faq-chips" aria-label={t('faq.topicsAria')}>
            {FAQ_SUGGESTIONS.map((s) => (
              <button key={s.id} type="button" className="ml-faq-chip" onClick={() => handleSuggestion(s.id)} disabled={busy}>
                {s.label}
              </button>
            ))}
          </div>

          <form className="ml-faq-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('faq.placeholder')}
              aria-label={t('faq.placeholder')}
              disabled={busy}
              autoComplete="off"
            />
            <button type="submit" className="ml-faq-send" aria-label={t('faq.send')} disabled={busy || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ml-faq-fab"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t('faq.closeAria') : t('faq.openAria')}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
