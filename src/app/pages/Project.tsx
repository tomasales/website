import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Menu, X } from 'lucide-react';

import { content } from '../content';
import { type Language, useLanguage } from '../language';

type ProjectSlug = 'ra' | '100preseguro';

type GlobUrls = Record<string, string>;

const SECTION_IDS = ['home', 'projects', 'about', 'contact'] as const;

const RA_EN = import.meta.glob('/Projects/RA/*.jpg', { eager: true, import: 'default' }) as GlobUrls;
const RA_ES = import.meta.glob('/Projects/RA Espaniol/*.jpg', { eager: true, import: 'default' }) as GlobUrls;
const PRESEGURO_EN = import.meta.glob('/Projects/100preseguro/*.jpg', {
  eager: true,
  import: 'default',
}) as GlobUrls;
const PRESEGURO_ES = import.meta.glob('/Projects/100preseguro espaniol/*.jpg', {
  eager: true,
  import: 'default',
}) as GlobUrls;

function isProjectSlug(slug: string): slug is ProjectSlug {
  return slug === 'ra' || slug === '100preseguro';
}

function sortByNumberedFilename(a: string, b: string) {
  const aMatch = a.match(/\/(\d+)\.[^.]+$/);
  const bMatch = b.match(/\/(\d+)\.[^.]+$/);
  const aNum = aMatch ? Number(aMatch[1]) : Number.POSITIVE_INFINITY;
  const bNum = bMatch ? Number(bMatch[1]) : Number.POSITIVE_INFINITY;
  const diff = aNum - bNum;
  return diff !== 0 ? diff : a.localeCompare(b);
}

function globToSortedUrls(glob: GlobUrls) {
  return Object.entries(glob)
    .sort(([a], [b]) => sortByNumberedFilename(a, b))
    .map(([, url]) => url);
}

function getProjectImages(slug: ProjectSlug, language: Language) {
  if (slug === 'ra') return globToSortedUrls(language === 'ES' ? RA_ES : RA_EN);
  return globToSortedUrls(language === 'ES' ? PRESEGURO_ES : PRESEGURO_EN);
}

export default function Project() {
  const { slug: rawSlug } = useParams();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const slug = rawSlug && isProjectSlug(rawSlug) ? rawSlug : null;
  const t = content[language];

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

  const project = useMemo(() => {
    if (!slug) return null;
    return t.projects.items.find((item) => item.slug === slug) ?? null;
  }, [slug, t.projects.items]);

  const images = useMemo(() => {
    if (!slug) return [];
    return getProjectImages(slug, language);
  }, [language, slug]);

  if (!slug || !project) {
    return (
      <div className="min-h-screen bg-background text-foreground">
	        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
	          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
	            <button
	              type="button"
	              className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
	              onClick={() => navigate('/')}
	              style={{ fontWeight: 600 }}
	            >
	              <ArrowLeft className="w-5 h-5" />
	              {language === 'ES' ? 'Volver' : 'Back'}
	            </button>
	
	            <div className="hidden lg:flex items-center gap-2 bg-muted rounded-full p-1 border border-border/70">
	              <button
	                onClick={() => setLanguage('EN')}
	                className={`px-3 py-1 rounded-full text-sm transition-all ${
	                  language === 'EN' ? 'bg-foreground text-background' : 'text-muted-foreground'
	                }`}
	                style={{ fontWeight: 600 }}
	              >
	                EN
	              </button>
	              <button
	                onClick={() => setLanguage('ES')}
	                className={`px-3 py-1 rounded-full text-sm transition-all ${
	                  language === 'ES' ? 'bg-foreground text-background' : 'text-muted-foreground'
	                }`}
	                style={{ fontWeight: 600 }}
	              >
	                ES
	              </button>
	            </div>

	            <button
	              type="button"
	              className="lg:hidden inline-flex items-center justify-center w-12 h-12 text-foreground/70 hover:text-foreground transition-colors"
	              onClick={() => setMobileMenuOpen(true)}
	              aria-label={language === 'ES' ? 'Abrir menú' : 'Open menu'}
	            >
	              <Menu className="w-8 h-8" />
	            </button>
	          </div>
	        </nav>

	        {/* Mobile Menu */}
	        {mobileMenuOpen && (
	          <div className="lg:hidden fixed inset-0 z-[60] bg-background flex flex-col">
	            <div className="px-6 pt-6 lg:px-12">
	              <button
	                type="button"
	                className="inline-flex items-center justify-center w-12 h-12 text-muted-foreground hover:text-foreground transition-colors"
	                onClick={() => setMobileMenuOpen(false)}
	                aria-label={language === 'ES' ? 'Cerrar menú' : 'Close menu'}
	              >
	                <X className="w-7 h-7" />
	              </button>
	            </div>

	            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 lg:px-12">
	              <div className="flex flex-col items-center gap-6">
	                {t.nav.map((item, i) => (
	                  <button
	                    key={item}
	                    onClick={() => {
	                      setMobileMenuOpen(false);
	                      navigate(`/#${SECTION_IDS[i]}`);
	                    }}
	                    className="text-4xl tracking-tight text-foreground hover:text-foreground/70 transition-colors"
	                    style={{ fontWeight: 700 }}
	                  >
	                    {item}
	                  </button>
	                ))}
	              </div>
	            </div>

	            <div className="pb-16 flex justify-center px-6 lg:px-12">
	              <div className="flex items-center gap-2 bg-muted rounded-xl p-2 border border-border/70">
	                <button
	                  onClick={() => setLanguage('EN')}
	                  className={`px-8 py-3 rounded-lg text-2xl transition-all ${
	                    language === 'EN' ? 'bg-foreground text-background' : 'text-muted-foreground'
	                  }`}
	                  style={{ fontWeight: 700 }}
	                >
	                  EN
	                </button>
	                <button
	                  onClick={() => setLanguage('ES')}
	                  className={`px-8 py-3 rounded-lg text-2xl transition-all ${
	                    language === 'ES' ? 'bg-foreground text-background' : 'text-muted-foreground'
	                  }`}
	                  style={{ fontWeight: 700 }}
	                >
	                  ES
	                </button>
	              </div>
	            </div>
	          </div>
	        )}
	
	        <main className="pt-28 pb-20">
	          <div className="max-w-[900px] mx-auto px-6 lg:px-12">
	            <h1 className="text-3xl md:text-4xl tracking-tight" style={{ fontWeight: 800 }}>
	              {language === 'ES' ? 'Proyecto no encontrado' : 'Project not found'}
            </h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate('/')}
            style={{ fontWeight: 600 }}
          >
            <ArrowLeft className="w-5 h-5" />
            {language === 'ES' ? 'Volver' : 'Back'}
          </button>

          <div className="hidden lg:flex items-center gap-2 bg-muted rounded-full p-1 border border-border/70">
            <button
              onClick={() => setLanguage('EN')}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                language === 'EN' ? 'bg-foreground text-background' : 'text-muted-foreground'
              }`}
              style={{ fontWeight: 600 }}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ES')}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                language === 'ES' ? 'bg-foreground text-background' : 'text-muted-foreground'
              }`}
              style={{ fontWeight: 600 }}
            >
              ES
            </button>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center w-12 h-12 text-foreground/70 hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={language === 'ES' ? 'Abrir menú' : 'Open menu'}
          >
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-background flex flex-col">
          <div className="px-6 pt-6 lg:px-12">
            <button
              type="button"
              className="inline-flex items-center justify-center w-12 h-12 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={language === 'ES' ? 'Cerrar menú' : 'Close menu'}
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 lg:px-12">
            <div className="flex flex-col items-center gap-6">
              {t.nav.map((item, i) => (
                <button
                  key={item}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(`/#${SECTION_IDS[i]}`);
                  }}
                  className="text-4xl tracking-tight text-foreground hover:text-foreground/70 transition-colors"
                  style={{ fontWeight: 700 }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-16 flex justify-center px-6 lg:px-12">
            <div className="flex items-center gap-2 bg-muted rounded-xl p-2 border border-border/70">
              <button
                onClick={() => setLanguage('EN')}
                className={`px-8 py-3 rounded-lg text-2xl transition-all ${
                  language === 'EN' ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
                style={{ fontWeight: 700 }}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ES')}
                className={`px-8 py-3 rounded-lg text-2xl transition-all ${
                  language === 'ES' ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
                style={{ fontWeight: 700 }}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-28 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            className="max-w-none"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontWeight: 700 }}>
              {project.category}
            </p>
            <h1 className="text-4xl md:text-5xl tracking-tight mb-6" style={{ fontWeight: 800, lineHeight: 1.1 }}>
              {project.title}
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">{project.description}</p>
          </motion.div>

          <div className="mt-12">
            {images.map((src, index) => (
              <motion.img
                key={src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
                src={src}
                alt={`${project.title} - ${index + 1}`}
                className="w-full h-auto block"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
