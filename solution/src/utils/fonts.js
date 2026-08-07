let fontsReadyPromise = null;

export function loadInterFonts() {
  if (fontsReadyPromise) return fontsReadyPromise;

  fontsReadyPromise = (async () => {
    const regular = new FontFace(
      "Inter",
      'url("/assets/fonts/inter/Inter-VariableFont_opsz,wght.ttf")',
      { weight: "100 900", style: "normal" },
    );
    const italic = new FontFace(
      "Inter",
      'url("/assets/fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf")',
      { weight: "100 900", style: "italic" },
    );

    const loaded = await Promise.all([regular.load(), italic.load()]);
    loaded.forEach((face) => document.fonts.add(face));
    await document.fonts.ready;
    return true;
  })();

  return fontsReadyPromise;
}
