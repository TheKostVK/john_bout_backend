import express from 'express';
import pkg from 'pg';
import {
    customersController,
    productsController,
    ordersController,
    dealHistoryController,
    supplyContractsController,
    financialSituationController,
    warehousesController,
} from './controllers/index.js';

const app = express();
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
// Маршрут для заказов
app.get('/orders', ordersController.default.getAllOrders);
app.get('/orders/items', ordersController.default.getAllOrderItems);
// Маршрут для истории сделок
app.get('/dealHistory', dealHistoryController.default.getAllDealHistory);
// Маршрут для контрактов поставок
app.get('/supplyContracts', supplyContractsController.default.getAllSupplyContracts);
// Маршрут для финансовой статистики
app.get('/financial', financialSituationController.default.getAllFinancialSituation);
// Маршрут для складов
app.get('/warehouses', warehousesController.default.getAllWarehouses);

// Порт, на котором будет запущен сервер
const port = 3000;

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${ port }`);
});
