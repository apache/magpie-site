(function () {
  "use strict";
  var cfg = window.__MAGPIE_PREVIEW__;
  if (!cfg || !cfg.repo || !cfg.pr) return; // not a preview

  var armed = false;
  var drag = null;
  var root, box, button, toast;

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
  }

  function showChrome() {
    button.style.display = "";
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
    button.textContent = "Comment on this preview";
  }

  async function submit(region) {
    var source = sourceUnder(region.x + region.w / 2, region.y + region.h / 2);
    var url = targetUrl({ repo: cfg.repo, pr: cfg.pr, source: source, anchors: cfg.anchors });
    var caption = captionFor({
      url: location.href,
      source: source,
      region: region,
      sha: cfg.sha,
    });

    hideChrome();
    var shot;
    try {
      shot = await window.html2canvas(document.body, {
        x: window.scrollX, y: window.scrollY,
        width: window.innerWidth, height: window.innerHeight,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true, logging: false,
      });
    } catch (err) {
      showChrome();
      root.style.display = "block";
      say("Could not capture the page: " + err.message);
      return;
    }

    showChrome();

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
    // The caption can carry a long URL and a long source path. Measure and
    // truncate rather than letting it run off the edge of the image.
    var text = caption;
    while (text.length > 12 && ctx.measureText(text).width > out.width - 16 * scale) {
      text = text.slice(0, -4) + "…";
    }
    ctx.fillText(text, 8 * scale, shot.height + 19 * scale);

    out.toBlob(async function (blob) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        say("Screenshot copied — paste it into the comment box");
      } catch (err) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "preview-pr" + cfg.pr + ".png";
        a.click();
        say("Clipboard refused — the screenshot was downloaded; drag it into the comment box");
      }
      var opened = window.open(url, "_blank", "noopener");
      if (!opened) say("Popup blocked — open the pull request manually: " + url, 15000);
      disarm();
    }, "image/png");
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
      if (e.key === "c" && !armed && e.target === document.body) button.click();
    });

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
