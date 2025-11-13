from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('catalog/', views.catalog, name='catalog'),
    path('anime/<int:anime_id>/', views.anime_detail, name='anime_detail'),
]