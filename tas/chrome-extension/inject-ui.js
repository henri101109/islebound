/**
 * Content script (document_idle): inject overlay into the page world once the game canvas exists.
 */
(function () {
  function isIsleboundPage() {
    if (document.title === "Islebound") return true;
    if (document.getElementById("game")) return true;
    if (document.querySelector('script[src*="game.js"]')) return true;
    const path = (location.pathname || "").toLowerCase();
    return path.includes("islebound");
  }

  function injectUi() {
    if (!isIsleboundPage()) return false;
    if (document.documentElement.getAttribute("data-islebound-tas-ui") === "1") return true;
    document.documentElement.setAttribute("data-islebound-tas-ui", "1");
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("page/tas.js");
    s.async = false;
    (document.documentElement || document.head || document.body).appendChild(s);
    return true;
  }

  if (injectUi()) return;

  const obs = new MutationObserver(() => {
    if (injectUi()) obs.disconnect();
  });
  obs.observe(document.documentElement || document, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 15000);
})();
