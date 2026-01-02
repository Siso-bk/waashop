"use client";

import { useMemo, useState } from "react";
import { HomeHeroCard } from "@/types";

type Props = {
  initialCards: HomeHeroCard[];
};

type CardState = HomeHeroCard;

const createCard = (): CardState => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `card_${Date.now()}`,
  tagline: "",
  title: "",
  body: "",
  imageUrl: "",
  overlayOpacity: 0.35,
  ctaLabel: "",
  ctaHref: "",
  order: 0,
  status: "PUBLISHED",
});

export function HeroCardsEditor({ initialCards }: Props) {
  const normalized = useMemo(
    () =>
      (initialCards || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((card) => ({
          ...card,
          tagline: card.tagline || "",
          imageUrl: card.imageUrl || "",
          overlayOpacity: typeof card.overlayOpacity === "number" ? card.overlayOpacity : 0.35,
          ctaLabel: card.ctaLabel || "",
          ctaHref: card.ctaHref || "",
          status: card.status || "PUBLISHED",
        })),
    [initialCards]
  );
  const [cards, setCards] = useState<CardState[]>(normalized);
  const [dragId, setDragId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(normalized[0]?.id ?? null);

  const updateCard = (id: string, patch: Partial<CardState>) => {
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  };

  const moveCard = (id: string, direction: "up" | "down") => {
    setCards((prev) => {
      const index = prev.findIndex((card) => card.id === id);
      if (index < 0) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [card] = next.splice(index, 1);
      next.splice(target, 0, card);
      return next;
    });
  };

  const addCard = () => {
    const nextCard = createCard();
    setCards((prev) => [...prev, nextCard]);
    setActiveId(nextCard.id);
  };
  const removeCard = (id: string) => setCards((prev) => prev.filter((card) => card.id !== id));
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setCards((prev) => {
      const fromIndex = prev.findIndex((card) => card.id === dragId);
      const toIndex = prev.findIndex((card) => card.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = prev.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDragId(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Hero cards</h3>
        {cards.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cards.map((card) => (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveId(card.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveId(card.id);
                  }
                }}
                className={`min-w-[200px] cursor-pointer rounded-2xl border bg-white p-3 transition ${
                  activeId === card.id
                    ? "ring-2 ring-slate-900/40 border-slate-300"
                    : card.status === "DRAFT"
                      ? "border-amber-300 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                }`}
              >
                {card.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.title || "Hero card"}
                    className="h-20 w-full rounded-xl object-cover"
                  />
                )}
                {card.tagline && <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">{card.tagline}</p>}
                <p className="mt-2 text-sm font-semibold text-slate-900">{card.title || "Untitled"}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {card.status || "PUBLISHED"}
                  {activeId === card.id ? " · Editing" : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={addCard}
        className="rounded-full border border-black/10 bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
      >
        Add card
      </button>
      <input type="hidden" name="cardCount" value={cards.length} />
      {cards.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No hero cards yet. Add your first card to populate the horizontal carousel.
        </div>
      )}
      {cards.map((card, index) => (
        <div key={card.id} className="hidden">
          <input type="hidden" name={`card-${index}-id`} value={card.id} />
          <input type="hidden" name={`card-${index}-order`} value={index} />
          <input type="hidden" name={`card-${index}-status`} value={card.status || "PUBLISHED"} />
          <input type="hidden" name={`card-${index}-tagline`} value={card.tagline || ""} />
          <input type="hidden" name={`card-${index}-title`} value={card.title} />
          <input type="hidden" name={`card-${index}-body`} value={card.body} />
          <input type="hidden" name={`card-${index}-imageUrl`} value={card.imageUrl || ""} />
          <input type="hidden" name={`card-${index}-overlayOpacity`} value={card.overlayOpacity ?? 0.35} />
          <input type="hidden" name={`card-${index}-ctaLabel`} value={card.ctaLabel || ""} />
          <input type="hidden" name={`card-${index}-ctaHref`} value={card.ctaHref || ""} />
        </div>
      ))}
      {cards.length > 0 && activeId && (
        (() => {
          const activeIndex = cards.findIndex((card) => card.id === activeId);
          const card = cards[activeIndex]!;
          return (
            <fieldset
              className="space-y-4 rounded-2xl border border-slate-900/40 p-4 ring-2 ring-slate-900/20"
              draggable
              onDragStart={() => setDragId(card.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(card.id)}
            >
              <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Editing card {activeIndex + 1}
              </legend>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveCard(card.id, "up")}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard(card.id, "down")}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                  >
                    Move down
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <select
                      value={card.status || "PUBLISHED"}
                      onChange={(event) => updateCard(card.id, { status: event.target.value as CardState["status"] })}
                      className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Tagline</span>
                  <input
                    name={`card-${activeIndex}-tagline`}
                    value={card.tagline || ""}
                    onChange={(event) => updateCard(card.id, { tagline: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                    placeholder="Transparency"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Title</span>
                  <input
                    name={`card-${activeIndex}-title`}
                    value={card.title}
                    onChange={(event) => updateCard(card.id, { title: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                    placeholder="Verified drops"
                    required
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Image URL</span>
                <input
                  name={`card-${activeIndex}-imageUrl`}
                  value={card.imageUrl || ""}
                  onChange={(event) => updateCard(card.id, { imageUrl: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Overlay opacity (0 to 0.95)</span>
                <input
                  name={`card-${activeIndex}-overlayOpacity`}
                  type="number"
                  min={0}
                  max={0.95}
                  step={0.05}
                  value={card.overlayOpacity ?? 0.35}
                  onChange={(event) => {
                    const raw = event.target.value;
                    const nextValue = raw === "" ? 0.35 : Number(raw);
                    updateCard(card.id, { overlayOpacity: nextValue });
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Body</span>
                <textarea
                  name={`card-${activeIndex}-body`}
                  value={card.body}
                  onChange={(event) => updateCard(card.id, { body: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                  rows={3}
                  placeholder="Describe the value in one or two sentences."
                  required
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Button label (optional)</span>
                  <input
                    name={`card-${activeIndex}-ctaLabel`}
                    value={card.ctaLabel || ""}
                    onChange={(event) => updateCard(card.id, { ctaLabel: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                    placeholder="Shop now"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Button URL (optional)</span>
                  <input
                    name={`card-${activeIndex}-ctaHref`}
                    value={card.ctaHref || ""}
                    onChange={(event) => updateCard(card.id, { ctaHref: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                    placeholder="/boxes/BOX_1000"
                  />
                </label>
              </div>
            </fieldset>
          );
        })()
      )}
    </div>
  );
}
