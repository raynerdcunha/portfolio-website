var m = document.getElementById('missing'); if (m) m.textContent = location.pathname.replace(/^\//, '') || 'this-page';
