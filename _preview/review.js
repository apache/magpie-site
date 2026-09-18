const MIN_SIDE = 12;

/** Normalise a drag into a viewport-clipped rectangle, or null if it is a stray click. */
function clampRegion({ x1, y1, x2, y2 }, viewport) {
  // Clamp both corners into the viewport before measuring, so an off-screen
  // drag yields a zero-size region rather than a negative one. Relying on the
  // minimum-size check to reject negatives works, but only by coincidence.
  const left = Math.min(Math.max(0, Math.min(x1, x2)), viewport.w);
  const top = Math.min(Math.max(0, Math.min(y1, y2)), viewport.h);
  const right = Math.min(Math.max(0, Math.max(x1, x2)), viewport.w);
  const bottom = Math.min(Math.max(0, Math.max(y1, y2)), viewport.h);

  const x = left;
  const y = top;
  const w = right - left;
  const h = bottom - top;

  if (w < MIN_SIDE || h < MIN_SIDE) return null;
  return { x, y, w, h };
}

/**
 * Burned into the image rather than written beside it: a caption survives being
 * dragged into a comment, quoted or downloaded, where a separate line would not.
 */
function captionFor({ url, source, region, sha }) {
  const where = source ?? "source not resolved";
  return `${url} — ${where} — ${region.w}×${region.h} at (${region.x},${region.y}) — built from ${sha}`;
}

/**
 * The Files tab anchored at the marked line when that line is part of the diff,
 * and the Conversation tab otherwise. It never guesses a line.
 */
function targetUrl({ repo, pr, source, anchors }) {
  const conversation = `https://github.com/${repo}/pull/${pr}`;
  if (!source || !anchors) return conversation;

  const match = /^(.*):(\d+)$/.exec(source);
  if (!match) return conversation;

  const [, file, lineText] = match;
  const line = Number(lineText);
  const entry = anchors[file];
  if (!entry?.anchor) return conversation;

  const inDiff = (entry.ranges ?? []).some(([from, to]) => line >= from && line <= to);
  if (!inDiff) return conversation;

  return `https://github.com/${repo}/pull/${pr}/files#${entry.anchor}R${line}`;
}

window.__MAGPIE_PREVIEW__ = {"repo":"apache/magpie-site","pr":180,"sha":"81d67e5","anchors":{".gitignore":{"anchor":"diff-bc37d034bad564583790a46f19d807abfe519c5671395fd494d8cce506c42947","ranges":[[83,86]]},".pre-commit-config.yaml":{"anchor":"diff-63a9c44a44acf85fea213a857769990937107cf072831e1a26808cfde9d096b9","ranges":[[41,41]]},"package-lock.json":{"anchor":"diff-053150b640a7ce75eff69d1a22cae7f0f94ad64ce9a855db544dda0929316519","ranges":[[17,17],[22,22],[34,34],[1348,1354],[5001,5007],[5159,5180],[5193,5199],[7285,7291],[7631,7636],[8578,8584],[10949,10954]]},"package.json":{"anchor":"diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519","ranges":[[29,31],[46,47]]},"public/illustrations/magpie/3d/README.md":{"anchor":"diff-435f90747ac70da6b271e14ba9f65b5eb6bb39645cc766905d7bf28f7357190f","ranges":[[1,21]]},"public/illustrations/magpie/3d/magpie-flying.png":{"anchor":"diff-8335b95bc5614a87ac4cf0e123c8779695e71ea254d5539664d77a7bfc59c679","ranges":[]},"public/illustrations/magpie/3d/magpie-front.png":{"anchor":"diff-05d7fbbb65df49b8ecebd2ca89befe2def182957dc31aa5b2feb2c45041b75e5","ranges":[]},"public/illustrations/magpie/3d/magpie-looking-back.png":{"anchor":"diff-87e4c37f22d31e90ad80dcc865b8bf35a999328178a4a4629384002e24bd3a2c","ranges":[]},"public/illustrations/magpie/README.md":{"anchor":"diff-d00490125008000ab15d7cc7c80030dca8ec9a24a3a781c1690db688679cbb2b","ranges":[[1,23]]},"public/illustrations/magpie/magpie-flying.png":{"anchor":"diff-f5aab758c852e5654ea091e7971eb7e7f24336acb49f0bb59aeb1b0d3194393f","ranges":[]},"public/illustrations/magpie/magpie-looking-back.png":{"anchor":"diff-22db2c27baa3e52a332eb15a19b1fd01f046b53ddc98cd83e13ab54bcb54f12a","ranges":[]},"public/illustrations/magpie/magpie-standing.png":{"anchor":"diff-60b9be47470ba1975cc1507576e20f7986878567b0fd9085c9a8f625fe631bc9","ranges":[]},"public/photos/README.md":{"anchor":"diff-2e7645257baf24b1c7f21c3228c78cc8506023cc82b12892fa0c4aa1bd31d463","ranges":[[1,27]]},"public/photos/building-tools.jpg":{"anchor":"diff-80d0bd6b49f64da0d9c0fb3bce586ccac0c77dbd696c398ac5b4f2db3a8c8cf6","ranges":[]},"public/photos/collaboration.jpg":{"anchor":"diff-843d6dd0f239877294b1dae21994cec351848c9d68e22218ad469920c9fd5829","ranges":[]},"public/photos/health-review.jpg":{"anchor":"diff-140249e51e07e8144552ef58c850cb76616b619a1f586a39a3ca0a74b6c3a085","ranges":[]},"public/photos/maintainer-work.jpg":{"anchor":"diff-ac9a74b9811bcb659de65fcec480a36af51351e73e36ace86a34c3f5cfd5158d","ranges":[]},"public/photos/pair-work.jpg":{"anchor":"diff-0c27ba3782826100f096ae4656bea0e5db648f136807d898f775a929583dbdb8","ranges":[]},"public/photos/release-planning.jpg":{"anchor":"diff-59095f02f9d9f0eaf93e37874ea2b76b3ca06f3de4b7fdc0658440d12f20c762","ranges":[]},"public/photos/security-review.jpg":{"anchor":"diff-f9ee307ecdf4f671d82e5462ccb3abb6680a58ab35e75d5708ebb443189d804b","ranges":[]},"public/photos/team-discussion.jpg":{"anchor":"diff-59ddf968edd806640b4ff53170325ff3b15ad534d6fd8b2d9e74c16ef40b8b9e","ranges":[]},"public/photos/team-review.jpg":{"anchor":"diff-7c7bc737a900a1897d4fcf03037cfaafad47bfee48452e7da09c15ba4ab5594f","ranges":[]},"public/photos/teamwork.jpg":{"anchor":"diff-a083785dabc3751db61f716e4f459a4c7645793665df38c4c66fea4412760eb7","ranges":[]},"public/photos/workshop.jpg":{"anchor":"diff-3eea42ac4cf43ab84ef64779f57da0b114ac671380ce26b64bbf8c9c224c3659","ranges":[]},"scripts/check-landing-education.py":{"anchor":"diff-3edbf2739f42039b716c05bd3faacf7e2ccbb481ca8843b0faf88bf6e4ebc21e","ranges":[[20,20],[54,54],[111,112]]},"scripts/check-landing-families.py":{"anchor":"diff-241dba5e2133ef739fc60f71af52da7e3153768d8730cc04bd1f6377976c4d02","ranges":[[20,21],[33,33],[56,56],[58,58],[61,61],[73,73],[78,78],[113,114]]},"src/components/animation-lab/AnimationLab.tsx":{"anchor":"diff-55ccc976e695b91a0eeba591707631dfc66c1666b3435cac44c2930cb7d05c4e","ranges":[[1,49]]},"src/components/animation-lab/MagpieFlightStudy.tsx":{"anchor":"diff-20b759c5b8b0cd195837ec5a42ee6d8d6ce5139cbb268820e7a21b0917becbec","ranges":[[1,2]]},"src/components/animation-lab/MagpieImageStudy.tsx":{"anchor":"diff-cb088f946d979b4879834b83cc8d69119eb68a8ed6e8edfe49a3fad83fa2a253","ranges":[[1,141]]},"src/components/landing/BadgeHero.tsx":{"anchor":"diff-8f6668be701eb3ff8d61cbc900f76352f484d5839023707593b5a166624df6a2","ranges":[[1,33]]},"src/components/landing/KineticHome.tsx":{"anchor":"diff-da519de2847002b9308cf28a8e4847b9532d66dcf991853f76229abd7dc87eb4","ranges":[[1,687]]},"src/components/landing/KineticResources.tsx":{"anchor":"diff-de827f51d19f7b08e3486f51390fd79fcea935dfb12c09914d0c105b1028cb41","ranges":[[1,48]]},"src/components/landing/MagpieFlight.tsx":{"anchor":"diff-12814980ad70d7f7f41ae9a218c47c8ceeb8ddebc82ccd1b95c2a84025c1bb4a","ranges":[[1,796]]},"src/components/landing/TerminalDemo.tsx":{"anchor":"diff-5aae84360f92ee91a9fa4682e2dc7d38a978e3fa879261d82c6142d76e945bd4","ranges":[[1,131]]},"src/pages/animation-test.astro":{"anchor":"diff-5c8158bba62e6c2ad6baa2e2ee79898be2a5c6f254423fa883419a92cf3b9d73","ranges":[[1,13]]},"src/pages/demo.astro":{"anchor":"diff-bf347304e5217bd527901b0e25d9761843d3da8bda196998bea1eec7f73003ec","ranges":[[1,7]]},"src/pages/index.astro":{"anchor":"diff-95d291e9ce4c8739cc7e65ff7bf0838dd5294cf39ab787ba51a42d08fb2df663","ranges":[[3,3],[6,7]]},"src/pages/resources.astro":{"anchor":"diff-0e1d5e79d00892459c8594c7278ee4f7f915a113bc9b80b52e838bc89ed3f993","ranges":[[1,10]]},"src/styles/animation-lab.css":{"anchor":"diff-5413ea33a25be3491a9e1d34d942aec6df4a9365767aaeba1257a97304d43ba3","ranges":[[1,36]]},"src/styles/kinetic-home.css":{"anchor":"diff-6f117bd6560bc0497e5a89912404bbcf752174ff4ff8f6e4820905e2c6d679c5","ranges":[[1,2352]]},"src/styles/terminal-demo.css":{"anchor":"diff-2f3102d9585139dda3ba9f62272b4c7b8ac745385d95bec8bd1193038bdbb48c","ranges":[[1,89]]}}};
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
