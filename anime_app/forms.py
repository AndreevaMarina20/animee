from django import forms
from .models import reviews

class ReviewForm(forms.ModelForm):
    # Поля для оценок с выбором от 1 до 5
    RATING_CHOICES = [
        (1, '1'),
        (2, '2'), 
        (3, '3'),
        (4, '4'),
        (5, '5'),
    ]
    
    estimation = forms.ChoiceField(
        choices=RATING_CHOICES,
        widget=forms.RadioSelect(),
        label='Общая оценка'
    )
    design_rating = forms.ChoiceField(
        choices=RATING_CHOICES,
        widget=forms.RadioSelect(),
        label='Дизайн сайта'
    )
    usability_rating = forms.ChoiceField(
        choices=RATING_CHOICES,
        widget=forms.RadioSelect(),
        label='Удобство использования'
    )
    content_rating = forms.ChoiceField(
        choices=RATING_CHOICES,
        widget=forms.RadioSelect(),
        label='Качество контента'
    )
    performance_rating = forms.ChoiceField(
        choices=RATING_CHOICES,
        widget=forms.RadioSelect(),
        label='Производительность'
    )
    
    class Meta:
        model = reviews
        fields = ['design_rating', 'usability_rating', 'content_rating', 'performance_rating', 'estimation', 'text']
        widgets = {
            'text': forms.Textarea(attrs={
                'class': 'review-textarea',
                'placeholder': 'Напишите ваш отзыв о сайте...',
                'rows': 4
            }),
        }
        labels = {
            'text': 'Текст отзыва',
        }