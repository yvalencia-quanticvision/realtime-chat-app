const COLORS = [
  'bg-rose-700',
  'bg-amber-700',
  'bg-lime-700',
  'bg-emerald-700',
  'bg-teal-700',
  'bg-cyan-700',
  'bg-indigo-700',
  'bg-violet-700',
  'bg-fuchsia-700',
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// se calcula a partir de la primera letra (no de un hash del nombre completo)
// para que el color quede ligado a la inicial misma: la misma letra inicial
// siempre da el mismo color
function colorFor(name = '') {
  const letter = name.trim().charAt(0).toUpperCase();
  const code = letter ? letter.charCodeAt(0) - 'A'.charCodeAt(0) : 0;
  return COLORS[((code % COLORS.length) + COLORS.length) % COLORS.length];
}

// un grupo no tiene una sola persona de la cual sacar iniciales/color, asi
// que recibe un icono fijo propio en vez de fingir que un participante representa el chat
function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[55%] w-[55%] text-white">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      <path d="M17.5 12.5c1.84 0 3.33-1.49 3.33-3.33S19.34 5.83 17.5 5.83c-.4 0-.78.08-1.13.2a5.3 5.3 0 010 6.27c.35.12.73.2 1.13.2zm1.5 1.5c-.22 0-.43.02-.64.04 1.02.84 1.7 2 1.7 3.46v2h3v-2c0-2.3-3.1-3.5-4.06-3.5z" />
    </svg>
  );
}

export default function Avatar({ name, size = 'md', isGroup = false }) {
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold tracking-tight text-white shadow-sm ring-1 ring-black/5 ${sizeClasses} ${
        isGroup ? 'bg-stone-600' : colorFor(name)
      }`}
    >
      {isGroup ? <GroupIcon /> : initials(name)}
    </div>
  );
}
