self.addEventListener("install",e=>{
e.waitUntil(
caches.open("sweatitout").then(c=>c.addAll([
"./","./index.html","./style.css","./script.js","./ai.js"
]))
);
});