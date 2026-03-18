// main.js - Главный JavaScript файл со всей функциональностью

document.addEventListener('DOMContentLoaded', function() {
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ВСЕХ МОДУЛЕЙ ====================
    initFavorites();
    initStarRating();
    initReviewForm();
    initVideoPlayer();
    initSearch();
    initAnimations();
    initKeyboardShortcuts();
    updateFavoritesCount(); // Загружаем количество избранного
    highlightActiveNav(); // Подсвечиваем активную вкладку
    
    // ==================== СИСТЕМА УВЕДОМЛЕНИЙ ====================
    window.showNotification = function(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Стили для уведомлений
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            max-width: 350px;
            word-break: break-word;
            background: ${type === 'success' ? 'linear-gradient(135deg, #4caf50, #45a049)' : 
                         type === 'error' ? 'linear-gradient(135deg, #f44336, #d32f2f)' : 
                         'linear-gradient(135deg, #2196f3, #1976d2)'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    };
    
    // ==================== ИЗБРАННОЕ ====================
    function initFavorites() {
        const favoriteBtn = document.getElementById('favoriteBtn');
        const animeContainer = document.querySelector('.anime-detail-container');
        
        if (favoriteBtn && animeContainer) {
            const animeId = animeContainer.dataset.animeId;
            
            favoriteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleFavorite(animeId, this);
            });
        }
    }
    
    window.toggleFavorite = async function(animeId, button) {
        console.log('Toggling favorite for anime:', animeId);
        
        // Проверяем, авторизован ли пользователь
        const isAuthenticated = document.querySelector('.login-btn')?.textContent === 'Выйти';
        
        if (!isAuthenticated) {
            window.showNotification('Необходимо войти в систему', 'error');
            setTimeout(() => {
                window.location.href = '/login/';
            }, 1500);
            return;
        }
        
        const token = getCSRFToken();
        console.log('CSRF Token found:', token ? 'Yes' : 'No');
        
        try {
            const response = await fetch('/api/toggle-favorite/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ anime_id: animeId })
            });
            
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                if (data.action === 'added') {
                    button.classList.add('active');
                    button.innerHTML = '✓ В избранном';
                } else {
                    button.classList.remove('active');
                    button.innerHTML = '❤ Добавить в избранное';
                }
                window.showNotification(data.message, data.action === 'added' ? 'success' : 'info');
                updateFavoritesCount();
            } else {
                window.showNotification(data.error || 'Ошибка при добавлении', 'error');
            }
        } catch (error) {
            console.error('Detailed error:', error);
            window.showNotification('Ошибка при подключении к серверу: ' + error.message, 'error');
        }
    };
    
    window.updateFavoritesCount = async function() {
        try {
            const response = await fetch('/api/favorites-count/', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            
            if (data.success) {
                // Обновляем все счетчики на странице
                document.querySelectorAll('.favorites-count, #favoritesCount, #headerFavoritesCount').forEach(counter => {
                    counter.textContent = data.count;
                });
                
                // Прячем бейдж если 0
                const badge = document.getElementById('headerFavoritesCount');
                if (badge) {
                    if (data.count === 0) {
                        badge.style.display = 'none';
                    } else {
                        badge.style.display = 'flex';
                    }
                }
            }
        } catch (error) {
            console.error('Error updating favorites count:', error);
        }
    };
    
    // ==================== ЗВЕЗДНЫЙ РЕЙТИНГ ====================
    function initStarRating() {
        document.querySelectorAll('.star-rating').forEach(container => {
            const stars = container.querySelectorAll('.star');
            const fieldName = container.dataset.field;
            const hiddenInput = document.getElementById(fieldName);
            
            if (!hiddenInput) return;
            
            // Устанавливаем начальное значение
            setRating(container, hiddenInput.value || 5);
            
            stars.forEach(star => {
                star.addEventListener('mouseenter', () => {
                    highlightStars(container, star.dataset.value);
                });
                
                star.addEventListener('click', () => {
                    const value = star.dataset.value;
                    hiddenInput.value = value;
                    setRating(container, value);
                    
                    star.style.transform = 'scale(1.2)';
                    setTimeout(() => star.style.transform = 'scale(1)', 200);
                });
            });
            
            container.addEventListener('mouseleave', () => {
                setRating(container, hiddenInput.value);
            });
        });
    }
    
    function highlightStars(container, value) {
        container.querySelectorAll('.star').forEach(star => {
            if (parseInt(star.dataset.value) <= parseInt(value)) {
                star.classList.add('active');
                star.style.transform = 'scale(1.1)';
            } else {
                star.classList.remove('active');
                star.style.transform = 'scale(1)';
            }
        });
    }
    
    function setRating(container, value) {
        container.querySelectorAll('.star').forEach(star => {
            if (parseInt(star.dataset.value) <= parseInt(value)) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
            star.style.transform = 'scale(1)';
        });
    }
    
    // ==================== ФОРМА ОТЗЫВА ====================
    function initReviewForm() {
        const form = document.getElementById('reviewForm');
        if (!form) return;
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(this);
                
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': getCSRFToken()
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.showNotification(data.message, 'success');
                    this.reset();
                    
                    // Сброс рейтингов
                    document.querySelectorAll('.star-rating').forEach(container => {
                        const fieldName = container.dataset.field;
                        const hiddenInput = document.getElementById(fieldName);
                        if (hiddenInput) {
                            hiddenInput.value = '5';
                            setRating(container, 5);
                        }
                    });
                } else {
                    window.showNotification(data.error || 'Ошибка при отправке', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                window.showNotification('Ошибка при отправке', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // ==================== ВИДЕО ПЛЕЕР ====================
    function initVideoPlayer() {
        const video = document.querySelector('video');
        if (!video) return;
        
        const container = video.closest('.video-player');
        if (!container) return;
        
        // Создаем кастомные контролы
        const controls = createVideoControls(video);
        container.appendChild(controls);
        
        setupVideoEvents(video, controls);
        restoreVideoPosition(video);
        
        // Кнопка следующей серии
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                window.showNotification('Переход на следующую серию', 'info');
            });
        }
    }
    
    function createVideoControls(video) {
        const controls = document.createElement('div');
        controls.className = 'custom-video-controls';
        controls.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-filled"></div>
                </div>
            </div>
            <div class="controls-buttons">
                <button class="control-btn play-pause">⏸️</button>
                <span class="time-display">0:00 / 0:00</span>
                <div class="volume-container">
                    <button class="control-btn volume-btn">🔊</button>
                    <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
                </div>
                <button class="control-btn fullscreen-btn">⛶</button>
                <button class="control-btn settings-btn">⚙️</button>
            </div>
            <div class="speed-menu hidden">
                <div class="speed-option" data-speed="0.5">0.5x</div>
                <div class="speed-option" data-speed="0.75">0.75x</div>
                <div class="speed-option" data-speed="1">1x</div>
                <div class="speed-option" data-speed="1.25">1.25x</div>
                <div class="speed-option" data-speed="1.5">1.5x</div>
                <div class="speed-option" data-speed="2">2x</div>
            </div>
        `;
        return controls;
    }
    
    function setupVideoEvents(video, controls) {
        const playPauseBtn = controls.querySelector('.play-pause');
        const progressFilled = controls.querySelector('.progress-filled');
        const progressBar = controls.querySelector('.progress-bar');
        const timeDisplay = controls.querySelector('.time-display');
        const volumeSlider = controls.querySelector('.volume-slider');
        const volumeBtn = controls.querySelector('.volume-btn');
        const fullscreenBtn = controls.querySelector('.fullscreen-btn');
        const settingsBtn = controls.querySelector('.settings-btn');
        const speedMenu = controls.querySelector('.speed-menu');
        
        playPauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
                playPauseBtn.textContent = '⏸️';
            } else {
                video.pause();
                playPauseBtn.textContent = '▶️';
            }
        });
        
        video.addEventListener('timeupdate', () => {
            const percent = (video.currentTime / video.duration) * 100;
            progressFilled.style.width = `${percent}%`;
            timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
            saveVideoPosition(video);
        });
        
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });
        
        volumeSlider.addEventListener('input', (e) => {
            video.volume = e.target.value;
            volumeBtn.textContent = video.volume === 0 ? '🔇' : video.volume < 0.5 ? '🔈' : '🔊';
        });
        
        fullscreenBtn.addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                video.closest('.video-player').requestFullscreen();
            }
        });
        
        settingsBtn.addEventListener('click', () => {
            speedMenu.classList.toggle('hidden');
        });
        
        speedMenu.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', () => {
                video.playbackRate = parseFloat(option.dataset.speed);
                speedMenu.querySelectorAll('.speed-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                speedMenu.classList.add('hidden');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!settingsBtn.contains(e.target) && !speedMenu.contains(e.target)) {
                speedMenu.classList.add('hidden');
            }
        });
        
        // Клавиши быстрого доступа для видео
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    playPauseBtn.click();
                    break;
                case 'ArrowLeft':
                    video.currentTime -= 10;
                    break;
                case 'ArrowRight':
                    video.currentTime += 10;
                    break;
                case 'f':
                    fullscreenBtn.click();
                    break;
                case 'm':
                    volumeBtn.click();
                    break;
            }
        });
    }
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function saveVideoPosition(video) {
        const videoId = window.location.pathname;
        if (video.currentTime > 5) {
            localStorage.setItem(`video_${videoId}_time`, video.currentTime);
        }
    }
    
    function restoreVideoPosition(video) {
        const videoId = window.location.pathname;
        const savedTime = localStorage.getItem(`video_${videoId}_time`);
        if (savedTime && savedTime > 5) {
            video.currentTime = parseFloat(savedTime);
            window.showNotification('Продолжаем с ' + formatTime(savedTime), 'info');
        }
    }
    
    // ==================== ПОИСК ====================
    function initSearch() {
        const searchInput = document.querySelector('.search-input');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', debounce(function(e) {
            performSearch(e.target.value);
        }, 300));
        
        // Добавляем иконку поиска
        const container = searchInput.parentElement;
        container.style.position = 'relative';
        
        const icon = document.createElement('span');
        icon.innerHTML = '🔍';
        icon.style.cssText = `
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
            pointer-events: none;
            z-index: 1;
        `;
        
        searchInput.style.paddingLeft = '35px';
        container.appendChild(icon);
    }
    
    function performSearch(query) {
        const animeCards = document.querySelectorAll('.anime-card');
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            animeCards.forEach(card => {
                card.style.display = 'flex';
                card.style.opacity = '1';
            });
            removeNoResultsMessage();
            return;
        }
        
        let hasResults = false;
        
        animeCards.forEach(card => {
            const title = card.querySelector('.anime-name')?.textContent.toLowerCase() || '';
            const original = card.querySelector('.anime-original')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.anime-description')?.textContent.toLowerCase() || '';
            
            if (title.includes(searchTerm) || original.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
                card.style.opacity = '1';
                hasResults = true;
            } else {
                card.style.display = 'none';
            }
        });
        
        if (!hasResults) {
            showNoResultsMessage();
        } else {
            removeNoResultsMessage();
        }
    }
    
    function showNoResultsMessage() {
        let msg = document.querySelector('.no-search-results');
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'no-search-results';
            msg.innerHTML = '<p>Ничего не найдено</p><span>Попробуйте изменить запрос</span>';
            msg.style.cssText = `
                text-align: center;
                padding: 50px;
                color: #b3b3b3;
                background: #1a1a1a;
                border-radius: 12px;
                margin-top: 20px;
                width: 100%;
            `;
            document.querySelector('.anime-list')?.appendChild(msg);
        }
    }
    
    function removeNoResultsMessage() {
        document.querySelector('.no-search-results')?.remove();
    }
    
    // ==================== АНИМАЦИИ ====================
    function initAnimations() {
        // Анимация появления карточек
        const cards = document.querySelectorAll('.anime-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // Анимация кнопок
        document.querySelectorAll('.watch-btn, .favorite-btn, .category-btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
        
        // Анимация для карточек в избранном
        const favoriteCards = document.querySelectorAll('.favorite-card');
        favoriteCards.forEach((card, index) => {
            card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
        });
    }
    
    // ==================== ПОДСВЕТКА АКТИВНОЙ ВКЛАДКИ ====================
    function highlightActiveNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPath || 
                (currentPath === '/' && href === '/') ||
                (href !== '/' && currentPath.startsWith(href) && href !== '/')) {
                link.classList.add('active');
            }
        });
    }
    
    // ==================== ГОРЯЧИЕ КЛАВИШИ ====================
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case '/':
                    e.preventDefault();
                    document.querySelector('.search-input')?.focus();
                    break;
                case 'escape':
                    const search = document.querySelector('.search-input');
                    if (search && search.value) {
                        search.value = '';
                        search.dispatchEvent(new Event('input'));
                    }
                    break;
                case 'h':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        window.location.href = '/';
                    }
                    break;
                case 'f':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        const favLink = document.querySelector('a[href="/favorites/"]');
                        if (favLink) window.location.href = favLink.href;
                    }
                    break;
            }
        });
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
    window.getCSRFToken = function() {
        // Ищем токен в разных местах
        let token = null;
        
        // 1. В мета-теге
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            token = metaToken.getAttribute('content');
        }
        
        // 2. В куках
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
        
        // 3. В скрытом инпуте
        if (!token) {
            const input = document.querySelector('[name=csrfmiddlewaretoken]');
            if (input) {
                token = input.value;
            }
        }
        
        return token || '';
    };
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // ==================== ДОБАВЛЯЕМ СТИЛИ ====================
    function addStyles() {
        if (document.querySelector('#main-js-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'main-js-styles';
        style.textContent = `
            /* Звездный рейтинг */
            .star-rating {
                display: flex;
                gap: 8px;
                font-size: 28px;
                cursor: pointer;
            }
            .star {
                color: #444;
                transition: all 0.2s ease;
            }
            .star.active {
                color: #FFD700;
                text-shadow: 0 0 15px rgba(255,215,0,0.5);
            }
            .rating-category {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 0;
                border-bottom: 1px solid #2a2a2a;
            }
            
            /* Видео плеер */
            .custom-video-controls {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.9));
                padding: 20px;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            }
            .video-player:hover .custom-video-controls {
                opacity: 1;
                pointer-events: auto;
            }
            .progress-bar {
                height: 5px;
                background: rgba(255,255,255,0.3);
                border-radius: 5px;
                cursor: pointer;
                margin-bottom: 15px;
            }
            .progress-filled {
                height: 100%;
                background: #7c4dff;
                border-radius: 5px;
                width: 0%;
            }
            .controls-buttons {
                display: flex;
                align-items: center;
                gap: 15px;
                color: white;
            }
            .control-btn {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 5px;
                transition: transform 0.2s;
            }
            .control-btn:hover {
                transform: scale(1.2);
            }
            .volume-slider {
                width: 80px;
                height: 5px;
                border-radius: 5px;
                background: rgba(255,255,255,0.3);
                outline: none;
            }
            .volume-slider::-webkit-slider-thumb {
                width: 12px;
                height: 12px;
                background: #7c4dff;
                border-radius: 50%;
                cursor: pointer;
            }
            .speed-menu {
                position: absolute;
                bottom: 80px;
                right: 20px;
                background: #1a1a1a;
                border: 1px solid #2a2a2a;
                border-radius: 8px;
                padding: 5px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.5);
                z-index: 100;
            }
            .speed-menu.hidden {
                display: none;
            }
            .speed-option {
                padding: 8px 20px;
                cursor: pointer;
                color: #f5f5f5;
                transition: all 0.2s;
                border-radius: 4px;
            }
            .speed-option:hover {
                background: #7c4dff;
            }
            .speed-option.active {
                background: #7c4dff;
            }
            
            /* Избранное */
            .favorite-btn.active {
                background-color: #ff4757 !important;
                border-color: #ff4757 !important;
                color: white !important;
            }
            
            /* Активная вкладка */
            nav a.active {
                color: #7c4dff;
                position: relative;
            }
            nav a.active::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 100%;
                height: 2px;
                background: #7c4dff;
                animation: slideIn 0.3s ease;
            }
            
            /* Анимации */
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes slideIn {
                from { transform: scaleX(0); }
                to { transform: scaleX(1); }
            }
            
            /* Светлая тема */
            body.light-theme .rating-category {
                border-bottom-color: #e0e0e0;
            }
            body.light-theme .speed-menu {
                background: #ffffff;
                border-color: #e0e0e0;
            }
            body.light-theme .speed-option {
                color: #1a1a1a;
            }
        `;
        document.head.appendChild(style);
    }
    
    addStyles();
});

// Глобальная функция для удаления из избранного (для страницы избранного)
window.removeFromFavorites = function(animeId, button) {
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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const card = button.closest('.favorite-card');
            if (card) {
                card.style.transform = 'scale(0.8)';
                card.style.opacity = '0';
                
                setTimeout(() => {
                    card.remove();
                    
                    const remainingCards = document.querySelectorAll('.favorite-card');
                    if (remainingCards.length === 0) {
                        location.reload();
                    } else {
                        window.updateFavoritesCount();
                    }
                }, 300);
            }
            
            window.showNotification(data.message, 'info');
        } else {
            window.showNotification(data.error || 'Ошибка при удалении', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        window.showNotification('Ошибка при подключении к серверу', 'error');
    });
};