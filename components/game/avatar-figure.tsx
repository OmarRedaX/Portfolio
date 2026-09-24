import styles from "./game-mode.module.css";

export function AvatarFigure({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 32"
      width="100%"
      height="100%"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.figure}>
        <path className={styles.legs} d="M8 22 7 30M16 22 17 30" />
        <path
          className={styles.hoodie}
          d="M5 13Q1 17 3 23L6 22 7 25H17L18 22 21 23Q23 17 19 13L17 11H7Z"
        />
        <path className={styles.hoodie} d="M5 10V8a7 7 0 0 1 14 0v2l-3 5H8Z" />
        <rect x="7" y="5" width="10" height="8" rx="3" className={styles.face} />
        <path className={styles.eyes} d="M10 8v2m4-2v2" />
        <path className={styles.seam} d="m9 16 3 2 3-2m-5 5h4" />
      </g>
    </svg>
  );
}
