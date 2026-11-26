'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { ArabesqueBackdrop } from '@/components/ArabesqueBackdrop';
import {
  formatLandingNum,
  type LandingCopy,
  type LandingFaqCategory,
  type LandingLang,
} from '@/lib/landing-copy';

interface FaqSectionProps {
  lang: LandingLang;
  copy: LandingCopy;
}

export function FaqSection({ lang, copy }: FaqSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<LandingFaqCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openQuestions, setOpenQuestions] = useState<string[]>(() =>
    copy.faqs[0] ? [copy.faqs[0].q] : [],
  );

  const isRtl = lang === 'ar';

  const categoryCounts = useMemo(() => {
    const counts: Record<LandingFaqCategory, number> = {
      all: copy.faqs.length,
      memorization: 0,
      revision: 0,
      app: 0,
    };
    for (const item of copy.faqs) {
      counts[item.category] += 1;
    }
    return counts;
  }, [copy.faqs]);

  const visibleFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return copy.faqs.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      return `${item.q} ${item.a}`.toLowerCase().includes(q);
    });
  }, [copy.faqs, selectedCategory, searchQuery]);

  const allVisibleOpen =
    visibleFaqs.length > 0 && visibleFaqs.every((item) => openQuestions.includes(item.q));

  const handleSelectCategory = (cat: LandingFaqCategory) => {
    setSelectedCategory(cat);
    const firstMatch =
      cat === 'all' ? copy.faqs[0] : copy.faqs.find((item) => item.category === cat);
    if (firstMatch) {
      setOpenQuestions([firstMatch.q]);
    }
  };

  const toggleQuestion = (question: string) => {
    setOpenQuestions((prev) =>
      prev.includes(question) ? prev.filter((item) => item !== question) : [...prev, question],
    );
  };

  const handleToggleAllVisible = () => {
    if (allVisibleOpen) {
      const visibleSet = new Set(visibleFaqs.map((item) => item.q));
      setOpenQuestions((prev) => prev.filter((q) => !visibleSet.has(q)));
    } else {
      setOpenQuestions(visibleFaqs.map((item) => item.q));
    }
  };

  const searchPlaceholder = 'ابحث في الأسئلة...';
  const expandAllLabel = allVisibleOpen ? 'طيّ الكل' : 'عرض الكل';
  const emptySearchText = 'لا توجد أسئلة مطابقة لبحثك.';
  const resetFiltersText = 'إعادة الضبط';

  return (
    <section
      id="faq"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="border-t border-border/80 bg-card/45 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Editorial Column */}
          <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                {copy.faqTitle}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {copy.faqSubtitle}
              </p>
            </div>

            {/* Quiet Search Field */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-11 w-full rounded-xl border border-border bg-background/90 pe-10 ps-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={resetFiltersText}
                  className="absolute end-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Clean Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {copy.faqCategories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background/80 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[11px] ${
                        active ? 'opacity-85' : 'text-muted-foreground'
                      }`}
                    >
                      ({formatLandingNum(categoryCounts[cat.id], lang)})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Accordion Column */}
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90">
              <ArabesqueBackdrop variant="subtle" pattern="arch" />

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatLandingNum(visibleFaqs.length, lang)} أسئلة
                  </span>

                  {visibleFaqs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleAllVisible}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-secondary/70"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{expandAllLabel}</span>
                    </button>
                  )}
                </div>

                {visibleFaqs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-medium text-muted-foreground">{emptySearchText}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 inline-flex items-center rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-secondary"
                    >
                      {resetFiltersText}
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/80">
                    {visibleFaqs.map((item, idx) => {
                      const isOpen = openQuestions.includes(item.q);
                      const panelId = `faq-panel-${idx}`;

                      return (
                        <div key={item.q} className="relative">
                          {isOpen && (
                            <span
                              className="absolute inset-y-3 start-0 w-1 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => toggleQuestion(item.q)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4.5 text-start transition-colors hover:bg-secondary/35"
                          >
                            <span className="text-sm font-bold leading-relaxed text-foreground sm:text-base">
                              {item.q}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-primary transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                              aria-hidden="true"
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                id={panelId}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                                  {item.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
