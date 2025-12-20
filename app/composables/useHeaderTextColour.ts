export const useHeaderTextColour = () => {
  const isWhiteText = useState<boolean>("header-white-text", () => false);

  const setWhiteText = (value: boolean) => {
    isWhiteText.value = value;
  };

  const observeHeroSections = () => {
    if (import.meta.server) return;

    const sectionStates = new Map<Element, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isHero = entry.target.classList.contains(
            "fullscreen-hero-section"
          );
          const isVisible = entry.intersectionRatio > 0.5;
          sectionStates.set(entry.target, isHero && isVisible);
        });

        const hasVisibleHero = Array.from(sectionStates.values()).some(
          (visible) => visible
        );
        setWhiteText(hasVisibleHero);
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: "-80px 0px 0px 0px",
      }
    );

    const allSections = document.querySelectorAll(".snap-section");
    allSections.forEach((section) => {
      sectionStates.set(section, false);
      observer.observe(section);
    });

    return () => observer.disconnect();
  };

  return {
    isWhiteText: readonly(isWhiteText),
    setWhiteText,
    observeHeroSections,
  };
};
