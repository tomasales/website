import { type FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Menu, Send, X } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

import { content } from '../content';
import { useLanguage } from '../language';

type ViewMode = 'chatbot' | 'page';
type ChatDownloadAction = {
  href: string;
  label: string;
  fileName: string;
  language: 'EN' | 'ES';
};
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  download?: ChatDownloadAction;
};

const SECTION_IDS = ['home', 'projects', 'about', 'contact'] as const;

function SparklesIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
      <path d="M19 4L19.5 5.5L21 6L19.5 6.5L19 8L18.5 6.5L17 6L18.5 5.5L19 4Z" />
    </svg>
  );
}

function PageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export default function Home() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState<ViewMode>('chatbot');
  const [showModeTip, setShowModeTip] = useState(true);
  const [cvDropdownOpen, setCvDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialSlides, setTestimonialSlides] = useState<number[]>([]);
  const cvDropdownRef = useRef<HTMLDivElement | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement | null>(null);
  const pendingTopScrollRef = useRef(false);
  const skipHashScrollOnceRef = useRef(false);

  const t = content[language];
  const hasChatStarted = chatMessages.length > 0 || isChatLoading;

  useEffect(() => {
    if (!emblaApi) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 12000);

    return () => clearInterval(interval);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const update = () => {
      setTestimonialSlides(emblaApi.scrollSnapList());
      setTestimonialIndex(emblaApi.selectedScrollSnap());
    };

    update();
    emblaApi.on('select', update);
    emblaApi.on('reInit', update);

    return () => {
      emblaApi.off('select', update);
      emblaApi.off('reInit', update);
    };
  }, [emblaApi]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!cvDropdownOpen) return;
      if (!(event.target instanceof Node)) return;
      if (!cvDropdownRef.current) return;
      if (cvDropdownRef.current.contains(event.target)) return;
      setCvDropdownOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [cvDropdownOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (viewMode !== 'chatbot') return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [viewMode]);

  useEffect(() => {
    if (!location.hash || viewMode === 'page') return;
    setViewMode('page');
    setShowModeTip(false);
  }, [location.hash, viewMode]);

  useLayoutEffect(() => {
    if (!pendingTopScrollRef.current) return;
    pendingTopScrollRef.current = false;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const animationFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [language, viewMode]);

  useEffect(() => {
    const id = location.hash.replace('#', '');
    if (!id || viewMode !== 'page') return;
    if (skipHashScrollOnceRef.current) {
      skipHashScrollOnceRef.current = false;
      return;
    }

    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [location.hash, viewMode]);

  useEffect(() => {
    if (viewMode !== 'chatbot' || !chatMessagesRef.current) return;
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
  }, [chatMessages, isChatLoading, viewMode]);

  useEffect(() => {
    if (!showModeTip || viewMode !== 'chatbot') return;

    const timeoutId = window.setTimeout(() => {
      setShowModeTip(false);
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, [showModeTip, viewMode]);

  const resetModeScroll = () => {
    pendingTopScrollRef.current = true;
    skipHashScrollOnceRef.current = true;

    if (location.hash) {
      navigate(`${location.pathname}${location.search}`, { replace: true });
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    resetModeScroll();

    setViewMode(mode);
    setShowModeTip(false);
    setCvDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLanguageChange = (nextLanguage: typeof language) => {
    resetModeScroll();

    setLanguage(nextLanguage);
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (viewMode === 'page') {
      const element = document.getElementById('home');
      element?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setViewMode('page');

    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMessage = chatInput.trim();
    if (!nextMessage || isChatLoading) return;

    const nextMessages = [...chatMessages, { role: 'user' as const, content: nextMessage }];
    setChatMessages(nextMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          language,
          messages: nextMessages,
        }),
      });

      const data = (await response.json()) as {
        answer?: string;
        download?: ChatDownloadAction;
        error?: string;
        code?: string;
      };
      if (!response.ok || !data.answer) {
        const errorMessage =
          data.code === 'invalid_api_key'
            ? t.chatbot.authError
            : data.code === 'insufficient_quota'
              ? t.chatbot.quotaError
              : t.chatbot.error;

        throw new Error(errorMessage);
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer!, download: data.download },
      ]);
    } catch (error) {
      console.error('Chat request failed', error);
      const message = error instanceof Error && error.message ? error.message : t.chatbot.error;

      setChatMessages((prev) => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderViewModeToggle = (large = false) => {
    const wrapperClass = large
      ? 'w-[240px] rounded-[28px] p-2 gap-2'
      : 'rounded-full p-1 gap-2';
    const buttonSizeClass = large
      ? 'h-16 flex-1 inline-flex items-center justify-center'
      : 'p-2 inline-flex items-center justify-center';
    const iconSizeClass = large ? 'w-6 h-6' : 'w-4 h-4';
    const indicatorId = large ? 'view-mode-indicator-large' : 'view-mode-indicator';

    return (
      <div className={`flex items-center bg-muted border border-border/70 ${wrapperClass}`}>
        <button
          type="button"
          onClick={() => handleViewModeChange('chatbot')}
          className={`${buttonSizeClass} relative rounded-[20px] transition-colors ${
            viewMode === 'chatbot' ? 'text-background' : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.chatbot.aiMode}
          aria-label={t.chatbot.aiMode}
        >
          {viewMode === 'chatbot' && (
            <motion.span
              layoutId={indicatorId}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-0 rounded-full bg-foreground shadow-sm"
            />
          )}
          <span className="relative z-10 flex">
            <SparklesIcon className={iconSizeClass} />
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleViewModeChange('page')}
          className={`${buttonSizeClass} relative rounded-[20px] transition-colors ${
            viewMode === 'page' ? 'text-background' : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t.chatbot.pageMode}
          aria-label={t.chatbot.pageMode}
        >
          {viewMode === 'page' && (
            <motion.span
              layoutId={indicatorId}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-0 rounded-full bg-foreground shadow-sm"
            />
          )}
          <span className="relative z-10 flex">
            <PageIcon className={iconSizeClass} />
          </span>
        </button>
      </div>
    );
  };

  const renderLanguageToggle = (large = false) => {
    const wrapperClass = large
      ? 'w-[240px] rounded-[28px] p-2 gap-2'
      : 'rounded-full p-1 gap-2';
    const buttonClass = large
      ? 'h-16 flex-1 inline-flex items-center justify-center rounded-[20px] text-2xl'
      : 'px-3 py-1 rounded-full text-sm';

    return (
      <div className={`flex items-center bg-muted border border-border/70 ${wrapperClass}`}>
          <button
          type="button"
          onClick={() => handleLanguageChange('EN')}
          className={`${buttonClass} transition-all ${
            language === 'EN' ? 'bg-foreground text-background' : 'text-muted-foreground'
          }`}
          style={{ fontWeight: large ? 700 : 600 }}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => handleLanguageChange('ES')}
          className={`${buttonClass} transition-all ${
            language === 'ES' ? 'bg-foreground text-background' : 'text-muted-foreground'
          }`}
          style={{ fontWeight: large ? 700 : 600 }}
        >
          ES
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between gap-4">
          <motion.div
            className="flex h-12 items-center text-2xl tracking-tight cursor-pointer leading-none"
            style={{ fontWeight: 700 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleLogoClick}
          >
            TOMAS
          </motion.div>

          <div className="hidden lg:flex flex-1 justify-center">
            {viewMode === 'page' ? (
              <div className="flex items-center gap-8">
                {t.nav.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => scrollToSection(SECTION_IDS[index])}
                    className="group text-base text-muted-foreground hover:text-foreground transition-colors relative"
                  >
                    {item}
                    <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none leading-none">
                      👆
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="relative">
                {renderViewModeToggle()}

                <AnimatePresence>
                  {showModeTip && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: [0, -4, 0, 4, 0], scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{
                        opacity: { duration: 0.18, ease: 'easeOut' },
                        scale: { duration: 0.18, ease: 'easeOut' },
                        y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
                    >
                      <div
                        className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-border/50 shadow-sm"
                        style={{ fontWeight: 500 }}
                      >
                        <span>👆</span>
                        <span>{t.chatbot.tip}</span>
                        <button
                          type="button"
                          onClick={() => setShowModeTip(false)}
                          className="inline-flex items-center justify-center w-5 h-5 ml-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={language === 'ES' ? 'Cerrar sugerencia' : 'Close tip'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              {viewMode === 'page' && renderViewModeToggle()}
              {renderLanguageToggle()}
            </div>

            <div className="relative lg:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center w-12 h-12 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label={language === 'ES' ? 'Abrir menu' : 'Open menu'}
              >
                <Menu className="w-8 h-8" />
              </button>

              <AnimatePresence>
                {viewMode === 'chatbot' && showModeTip && !mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: [0, -4, 0, 4, 0], scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{
                      opacity: { duration: 0.18, ease: 'easeOut' },
                      scale: { duration: 0.18, ease: 'easeOut' },
                      y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className="absolute top-full mt-4 right-0 z-10 w-fit min-w-[18rem] max-w-[calc(100vw-1.5rem)]"
                  >
                    <div className="absolute -top-1 right-5 w-3 h-3 rotate-45 bg-muted border-l border-t border-border/50" />
                    <div
                      className="relative w-full bg-muted text-foreground px-3.5 py-3 rounded-lg text-[13px] flex items-center gap-1.5 border border-border/50 shadow-sm"
                      style={{ fontWeight: 500 }}
                    >
                      <span className="pt-0.5">👆</span>
                      <span className="flex-1 whitespace-nowrap">{t.chatbot.tip}</span>
                      <button
                        type="button"
                        onClick={() => setShowModeTip(false)}
                        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        aria-label={language === 'ES' ? 'Cerrar sugerencia' : 'Close tip'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-background flex flex-col">
          <div className="px-6 pt-6 lg:px-12">
            <button
              type="button"
              className="inline-flex items-center justify-center w-12 h-12 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={language === 'ES' ? 'Cerrar menu' : 'Close menu'}
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 lg:px-12">
            {viewMode === 'page' && (
              <div className="flex flex-col items-center gap-6 mb-12">
                {t.nav.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => scrollToSection(SECTION_IDS[index])}
                    className="text-4xl tracking-tight text-foreground hover:text-foreground/70 transition-colors"
                    style={{ fontWeight: 700 }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col items-center gap-10">
              {renderViewModeToggle(true)}
              {renderLanguageToggle(true)}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'chatbot' && (
          <motion.div
            key="chatbot-view"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-0 h-[100svh] h-[100dvh] max-h-[100svh] max-h-[100dvh] overflow-hidden bg-background pt-24 pb-3 sm:pb-8 flex items-start"
          >
          <div className="max-w-6xl mx-auto px-6 lg:px-12 w-full h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`h-full min-h-0 flex flex-col pb-0 ${
                hasChatStarted ? 'pt-3 sm:pt-8' : 'pt-5 sm:pt-12'
              }`}
            >
              <AnimatePresence initial={false}>
                {!hasChatStarted && (
                  <motion.div
                    key="chatbot-intro"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-16 overflow-hidden"
                  >
                    <div className="w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] rounded-[28px] bg-gradient-to-br from-[#dfe4ff] to-[#f1e6ff] overflow-hidden flex-shrink-0" />
                    <div className="flex-1 max-w-4xl">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 800, lineHeight: 1.05 }}>
                        {t.chatbot.greeting}
                        <br />
                        {t.chatbot.welcome}
                      </h1>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                ref={chatMessagesRef}
                className={`flex-1 min-h-0 space-y-4 overflow-y-auto pr-1 ${hasChatStarted ? 'pt-2 pb-4' : ''}`}
              >
                {chatMessages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-5 sm:px-6 py-4 ${
                        message.role === 'user'
                          ? 'bg-muted text-foreground'
                          : 'bg-muted/50 text-foreground border border-border/50'
                      }`}
                    >
                      <p className="text-base sm:text-lg leading-relaxed">{message.content}</p>
                      {message.download && (
                        <a
                          href={`${import.meta.env.BASE_URL}${message.download.href}`}
                          download={message.download.fileName}
                          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
                          style={{ fontWeight: 700 }}
                        >
                          {message.download.label}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] sm:max-w-[80%] rounded-2xl px-5 sm:px-6 py-4 bg-muted/50 text-foreground border border-border/50">
                      <p className="text-base sm:text-lg leading-relaxed">{t.chatbot.thinking}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 mt-auto pt-3 sm:pt-6 bg-background">
                <form onSubmit={handleChatSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={t.chatbot.placeholder}
                    className="flex-1 px-6 py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-base sm:text-lg"
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-base sm:text-lg hover:bg-primary/90 transition-colors sm:min-w-[110px]"
                    style={{ fontWeight: 600 }}
                    disabled={isChatLoading}
                  >
                    {t.chatbot.send}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'page' && (
          <motion.div
            key="page-view"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
          <section id="home" className="min-h-screen flex items-center pt-24 pb-[88px]">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                <motion.div
                  className="order-2 lg:order-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1
                    className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight mb-6"
                    style={{ fontWeight: 800, lineHeight: 1.1 }}
                  >
                    {t.hero.greeting.replace(' 👋,', '').replace(' 👋', '')}{' '}
                    <motion.span
                      className="inline-block"
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      👋
                    </motion.span>
                    ,
                    <br />
                    {t.hero.intro}
                  </h1>
                  <p className="text-xl md:text-2xl text-foreground/80 mb-4 leading-relaxed">{t.hero.description}</p>
                  <p className="text-lg md:text-xl text-muted-foreground italic">{t.hero.note}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="order-1 lg:order-2 relative aspect-square rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 overflow-hidden"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-60 blur-3xl animate-pulse"></div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          <section className="py-[88px]">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <motion.div
                className="text-center max-w-3xl mx-auto bg-muted/50 border border-border/50 rounded-3xl px-6 sm:px-12 py-10 sm:py-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-xl md:text-2xl lg:text-3xl mb-12" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                  🎁 {t.gift.title} 🎁
                </h2>
                <a
                  href="#"
                  className="group inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-base hover:bg-primary/90 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {t.gift.link}
                  <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
                </a>
              </motion.div>
            </div>
          </section>

          <section id="projects" className="py-[88px]">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <motion.h2
                className="text-4xl md:text-5xl lg:text-6xl mb-20"
                style={{ fontWeight: 700, lineHeight: 1.2 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {t.projects.title}
              </motion.h2>

              <div className="space-y-24">
                {t.projects.items.map((project, index) => (
                  <motion.div
                    key={project.slug}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="bg-muted/50 border border-border/50 rounded-3xl p-8 sm:p-12"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                      <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                        <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-pink-500/30 to-blue-500/30 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-blue-500 opacity-40"></div>
                        </div>
                      </div>

                      <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                        <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontWeight: 600 }}>
                          {project.category}
                        </p>
                        <h3 className="text-4xl md:text-5xl mb-6" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {project.title}
                        </h3>
                        <p className="text-xl text-foreground/70 leading-relaxed mb-8">{project.description}</p>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 text-base hover:bg-primary/90 transition-colors"
                          style={{ fontWeight: 600 }}
                          onClick={() => navigate(`/projects/${project.slug}`)}
                          aria-label={`${language === 'ES' ? 'Ver proyecto' : 'View project'}: ${project.title}`}
                        >
                          {language === 'ES' ? 'Ver proyecto' : 'View project'}
                          <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section id="about" className="py-[88px]">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-24">
                <motion.div
                  className="lg:col-span-2"
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="aspect-[4/3] lg:aspect-[3/4] rounded-2xl bg-gradient-to-br from-cyan-500/30 to-orange-500/30 overflow-hidden sticky top-32">
                    <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-orange-500 opacity-50"></div>
                  </div>
                </motion.div>

                <motion.div
                  className="lg:col-span-3"
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl md:text-5xl mb-8" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {t.about.title}
                  </h2>
                  <p className="text-xl text-foreground/70 whitespace-pre-line leading-relaxed mb-12">{t.about.bio}</p>

                  <div className="mb-8">
                    <h3 className="text-sm uppercase tracking-wider mb-6" style={{ fontWeight: 700 }}>
                      {t.about.certifications}
                    </h3>
                    <div className="space-y-4">
                      {t.about.certs.map((cert) => {
                        const isAICert = cert.includes('AI Designer');

                        return (
                          <div
                            key={cert}
                            className={`relative px-5 py-4 bg-muted/50 text-foreground rounded-lg text-base ${
                              isAICert ? 'border-2' : 'border border-border/50'
                            }`}
                            style={{ fontWeight: 500, borderColor: isAICert ? '#4C2C72' : undefined }}
                          >
                            {isAICert && (
                              <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#4C2C72] rounded-full flex items-center justify-center text-white">
                                <SparklesIcon className="w-4 h-4" />
                              </div>
                            )}
                            {cert}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative" ref={cvDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCvDropdownOpen(!cvDropdownOpen)}
                      className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      {t.about.download} →
                    </button>

                    {cvDropdownOpen && (
                      <div className="absolute top-full mt-2 left-0 bg-background border border-border rounded-2xl shadow-lg overflow-hidden z-10 min-w-[200px]">
                        <a
                          href={`${import.meta.env.BASE_URL}Curriculum/CV_EN.pdf`}
                          download
                          className="block px-6 py-4 text-base hover:bg-muted transition-colors"
                          style={{ fontWeight: 500 }}
                          onClick={() => setCvDropdownOpen(false)}
                        >
                          {language === 'ES' ? 'Inglés' : 'English'}
                        </a>
                        <a
                          href={`${import.meta.env.BASE_URL}Curriculum/CV_ES.pdf`}
                          download
                          className="block px-6 py-4 text-base hover:bg-muted transition-colors border-t border-border"
                          style={{ fontWeight: 500 }}
                          onClick={() => setCvDropdownOpen(false)}
                        >
                          {language === 'ES' ? 'Español' : 'Spanish'}
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          <section id="contact" className="py-[88px]">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="lg:pr-12"
                >
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl mb-6 sm:mb-8" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {t.contact.title}
                  </h2>
                  <p className="text-lg sm:text-xl text-foreground/70 mb-10 sm:mb-12 leading-relaxed break-words">
                    {t.contact.description}
                  </p>
                  <ul className="space-y-4 sm:space-y-5 mb-10 sm:mb-12">
                    {t.contact.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 flex-shrink-0 text-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-base sm:text-lg text-foreground/80 break-words">{reason}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex">
                      {t.contact.testimonials.map((testimonial, index) => (
                        <div key={index} className="flex-[0_0_100%] min-w-0">
                          <div className="bg-muted/30 rounded-2xl p-5 sm:p-6 border border-border/50">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="relative w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm overflow-hidden"
                                style={{ fontWeight: 600 }}
                              >
                                {testimonial.avatar}
                                {testimonial.avatarImage && (
                                  <img
                                    src={`${import.meta.env.BASE_URL}${testimonial.avatarImage}`}
                                    alt={testimonial.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(event) => {
                                      event.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm" style={{ fontWeight: 600 }}>
                                  {testimonial.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                              </div>
                            </div>
                            <p className="text-sm text-foreground/70 leading-relaxed italic break-words">
                              "{testimonial.review}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {testimonialSlides.length > 1 && (
                    <div className="mt-4 flex items-center gap-1.5">
                      {testimonialSlides.map((_, index) => {
                        const isSelected = index === testimonialIndex;
                        const label =
                          language === 'ES' ? `Ir al testimonio ${index + 1}` : `Go to testimonial ${index + 1}`;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => emblaApi?.scrollTo(index)}
                            aria-label={label}
                            aria-current={isSelected ? 'true' : undefined}
                            className={
                              isSelected
                                ? 'h-6 px-3 rounded-full bg-primary text-primary-foreground text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20'
                                : 'w-2 h-2 rounded-full bg-muted-foreground/35 hover:bg-muted-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20'
                            }
                            style={isSelected ? { fontWeight: 700 } : undefined}
                          >
                            {isSelected ? index + 1 : <span className="sr-only">{index + 1}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                  <form className="w-full max-w-[560px] lg:max-w-none mx-auto space-y-5 sm:space-y-6">
                    <div>
                      <label className="block text-sm sm:text-base mb-2 sm:mb-3 text-foreground/60">{t.contact.form.name}</label>
                      <input
                        type="text"
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-base sm:text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base mb-2 sm:mb-3 text-foreground/60">{t.contact.form.email}</label>
                      <input
                        type="email"
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-base sm:text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base mb-2 sm:mb-3 text-foreground/60">{t.contact.form.message}</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all resize-none text-base sm:text-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg text-base sm:text-lg hover:bg-primary/90 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      {t.contact.form.send}
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    </button>
                  </form>
                </motion.div>
              </div>
            </div>
          </section>

          <footer className="py-9 sm:py-20 border-t border-border">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="text-center space-y-4 sm:space-y-8">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-foreground text-background rounded-full hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 382 382" fill="currentColor">
                    <path
                      d="M347.445,0H34.555C15.471,0,0,15.471,0,34.555v312.889C0,366.529,15.471,382,34.555,382h312.889
                      C366.529,382,382,366.529,382,347.444V34.555C382,15.471,366.529,0,347.445,0z M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056
                      H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806
                      c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1
                      s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73
                      c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079
                      c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426
                      c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472
                      L341.91,330.654L341.91,330.654z"
                    />
                  </svg>
                </a>
                <p className="text-sm text-muted-foreground">{t.footer.copyright}</p>
              </div>
            </div>
          </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
