// main.js - Только для избранного

document.addEventListener('DOMContentLoaded', function() {
    console.log('Main.js loaded');
    
    // ==================== ПОЛУЧЕНИЕ CSRF ТОКЕНА ====================
    window.getCSRFToken = function() {
        let token = null;
        
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            token = metaToken.getAttribute('content');
        }
        
        if (!token) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'csrftoken') {
                    token = value;
                    break;
                }
            }
        }
        
        if (!token) {
            const input = document.querySelector('[name=csrfmiddlewaretoken]');
            if (input) {
                token = input.value;
            }
        }
        
        return token || '';
    };
    
    // ==================== УВЕДОМЛЕНИЯ ====================
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
    
    // ==================== ОБНОВЛЕНИЕ СЧЕТЧИКА ====================
    window.updateFavoritesCount = function() {
        fetch('/api/favorites-count/', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelectorAll('#headerFavoritesCount').forEach(el => {
                    el.textContent = data.count;
                    el.style.display = data.count === 0 ? 'none' : 'flex';
                });
            }
        })
        .catch(error => console.error('Error:', error));
    };
    
    // ==================== ПЕРЕКЛЮЧЕНИЕ ИЗБРАННОГО ====================
    window.toggleFavorite = function(animeId, button) {
        const isAuth = document.querySelector('.login-btn')?.textContent === 'Выйти';
        if (!isAuth) {
            window.showNotification('Войдите в аккаунт', 'error');
            setTimeout(() => { window.location.href = '/login/'; }, 1500);
            return;
        }
        
        const token = window.getCSRFToken();
        if (!token) {
            window.showNotification('Ошибка безопасности', 'error');
            return;
        }
        
        const originalText = button.innerHTML;
        button.innerHTML = '...';
        button.disabled = true;
        
        fetch('/api/toggle-favorite/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ anime_id: animeId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.action === 'added') {
                    button.innerHTML = '✓ В избранном';
                    button.classList.add('active');
                } else {
                    button.innerHTML = '❤ Добавить в избранное';
                    button.classList.remove('active');
                }
                window.showNotification(data.message, data.action === 'added' ? 'success' : 'info');
                window.updateFavoritesCount();
            } else {
                window.showNotification(data.error || 'Ошибка', 'error');
                button.innerHTML = originalText;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.showNotification('Ошибка подключения', 'error');
            button.innerHTML = originalText;
        })
        .finally(() => {
            button.disabled = false;
        });
    };
    
    // ==================== ИНИЦИАЛИЗАЦИЯ КНОПКИ ====================
    function initFavoriteButton() {
        const btn = document.getElementById('favoriteBtn');
        const container = document.querySelector('.anime-detail-container');
        
        if (btn && container) {
            const animeId = container.dataset.animeId;
            
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.onclick = function(e) {
                e.preventDefault();
                window.toggleFavorite(animeId, this);
                return false;
            };
        }
    }
    
    // ==================== ЗАПУСК ====================
    initFavoriteButton();
    window.updateFavoritesCount();
    
    console.log('Favorite system initialized!');
});

// ==================== ДЛЯ СТРАНИЦЫ ИЗБРАННОГО ====================
window.removeFromFavorites = function(animeId, btn) {
    if (!confirm('Удалить из избранного?')) return;
    
    fetch('/api/toggle-favorite/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': window.getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ anime_id: animeId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const card = btn.closest('.favorite-card');
            if (card) card.remove();
            window.showNotification(data.message, 'info');
            window.updateFavoritesCount();
            if (document.querySelectorAll('.favorite-card').length === 0) {
                location.reload();
            }
        } else {
            window.showNotification(data.error || 'Ошибка', 'error');
        }
    })
    .catch(() => window.showNotification('Ошибка подключения', 'error'));
};

// ==================== СТИЛИ ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .favorite-btn.active {
        background-color: #ff4757 !important;
        border-color: #ff4757 !important;
        color: white !important;
    }
`;
document.head.appendChild(style);