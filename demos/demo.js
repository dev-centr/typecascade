(() => {
  const familySel = document.getElementById("demo-family");
  const providerSel = document.getElementById("demo-provider");
  const heading = document.getElementById("sample-heading");
  const winner = document.getElementById("fake-winner");
  const source = document.getElementById("fake-source");
  const linkId = "demo-provider-font";

  function slug(name) {
    return name.trim().replace(/\s+/g, "+");
  }

  function inject(family, provider) {
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (provider === "bunny") {
      link.href = `https://fonts.bunny.net/css?family=${slug(family)}:400,700&display=swap`;
    } else {
      const enc = encodeURIComponent(family).replace(/%20/g, "+");
      link.href = `https://fonts.googleapis.com/css2?family=${enc}:wght@400;700&display=swap`;
    }
    heading.style.fontFamily = `"${family}", Georgia, serif`;
    winner.textContent = `"${family}", serif`;
    source.textContent = provider === "bunny" ? "Bunny Fonts" : "Google Fonts";
  }

  document.getElementById("demo-inject").addEventListener("click", () => {
    inject(familySel.value, providerSel.value);
  });

  // Default preview face
  inject(familySel.value, providerSel.value);
})();
