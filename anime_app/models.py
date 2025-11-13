from django.db import models


class studios(models.Model):
    name = models.CharField('Название студии')
    adress = models.CharField('Адрес студии', default="")

    def __str__(self):
         return f"{self.name}"

    class Meta:
        verbose_name = "Студии"
        verbose_name_plural = "Студии"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"])
        ]

class genres(models.Model):
    name = models.CharField('Название жанра', max_length=100)
    description = models.TextField("Описание жанра", default='Описание отсутствует')

    def __str__(self):
            return f"{self.name}"

    class Meta:
        verbose_name  = "Жанр"
        verbose_name_plural = "Жанры"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"])
        ]

class Anime(models.Model):

    STAT = [
        ("Вышло", "Завершён"),
        ("Релиз", "Релиз"),
        ("Выходит", "Выходит")
    ]
    name = models.CharField(verbose_name='Название аниме', max_length=100)
    old_name = models.CharField("Название на оригинале", max_length=255)
    description = models.TextField("Описание")
    status = models.CharField("Статус", choices=STAT, default=STAT[2])
    episode_duration = models.IntegerField("Длительность эпизода (в минутах)")
    quantity_of_episodes = models.IntegerField("Количество эпизодов")
    id_genres = models.ManyToManyField(genres)
    id_studios = models.ManyToManyField(studios)
    rating = models.FloatField("Рейтинг", default=0.0)
    poster = models.ImageField("Постер", upload_to='anime_posters/', blank=True, null=True)
    
    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name  = "Аниме"
        verbose_name_plural = "Аниме"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"])
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "description"],
                name = "unique_name_description"
            ),
        ]

class Users(models.Model):
    name = models.CharField('Имя пользователя')
    email = models.CharField('Почта', max_length=150)
    description = models.TextField("Описание профиля", max_length=300)
    last_login_time = models.DateTimeField("Время последнего входа")
    account_creation_date = models.DateField("Дата создания аккаунта")

    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"])
        ]
        
class playlists(models.Model):
    name = models.CharField('Название плейлиста')
    id_anime = models.ForeignKey(Anime, on_delete=models.CASCADE)
    id_user = models.ForeignKey(Users, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        verbose_name = "Плейлист"
        verbose_name_plural = "Плейлисты"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"])
        ]

class viewing_history(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    id_user = models.ForeignKey(Users, on_delete=models.CASCADE)
    id_episodes = models.ForeignKey('Episode', on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.id_user}"
    
    class Meta:
        verbose_name = "История просмотра"
        verbose_name_plural = "История просмотра"
        ordering = ["id_user"]
        indexes = [
            models.Index(fields=["id_user"])
        ]

class reviews(models.Model):
    id_user = models.ForeignKey(Users, on_delete=models.CASCADE)
    id_anime = models.ManyToManyField(Anime)
    estimation = models.IntegerField('Оценка')
    text = models.TextField("Текст отзыва")
    Release_date = models.DateField("Время создания")

    def __str__(self):
        return f"{self.id_user}"
    
    class Meta:
        verbose_name = "Отзывы"
        verbose_name_plural = "Отзывы"
        ordering = ["id_user"]
        indexes = [
            models.Index(fields=["id_user"])
        ]

class Episode(models.Model):
    anime = models.ForeignKey(Anime, on_delete=models.CASCADE, verbose_name="Аниме")
    season = models.IntegerField("Сезон", default=1)
    episode_number = models.IntegerField("Номер серии")
    title = models.CharField("Название серии", max_length=200)
    video_file = models.FileField("Видео файл", upload_to='episodes/', blank=True)

    class Meta:
        verbose_name = "Серия"
        verbose_name_plural = "Серии"
        ordering = ['season', 'episode_number']
    
    def __str__(self):
        return f"{self.anime.name} - Сезон {self.season} Серия {self.episode_number}"