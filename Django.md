# Django E-Ticketing Backend Setup Guide

## Prerequisites

- Python 3.8+ installed
- pip package manager
- PostgreSQL (optional, can use SQLite for development)

## Step 1: Create Django Project

```bash
# Create project directory
mkdir eticketing_backend
cd eticketing_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Create Django project
django-admin startproject eticketing_backend .

# Create Django apps
python manage.py startapp users
python manage.py startapp events
python manage.py startapp orders
python manage.py startapp tickets
```

## Step 2: Install Dependencies

```bash
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install pillow
pip install qrcode[pil]
pip install django-cors-headers
pip install psycopg2-binary  # For PostgreSQL (optional)
```

## Step 3: Configure Settings

Update `eticketing_backend/settings.py`:

```python
import os
from datetime import timedelta

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'users',
    'events',
    'orders',
    'tickets',
]

# Add CORS middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Custom user model
AUTH_USER_MODEL = 'users.User'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# CORS settings (for development)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",  # Expo dev server
    "http://127.0.0.1:8081",
]

CORS_ALLOW_ALL_ORIGINS = True  # Only for development

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

## Step 4: Create Models

### users/models.py

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    phone = models.CharField(max_length=20, unique=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.email
```

### events/models.py

```python
from django.db import models
from users.models import User

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.URLField(max_length=500)  # Using URL for images
    location = models.CharField(max_length=200)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
```

### orders/models.py

```python
from django.db import models
from users.models import User
from events.models import Event
import uuid

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Confirmation'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ]

    order_id = models.CharField(max_length=20, unique=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_id} - {self.event.title}"
```

### tickets/models.py

```python
from django.db import models
from orders.models import Order
import qrcode
from io import BytesIO
from django.core.files import File
import uuid

class Ticket(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    ticket_id = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    qr_code = models.ImageField(upload_to='tickets/', blank=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.qr_code:
            qr_img = qrcode.make(str(self.ticket_id))
            buffer = BytesIO()
            qr_img.save(buffer, format='PNG')
            self.qr_code.save(f"{self.ticket_id}.png", File(buffer), save=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Ticket {self.ticket_id}"
```

## Step 5: Create Serializers

### users/serializers.py

```python
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'is_admin')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'phone')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data['phone']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
        else:
            raise serializers.ValidationError('Must include email and password.')

        return data
```

### events/serializers.py

```python
from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
```

### orders/serializers.py

```python
from rest_framework import serializers
from .models import Order
from events.serializers import EventSerializer

class OrderSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    event_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('order_id', 'user', 'total_amount')

    def create(self, validated_data):
        event_id = validated_data.pop('event_id')
        event = Event.objects.get(id=event_id)
        validated_data['event'] = event
        validated_data['total_amount'] = event.price * validated_data['quantity']
        return super().create(validated_data)
```

### tickets/serializers.py

```python
from rest_framework import serializers
from .models import Ticket

class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'
```

## Step 6: Create Views

### users/views.py

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### events/views.py

```python
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Event
from .serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
```

### orders/views.py

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer
from tickets.models import Ticket

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        order = self.get_object()
        if request.user.is_admin:
            order.status = 'approved'
            order.save()

            # Create tickets
            for i in range(order.quantity):
                Ticket.objects.create(order=order)

            return Response({'status': 'approved'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
```

### tickets/views.py

```python
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Ticket
from .serializers import TicketSerializer

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer

    def get_queryset(self):
        return Ticket.objects.filter(order__user=self.request.user)

@api_view(['POST'])
def validate_ticket(request):
    ticket_id = request.data.get('ticket_id')
    try:
        ticket = Ticket.objects.get(ticket_id=ticket_id)
        if ticket.is_used:
            return Response({'status': 'invalid', 'reason': 'Already used'}, status=400)
        ticket.is_used = True
        ticket.save()
        return Response({'status': 'valid'})
    except Ticket.DoesNotExist:
        return Response({'status': 'invalid'}, status=404)
```

## Step 7: Configure URLs

### eticketing_backend/urls.py

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view()),
    path('api/', include('events.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('tickets.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### users/urls.py

```python
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/', views.login),
]
```

### events/urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'events', views.EventViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### orders/urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'orders', views.OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]
```

### tickets/urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tickets', views.TicketViewSet, basename='ticket')

urlpatterns = [
    path('', include(router.urls)),
    path('tickets/validate/', views.validate_ticket),
]
```

## Step 8: Run Migrations and Start Server

```bash
# Create and apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## Step 9: Update Frontend API URL

In your React Native app, update the `BASE_URL` in `services/api.ts`:

```typescript
// For local development
const BASE_URL = "http://localhost:8000/api";

// For mobile device testing (replace with your computer's IP)
// const BASE_URL = 'http://192.168.1.100:8000/api';
```

## Step 10: Test the Connection

1. Start your Django server: `python manage.py runserver`
2. Start your React Native app
3. Try logging in with the credentials you created

## Additional Notes

- The frontend includes fallback to mock data when the API is not available
- For production, configure proper CORS settings and use HTTPS
- Consider using environment variables for sensitive settings
- Add proper error handling and validation
- Implement proper logging and monitoring

## Troubleshooting

1. **CORS Issues**: Make sure `django-cors-headers` is installed and configured
2. **Network Issues**: Use your computer's IP address instead of localhost for mobile testing
3. **Authentication Issues**: Check JWT token configuration and expiration times
4. **Database Issues**: Ensure migrations are applied and database is accessible

Your Django backend is now ready to work with the React Native frontend!
