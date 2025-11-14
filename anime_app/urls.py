from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('categories/', views.categories, name='categories'),
    path('anime/<int:anime_id>/', views.anime_detail, name='anime_detail'),
    path('anime/<int:anime_id>/watch/<int:episode_id>/', views.watch_episode, name='watch_episode'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
]