// FieldCompass on-device plans (FC-11, FC-14, FC-15; tests T11–T13).
// Nothing is stored until the person confirms "Save on this device".
// Nothing here is sent to the server except resource IDs to check for changes.
(function () {
  "use strict";

  var KEY = "fc.plan.v1";
  var STATUSES = ["todo", "done", "no_answer", "not_eligible", "no_availability"];
  var dataEl = document.getElementById("fc-data");
  var config = dataEl ? JSON.parse(dataEl.textContent || "{}") : {};
  var M = config.messages || {};
  var lang = config.lang || "en";

  function msg(key, vars) {
    var s = M[key] || key;
    return s.replace(/\{(\w+)\}/g, function (_, k) {
      return vars && vars[k] != null ? String(vars[k]) : "{" + k + "}";
    });
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function store(plan) {
    try {
      plan.updated_at = new Date().toISOString();
      window.localStorage.setItem(KEY, JSON.stringify(plan));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAll() {
    try {
      window.localStorage.removeItem(KEY);
    } catch (e) {
      /* storage unavailable: nothing stored */
    }
  }

  function fmtDate(iso) {
    try {
      return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium" }).format(new Date(iso));
    } catch (e) {
      return iso;
    }
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(c);
    });
    return node;
  }

  // ---- Detail page: "Add to my plan" -------------------------------------

  var saveBtn = document.querySelector(".js-save");
  if (saveBtn) {
    var snapshot = JSON.parse(saveBtn.getAttribute("data-resource") || "{}");
    var dialog = document.getElementById("consent-dialog");
    var label = saveBtn.querySelector("span");

    var markSaved = function () {
      label.textContent = msg("detail.saved");
      saveBtn.setAttribute("aria-pressed", "true");
      saveBtn.disabled = true;
    };

    var addItem = function (plan) {
      plan.items.push({
        resource: snapshot,
        status: "todo",
        note: "",
        added_at: new Date().toISOString(),
      });
      if (store(plan)) markSaved();
    };

    var existing = load();
    if (existing && existing.items.some(function (i) { return i.resource.id === snapshot.id; })) markSaved();
    saveBtn.hidden = false;

    saveBtn.addEventListener("click", function () {
      var plan = load();
      if (plan) {
        addItem(plan);
        return;
      }
      // First save: explain shared-device storage and ask (FC-14, FC-28).
      if (dialog && typeof dialog.showModal === "function") {
        dialog.returnValue = "";
        dialog.showModal();
        dialog.addEventListener(
          "close",
          function () {
            if (dialog.returnValue === "confirm") {
              var now = new Date().toISOString();
              addItem({ version: 1, consented_at: now, created_at: now, updated_at: now, items: [] });
            }
            saveBtn.focus();
          },
          { once: true },
        );
      } else if (window.confirm(msg("consent.title") + "\n\n" + msg("consent.body"))) {
        var t = new Date().toISOString();
        addItem({ version: 1, consented_at: t, created_at: t, updated_at: t, items: [] });
      }
    });
  }

  // ---- Saved page ---------------------------------------------------------

  var root = document.getElementById("plan-root");
  if (!root) return;
  var tools = document.getElementById("plan-tools");
  var statusEl = document.getElementById("plan-status");
  var flags = {}; // resource id -> "changed" | "withdrawn"

  function announce(text) {
    statusEl.textContent = text;
    statusEl.hidden = !text;
  }

  function render() {
    var plan = load();
    root.textContent = "";
    if (!plan || plan.items.length === 0) {
      root.appendChild(el("p", { text: msg("saved.empty") }));
      tools.hidden = true;
      return;
    }
    tools.hidden = false;
    root.appendChild(el("p", { class: "fine", text: msg("saved.savedOn", { date: fmtDate(plan.created_at) }) }));

    var list = el("ol", { class: "plan-list" });
    plan.items.forEach(function (item, idx) {
      var r = item.resource;
      var li = el("li", { class: "plan-item" });
      var title = el("h2", null, [el("a", { href: "/resources/" + encodeURIComponent(r.id), text: r.name })]);
      li.appendChild(title);
      li.appendChild(el("p", { class: "fine", text: r.organization }));

      if (flags[r.id] === "changed") li.appendChild(el("p", { class: "notice plan-flag", text: msg("saved.changed") }));
      if (flags[r.id] === "withdrawn") li.appendChild(el("p", { class: "notice plan-flag", text: msg("saved.withdrawn") }));

      if (r.phone) {
        li.appendChild(el("p", null, [el("a", { href: "tel:" + r.phone.replace(/[^\d+]/g, ""), text: msg("detail.call") + " " + r.phone })]));
      }

      var row = el("div", { class: "plan-row plan-actions" });
      var selId = "status-" + idx;
      var select = el("select", { id: selId });
      STATUSES.forEach(function (s) {
        var opt = el("option", { value: s, text: msg("saved.status." + s) });
        if (item.status === s) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", function () {
        var p = load();
        if (!p || !p.items[idx]) return;
        p.items[idx].status = select.value;
        store(p);
        render();
      });
      row.appendChild(el("div", { class: "field" }, [el("label", { for: selId, text: msg("saved.status") }), select]));

      var noteId = "note-" + idx;
      var note = el("textarea", { id: noteId, rows: "2", maxlength: "500" });
      note.value = item.note || "";
      note.addEventListener("change", function () {
        var p = load();
        if (!p || !p.items[idx]) return;
        p.items[idx].note = note.value.slice(0, 500);
        store(p);
      });
      row.appendChild(el("div", { class: "field" }, [el("label", { for: noteId, text: msg("saved.note") }), note]));
      li.appendChild(row);

      var actions = el("div", { class: "plan-row plan-actions" });
      var needsAlternative = item.status === "no_answer" || item.status === "not_eligible" || item.status === "no_availability" || flags[r.id] === "withdrawn";
      if (needsAlternative && r.category) {
        actions.appendChild(el("a", { class: "btn btn-secondary", href: "/search?category=" + encodeURIComponent(r.category), text: msg("saved.findAlternative") }));
      }
      var remove = el("button", { class: "btn btn-quiet", type: "button", text: msg("saved.remove") });
      remove.addEventListener("click", function () {
        var p = load();
        if (!p) return;
        p.items.splice(idx, 1);
        store(p);
        render();
      });
      actions.appendChild(remove);
      li.appendChild(actions);
      list.appendChild(li);
    });
    root.appendChild(list);
  }

  // Check saved resources against the current published versions (T13).
  function checkForChanges() {
    var plan = load();
    if (!plan || plan.items.length === 0 || !window.fetch) return;
    var failed = false;
    Promise.all(
      plan.items.map(function (item) {
        return fetch("/api/resources/" + encodeURIComponent(item.resource.id), { headers: { Accept: "application/json" } })
          .then(function (res) {
            if (res.status === 410 || res.status === 404) {
              flags[item.resource.id] = "withdrawn";
              return;
            }
            if (!res.ok) throw new Error("status " + res.status);
            return res.json().then(function (body) {
              if (body.resource && body.resource.record_version !== item.resource.record_version) flags[item.resource.id] = "changed";
            });
          })
          .catch(function () {
            failed = true;
          });
      }),
    ).then(function () {
      if (failed) announce(msg("saved.offline", { date: fmtDate(plan.updated_at) }));
      render();
    });
  }

  function exportText() {
    var plan = load();
    if (!plan) return;
    var lines = ["FieldCompass — " + msg("saved.title"), new Date().toLocaleString(lang === "es" ? "es-US" : "en-US"), ""];
    plan.items.forEach(function (item, i) {
      var r = item.resource;
      lines.push(i + 1 + ". " + r.name);
      lines.push("   " + r.organization);
      if (r.phone) lines.push("   " + msg("detail.call") + ": " + r.phone);
      if (r.website) lines.push("   " + r.website);
      lines.push("   " + msg("saved.status") + ": " + msg("saved.status." + item.status));
      if (item.note) lines.push("   " + item.note);
      lines.push("   Source updated: " + fmtDate(r.source_updated_at));
      lines.push("");
    });
    lines.push(msg("saved.confirmReminder"));
    var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    var a = el("a", { href: URL.createObjectURL(blob), download: "fieldcompass-plan.txt" });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  document.getElementById("plan-export").addEventListener("click", exportText);
  document.getElementById("plan-print").addEventListener("click", function () {
    window.print();
  });
  document.getElementById("plan-clear").addEventListener("click", function () {
    if (!window.confirm(msg("saved.clearConfirm"))) return;
    clearAll();
    flags = {};
    render();
    announce(msg("saved.cleared") + " " + msg("saved.exportNote"));
  });

  render();
  checkForChanges();
})();
