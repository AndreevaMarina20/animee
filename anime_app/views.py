from django.shortcuts import render, get_object_or_404
from .models import *
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import ReviewForm
from django.utils import timezone

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
        username = request.POST.get('username')  # меняем на username
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            return render(request, 'login.html', {'error': 'Неверный логин или пароль'})
    
    return render(request, 'login.html')

def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        if password1 == password2:
            try:
                user = User.objects.create_user(
                    username=username,  # используем username
                    email=email,
                    password=password1
                )
                login(request, user)
                return redirect('home')
            except:
                return render(request, 'register.html', {'error': 'Пользователь с таким логином уже существует'})
        else:
            return render(request, 'register.html', {'error': 'Пароли не совпадают'})
    
    return render(request, 'register.html')

def logout_view(request):
    logout(request)
    return redirect('home')

def categories(request):
    category_type = request.GET.get('category', 'сериалы')  # по умолчанию сериалы
    
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
    context = {
        'user': user,
    }
    return render(request, 'profile.html', context)

@login_required
def profile(request):
    user = request.user
    success_message = None
    
    if request.method == 'POST':
        form = ReviewForm(request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            user_profile, created = Users.objects.get_or_create(
                name=user.username,
                defaults={
                    'email': user.email,
                    'description': 'Пользователь сайта',
                    'last_login_time': timezone.now(),
                    'account_creation_date': timezone.now().date()
                }
            )
            review.id_user = user_profile
            review.Release_date = timezone.now().date()
            
            review.estimation = int(form.cleaned_data['estimation'])
            review.design_rating = int(form.cleaned_data['design_rating'])
            review.usability_rating = int(form.cleaned_data['usability_rating'])
            review.content_rating = int(form.cleaned_data['content_rating'])
            review.performance_rating = int(form.cleaned_data['performance_rating'])
            
            review.save()
            success_message = "Спасибо за ваш отзыв! Он был успешно отправлен."
            form = ReviewForm()
    else:
        form = ReviewForm()
    
    context = {
        'user': user,
        'form': form,
        'success_message': success_message,
    }
    return render(request, 'profile.html', context)