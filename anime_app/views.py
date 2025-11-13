from django.shortcuts import render, get_object_or_404
from .models import Anime

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