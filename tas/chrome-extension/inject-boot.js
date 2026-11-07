/**
 * Content script (document_start): inject tas-boot into the page world
 * synchronously so Math.random is wrapped before game.js runs.
 */
(function () {
  function looksLikeIslebound() {
    try {
      const path = (location.pathname || "").toLowerCase();
      const href = (location.href || "").toLowerCase();
      if (path.includes("islebound") || href.includes("islebound")) return true;
      if (document.title === "Islebound") return true;
      if (document.querySelector && document.querySelector('canvas#game, script[src*="game.js"]')) {
        return true;
      }
      // Local / file serve of this repo's index.html
      if (
        (location.hostname === "127.0.0.1" ||
          location.hostname === "localhost" ||
          location.protocol === "file:") &&
        (path.endsWith("/") || path.endsWith("index.html") || path === "" || /index\.html$/i.test(path))
      ) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  function injectSync() {
    if (document.documentElement.getAttribute("data-islebound-tas-boot") === "1") return;
    document.documentElement.setAttribute("data-islebound-tas-boot", "1");

    // Force-enable in page world before boot body runs.
    const mark = document.createElement("script");
    mark.textContent = "window.__IsleboundTAS_EXT=true;";
    (document.documentElement || document.head).appendChild(mark);
    mark.remove();

    // Sync-load extension script so it executes before the HTML parser reaches game.js.
    let src = "";
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", chrome.runtime.getURL("page/tas-boot.js"), false);
      xhr.send(null);
      if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) src = xhr.responseText;
    } catch (e) {
      src = "";
    }

    if (src) {
      const boot = document.createElement("script");
      boot.textContent = src;
      (document.documentElement || document.head).appendChild(boot);
      boot.remove();
      return;
    }

    // Fallback: external tag (may race on slow disks).
    const boot = document.createElement("script");
    boot.src = chrome.runtime.getURL("page/tas-boot.js");
    boot.async = false;
    (document.documentElement || document.head).appendChild(boot);
  }

  if (looksLikeIslebound()) {
    injectSync();
    return;
  }

  // Title/canvas may not exist yet — poll briefly during early parse.
  const t = setInterval(() => {
    if (looksLikeIslebound()) {
      clearInterval(t);
      injectSync();
    }
  }, 5);
  setTimeout(() => clearInterval(t), 3000);
})();
