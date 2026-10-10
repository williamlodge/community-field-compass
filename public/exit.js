// Quick exit: replace this page in history so Back doesn't return here.
// It does not erase browser history (the page says so).
(function () {
  "use strict";
  var link = document.querySelector(".js-quick-exit");
  if (!link) return;
  link.addEventListener("click", function (e) {
    e.preventDefault();
    window.location.replace(link.href);
  });
})();
