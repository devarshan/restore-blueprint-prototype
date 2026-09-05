(function (window, document) {
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  var ORIGIN = SCRIPT_SRC ? SCRIPT_SRC.replace(/\/widget\.js(?:\?.*)?$/, "") : window.location.origin;

  function css(el, styles) {
    for (var key in styles) el.style[key] = styles[key];
  }

  function frame(src) {
    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = "Restore Survey";
    iframe.setAttribute("allow", "clipboard-write");
    css(iframe, { border: "0", width: "100%", height: "100%", display: "block" });
    return iframe;
  }

  function campaignUrl(opts) {
    var src = ORIGIN + "/embed?campaign=" + encodeURIComponent(opts.campaign || "conference");
    if (opts.utm_source) src += "&utm_source=" + encodeURIComponent(opts.utm_source);
    if (opts.utm_medium) src += "&utm_medium=" + encodeURIComponent(opts.utm_medium);
    if (opts.utm_campaign) src += "&utm_campaign=" + encodeURIComponent(opts.utm_campaign);
    if (opts.utm_term) src += "&utm_term=" + encodeURIComponent(opts.utm_term);
    if (opts.utm_content) src += "&utm_content=" + encodeURIComponent(opts.utm_content);
    return src;
  }

  function mountInline(opts) {
    var target = document.querySelector(opts.target || "#restore-survey");
    if (!target) return;
    css(target, { minHeight: "720px" });
    target.innerHTML = "";
    target.appendChild(frame(campaignUrl(opts)));
  }

  function mountOverlay(opts, kind) {
    var overlay = document.createElement("div");
    overlay.setAttribute("data-restore-widget", kind);
    css(overlay, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483646",
      background: kind === "popup" ? "rgba(8,20,28,0.72)" : "transparent",
    });

    var panel = document.createElement("div");
    var side = opts.side === "left" ? "left" : "right";
    if (kind === "popup") {
      css(panel, {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(420px, calc(100vw - 24px))",
        height: "min(760px, calc(100dvh - 24px))",
        background: "#08141c",
      });
    } else {
      var styles = {
        position: "absolute",
        top: "0",
        width: "min(400px, 100vw)",
        height: "100dvh",
        background: "#08141c",
      };
      styles[side] = "0";
      css(panel, styles);
    }

    var close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    css(close, {
      position: "absolute",
      top: "10px",
      right: "12px",
      zIndex: "2",
      height: "44px",
      padding: "0 8px",
      border: "0",
      background: "transparent",
      color: "#c5d6d4",
      fontFamily: "Sora, sans-serif",
      fontSize: "12px",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      cursor: "pointer",
    });
    close.addEventListener("click", function () {
      overlay.remove();
    });

    panel.appendChild(close);
    panel.appendChild(frame(campaignUrl(opts)));
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function open(opts) {
    var mode = opts.mode || "inline";
    if (mode === "inline") mountInline(opts);
    else mountOverlay(opts, mode === "slider" ? "slider" : "popup");
  }

  function init(opts) {
    opts = opts || {};
    if (opts.trigger) {
      document.addEventListener("click", function (event) {
        var node = event.target.closest ? event.target.closest(opts.trigger) : null;
        if (node) {
          event.preventDefault();
          open(opts);
        }
      });
    }
    if (typeof opts.delayMs === "number" && opts.delayMs >= 0) {
      window.setTimeout(function () {
        open(opts);
      }, opts.delayMs);
    }
    if (!opts.trigger && typeof opts.delayMs !== "number") {
      open(opts);
    }
  }

  window.RestoreWidget = function (command, opts) {
    if (command === "init") init(opts || {});
    if (command === "open") open(opts || {});
  };
})(window, document);
