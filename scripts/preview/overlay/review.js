(function () {
  "use strict";
  var cfg = window.__MAGPIE_PREVIEW__;
  if (!cfg || !cfg.repo || !cfg.pr) return; // not a preview

  var armed = false;
  var drag = null;
  var root, box, button, toast, banner;

  function el(tag, style, text) {
    var n = document.createElement(tag);
    n.style.cssText = style;
    if (text) n.textContent = text;
    return n;
  }

  function say(message, ms) {
    toast.textContent = message;
    toast.style.display = "block";
    clearTimeout(say._t);
    say._t = setTimeout(function () { toast.style.display = "none"; }, ms || 6000);
  }

  // root holds the dimming and the marking box; button and toast are siblings
  // on document.body, so hiding root alone leaves them in the captured image.
  function hideChrome() {
    root.style.display = "none";
    button.style.display = "none";
    toast.style.display = "none";
    banner.style.display = "none";
  }

  function showChrome() {
    button.style.display = "";
    banner.style.display = "";
  }

  function sourceUnder(x, y) {
    var node = document.elementFromPoint(x, y);
    while (node && node !== document.body) {
      if (node.getAttribute && node.getAttribute("data-magpie-src")) {
        return node.getAttribute("data-magpie-src");
      }
      node = node.parentElement;
    }
    return null;
  }

  function disarm() {
    armed = false;
    drag = null;
    root.style.display = "none";
    box.style.display = "none";
    button.textContent = "Comment on this preview";
  }

  async function submit(region) {
    // Hide the overlay BEFORE resolving the source. root is
    // position:fixed;inset:0 and must accept pointer events to receive the
    // drag, so with it displayed elementFromPoint returns root itself, the walk
    // ends at <body>, and the source is never resolved — which silently turns
    // every capture into a Conversation-tab fallback.
    hideChrome();

    var source = sourceUnder(region.x + region.w / 2, region.y + region.h / 2);
    var url = targetUrl({ repo: cfg.repo, pr: cfg.pr, source: source, anchors: cfg.anchors });
    var caption = captionFor({
      url: location.href,
      source: source,
      region: region,
      sha: cfg.sha,
    });

    // Built as a promise and handed straight to ClipboardItem, so
    // clipboard.write() is reached while the click's transient activation is
    // still valid. Awaiting the capture first loses it, and Safari then refuses
    // the write on every large page.
    var blobPromise = (async function () {
      // html2canvas-pro's UMD bundle exposes a module namespace, not a
      // callable: window.html2canvas is an object whose .default is the
      // function. The older html2canvas exposed the function directly, so
      // resolve both shapes rather than depending on one.
      var capture =
        (window.html2canvas && (window.html2canvas.default || window.html2canvas.html2canvas)) ||
        window.html2canvas;
      if (typeof capture !== "function") {
        throw new Error("the screenshot library did not load");
      }

      var shot = await capture(document.body, {
        x: window.scrollX, y: window.scrollY,
        width: window.innerWidth, height: window.innerHeight,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true, logging: false,
      });

      var scale = shot.width / window.innerWidth;
      var out = document.createElement("canvas");
      out.width = shot.width;
      out.height = shot.height + 28 * scale;
      var ctx = out.getContext("2d");

      ctx.drawImage(shot, 0, 0);
      ctx.fillStyle = "rgba(15,23,42,0.55)";
      ctx.fillRect(0, 0, out.width, region.y * scale);
      ctx.fillRect(0, (region.y + region.h) * scale, out.width, shot.height);
      ctx.fillRect(0, region.y * scale, region.x * scale, region.h * scale);
      ctx.fillRect((region.x + region.w) * scale, region.y * scale, out.width, region.h * scale);
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(region.x * scale, region.y * scale, region.w * scale, region.h * scale);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, shot.height, out.width, 28 * scale);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = (13 * scale) + "px ui-monospace, monospace";

      var text = caption;
      while (text.length > 12 && ctx.measureText(text).width > out.width - 16 * scale) {
        text = text.slice(0, -4) + "…";
      }
      ctx.fillText(text, 8 * scale, shot.height + 19 * scale);

      // toBlob throws SecurityError on a canvas tainted by a cross-origin
      // image. Inside this promise it surfaces as a rejection and is reported,
      // rather than escaping a callback and leaving the overlay stuck.
      return await new Promise(function (resolve, reject) {
        try {
          out.toBlob(function (blob) {
            if (blob) resolve(blob);
            else reject(new Error("the canvas produced no image"));
          }, "image/png");
        } catch (err) {
          reject(err);
        }
      });
    })();

    var copied = false;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
      copied = true;
    } catch (err) {
      copied = false;
    }

    showChrome();

    if (!copied) {
      // Either the clipboard refused, or the capture itself failed. Awaiting
      // the promise tells us which, and reports the real reason either way.
      var blob = null;
      try {
        blob = await blobPromise;
      } catch (err) {
        root.style.display = "block";
        say("Could not capture the page: " + err.message);
        return;
      }

      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "preview-pr" + cfg.pr + ".png";
      a.click();
      say("Clipboard refused — the screenshot was downloaded; drag it into the comment box");
    } else {
      say("Screenshot copied — paste it into the comment box");
    }

    // window.open returns null whenever "noopener" is passed, blocked or not,
    // so the opener is cleared manually instead and a null result genuinely
    // means the popup was blocked.
    var opened = window.open(url, "_blank");
    if (opened) {
      try { opened.opener = null; } catch (err) { /* cross-origin, already safe */ }
    } else {
      say("Popup blocked — open the pull request manually: " + url, 15000);
    }
    disarm();
  }

  function build() {
    button = el("button",
      "position:fixed;right:16px;bottom:16px;z-index:2147483646;padding:8px 12px;" +
      "border-radius:8px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;" +
      "font:13px system-ui;cursor:pointer", "Comment on this preview");
    button.addEventListener("click", function () {
      armed = !armed;
      root.style.display = armed ? "block" : "none";
      button.textContent = armed ? "Cancel (Esc)" : "Comment on this preview";
    });

    // Always on, and deliberately not dismissible: someone sent this URL to
    // someone else, and the reader needs to know it is a pull request's
    // preview and not magpie.apache.org.
    banner = document.createElement("a");
    banner.href = "https://github.com/" + cfg.repo + "/pull/" + cfg.pr;
    banner.target = "_blank";
    banner.rel = "noopener";
    banner.style.cssText =
      "position:fixed;top:0;right:16px;z-index:2147483646;padding:4px 10px;" +
      "border-radius:0 0 6px 6px;background:#b45309;color:#fff;text-decoration:none;" +
      "font:12px/1.6 system-ui;box-shadow:0 1px 4px rgba(0,0,0,.3)";
    banner.textContent =
      "Preview of " + cfg.repo + " #" + cfg.pr + " · " + cfg.sha + " · not the published site";

    root = el("div", "position:fixed;inset:0;z-index:2147483645;display:none;cursor:crosshair");
    box = el("div", "position:absolute;border:2px solid #e11d48;background:rgba(225,29,72,0.08);display:none");
    root.appendChild(box);

    toast = el("div",
      "position:fixed;left:16px;bottom:16px;z-index:2147483647;display:none;max-width:60vw;" +
      "padding:8px 12px;border-radius:8px;background:#0f172a;color:#e2e8f0;font:13px system-ui");

    root.addEventListener("mousedown", function (e) {
      drag = { x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY };
      box.style.display = "block";
    });
    root.addEventListener("mousemove", function (e) {
      if (!drag) return;
      drag.x2 = e.clientX; drag.y2 = e.clientY;
      var r = clampRegion(drag, { w: window.innerWidth, h: window.innerHeight }) ||
              { x: Math.min(drag.x1, drag.x2), y: Math.min(drag.y1, drag.y2), w: 0, h: 0 };
      box.style.left = r.x + "px"; box.style.top = r.y + "px";
      box.style.width = r.w + "px"; box.style.height = r.h + "px";
    });
    root.addEventListener("mouseup", function () {
      if (!drag) return;
      var region = clampRegion(drag, { w: window.innerWidth, h: window.innerHeight });
      drag = null;
      box.style.display = "none";
      if (!region) { say("That region is too small — drag a box around what you mean"); return; }
      submit(region);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && armed) disarm();
      if (
        e.key === "c" &&
        !armed &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        e.target === document.body
      ) {
        button.click();
      }
    });

    // A mouseup outside the window never reaches root, which would leave drag
    // set and make the next mousemove resize a box the user never started.
    window.addEventListener("mouseup", function () {
      if (!drag) return;
      drag = null;
      box.style.display = "none";
    });
    window.addEventListener("blur", function () {
      drag = null;
      box.style.display = "none";
    });

    document.body.appendChild(banner);
    document.body.appendChild(root);
    document.body.appendChild(button);
    document.body.appendChild(toast);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
