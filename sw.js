self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("sweatitout").then(c =>
      c.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./app.js",
        "./ai.js"
      ])
    )
  );
});
