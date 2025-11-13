from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(Anime)
admin.site.register(Episode)
admin.site.register(genres)
admin.site.register(studios)
admin.site.register(Users)
admin.site.register(playlists)
admin.site.register(viewing_history)
admin.site.register(reviews)