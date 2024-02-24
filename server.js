import express, { Express } from 'express';
import pkg from 'pg';
import { customersController, productsController } from './controllers/index.js';

const app: Express = express();
const { Pool } = pkg;
// Подключение к БД
export const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'JohnBout',
    password: 'admin',
    port: 5432,
});

// Маршруты для заказчиков
app.use('/customers', customersController.default.getAllCustomers);
// Маршрут для продуктов
app.get('/products', productsController.default.getAllProducts);

// Порт, на котором будет запущен сервер
const port = 3000;

// Запуск сервера
app.listen(port, (): void => {
    console.log(`Сервер запущен на http://localhost:${ port }`);
});
