"use client";

import { Component, useCallback, useEffect, useId, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { createPortal } from "react-dom";
import { gameMode } from "@/content/game-mode";
import type { GameSessionProps } from "./game-session";
import styles from "./game-mode.module.css";

class SessionBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function GameEntry(): React.JSX.Element {
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const keyboard = useRef(false);
  const operation = useRef(0);
  const [keyboardEvidence, setKeyboardEvidence] = useState(false);
  const [sessionTrigger, setSessionTrigger] = useState<HTMLButtonElement | null>(null);
  const [Session, setSession] = useState<ComponentType<GameSessionProps> | null>(null);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const id = useId();

  // Invalidates an in-flight import without attaching any dormant game listeners.
  useEffect(
    () => () => {
      operation.current += 1;
    },
    [],
  );

  function noteKeyboard() {
    keyboard.current = true;
    setKeyboardEvidence(true);
  }

  function eligible() {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setMessage(gameMode.largerWindow);
      return false;
    }
    if (!keyboard.current && !window.matchMedia("(any-pointer: fine)").matches) {
      setMessage(gameMode.keyboardRequired);
      return false;
    }
    setMessage("");
    return true;
  }

  function dismiss() {
    dialog.current?.close();
    trigger.current?.focus({ preventScroll: true });
  }

  const exit = useCallback(() => {
    operation.current += 1;
    setSessionTrigger(null);
    setSession(null);
    setFailed(false);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  async function confirm() {
    // The viewport may have changed while the modal was open.
    if (!eligible()) {
      dismiss();
      return;
    }
    const button = trigger.current;
    if (!button) return;
    dismiss();
    setSessionTrigger(button);
    const token = ++operation.current;
    try {
      // An explicit event-driven import also permits retry after a load failure.
      const loaded = await import("./game-session");
      if (token === operation.current) setSession(() => loaded.GameSession);
    } catch {
      if (token === operation.current) setFailed(true);
    }
  }

  function focusPreparationExit(node: HTMLButtonElement | null) {
    if (
      node &&
      (document.activeElement === document.body ||
        document.activeElement === trigger.current)
    ) {
      node.focus({ preventScroll: true });
    }
  }

  const fallback = (
    <section className={styles.preparation} aria-label={gameMode.entry}>
      <p role="status">{failed ? gameMode.failed : gameMode.loading}</p>
      <button className="btn btn-secondary" onClick={exit} ref={focusPreparationExit}>
        {gameMode.exitGame}
      </button>
    </section>
  );

  return (
    <span className={styles.entry} data-keyboard={keyboardEvidence ? "true" : undefined}>
      <button
        ref={trigger}
        type="button"
        className={`btn btn-secondary ${styles.trigger}`}
        aria-haspopup="dialog"
        aria-disabled={sessionTrigger !== null}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) noteKeyboard();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") noteKeyboard();
        }}
        onClick={(event) => {
          if (sessionTrigger) return;
          if (event.detail === 0) noteKeyboard();
          if (!eligible()) return;
          dialog.current?.showModal();
          cancel.current?.focus({ preventScroll: true });
        }}
      >
        <span className={styles.available}>{gameMode.entry}</span>
        <span className={styles.keyboardRequired}>{gameMode.keyboardRequired}</span>
      </button>
      <span className={styles.largerWindow}>{gameMode.largerWindow}</span>
      {message && (
        <span className={styles.feedback} role="status">
          {message}
        </span>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onCancel={(event) => {
          event.preventDefault();
          dismiss();
        }}
      >
        <h2 id={`${id}-title`} className="font-display text-h3">
          {gameMode.title}
        </h2>
        <p id={`${id}-description`}>{gameMode.description}</p>
        <div className={styles.actions}>
          <button
            ref={cancel}
            type="button"
            className="btn btn-secondary"
            onClick={dismiss}
          >
            {gameMode.exit}
          </button>
          <button type="button" className="btn btn-primary" onClick={confirm}>
            {gameMode.continue}
          </button>
        </div>
      </dialog>
      {sessionTrigger &&
        createPortal(
          <SessionBoundary
            fallback={
              <section className={styles.preparation} aria-label={gameMode.entry}>
                <p role="status">{gameMode.failed}</p>
                <button
                  className="btn btn-secondary"
                  onClick={exit}
                  ref={focusPreparationExit}
                >
                  {gameMode.exitGame}
                </button>
              </section>
            }
          >
            {Session ? <Session onExit={exit} trigger={sessionTrigger} /> : fallback}
          </SessionBoundary>,
          document.body,
        )}
    </span>
  );
}
