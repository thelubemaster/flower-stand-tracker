export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1f4d38" />
      <g transform="translate(16 16) scale(0.9) translate(-16 -16)">
        <ellipse cx="10.2" cy="22.4" rx="3.4" ry="1.7" transform="rotate(-32 10.2 22.4)" fill="#f4efe6" />
        <ellipse cx="21.8" cy="22.4" rx="3.4" ry="1.7" transform="rotate(32 21.8 22.4)" fill="#f4efe6" />
        <g fill="#fffdf8">
          <circle cx="16" cy="7.6" r="3.7" />
          <circle cx="19.8" cy="9.2" r="3.7" />
          <circle cx="22.2" cy="12.6" r="3.7" />
          <circle cx="20.6" cy="16.4" r="3.7" />
          <circle cx="16" cy="18" r="3.7" />
          <circle cx="11.4" cy="16.4" r="3.7" />
          <circle cx="9.8" cy="12.6" r="3.7" />
          <circle cx="12.2" cy="9.2" r="3.7" />
        </g>
        <circle cx="16" cy="12.8" r="4.5" fill="#f4efe6" />
        <circle cx="14.5" cy="12.2" r="0.7" fill="#1c2822" />
        <circle cx="17.5" cy="12.2" r="0.7" fill="#1c2822" />
        <path
          d="M14.2 14.2c.55.85 1.15 1.25 1.8 1.25s1.25-.4 1.8-1.25"
          stroke="#8a3b1c"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect x="12.1" y="22.2" width="7.8" height="1.7" rx="0.7" fill="#fffdf8" />
        <path d="M12.7 23.8h6.6l-.95 4.3h-4.7z" fill="#8a3b1c" />
      </g>
    </svg>
  );
}
