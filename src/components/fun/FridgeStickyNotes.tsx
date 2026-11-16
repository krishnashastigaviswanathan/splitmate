"use client";

import React, { useState } from "react";
import { Plus, Pin, Trash2, Smile, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface StickyNote {
  id: string;
  author: string;
  text: string;
  color: "yellow" | "pink" | "blue" | "green";
  emoji: string;
  rotation: string;
}

const DEFAULT_NOTES: StickyNote[] = [
  {
    id: "note-1",
    author: "Rahul",
    text: "Whoever drank my blueberry Greek yogurt: I know who you are 🕵️‍♂️ (please buy a replacement)",
    color: "yellow",
    emoji: "🥛",
    rotation: "-rotate-2",
  },
  {
    id: "note-2",
    author: "Sneha",
    text: "WiFi password updated: 'splitwise_first_then_netflix'. Pay up! 📡",
    color: "pink",
    emoji: "🔐",
    rotation: "rotate-1",
  },
  {
    id: "note-3",
    author: "Arjun",
    text: "Please throw away the cardboard box in the kitchen, it has developed its own micro-economy 🍕",
    color: "blue",
    emoji: "📦",
    rotation: "-rotate-1",
  },
  {
    id: "note-4",
    author: "Priya",
    text: "I bought the 3-ply toilet paper rolls. All flatmates owe me eternal fealty 🧻✨",
    color: "green",
    emoji: "👑",
    rotation: "rotate-2",
  },
];

const COLOR_CLASSES = {
  yellow: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/70 dark:text-amber-100 dark:border-amber-800",
  pink: "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-100 dark:border-rose-800",
  blue: "bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950/70 dark:text-sky-100 dark:border-sky-800",
  green: "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-100 dark:border-emerald-800",
};

export function FridgeStickyNotes() {
  const { success } = useToast();
  const [notes, setNotes] = useState<StickyNote[]>(DEFAULT_NOTES);
  const [newText, setNewText] = useState("");
  const [selectedColor, setSelectedColor] = useState<"yellow" | "pink" | "blue" | "green">("yellow");
  const [selectedEmoji, setSelectedEmoji] = useState("📌");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const rotations = ["-rotate-2", "-rotate-1", "rotate-1", "rotate-2", "rotate-3"];
    const randomRot = rotations[Math.floor(Math.random() * rotations.length)];

    const note: StickyNote = {
      id: `note-${Date.now()}`,
      author: "You",
      text: newText.trim(),
      color: selectedColor,
      emoji: selectedEmoji,
      rotation: randomRot,
    };

    setNotes([note, ...notes]);
    setNewText("");
    setIsAdding(false);
    success("Sticky note slapped onto the fridge door! 📌");
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="rounded-3xl p-6 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center text-lg">
            🧊
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span>The Apartment Fridge Door</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Post-It Wall
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leave funny warnings, passive-aggressive chore notes, and roommate shoutouts.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? "Cancel" : "Stick a Note"}</span>
        </button>
      </div>

      {/* Add note drawer */}
      {isAdding && (
        <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note message
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Please wash your frying pan, it's gaining consciousness..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(["yellow", "pink", "blue", "green"] as const).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    c === "yellow"
                      ? "bg-amber-300 border-amber-400"
                      : c === "pink"
                      ? "bg-rose-300 border-rose-400"
                      : c === "blue"
                      ? "bg-sky-300 border-sky-400"
                      : "bg-emerald-300 border-emerald-400"
                  } ${selectedColor === c ? "ring-2 ring-slate-900 dark:ring-white scale-110" : ""}`}
                />
              ))}
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all"
            >
              Stick it! 📌
            </button>
          </div>
        </form>
      )}

      {/* Sticky Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {notes.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border shadow-sm ${n.rotation} hover:rotate-0 hover:scale-105 transition-all relative group flex flex-col justify-between ${
              COLOR_CLASSES[n.color]
            }`}
          >
            {/* Pushpin at top */}
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-base select-none">{n.emoji}</span>
              <button
                onClick={() => handleDeleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                title="Remove note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs font-semibold leading-relaxed mb-3">
              &ldquo;{n.text}&rdquo;
            </p>

            <div className="pt-2 border-t border-black/10 dark:border-white/10 text-[10px] font-bold opacity-70 flex items-center justify-between">
              <span>— {n.author}</span>
              <span>📌 Sticky</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
