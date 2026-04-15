import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export default function App() {
  const [language, setLanguage] = useState<'EN' | 'ES'>('EN');
  const [cvDropdownOpen, setCvDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const cvDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!emblaApi) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
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

  const content = {
    EN: {
      nav: ['Home', 'Projects', 'Me', 'Contact me'],
      hero: {
        greeting: 'Hello world 👋,',
        intro: "my name is Tomas.",
        description: "I'm a graduated Graphic Designer specialized in UX/UI, focused on creating a better world through design, music, and food.",
        note: "(they all make people smile)"
      },
      gift: {
        title: 'First of all, here is a gift for you',
        link: 'Free recipes curated by me'
      },
      projects: {
        title: 'Selected Work',
        items: [
          {
            title: 'Re-design: RA',
            category: 'UX/UI',
            description: 'Number one magazine and platform in the world that showcase electronic music, artists and events'
          },
          {
            title: '100preseguro',
            category: 'Project Leader · Branding · UX/UI',
            description: 'A platform where people can request their insurance plans from different insurance companies'
          }
        ]
      },
      about: {
        title: "About myself",
        bio: "I'm a graduated Graphic Designer based in Argentina, with a few (9) years of experience in UX/UI.\n\nI worked in multiple industries as HR tech (Talent Acquisition / ATS), health, logistics, insurance, e-commerce, digital payments, among others.",
        certifications: 'CERTIFICATIONS',
        certs: [
          'AI Designer - The Interaction Design Foundation',
          'Advanced UX/UI designer - Coderhouse',
          'Scrum Master - Udemy',
          'UX Research - Design Core Academy',
          'Design Thinking - The Interaction Design Foundation',
          'Web Developer - Coderhouse'
        ],
        download: 'Download CV'
      },
      contact: {
        title: "Let's work together 🤝",
        description: "I'd love to hear about your project and how I can help bring your ideas to life through thoughtful design.",
        reasons: [
          '9 years of experience in UX/UI design',
          'Worked across multiple industries',
          'User-centered design approach'
        ],
        testimonials: [
          {
            name: 'Sarah Chen',
            company: 'TechStart Inc.',
            review: 'Tomas delivered exceptional UX work that increased our conversion by 40%. His attention to detail and user-first approach was impressive.',
            avatar: 'SC'
          },
          {
            name: 'Miguel Rodriguez',
            company: 'HealthCare Solutions',
            review: 'Working with Tomas was a game-changer. He understood our complex requirements and created an intuitive interface our users love.',
            avatar: 'MR'
          },
          {
            name: 'Emma Thompson',
            company: 'E-commerce Plus',
            review: 'Professional, creative, and efficient. Tomas transformed our vision into a beautiful, functional platform. Highly recommend!',
            avatar: 'ET'
          }
        ],
        form: {
          name: 'Your name',
          email: 'Your email',
          subject: 'Subject',
          message: 'Message',
          send: 'Send'
        }
      },
      footer: {
        cta: "Let's work together 🤝",
        copyright: 'Copyright 2022'
      }
    },
    ES: {
      nav: ['Inicio', 'Proyectos', 'Sobre mí', 'Contacto'],
      hero: {
        greeting: 'Hola mundo 👋,',
        intro: "mi nombre es Tomas.",
        description: "Soy un Diseñador Gráfico graduado especializado en UX/UI, enfocado en crear un mundo mejor a través del diseño, la música y la comida.",
        note: "(todas hacen sonreír a la gente)"
      },
      gift: {
        title: 'Antes que nada, acá hay un regalo para vos',
        link: 'Recetas gratis curadas por mí'
      },
      projects: {
        title: 'Trabajo Seleccionado',
        items: [
          {
            title: 'Re-diseño: RA',
            category: 'UX/UI',
            description: 'La revista y plataforma número uno en el mundo que muestra música electrónica, artistas y eventos'
          },
          {
            title: '100preseguro',
            category: 'Líder de Proyecto · Branding · UX/UI',
            description: 'Una plataforma donde las personas pueden solicitar sus planes de seguro de diferentes compañías'
          }
        ]
      },
      about: {
        title: "Sobre mí",
        bio: "Soy un Diseñador Gráfico graduado con sede en Argentina, con algunos (9) años de experiencia en UX/UI.\n\nTrabajé en múltiples industrias como HR tech (Adquisición de Talento / ATS), salud, logística, seguros, comercio electrónico, pagos digitales, entre otros.",
        certifications: 'CERTIFICACIONES',
        certs: [
          'AI Designer - The Interaction Design Foundation',
          'Diseñador UX/UI Avanzado - Coderhouse',
          'Scrum Master - Udemy',
          'Investigación UX - Design Core Academy',
          'Design Thinking - The Interaction Design Foundation',
          'Desarrollador Web - Coderhouse'
        ],
        download: 'Descargar CV'
      },
      contact: {
        title: "Trabajemos juntos 🤝",
        description: "Me encantaría conocer tu proyecto y ayudarte a dar vida a tus ideas a través de un diseño cuidadoso.",
        reasons: [
          '9 años de experiencia en diseño UX/UI',
          'Trabajé en múltiples industrias',
          'Enfoque centrado en el usuario'
        ],
        testimonials: [
          {
            name: 'Sarah Chen',
            company: 'TechStart Inc.',
            review: 'Tomas entregó un trabajo UX excepcional que aumentó nuestra conversión en un 40%. Su atención al detalle y enfoque en el usuario fue impresionante.',
            avatar: 'SC'
          },
          {
            name: 'Miguel Rodriguez',
            company: 'HealthCare Solutions',
            review: 'Trabajar con Tomas fue un cambio total. Entendió nuestros requisitos complejos y creó una interfaz intuitiva que nuestros usuarios aman.',
            avatar: 'MR'
          },
          {
            name: 'Emma Thompson',
            company: 'E-commerce Plus',
            review: 'Profesional, creativo y eficiente. Tomas transformó nuestra visión en una plataforma hermosa y funcional. ¡Muy recomendable!',
            avatar: 'ET'
          }
        ],
        form: {
          name: 'Tu nombre',
          email: 'Tu email',
          subject: 'Asunto',
          message: 'Mensaje',
          send: 'Enviar'
        }
      },
      footer: {
        cta: "Trabajemos juntos 🤝",
        copyright: 'Copyright 2022'
      }
    }
  };

  const t = content[language];

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <motion.div
            className="text-2xl tracking-tight cursor-pointer"
            style={{ fontWeight: 700 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => scrollToSection('home')}
          >
            TOMAS
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {t.nav.map((item, i) => (
              <button
                key={item}
                onClick={() => scrollToSection(['home', 'projects', 'about', 'contact'][i])}
                className="group text-base text-muted-foreground hover:text-foreground transition-colors relative"
              >
                {item}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  👆
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
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
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={language === 'ES' ? 'Abrir menú' : 'Open menu'}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 w-full h-full"
            aria-label={language === 'ES' ? 'Cerrar menú' : 'Close menu'}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 pt-28">
            <div className="bg-background border border-border rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 700 }}>
                  {language === 'ES' ? 'Menú' : 'Menu'}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={language === 'ES' ? 'Cerrar menú' : 'Close menu'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {t.nav.map((item, i) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(['home', 'projects', 'about', 'contact'][i])}
                    className="text-left px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-base"
                    style={{ fontWeight: 600 }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center pt-24 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight mb-6" style={{ fontWeight: 800, lineHeight: 1.1 }}>
                {t.hero.greeting.replace(' 👋,', '').replace(' 👋', '')} <motion.span
                  className="inline-block"
                  animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  👋
                </motion.span>,
                <br />
                {t.hero.intro}
              </h1>
              <p className="text-xl md:text-2xl text-foreground/80 mb-4 leading-relaxed">
                 {t.hero.description}
             </p>
              <p className="text-lg md:text-xl text-muted-foreground italic">
                {t.hero.note}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-square rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-60 blur-3xl animate-pulse"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gift Section */}
      <section className="py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl md:text-2xl lg:text-3xl mb-12" style={{ fontWeight: 700, lineHeight: 1.2 }}>
              🎁 {t.gift.title} 🎁
            </h2>
            <a
              href="#"
              className="group inline-flex items-center gap-2 text-lg text-foreground hover:text-foreground/70 transition-colors"
              style={{ fontWeight: 600 }}
            >
              {t.gift.link}
              <ArrowUpRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-32">
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
                key={project.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group cursor-pointer"
              >
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-pink-500/30 to-blue-500/30 overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-blue-500 opacity-40"></div>
                    </div>
                  </div>

                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontWeight: 600 }}>
                      {project.category}
                    </p>
                    <h3 className="text-4xl md:text-5xl mb-6 group-hover:text-muted-foreground transition-colors" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {project.title}
                    </h3>
                    <p className="text-xl text-foreground/70 leading-relaxed mb-8">
                      {project.description}
                    </p>
                    <div className="inline-flex items-center gap-2 text-lg" style={{ fontWeight: 600 }}>
                      View project <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-16 lg:gap-24">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-cyan-500/30 to-orange-500/30 overflow-hidden sticky top-32">
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
              <p className="text-xl text-foreground/70 whitespace-pre-line leading-relaxed mb-12">
                {t.about.bio}
              </p>

              <div className="mb-8">
                <h3 className="text-sm uppercase tracking-wider mb-6" style={{ fontWeight: 700 }}>
                  {t.about.certifications}
                </h3>
                <div className="space-y-4">
                  {t.about.certs.map((cert) => (
                    <div
                      key={cert}
                      className="px-5 py-4 bg-muted/50 text-foreground rounded-lg text-base border border-border/50"
                      style={{ fontWeight: 500 }}
                    >
                      {cert}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative" ref={cvDropdownRef}>
                <button
                  onClick={() => setCvDropdownOpen(!cvDropdownOpen)}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {t.about.download} →
                </button>

                {cvDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 bg-background border border-border rounded-2xl shadow-lg overflow-hidden z-10 min-w-[200px]">
                    <a
                      href="#"
                      className="block px-6 py-4 text-base hover:bg-muted transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      English
                    </a>
                    <a
                      href="#"
                      className="block px-6 py-4 text-base hover:bg-muted transition-colors border-t border-border"
                      style={{ fontWeight: 500 }}
                    >
                      Spanish
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left Column - Pitch */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:pr-12"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl mb-8" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                {t.contact.title}
              </h2>
              <p className="text-xl text-foreground/70 mb-12 leading-relaxed">
                {t.contact.description}
              </p>
              <ul className="space-y-5 mb-12">
                {t.contact.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 mt-0.5 flex-shrink-0 text-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-lg text-foreground/80">{reason}</span>
                  </li>
                ))}
              </ul>

              {/* Testimonials Carousel */}
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {t.contact.testimonials.map((testimonial, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0">
                      <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 mr-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm" style={{ fontWeight: 600 }}>
                            {testimonial.avatar}
                          </div>
                          <div>
                            <h4 className="text-sm" style={{ fontWeight: 600 }}>
                              {testimonial.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {testimonial.company}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/70 leading-relaxed italic">
                          "{testimonial.review}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form className="space-y-6">
                <div>
                  <label className="block text-base mb-3 text-foreground/60">
                    {t.contact.form.name}
                  </label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-lg"
                  />
                </div>

                <div>
                  <label className="block text-base mb-3 text-foreground/60">
                    {t.contact.form.email}
                  </label>
                  <input
                    type="email"
                    className="w-full px-6 py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all text-lg"
                  />
                </div>

                <div>
                  <label className="block text-base mb-3 text-foreground/60">
                    {t.contact.form.message}
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-6 py-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all resize-none text-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {t.contact.form.send}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center space-y-8">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-12 h-12 bg-foreground text-background rounded-full hover:scale-110 transition-transform"
            >
              <svg className="w-6 h-6" viewBox="0 0 382 382" fill="currentColor">
                <path d="M347.445,0H34.555C15.471,0,0,15.471,0,34.555v312.889C0,366.529,15.471,382,34.555,382h312.889
                  C366.529,382,382,366.529,382,347.444V34.555C382,15.471,366.529,0,347.445,0z M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056
                  H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806
                  c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1
                  s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73
                  c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079
                  c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426
                  c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472
                  L341.91,330.654L341.91,330.654z"/>
              </svg>
            </a>
            <p className="text-sm text-muted-foreground">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
