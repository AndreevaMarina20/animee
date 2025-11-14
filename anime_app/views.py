from django.shortcuts import render, get_object_or_404
from .models import Anime
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from django.shortcuts import render, redirect
from django.contrib.auth import logout

def home(request):
    latest_anime = Anime.objects.all()[:6]
    return render(request, 'main.html', {'animes': latest_anime})  # убрал 'anime_app/'

def catalog(request):
    all_anime = Anime.objects.all()
    return render(request, 'main.html', {'animes': all_anime})  # или создайте catalog.html

def anime_detail(request, anime_id):
    anime = get_object_or_404(Anime, id=anime_id)
    return render(request, 'anime_detail.html', {'anime': anime})  # убрал 'anime_app/'

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
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # Ищем пользователя по email (используем filter вместо get)
        users = User.objects.filter(email=email)
        
        if users.exists():
            # Проверяем пароль для каждого пользователя с таким email
            user = None
            for u in users:
                if u.check_password(password):
                    user = u
                    break
            
            if user is not None:
                login(request, user)
                return redirect('home')
            else:
                return render(request, 'login.html', {'error': 'Неверный пароль'})
        else:
            return render(request, 'login.html', {'error': 'Пользователь с таким email не найден'})
    
    return render(request, 'login.html')

def register_view(request):
    return render(request, 'register.html')

def register_view(request):
    if request.method == 'POST':
        # Получаем данные из формы
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        # Простая валидация
        if password1 == password2:
            try:
                # Создаем пользователя
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password1
                )
                # Автоматически логиним пользователя
                login(request, user)
                # Перенаправляем на главную
                return redirect('home')
            except:
                # Если пользователь уже существует
                return render(request, 'register.html', {'error': 'Пользователь с таким логином уже существует'})
        else:
            # Если пароли не совпадают
            return render(request, 'register.html', {'error': 'Пароли не совпадают'})
    
    return render(request, 'register.html')

def logout_view(request):
    logout(request)
    return redirect('home')