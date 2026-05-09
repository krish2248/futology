/**
 * Clamps a numeric value to the inclusive `[min, max]` range.
 *
 * Useful for score pickers, slider inputs, ELO bumps in the simulator,
 * and anywhere a value must stay within bounds without throwing.
 *
 * @example
 * clamp(12, 0, 9)  // → 9
 * clamp(-3, 0, 9)  // → 0
 * clamp(5, 0, 9)   // → 5
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
