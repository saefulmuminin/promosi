"use client";

import { useState } from "react";

interface OnScreenKeyboardProps {
  onKey: (ch: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
}

const ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

/** Keyboard virtual (QWERTY) untuk input teks di layar sentuh / kiosk. */
export function OnScreenKeyboard({
  onKey,
  onBackspace,
  onSpace,
}: OnScreenKeyboardProps) {
  const [caps, setCaps] = useState(false);
  const cap = (k: string) => (caps && /[a-z]/.test(k) ? k.toUpperCase() : k);

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-black/10 bg-black/[0.03] p-2.5">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {i === 3 && (
            <Key
              onClick={() => setCaps((c) => !c)}
              className={`px-3 ${caps ? "!bg-[#1F8A3B] !text-white" : ""}`}
            >
              ⇧
            </Key>
          )}
          {row.map((k) => (
            <Key key={k} onClick={() => onKey(cap(k))}>
              {cap(k)}
            </Key>
          ))}
          {i === 3 && (
            <Key onClick={onBackspace} className="px-3 text-red-500">
              ⌫
            </Key>
          )}
        </div>
      ))}
      <div className="flex justify-center gap-1.5">
        <Key onClick={() => onKey("@")}>@</Key>
        <Key onClick={() => onKey(".")}>.</Key>
        <button
          onClick={onSpace}
          className="h-11 flex-[4] rounded-lg border border-black/10 bg-white text-sm font-medium text-gray-600 shadow-sm transition active:scale-95 active:bg-black/[0.05]"
        >
          spasi
        </button>
        <Key onClick={() => onKey("_")}>_</Key>
        <Key onClick={() => onKey("-")}>-</Key>
      </div>
    </div>
  );
}

function Key({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-11 min-w-[2rem] flex-1 rounded-lg border border-black/10 bg-white text-lg font-semibold text-[#0f2a1a] shadow-sm transition active:scale-95 active:bg-black/[0.05] ${className}`}
    >
      {children}
    </button>
  );
}
