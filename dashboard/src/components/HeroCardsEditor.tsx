"use client";

import { useMemo, useState } from "react";
import { HomeHeroCard } from "@/types";

type Props = {
  initialCards: HomeHeroCard[];
};

type CardState = HomeHeroCard;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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
  const duplicateCard = (id: string) => {
    const source = cards.find((card) => card.id === id);
    if (!source) return;
    const cloned: HomeHeroCard = {
      ...source,
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `card_${Date.now()}`,
      status: "DRAFT",
    };
    setCards((prev) => [...prev, cloned]);
    setActiveId(cloned.id);
  };
  const removeCard = (id: string) => {
    const confirmed = window.confirm("Delete this hero card? This cannot be undone.");
    if (!confirmed) return;
    setCards((prev) => prev.filter((card) => card.id !== id));
  };
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Hero cards</h3>
            <p className="mt-1 text-xs text-slate-500">Click a card to edit. Drag a card to reorder.</p>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {cards.length} cards
          </span>
        </div>
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
                className={`min-w-[220px] cursor-pointer rounded-2xl border bg-white p-3 transition ${
                  activeId === card.id
                    ? "ring-2 ring-slate-900/40 border-slate-300"
                    : card.status === "DRAFT"
                      ? "border-amber-300 bg-amber-50"
                      : "border-emerald-200 bg-emerald-50"
                }`}
              >
                <div className="relative h-20 w-full overflow-hidden rounded-xl border border-black/5 bg-slate-100">
                  {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.imageUrl} alt={card.title || "Hero card"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.25em] text-slate-400">
                      No image
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: "rgba(0,0,0,0.45)", opacity: card.overlayOpacity ?? 0.35 }}
                  />
                </div>
                {card.tagline && <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">{card.tagline}</p>}
                <p className="mt-2 text-sm font-semibold text-slate-900">{card.title || "Untitled"}</p>
                <div className="mt-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span>{card.status || "PUBLISHED"}</span>
                  {activeId === card.id && <span>Editing</span>}
                </div>
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
          const card = cards[activeIndex];
          if (!card) {
            return (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Select a card to edit.
              </div>
            );
          }
          return (
            <fieldset
              className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
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
                  <button
                    type="button"
                    onClick={() => duplicateCard(card.id)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                  >
                    Duplicate
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
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (file.size > 1024 * 1024) {
                          window.alert("Please use an image under 1MB.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            updateCard(card.id, { imageUrl: reader.result });
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {card.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateCard(card.id, { imageUrl: "" })}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                    >
                      Clear
                    </button>
                  )}
                  <span>Uploads store as data URLs. Use hosted URLs for production.</span>
                </div>
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
                    const nextValue = raw === "" ? 0.35 : clamp(Number(raw), 0, 0.95);
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Preview</p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-slate-900 text-white">
                  <div className="relative h-36">
                    {card.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.imageUrl} alt={card.title || "Preview"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.3em] text-white/60">
                        No image
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: "rgba(0,0,0,0.55)", opacity: card.overlayOpacity ?? 0.35 }}
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      {card.tagline && (
                        <p className="text-[10px] uppercase tracking-[0.35em] text-white/70">{card.tagline}</p>
                      )}
                      <p className="mt-2 text-lg font-semibold text-white">{card.title || "Untitled card"}</p>
                      <p className="mt-1 text-sm text-white/80">{card.body || "Body copy preview."}</p>
                      {card.ctaLabel && (
                        <span className="mt-3 inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                          {card.ctaLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          );
        })()
      )}
    </div>
  );
}
