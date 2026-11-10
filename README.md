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

## Arquitectura

### Modelo de datos

El schema completo esta en `backend/prisma/schema.prisma`. Las migraciones (el historial versionado que genera esos cambios en Postgres) estan en `backend/prisma/migrations/`, una carpeta por migracion (`20261110131709_init` crea las tablas base, `20261110140354_add_attachments` agrega los adjuntos).

| Tabla | Que representa | Relacion |
|---|---|---|
| `User` | Una cuenta registrada | - |
| `Chat` | Una conversacion (1 a 1 o grupal, segun `isGroup`) | - |
| `ChatParticipant` | Que usuario pertenece a que chat | tabla puente, resuelve el muchos-a-muchos entre `User` y `Chat` |
| `Message` | Un mensaje dentro de un chat | pertenece a un `Chat` y a un `User` (el remitente) |
| `Attachment` | El archivo adjunto de un mensaje, si tiene | uno a uno opcional con `Message` |

### Rutas del backend

Todas bajo `/api`, montadas en `backend/src/app.js`. Las de `/api/chats` exigen estar autenticado (`requireAuth` aplicado a todo ese router).

| Metodo | Ruta | Que hace |
|---|---|---|
| POST | `/api/auth/register` | Crea un usuario y devuelve su token |
| POST | `/api/auth/login` | Valida credenciales y devuelve un token |
| GET | `/api/auth/me` | Datos del usuario autenticado |
| GET | `/api/users` | Lista los usuarios registrados, para elegir con quien chatear |
| GET | `/api/chats` | Lista los chats del usuario autenticado |
| POST | `/api/chats` | Crea un chat (o grupo, si hay mas de un participante) |
| GET | `/api/chats/:chatId` | Trae un chat puntual (verifica pertenencia) |
| DELETE | `/api/chats/:chatId` | Elimina un chat (participantes y mensajes en cascada) |
| PATCH | `/api/chats/:chatId` | Cambia el nombre de un grupo |
| GET | `/api/chats/:chatId/messages` | Historial de mensajes de un chat |
| POST | `/api/chats/:chatId/messages` | Manda un mensaje de texto |
| POST | `/api/chats/:chatId/messages/attachment` | Manda un mensaje con un archivo adjunto |
| GET | `/api/chats/:chatId/messages/:messageId/attachment` | Descarga el adjunto de un mensaje (verifica pertenencia al chat) |

Ademas de las rutas REST, el servidor de sockets (`backend/src/sockets/index.js`) maneja los eventos en tiempo real (`message:send`, `chat:join`) sobre la misma conexion que `server.js` levanta.

## Notas de implementacion

- El token JWT se guarda en `localStorage` en el cliente y se manda tanto en el header `Authorization` de las peticiones REST como en el `auth.token` del handshake de socket.io.
- El middleware de socket.io valida el JWT antes de aceptar la conexion; si no hay token o es invalido, se rechaza con `connect_error` y nunca llega a `connection`.
- Al conectar, el socket se une automaticamente a una sala por cada chat donde el usuario tiene una fila en `ChatParticipant`. El evento `message:send` vuelve a verificar esa pertenencia antes de persistir el mensaje y emitirlo, asi que un chatId arbitrario no sirve para colarse en una conversacion ajena.
- Si el socket esta caido al enviar un mensaje, el formulario cae a un POST REST normal para no bloquear al usuario.
- Al reconectar, se vuelve a pedir la lista de chats y los mensajes del chat abierto, por si se perdio algo mientras no habia conexion.
- Los controladores solo traducen HTTP <-> dominio; la logica vive en `backend/src/services` (authService, userService, chatService, messageService), que reciben el cliente de Prisma por parametro en vez de importarlo directo. El socket y las rutas REST llaman a los mismos servicios, asi que la verificacion de pertenencia a un chat esta en un solo lugar.
- Seguridad minima aplicada: helmet, rate limiting en `/api/auth/login` y `/api/auth/register` (20 intentos / 15 min por IP), CORS restringido al origen del frontend, passwords con bcrypt, validacion de formato y longitud en cada endpoint que recibe datos del usuario, y respuestas de error 500 genericas (el detalle solo se loguea en el servidor).
## Capturas de pantalla

<img width="516" height="542" alt="image" src="https://github.com/user-attachments/assets/a63e0901-8964-4ac7-a93c-1e5cbb838299" />

**1. Login**

<img width="466" height="613" alt="image" src="https://github.com/user-attachments/assets/ac1a9b72-1321-4453-8dd9-54df2ab6915a" />

**2. Registro**

<img width="1717" height="1266" alt="image" src="https://github.com/user-attachments/assets/054222c7-e038-4472-8d6a-fd66a2e0b63f" />

**3. Interfaz principal**

<img width="350" height="206" alt="image" src="https://github.com/user-attachments/assets/f63b8483-45ac-4a0f-b91d-1ab64fa1b08f" />

**4. Crear nuevo chat**

<img width="521" height="332" alt="image" src="https://github.com/user-attachments/assets/b4b373b8-bb7f-42c8-8c85-906d6f3f7d94" />

**5. Seleccionar con quien vas a hablar**

<img width="548" height="440" alt="image" src="https://github.com/user-attachments/assets/b34b7838-dbc2-45df-8f83-50d9a8804d43" />

**6. Si escoges mas de una persona, aparece la opcion de crear un grupo**

<img width="371" height="124" alt="image" src="https://github.com/user-attachments/assets/bb60750f-0464-49e7-866a-f9ca4c6c1bad" />

**7. Chat individual**

<img width="353" height="131" alt="image" src="https://github.com/user-attachments/assets/79a9e058-0559-4000-9468-ecc10ba9aa12" />

**8. Chat grupal**

<img width="361" height="250" alt="image" src="https://github.com/user-attachments/assets/384874eb-3dc4-4d17-8062-6c3f2f4ecfef" />

**9. El nombre de un grupo se puede editar (solo aplica a grupos, no a chats 1 a 1)**

<img width="490" height="337" alt="image" src="https://github.com/user-attachments/assets/ac68dfec-18b6-456d-b073-3ff480d36322" />

**10. Perfil de la persona con quien hablas**

<img width="1369" height="1277" alt="image" src="https://github.com/user-attachments/assets/bf15bcb0-8bed-4092-8a66-04b843f2c1a9" />

**11. Bandeja de chats**

<img width="2554" height="1252" alt="image" src="https://github.com/user-attachments/assets/5e599db4-d12a-4027-9b24-fa014c96844a" />

**12. Simulacion de dos usuarios chateando en tiempo real**
