const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// Секреты для JWT
const ACCESS_SECRET = "access_secret_key_123";
const REFRESH_SECRET = "refresh_secret_key_456";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// настройка CORS
app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ← ДОБАВЬТЕ OPTIONS
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Хранилища данных
let users = [];
let refreshTokens = new Set();

// Начальные товары
let products = [
 { id: nanoid(6), name: 'Ноутбук', price: 50000, category: 'Электроника', description: 'Мощный ноутбук', stock: 10 },
 { id: nanoid(6), name: 'Мышь', price: 1500, category: 'Аксессуары', description: 'Беспроводная', stock: 50 },
 { id: nanoid(6), name: 'Клавиатура', price: 3000, category: 'Аксессуары', description: 'Механическая', stock: 30 },
 { id: nanoid(6), name: 'Монитор', price: 15000, category: 'Электроника', description: '27 дюймов', stock: 15 },
 { id: nanoid(6), name: 'Наушники', price: 5000, category: 'Аудио', description: 'Шумоподавление', stock: 40 }
];

// Функции хеширования пароля
async function hashPassword(password) {
 const rounds = 10;
 return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
 return bcrypt.compare(password, passwordHash);
}

// Генерация токенов
function generateAccessToken(user) {
 return jwt.sign(
   { sub: user.id, email: user.email, role: user.role },
   ACCESS_SECRET,
   { expiresIn: ACCESS_EXPIRES_IN }
 );
}

function generateRefreshToken(user) {
 return jwt.sign(
   { sub: user.id, email: user.email, role: user.role },
   REFRESH_SECRET,
   { expiresIn: REFRESH_EXPIRES_IN }
 );
}

// Middleware для проверки аутентификации
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  
  // Ожидаем формат: "Bearer <token>"
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  
  const token = header.slice(7); // убираем "Bearer "
  
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Middleware для проверки ролей
function roleMiddleware(allowedRoles) {
 return (req, res, next) => {
   if (!req.user || !allowedRoles.includes(req.user.role)) {
     return res.status(403).json({ error: "Forbidden" });
   }
   next();
 };
}

// настройка swagger
const swaggerOptions = {
 definition: {
   openapi: '3.0.0',
   info: {
     title: 'API Интернет-магазина',
     version: '1.0.0',
     description: 'API с аутентификацией и RBAC'
   },
   servers: [{ url: `http://localhost:${port}` }]
 },
 apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== AUTH ROUTES ====================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               first_name: { type: string, example: "Иван" }
 *               last_name: { type: string, example: "Иванов" }
 *               password: { type: string, example: "password123" }
 *               role: { type: string, example: "user", enum: [user, seller, admin] }
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Пользователь уже существует
 */
app.post("/api/auth/register", async (req, res) => {
 const { email, first_name, last_name, password, role } = req.body;

 if (!email || !password || !first_name || !last_name) {
   return res.status(400).json({ error: "email, password, first_name and last_name are required" });
 }

 const exists = users.some(u => u.email === email);
 if (exists) {
   return res.status(409).json({ error: "User already exists" });
 }

 const hashedPassword = await hashPassword(password);
 const newUser = {
   id: nanoid(6),
   email,
   first_name,
   last_name,
   hashedPassword,
   role: role || "user"
 };

 users.push(newUser);

 res.status(201).json({
   id: newUser.id,
   email: newUser.email,
   first_name: newUser.first_name,
   last_name: newUser.last_name,
   role: newUser.role
 });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *       401:
 *         description: Неверные учетные данные
 */
app.post("/api/auth/login", async (req, res) => {
 const { email, password } = req.body;

 if (!email || !password) {
   return res.status(400).json({ error: "email and password are required" });
 }

 const user = users.find(u => u.email === email);
 if (!user) {
   return res.status(401).json({ error: "Invalid credentials" });
 }

 const isValid = await verifyPassword(password, user.hashedPassword);
 if (!isValid) {
   return res.status(401).json({ error: "Invalid credentials" });
 }

 const accessToken = generateAccessToken(user);
 const refreshToken = generateRefreshToken(user);

 refreshTokens.add(refreshToken);

 res.json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Токены обновлены
 *       401:
 *         description: Неверный refresh токен
 */
app.post("/api/auth/refresh", (req, res) => {
 const { refreshToken } = req.body;

 if (!refreshToken) {
   return res.status(400).json({ error: "refreshToken is required" });
 }

 if (!refreshTokens.has(refreshToken)) {
   return res.status(401).json({ error: "Invalid refresh token" });
 }

 try {
   const payload = jwt.verify(refreshToken, REFRESH_SECRET);
   const user = users.find(u => u.id === payload.sub);
   
   if (!user) {
     return res.status(401).json({ error: "User not found" });
   }

   // Ротация токенов
   refreshTokens.delete(refreshToken);

   const newAccessToken = generateAccessToken(user);
   const newRefreshToken = generateRefreshToken(user);

   refreshTokens.add(newRefreshToken);

   res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
 } catch (err) {
   return res.status(401).json({ error: "Invalid or expired refresh token" });
 }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *       401:
 *         description: Не авторизован
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
 const user = users.find(u => u.id === req.user.sub);
 
 if (!user) {
   return res.status(404).json({ error: "User not found" });
 }

 res.json({
   id: user.id,
   email: user.email,
   first_name: user.first_name,
   last_name: user.last_name,
   role: user.role
 });
});

// ==================== USERS ROUTES (Admin only) ====================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       403:
 *         description: Доступ запрещен
 */
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
 const usersWithoutPassword = users.map(u => ({
   id: u.id,
   email: u.email,
   first_name: u.first_name,
   last_name: u.last_name,
   role: u.role
 }));
 res.json(usersWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *       404:
 *         description: Пользователь не найден
 */
app.get("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
 const user = users.find(u => u.id === req.params.id);
 
 if (!user) {
   return res.status(404).json({ error: "User not found" });
 }

 res.json({
   id: user.id,
   email: user.email,
   first_name: user.first_name,
   last_name: user.last_name,
   role: user.role
 });
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role: { type: string }
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 */
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
 const user = users.find(u => u.id === req.params.id);
 
 if (!user) {
   return res.status(404).json({ error: "User not found" });
 }

 if (req.body.first_name) user.first_name = req.body.first_name;
 if (req.body.last_name) user.last_name = req.body.last_name;
 if (req.body.role) user.role = req.body.role;

 res.json({
   id: user.id,
   email: user.email,
   first_name: user.first_name,
   last_name: user.last_name,
   role: user.role
 });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя (только админ)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Пользователь заблокирован
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
 const index = users.findIndex(u => u.id === req.params.id);
 
 if (index === -1) {
   return res.status(404).json({ error: "User not found" });
 }

 users.splice(index, 1);
 res.status(204).send();
});

// ==================== PRODUCTS ROUTES ====================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров (все аутентифицированные)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get("/api/products", authMiddleware, (req, res) => {
 res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (продавец и админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               category: { type: string }
 *               description: { type: string }
 *               stock: { type: number }
 *     responses:
 *       201:
 *         description: Товар создан
 *       403:
 *         description: Доступ запрещен
 */
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
 const newProduct = { 
   id: nanoid(6), 
   ...req.body 
 };
 products.push(newProduct);
 res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID (все аутентифицированные)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
 const product = products.find(p => p.id === req.params.id);
 if (!product) {
   return res.status(404).json({ error: "Product not found" });
 }
 res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (продавец и админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Товар обновлен
 */
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
 const product = products.find(p => p.id === req.params.id);
 
 if (!product) {
   return res.status(404).json({ error: "Product not found" });
 }

 Object.assign(product, req.body);
 res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (только админ)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Товар удален
 *       403:
 *         description: Доступ запрещен
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
 const index = products.findIndex(p => p.id === req.params.id);
 
 if (index === -1) {
   return res.status(404).json({ error: "Product not found" });
 }

 products.splice(index, 1);
 res.status(204).send();
});

// запуск сервера
app.listen(port, () => {
 console.log(`Сервер запущен: http://localhost:${port}`);
 console.log(`Swagger документация: http://localhost:${port}/api-docs`);
});