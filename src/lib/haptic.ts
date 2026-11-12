/**
 * Device vibration feedback wrapper
 */
export function triggerHaptic(type: "success" | "error" | "tap" = "tap") {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;

  try {
    if (type === "success") {
      navigator.vibrate([100]); // Single firm pulse
    } else if (type === "error") {
      navigator.vibrate([120, 60, 150]); // Warning double-buzz
    } else {
      navigator.vibrate(40); // Subtle button tap
    }
  } catch (e) {
    console.warn("Haptic failed", e);
  }
}

