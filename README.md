# Chat en tiempo real - prueba tecnica

Aplicacion de chat con autenticacion, gestion de conversaciones y mensajeria en tiempo real via WebSockets.

## Stack

- Backend: Node.js + Express + Socket.io, JavaScript plano (CommonJS).
- Frontend: Next.js (App Router) + Tailwind CSS, JavaScript plano.
- Base de datos: PostgreSQL + Prisma ORM.
- Auth: JWT, verificado tanto en las rutas REST como en el handshake de los sockets.

Se eligio esta combinacion porque Next.js con App Router es requisito del enunciado y encaja bien con Context API para el estado global (auth y socket) sin anadir una libreria de estado externa; Prisma da migraciones versionadas y tipado de consultas sin escribir SQL a mano; y Socket.io resuelve reconexion automatica y salas (rooms) por chat, que es justo el mecanismo que se necesita para que cada usuario reciba solo los mensajes de sus propias conversaciones.

## Estructura

```
backend/    API REST + servidor de sockets
frontend/   Next.js App Router
docker-compose.yml
```

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+ (local o via Docker)
- Docker y Docker Compose (opcional, para levantar todo con un comando)

## Ejecucion local (sin Docker)

### 1. Base de datos

Crea una base de datos Postgres vacia, por ejemplo:

```bash
createdb chatdb
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edita .env si tu Postgres no usa las credenciales por defecto
npm install
npx prisma migrate dev
npm run dev
```

Variables de entorno (`backend/.env`):

- `DATABASE_URL` - cadena de conexion a Postgres
- `JWT_SECRET` - secreto para firmar los tokens
- `JWT_EXPIRES_IN` - vigencia del token (ej. `7d`)
- `PORT` - puerto del servidor (por defecto 4000)
- `CORS_ORIGIN` - origen permitido para CORS (la URL del frontend)

El backend queda escuchando en `http://localhost:4000`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Variables de entorno (`frontend/.env.local`):

- `NEXT_PUBLIC_API_URL` - URL del backend (ej. `http://localhost:4000`)
- `NEXT_PUBLIC_SOCKET_URL` - URL del servidor de sockets, normalmente la misma que la anterior

El frontend queda en `http://localhost:3000`.

## Ejecucion con Docker

Con Docker y Docker Compose instalados, desde la raiz del proyecto:

```bash
docker-compose up --build
```

Esto levanta Postgres, el backend (corre las migraciones al arrancar) y el frontend. La app queda disponible en `http://localhost:3000`.

Para pasar un `JWT_SECRET` propio en vez del valor por defecto:

```bash
JWT_SECRET=algo-largo-y-aleatorio docker-compose up --build
```

## Notas de implementacion

- El token JWT se guarda en `localStorage` en el cliente y se manda tanto en el header `Authorization` de las peticiones REST como en el `auth.token` del handshake de socket.io.
- El middleware de socket.io valida el JWT antes de aceptar la conexion; si no hay token o es invalido, se rechaza con `connect_error` y nunca llega a `connection`.
- Al conectar, el socket se une automaticamente a una sala por cada chat donde el usuario tiene una fila en `ChatParticipant`. El evento `message:send` vuelve a verificar esa pertenencia antes de persistir el mensaje y emitirlo, asi que un chatId arbitrario no sirve para colarse en una conversacion ajena.
- Si el socket esta caido al enviar un mensaje, el formulario cae a un POST REST normal para no bloquear al usuario.
- Al reconectar, se vuelve a pedir la lista de chats y los mensajes del chat abierto, por si se perdio algo mientras no habia conexion.
- Los controladores solo traducen HTTP <-> dominio; la logica vive en `backend/src/services` (authService, userService, chatService, messageService), que reciben el cliente de Prisma por parametro en vez de importarlo directo. El socket y las rutas REST llaman a los mismos servicios, asi que la verificacion de pertenencia a un chat esta en un solo lugar.
- Seguridad minima aplicada: helmet, rate limiting en `/api/auth/login` y `/api/auth/register` (20 intentos / 15 min por IP), CORS restringido al origen del frontend, passwords con bcrypt, validacion de formato y longitud en cada endpoint que recibe datos del usuario, y respuestas de error 500 genericas (el detalle solo se loguea en el servidor).
