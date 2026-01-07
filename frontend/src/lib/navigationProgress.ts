"use client";

export const triggerNavigationProgress = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("waashop:navigation-start"));
};
