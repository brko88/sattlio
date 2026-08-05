import { useState } from "react";
import { FAQ_ITEMS, type FaqItem } from "../config/faqConfig";

function FAQ() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Najčešća pitanja</h1>
      <p className="text-slate-500 mb-6">Brzi odgovori — bez čekanja na podršku.</p>

      <div className="space-y-3 max-w-2xl">
        {FAQ_ITEMS.map((item) => (
          <FaqAccordionItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="font-medium text-slate-900 text-sm">{item.question}</span>
        <span
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
          <p className={item.youtubeId ? "mb-4" : undefined}>{item.answer}</p>

          {item.youtubeId && (
            <div className="aspect-video bg-slate-100 rounded-md overflow-hidden">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}`}
                title={item.question}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FAQ;
