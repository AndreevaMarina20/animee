from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import *
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import ReviewForm
from django.utils import timezone
from django.views.decorators.http import require_POST
import json
import logging

logger = logging.getLogger(__name__)

def home(request):
    latest_anime = Anime.objects.all()[:6]
    return render(request, 'main.html', {'animes': latest_anime})

def anime_detail(request, anime_id):
    anime = get_object_or_404(Anime, id=anime_id)
    
    is_favorite = False
    if request.user.is_authenticated:
        try:
            user_profile = Users.objects.get(name=request.user.username)
            is_favorite = Favorite.objects.filter(id_user=user_profile, id_anime=anime).exists()
        except Users.DoesNotExist:
            pass
    
    return render(request, 'anime_detail.html', {
        'anime': anime,
        'is_favorite': is_favorite
    })

def watch_episode(request, anime_id, episode_id):
    anime = get_object_or_404(Anime, id=anime_id)
    episode = get_object_or_404(Episode, id=episode_id, anime=anime)
    episodes = Episode.objects.filter(anime=anime).order_by('season', 'episode_number')
    
    context = {
        'anime': anime,
        'episode': episode,
        'episodes': episodes,
    }
    return render(request, 'anime_app/watch_episode.html', context)

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, f'Добро пожаловать, {username}!')
            return redirect('home')
        else:
            messages.error(request, 'Неверный логин или пароль')
    
    return render(request, 'login.html')

def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        # Проверка длины логина
        if len(username) < 3:
            messages.error(request, 'Логин должен содержать минимум 3 символа')
            return render(request, 'register.html')
        
        # Проверка пароля
        if len(password1) < 8:
            messages.error(request, 'Пароль должен содержать минимум 8 символов')
            return render(request, 'register.html')
        
        if password1 == password2:
            try:
                # Проверяем, существует ли пользователь
                if User.objects.filter(username=username).exists():
                    messages.error(request, 'Пользователь с таким логином уже существует')
                    return render(request, 'register.html')
                
                if User.objects.filter(email=email).exists():
                    messages.error(request, 'Пользователь с таким email уже существует')
                    return render(request, 'register.html')
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password1
                )
                login(request, user)
                
                # Создаем профиль пользователя в модели Users
                Users.objects.create(
                    name=username,
                    email=email,
                    description='Пользователь сайта',
                    last_login_time=timezone.now(),
                    account_creation_date=timezone.now().date()
                )
                
                messages.success(request, f'Регистрация прошла успешно! Добро пожаловать, {username}!')
                return redirect('home')
            except Exception as e:
                messages.error(request, f'Ошибка при регистрации: {str(e)}')
                return render(request, 'register.html')
        else:
            messages.error(request, 'Пароли не совпадают')
            return render(request, 'register.html')
    
    return render(request, 'register.html')

def logout_view(request):
    logout(request)
    messages.info(request, 'Вы вышли из аккаунта')
    return redirect('home')

def categories(request):
    category_type = request.GET.get('category', 'сериалы')
    
    if category_type == 'фильмы':
        animes = Anime.objects.filter(category='Фильм')
    else:
        animes = Anime.objects.filter(category='Сериал')
    
    context = {
        'animes': animes,
        'current_category': category_type,
    }
    return render(request, 'categories.html', context)

@login_required
def profile(request):
    user = request.user
    
    try:
        user_profile = Users.objects.get(name=user.username)
    except Users.DoesNotExist:
        user_profile = Users.objects.create(
            name=user.username,
            email=user.email,
            description='Пользователь сайта',
            last_login_time=timezone.now(),
            account_creation_date=timezone.now().date()
        )
    
    # Только количество избранного, без списка
    favorites_count = Favorite.objects.filter(id_user=user_profile).count()
    
    if request.method == 'POST':
        form = ReviewForm(request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            review.id_user = user_profile
            review.Release_date = timezone.now().date()
            
            review.estimation = int(request.POST.get('estimation', 5))
            review.design_rating = int(request.POST.get('design_rating', 5))
            review.usability_rating = int(request.POST.get('usability_rating', 5))
            review.content_rating = int(request.POST.get('content_rating', 5))
            review.performance_rating = int(request.POST.get('performance_rating', 5))
            
            review.save()
            
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Спасибо за ваш отзыв!'
                })
            
            messages.success(request, 'Спасибо за ваш отзыв!')
            return redirect('profile')
    else:
        form = ReviewForm()
    
    context = {
        'user': user,
        'user_profile': user_profile,
        'form': form,
        'favorites_count': favorites_count,  # Только число, без списка аниме
    }
    return render(request, 'profile.html', context)

@login_required
def favorites_view(request):
    """Страница с избранным пользователя"""
    try:
        user_profile = Users.objects.get(name=request.user.username)
    except Users.DoesNotExist:
        user_profile = Users.objects.create(
            name=request.user.username,
            email=request.user.email,
            description='Пользователь сайта',
            last_login_time=timezone.now(),
            account_creation_date=timezone.now().date()
        )
    
    # Получаем все избранное пользователя для отдельной страницы
    favorites = Favorite.objects.filter(id_user=user_profile).select_related('id_anime').order_by('-created_at')
    
    context = {
        'favorites': favorites,
        'favorites_count': favorites.count(),
    }
    return render(request, 'favorites.html', context)

@login_required
@require_POST
def toggle_favorite(request):
    """API для добавления/удаления из избранного"""
    try:
        data = json.loads(request.body)
        anime_id = data.get('anime_id')
        
        logger.info(f"Toggle favorite - User: {request.user.username}, Anime ID: {anime_id}")
        
        if not anime_id:
            return JsonResponse({'success': False, 'error': 'Не указан ID аниме'}, status=400)
        
        # Получаем аниме
        try:
            anime = Anime.objects.get(id=anime_id)
        except Anime.DoesNotExist:
            logger.error(f"Anime with ID {anime_id} not found")
            return JsonResponse({'success': False, 'error': 'Аниме не найдено'}, status=404)
        
        # Получаем профиль пользователя
        try:
            user_profile = Users.objects.get(name=request.user.username)
        except Users.DoesNotExist:
            # Создаем профиль, если не существует
            logger.info(f"Creating user profile for {request.user.username}")
            user_profile = Users.objects.create(
                name=request.user.username,
                email=request.user.email,
                description='Пользователь сайта',
                last_login_time=timezone.now(),
                account_creation_date=timezone.now().date()
            )
        
        # Проверяем, есть ли уже в избранном
        favorite = Favorite.objects.filter(id_user=user_profile, id_anime=anime).first()
        
        if favorite:
            # Удаляем из избранного
            favorite.delete()
            logger.info(f"Removed from favorites: {anime.name}")
            return JsonResponse({
                'success': True,
                'action': 'removed',
                'message': f'"{anime.name}" удалено из избранного'
            })
        else:
            # Добавляем в избранное
            favorite = Favorite.objects.create(
                id_user=user_profile,
                id_anime=anime
            )
            logger.info(f"Added to favorites: {anime.name}")
            return JsonResponse({
                'success': True,
                'action': 'added',
                'message': f'"{anime.name}" добавлено в избранное'
            })
            
    except Exception as e:
        logger.error(f"Error in toggle_favorite: {str(e)}", exc_info=True)
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@login_required
def get_favorites_count(request):
    """API для получения количества избранного"""
    try:
        user_profile = Users.objects.get(name=request.user.username)
        count = Favorite.objects.filter(id_user=user_profile).count()
        logger.info(f"Favorites count for {request.user.username}: {count}")
        return JsonResponse({'success': True, 'count': count})
    except Users.DoesNotExist:
        return JsonResponse({'success': False, 'count': 0})