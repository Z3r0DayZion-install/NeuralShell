import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import caseStudies from "../../docs/marketing/case_studies.json";

export default function CaseCarousel() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300/80">Case Studies</p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] text-slate-100">
            Metric-Driven Wins
          </h2>
        </div>
      </div>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        breakpoints={{
          768: { slidesPerView: 2 },
          1100: { slidesPerView: 3 },
        }}
      >
        {caseStudies.map((item) => (
          <SwiperSlide key={item.title}>
            <article className="h-full rounded-2xl border border-cyan-400/25 bg-slate-900/70 p-3 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
              <img
                src={item.img}
                alt={item.title}
                className="mb-3 h-40 w-full rounded-xl border border-white/10 object-cover"
                loading="lazy"
              />
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{item.metric}</div>
              <h3 className="mt-1 text-lg font-bold text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
