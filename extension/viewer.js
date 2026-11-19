(() => {
  const SOURCE_IN = "mail-peek";
  const SOURCE_OUT = "mail-peek-viewer";
  let observer = null;
  let currentZoom = 1;

  function post(message) {
    window.parent.postMessage({ source: SOURCE_OUT, ...message }, "*");
  }

  function sanitizeMail(html) {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    doc
      .querySelectorAll("script, iframe, frame, object, embed, applet, link[rel~='import'], meta[http-equiv]")
      .forEach((node) => node.remove());
    doc.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value || "";
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
        } else if ((name === "href" || name === "src" || name === "xlink:href") && /^\s*javascript:/i.test(value)) {
          el.removeAttribute(attr.name);
        } else if ((name === "src" || name === "href" || name === "xlink:href" || name === "background") && /^\s*cid:/i.test(value)) {
          // Unresolved cid: would violate sandbox CSP (img-src). Drop it.
          el.removeAttribute(attr.name);
        }
      }
    });
    return doc;
  }

  function report(id) {
    const root = document.documentElement;
    const body = document.body;
    const height = Math.max(root.scrollHeight, body ? body.scrollHeight : 0);
    // documentElement.scrollWidth is the full visual width of the laid-out
    // mail (content overflow included, CSS zoom applied). body.scrollWidth is
    // zoom-independent and would feed back into the iframe width when zoom is
    // below 100%, so it must not be used here.
    const width = Math.max(root.scrollWidth, root.clientWidth);
    post({ type: "height", id, height, width, zoom: currentZoom });
  }

  function applyZoom() {
    const target = document.body || document.documentElement;
    if (!target) return;
    target.style.zoom = currentZoom === 1 ? "" : String(currentZoom);
  }

  function setZoom(value) {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return;
    currentZoom = next;
    applyZoom();
  }

  function renderMail({ id, html }) {
    const doc = sanitizeMail(html);

    document.head.querySelectorAll("[data-mail]").forEach((node) => node.remove());
    const base = document.createElement("base");
    base.target = "_blank";
    base.setAttribute("data-mail", "");
    document.head.appendChild(base);
    doc.querySelectorAll("style").forEach((style) => {
      style.setAttribute("data-mail", "");
      document.head.appendChild(document.adoptNode(style));
    });

    const body = document.body;
    for (const attr of Array.from(body.attributes)) body.removeAttribute(attr.name);
    for (const attr of Array.from(doc.body.attributes)) body.setAttribute(attr.name, attr.value);
    body.replaceChildren(...Array.from(doc.body.childNodes).map((node) => document.adoptNode(node)));

    observer?.disconnect();
    observer = new ResizeObserver(() => report(id));
    observer.observe(document.documentElement);
    observer.observe(body);
    document.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", () => report(id));
      img.addEventListener("error", () => report(id));
    });
    report(id);
    setTimeout(() => report(id), 250);
    setTimeout(() => report(id), 1200);
  }

  function renderPage({ id, html }) {
    // Do NOT use document.open()/write(): per spec that strips every event
    // listener from the window, so zoom / wheel / keyboard messages from the
    // parent were silently dropped afterwards. Swap the root element instead —
    // the page keeps its own <head> styles, and our listeners survive.
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    doc.querySelectorAll("script").forEach((node) => node.remove());
    doc.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on") || ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value || ""))) {
          el.removeAttribute(attr.name);
        }
      }
    });
    const base = doc.createElement("base");
    base.target = "_blank";
    // Keep the page's own layout. Only guarantee that content can overflow the
    // iframe (the parent panel provides the scrolling) instead of being
    // clipped to the window width.
    const fit = doc.createElement("style");
    fit.textContent = "html,body{margin:0;overflow:visible}";
    (doc.head || doc.documentElement).prepend(fit);
    (doc.head || doc.documentElement).prepend(base);

    const root = document.adoptNode(doc.documentElement);
    document.replaceChild(root, document.documentElement);

    observer?.disconnect();
    observer = new ResizeObserver(() => report(id));
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
    document.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", () => report(id));
      img.addEventListener("error", () => report(id));
    });
    requestAnimationFrame(() => report(id));
    setTimeout(() => report(id), 250);
    setTimeout(() => report(id), 1200);
  }

  function zoomKeyDirection(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return 0;
    const key = event.key;
    const code = event.code;
    if (key === "+" || key === "=" || code === "Equal" || code === "NumpadAdd") return 1;
    if (key === "-" || key === "_" || code === "Minus" || code === "NumpadSubtract") return -1;
    if (key === "0" || code === "Digit0" || code === "Numpad0") return 2;
    return 0;
  }

  window.addEventListener("keydown", (event) => {
    const direction = zoomKeyDirection(event);
    if (!direction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    post({ type: "zoom-step", direction });
  }, true);

  // Only pinch-zoom (ctrl+wheel). Plain two-finger scroll is forwarded to the
  // parent preview panel — an iframe sized to its content has nothing to scroll
  // itself, and browsers will not chain that gesture to the parent.
  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.deltaY < 0) post({ type: "zoom-step", direction: 1 });
        else if (event.deltaY > 0) post({ type: "zoom-step", direction: -1 });
        return;
      }
      event.preventDefault();
      // Shift+wheel is the common "scroll sideways" gesture; Chrome usually
      // reports it as deltaX, but not always. Normalize it so wide mail (large
      // images) can be panned horizontally from anywhere over the body.
      let deltaX = event.deltaX;
      let deltaY = event.deltaY;
      if (event.shiftKey && !deltaX) {
        deltaX = deltaY;
        deltaY = 0;
      }
      post({
        type: "wheel",
        deltaX,
        deltaY,
        deltaMode: event.deltaMode,
      });
    },
    { capture: true, passive: false }
  );

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== SOURCE_IN) return;
    if (data.type === "render-mail") {
      renderMail(data);
      if (data.zoom) currentZoom = Number(data.zoom) || 1;
      applyZoom();
    } else if (data.type === "render-page") {
      renderPage(data);
      if (data.zoom) currentZoom = Number(data.zoom) || 1;
      applyZoom();
    } else if (data.type === "zoom") {
      setZoom(data.zoom);
      // A fixed iframe width may have been applied for the previous zoom
      // level; ask the parent to release it before measuring again, otherwise
      // zooming out would keep the old, wider viewport.
      const id = location.hash.slice(1);
      if (id) {
        post({ type: "remeasure", id });
        requestAnimationFrame(() => report(id));
        setTimeout(() => report(id), 100);
      }
    }
  });

  post({ type: "ready" });
})();
