'use client';

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤔', '😅',
  '😉', '😢', '😭', '😡', '😱', '🥳', '🙌', '👍', '👎', '👏',
  '🙏', '💪', '❤️', '💔', '🔥', '✨', '🎉', '👀', '🤝', '✅',
  '❌', '🤷', '😴', '🤯', '🥺', '😇', '🙄', '😬', '🫡', '💯',
];

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute bottom-12 left-0 z-20 grid w-64 grid-cols-8 gap-1 rounded-xl border border-stone-200 bg-white p-2 shadow-lg shadow-stone-900/5">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="rounded-md p-1 text-lg transition-colors hover:bg-stone-100"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
