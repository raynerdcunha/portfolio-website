/* Runs before first paint: marks JS as available and picks the intro / page-wipe state. */
(function () {
  var r = document.documentElement; r.classList.add('js');
  var seen = false; try { seen = sessionStorage.getItem('rd-loader-seen') === '1'; } catch (e) {}
  var rm = false; // site effects always run
  var wiping = false; try { wiping = sessionStorage.getItem('rd-wipe') === '1'; } catch (e) {}
  if (wiping && !rm) r.classList.add('is-wiping');
  else if (!seen && !rm) r.classList.add('is-loading');
})();
