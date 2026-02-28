const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// настройка CORS
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// начальные данные
let products = [
    { id: nanoid(6), name: 'Ноутбук', price: 50000, category: 'Электроника', description: 'Мощный ноутбук', stock: 10 },
    { id: nanoid(6), name: 'Мышь', price: 1500, category: 'Аксессуары', description: 'Беспроводная', stock: 50 },
    { id: nanoid(6), name: 'Клавиатура', price: 3000, category: 'Аксессуары', description: 'Механическая', stock: 30 },
    { id: nanoid(6), name: 'Монитор', price: 15000, category: 'Электроника', description: '27 дюймов', stock: 15 },
    { id: nanoid(6), name: 'Наушники', price: 5000, category: 'Аудио', description: 'Шумоподавление', stock: 40 },
    { id: nanoid(6), name: 'Веб-камера', price: 4000, category: 'Аксессуары', description: 'Full HD', stock: 25 },
    { id: nanoid(6), name: 'Микрофон', price: 7000, category: 'Аудио', description: 'USB конденсаторный', stock: 20 },
    { id: nanoid(6), name: 'Коврик', price: 1000, category: 'Аксессуары', description: 'Игровой большой', stock: 100 },
    { id: nanoid(6), name: 'Подставка', price: 2000, category: 'Аксессуары', description: 'Для ноутбука', stock: 35 },
    { id: nanoid(6), name: 'Кабель HDMI', price: 500, category: 'Кабели', description: '2 метра', stock: 200 }
];

// настройка swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Интернет-магазина',
            version: '1.0.0',
            description: 'Документация API для контрольной работы'
        },
        servers: [{ url: `http://localhost:${port}` }]
    },
    apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// вспомогательная функция поиска
function findProductOr404(id, res) {
    const product = products.find(p => p.id == id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// swagger схема
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { type: string }
 *         price: { type: number }
 *         category: { type: string }
 *         description: { type: string }
 *         stock: { type: number }
 */

// маршруты

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get("/api/products", (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 */
app.post("/api/products", (req, res) => {
    const newProduct = { id: nanoid(6), ...req.body };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
app.get("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
app.patch("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    
    if (req.body?.name === undefined && req.body?.price === undefined && req.body?.stock === undefined) {
        return res.status(400).json({ error: "Nothing to update" });
    }
    
    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.price !== undefined) product.price = req.body.price;
    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (req.body.category !== undefined) product.category = req.body.category;
    if (req.body.description !== undefined) product.description = req.body.description;
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
app.delete("/api/products/:id", (req, res) => {
    const exists = products.some(p => p.id === req.params.id);
    if (!exists) return res.status(404).json({ error: "Product not found" });
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});

// запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
    console.log(`Swagger документация: http://localhost:${port}/api-docs`);
});