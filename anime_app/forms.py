from django import forms
from .models import reviews

class ReviewForm(forms.ModelForm):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]
    
    estimation = forms.ChoiceField(choices=RATING_CHOICES, widget=forms.HiddenInput(), initial=5)
    design_rating = forms.ChoiceField(choices=RATING_CHOICES, widget=forms.HiddenInput(), initial=5)
    usability_rating = forms.ChoiceField(choices=RATING_CHOICES, widget=forms.HiddenInput(), initial=5)
    content_rating = forms.ChoiceField(choices=RATING_CHOICES, widget=forms.HiddenInput(), initial=5)
    performance_rating = forms.ChoiceField(choices=RATING_CHOICES, widget=forms.HiddenInput(), initial=5)
    
    class Meta:
        model = reviews
        fields = ['design_rating', 'usability_rating', 'content_rating', 'performance_rating', 'estimation', 'text']
        widgets = {
            'text': forms.Textarea(attrs={
                'class': 'review-textarea',
                'placeholder': 'Напишите ваш отзыв о сайте...',
                'rows': 4,
                'required': True
            }),
        }