/**
 * Returns a debounced version of `fn` that delays invocation until
 * `delay` ms have passed without another call.
 *
 * Useful outside React (where `useDebounce` is preferable). The returned
 * function exposes `cancel()` to abort a pending invocation — handy on
 * unmount or when the input that triggered the call goes away.
 *
 * @example
 * const save = debounce(persist, 300);
 * input.addEventListener("input", (e) => save(e.target.value));
 * // later, on cleanup:
 * save.cancel();
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): ((...args: TArgs) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const wrapped = (...args: TArgs) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  wrapped.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return wrapped;
}
