/** Kratka vibracija (Android/Chrome) - npr. pri uspjesnoj rezervaciji. iOS Safari
 * ne podrzava Vibration API pa poziv tiho nema efekta (nema greske). */
export function vibrateSuccess() {
  if ("vibrate" in navigator) {
    navigator.vibrate(60);
  }
}
