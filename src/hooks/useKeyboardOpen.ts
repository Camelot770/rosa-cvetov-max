import { useEffect, useState } from 'react';

// Inputs that never raise the on-screen keyboard
const NO_KEYBOARD_TYPES = ['checkbox', 'radio', 'range', 'date', 'time', 'file', 'button', 'submit'];

// A viewport this much shorter than its full height means the keyboard is up
const KEYBOARD_MIN_HEIGHT = 120;

function isTextField(el: Element | null): boolean {
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  return el.tagName === 'INPUT' && !NO_KEYBOARD_TYPES.includes((el as HTMLInputElement).type);
}

// True while a text field has focus and the keyboard is up, which is when fixed bars cover that field.
// The viewport check brings the bars back after Android's back button closes the keyboard but keeps the focus.
// resetKey re-checks after navigation, which can remove a focused field without a focusout.
export function useKeyboardOpen(resetKey?: unknown): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    let fullHeight = viewport?.height ?? 0;
    let timer: ReturnType<typeof setTimeout>;

    const update = () => {
      clearTimeout(timer);
      // Focus moving between two fields passes through <body> for a moment
      timer = setTimeout(() => {
        if (viewport) fullHeight = Math.max(fullHeight, viewport.height);
        const shrunk = !viewport || viewport.height < fullHeight - KEYBOARD_MIN_HEIGHT;
        setOpen(isTextField(document.activeElement) && shrunk);
      }, 60);
    };

    update();
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    viewport?.addEventListener('resize', update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      viewport?.removeEventListener('resize', update);
    };
  }, [resetKey]);

  return open;
}
