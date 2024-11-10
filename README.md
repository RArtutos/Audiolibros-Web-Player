# Audiolibros Web Player

Una aplicación web moderna para reproducir audiolibros con una interfaz elegante y funcional.

## Características

- 🎧 Reproductor de audio avanzado
- 📚 Gestión de capítulos
- 🎵 Control de velocidad de reproducción
- ⏰ Temporizador de sueño
- 🌙 Temas claro/oscuro/sepia
- 📱 Diseño responsive
- 🔍 Búsqueda y filtrado de audiolibros
- ❤️ Sistema de favoritos
- 📝 Marcadores
- 🔄 Sincronización del progreso de reproducción

## Tecnologías

- React 18
- TypeScript
- Tailwind CSS
- Vite
- FastAPI (Backend)
- Python 3.9
- Docker

## Estructura del Proyecto

```
├── src/
│   ├── components/        # Componentes React
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Páginas/Rutas
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilidades
│   └── config/           # Configuraciones
├── server/               # Backend FastAPI
├── public/               # Archivos estáticos
└── docker/              # Configuración Docker
```

## Características del Reproductor

- Control de reproducción (play/pause)
- Navegación por capítulos
- Control de volumen
- Ajuste de velocidad de reproducción (0.5x - 2x)
- Temporizador de sueño (15, 30, 45, 60 minutos)
- Barra de progreso interactiva
- Gestión de errores y reintentos
- Persistencia del estado de reproducción

## Temas Disponibles

- Light: Tema claro para uso diurno
- Dark: Tema oscuro para uso nocturno
- Darker: Tema negro puro para OLED
- Sepia: Tema cálido para lectura prolongada

## API Backend

El backend proporciona las siguientes funcionalidades:

- Listado de audiolibros con paginación
- Búsqueda por título, autor, narrador y género
- Detalles completos de audiolibros
- Gestión de metadatos y capítulos
- Streaming de audio optimizado

## Instalación y Uso

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Para el backend:
   ```bash
   cd server
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

## Docker

Para ejecutar con Docker:

```bash
docker-compose up -d
```

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT
