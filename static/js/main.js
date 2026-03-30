document.addEventListener('DOMContentLoaded', function() {
    window.getCSRFToken = function() {
        let token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!token) {
            document.cookie.split(';').some(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (name === 'csrftoken') token = value;
                return token;
            });
        }
        return token || document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    };
    
    window.showNotification = function(msg, type = 'info') {
        const n = document.createElement('div');
        n.textContent = msg;
        n.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;background:${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};color:white;border-radius:8px;z-index:10000;animation:slideIn .3s ease`;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    };
    
    window.updateFavoritesCount = function() {
        fetch('/api/favorites-count/', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.json())
            .then(d => d.success && document.querySelectorAll('#headerFavoritesCount').forEach(el => {
                el.textContent = d.count;
                el.style.display = d.count === 0 ? 'none' : 'flex';
            }));
    };
    
    window.toggleFavorite = function(id, btn) {
        if (document.querySelector('.login-btn')?.textContent !== 'Выйти') {
            window.showNotification('Войдите в аккаунт', 'error');
            setTimeout(() => window.location.href = '/login/', 1500);
            return;
        }
        const token = window.getCSRFToken();
        if (!token) return window.showNotification('Ошибка безопасности', 'error');
        const orig = btn.innerHTML;
        btn.innerHTML = '...';
        btn.disabled = true;
        fetch('/api/toggle-favorite/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token, 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ anime_id: id })
        })
        .then(r => r.json())
        .then(d => {
            if (d.success) {
                if (d.action === 'added') {
                    btn.innerHTML = '✓ В избранном';
                    btn.classList.add('active');
                } else {
                    btn.innerHTML = '❤ Добавить в избранное';
                    btn.classList.remove('active');
                }
                window.showNotification(d.message, d.action === 'added' ? 'success' : 'info');
                window.updateFavoritesCount();
            } else {
                window.showNotification(d.error || 'Ошибка', 'error');
                btn.innerHTML = orig;
            }
        })
        .catch(() => {
            window.showNotification('Ошибка подключения', 'error');
            btn.innerHTML = orig;
        })
        .finally(() => btn.disabled = false);
    };
    
    document.getElementById('favoriteBtn') && (() => {
        const btn = document.getElementById('favoriteBtn');
        const id = document.querySelector('.anime-detail-container')?.dataset.animeId;
        if (id) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.onclick = e => (e.preventDefault(), window.toggleFavorite(id, newBtn));
        }
    })();
    
    document.querySelectorAll('.star-rating').forEach(c => {
        const stars = c.querySelectorAll('.star');
        const hidden = document.getElementById(c.dataset.field);
        if (!hidden) return;
        const upd = v => stars.forEach(s => parseInt(s.dataset.value) <= v ? s.classList.add('active') : s.classList.remove('active'));
        upd(5);
        stars.forEach(s => {
            s.onmouseenter = () => upd(parseInt(s.dataset.value));
            s.onclick = () => (hidden.value = s.dataset.value, upd(parseInt(s.dataset.value)));
        });
        c.onmouseleave = () => upd(parseInt(hidden.value));
    });
    
    const form = document.getElementById('reviewForm');
    form && form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = 'Отправка...';
        btn.disabled = true;
        try {
            const r = await fetch(window.location.href, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': window.getCSRFToken() }
            });
            const d = await r.json();
            if (d.success) {
                window.showNotification(d.message, 'success');
                form.reset();
                document.querySelectorAll('.star-rating').forEach(c => {
                    const h = document.getElementById(c.dataset.field);
                    if (h) { h.value = '5'; c.querySelectorAll('.star').forEach(s => s.classList.add('active')); }
                });
            } else window.showNotification(d.error || 'Ошибка', 'error');
        } catch { window.showNotification('Ошибка отправки', 'error'); }
        finally { btn.textContent = orig; btn.disabled = false; }
    });
    
    const search = document.querySelector('.search-input');
    let timer;
    search && search.addEventListener('input', e => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const q = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.anime-card');
            let has = false;
            cards.forEach(c => {
                const t = c.querySelector('.anime-name')?.textContent.toLowerCase() || '';
                const o = c.querySelector('.anime-original')?.textContent.toLowerCase() || '';
                if (t.includes(q) || o.includes(q) || !q) {
                    c.style.display = 'flex';
                    if (q) has = true;
                } else c.style.display = 'none';
            });
            let msg = document.querySelector('.no-search-results');
            if (q && !has && cards.length) {
                if (!msg) {
                    msg = document.createElement('div');
                    msg.className = 'no-search-results';
                    msg.innerHTML = '<p>Ничего не найдено</p>';
                    document.querySelector('.anime-list')?.appendChild(msg);
                }
            } else msg?.remove();
        }, 300);
    });
    
    document.querySelectorAll('.anime-card').forEach((c, i) => {
        c.style.opacity = '0';
        c.style.transform = 'translateY(20px)';
        setTimeout(() => {
            c.style.transition = 'all 0.5s ease';
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
        }, i * 100);
    });
    
    window.updateFavoritesCount();
});

window.removeFromFavorites = function(id, btn) {
    if (!confirm('Удалить из избранного?')) return;
    fetch('/api/toggle-favorite/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': window.getCSRFToken(), 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ anime_id: id })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            const card = btn.closest('.anime-card');
            card && card.remove();
            window.showNotification(d.message, 'info');
            window.updateFavoritesCount();
            !document.querySelectorAll('.anime-card').length && location.reload();
        } else window.showNotification(d.error || 'Ошибка', 'error');
    })
    .catch(() => window.showNotification('Ошибка подключения', 'error'));
};