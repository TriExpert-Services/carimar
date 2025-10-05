# Guía de Despliegue con Docker

Esta guía proporciona instrucciones detalladas para desplegar la aplicación de servicios de limpieza usando Docker.

## Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)
- Archivo `.env` configurado con las variables de Supabase

## Estructura de Archivos Docker

```
project/
├── Dockerfile              # Configuración de la imagen Docker
├── docker-compose.yml      # Orquestación de contenedores
├── nginx.conf             # Configuración del servidor Nginx
└── .dockerignore          # Archivos excluidos del build
```

## Configuración Inicial

### 1. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env` contenga las siguientes variables:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

**IMPORTANTE:** Las variables de entorno deben estar configuradas ANTES de construir la imagen Docker, ya que se incluyen durante el proceso de build.

### 2. Construir la Imagen

#### Opción A: Usando Docker Compose (Recomendado)

```bash
docker-compose build
```

#### Opción B: Usando Docker directamente

```bash
docker build -t cleaning-services-app:latest .
```

## Métodos de Despliegue

### Método 1: Docker Compose (Recomendado para desarrollo y staging)

#### Iniciar la aplicación

```bash
docker-compose up -d
```

#### Detener la aplicación

```bash
docker-compose down
```

#### Ver logs

```bash
docker-compose logs -f app
```

#### Reconstruir y reiniciar

```bash
docker-compose up -d --build
```

### Método 2: Docker Run (Para producción con más control)

#### Ejecutar el contenedor

```bash
docker run -d \
  --name cleaning-services-app \
  -p 80:80 \
  --restart unless-stopped \
  cleaning-services-app:latest
```

#### Detener el contenedor

```bash
docker stop cleaning-services-app
```

#### Eliminar el contenedor

```bash
docker rm cleaning-services-app
```

#### Ver logs

```bash
docker logs -f cleaning-services-app
```

### Método 3: Despliegue en Servidor con Puerto Personalizado

Si ya tienes un servicio en el puerto 80:

```bash
docker run -d \
  --name cleaning-services-app \
  -p 3000:80 \
  --restart unless-stopped \
  cleaning-services-app:latest
```

La aplicación estará disponible en `http://localhost:3000`

## Despliegue en Producción

### Opción A: Docker con Nginx Reverse Proxy

1. **Ejecutar la aplicación en un puerto interno:**

```bash
docker run -d \
  --name cleaning-services-app \
  -p 8080:80 \
  --restart unless-stopped \
  cleaning-services-app:latest
```

2. **Configurar Nginx en el host como reverse proxy:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Configurar SSL con Certbot:**

```bash
sudo certbot --nginx -d tu-dominio.com
```

### Opción B: Docker con Traefik (Recomendado para múltiples servicios)

Actualizar `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cleaning-services-app
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.cleaning-app.rule=Host(`tu-dominio.com`)"
      - "traefik.http.routers.cleaning-app.entrypoints=websecure"
      - "traefik.http.routers.cleaning-app.tls.certresolver=letsencrypt"
      - "traefik.http.services.cleaning-app.loadbalancer.server.port=80"
    restart: unless-stopped
    networks:
      - traefik-network

networks:
  traefik-network:
    external: true
```

### Opción C: Despliegue en Cloud Providers

#### AWS ECS (Elastic Container Service)

1. Subir imagen a ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin tu-cuenta.dkr.ecr.us-east-1.amazonaws.com
docker tag cleaning-services-app:latest tu-cuenta.dkr.ecr.us-east-1.amazonaws.com/cleaning-services-app:latest
docker push tu-cuenta.dkr.ecr.us-east-1.amazonaws.com/cleaning-services-app:latest
```

2. Crear tarea y servicio en ECS usando la consola AWS

#### Google Cloud Run

```bash
gcloud builds submit --tag gcr.io/tu-proyecto/cleaning-services-app
gcloud run deploy cleaning-services-app --image gcr.io/tu-proyecto/cleaning-services-app --platform managed --region us-central1 --allow-unauthenticated
```

#### Azure Container Instances

```bash
az acr build --registry tu-registro --image cleaning-services-app:latest .
az container create --resource-group tu-grupo --name cleaning-services-app --image tu-registro.azurecr.io/cleaning-services-app:latest --dns-name-label cleaning-app --ports 80
```

#### DigitalOcean App Platform

1. Conectar tu repositorio Git
2. Seleccionar "Dockerfile" como método de build
3. Configurar variables de entorno en el panel
4. Desplegar

## Optimización y Mejores Prácticas

### 1. Build Multi-stage

El Dockerfile ya usa multi-stage builds para reducir el tamaño de la imagen final.

### 2. Variables de Entorno en Producción

Para producción, es mejor pasar las variables durante el build:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=tu_url \
  --build-arg VITE_SUPABASE_ANON_KEY=tu_key \
  -t cleaning-services-app:latest .
```

Y actualizar el Dockerfile:

```dockerfile
# En la sección de build stage, agregar:
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
```

### 3. Health Checks

Agregar health check al docker-compose.yml:

```yaml
services:
  app:
    # ... otras configuraciones
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 4. Límites de Recursos

```yaml
services:
  app:
    # ... otras configuraciones
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Comandos Útiles

### Ver estado de contenedores
```bash
docker ps
```

### Ver logs en tiempo real
```bash
docker logs -f cleaning-services-app
```

### Ejecutar comando dentro del contenedor
```bash
docker exec -it cleaning-services-app sh
```

### Inspeccionar contenedor
```bash
docker inspect cleaning-services-app
```

### Ver uso de recursos
```bash
docker stats cleaning-services-app
```

### Limpiar imágenes no utilizadas
```bash
docker system prune -a
```

## Actualización de la Aplicación

### Proceso de actualización sin downtime

1. Construir nueva imagen con tag de versión:
```bash
docker build -t cleaning-services-app:v2.0.0 .
```

2. Iniciar nuevo contenedor en puerto diferente:
```bash
docker run -d --name cleaning-services-app-v2 -p 8081:80 cleaning-services-app:v2.0.0
```

3. Verificar que funciona correctamente:
```bash
curl http://localhost:8081/health
```

4. Actualizar configuración del reverse proxy para apuntar al nuevo puerto

5. Detener contenedor antiguo:
```bash
docker stop cleaning-services-app
docker rm cleaning-services-app
```

6. Renombrar nuevo contenedor:
```bash
docker rename cleaning-services-app-v2 cleaning-services-app
```

## Troubleshooting

### Problema: El contenedor no inicia

```bash
# Ver logs detallados
docker logs cleaning-services-app

# Verificar que el puerto no está en uso
netstat -tulpn | grep :80
```

### Problema: Error de conexión a Supabase

Verificar que las variables de entorno están correctamente configuradas:

```bash
docker exec cleaning-services-app env | grep VITE
```

### Problema: Imagen muy grande

```bash
# Ver tamaño de la imagen
docker images cleaning-services-app

# El multi-stage build ya debería optimizar el tamaño
# La imagen final solo contiene los archivos estáticos y nginx
```

### Problema: Cambios no se reflejan

Reconstruir sin caché:

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Monitoreo y Logs

### Configurar rotación de logs

Crear `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Reiniciar Docker:
```bash
sudo systemctl restart docker
```

## Seguridad

1. **No incluir secretos en la imagen:** Usar variables de entorno o secretos de Docker
2. **Mantener Nginx actualizado:** Reconstruir la imagen regularmente
3. **Ejecutar como usuario no-root:** Ya está configurado en la imagen de Nginx
4. **Escanear vulnerabilidades:**

```bash
docker scan cleaning-services-app:latest
```

## Respaldo y Recuperación

### Crear imagen de respaldo

```bash
docker save -o cleaning-services-app-backup.tar cleaning-services-app:latest
```

### Restaurar desde respaldo

```bash
docker load -i cleaning-services-app-backup.tar
```

## Soporte

Para problemas o preguntas sobre el despliegue, consultar:
- Documentación oficial de Docker: https://docs.docker.com
- Documentación de Nginx: https://nginx.org/en/docs/
- Documentación de Supabase: https://supabase.com/docs
