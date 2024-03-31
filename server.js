import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import {
    customersController,
    productsController,
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

// Обработчик события завершения процесса
process.on('SIGINT', () => {
    pool.end().then(() => {
        console.log('Пул соединений закрыт');
        process.exit(0);
    });
});

// Используем middleware cors
app.use(cors());
// Middleware для обработки данных в формате JSON
app.use(express.json());
// Middleware для обработки данных из формы
app.use(express.urlencoded({ extended: true }));
// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} запрос на ${req.originalUrl}`);
    next();
});

// Маршруты для заказчиков
app.get('/customers', customersController.default.getAllCustomers);
app.post('/customers', customersController.default.createCustomer);
app.delete('/customers/:id', customersController.default.deleteCustomer);
// Маршрут для продуктов
app.get('/products', productsController.default.getAllProducts);
app.post('/products', productsController.default.addProduct);
app.put('/products/:id', productsController.default.updateProduct);
app.delete('/products/:id', productsController.default.disableProduct);
// Маршрут для истории сделок
app.get('/dealHistory', dealHistoryController.default.getAllDealHistory);
// Маршрут для контрактов поставок
app.get('/supplyContracts', supplyContractsController.default.getAllSupplyContracts);
app.post('/supplyContracts/status/:id', supplyContractsController.default.changeContractStatus);
app.post('/supplyContracts/:id', supplyContractsController.default.completeContract);
app.post('/supplyContracts', supplyContractsController.default.createSupplyContract);
// Маршрут для финансовой статистики
app.get('/financial', financialSituationController.default.getAllFinancialSituation);
// Маршрут для складов
app.get('/warehouses', warehousesController.default.getAllWarehouses);
app.post('/warehouses', warehousesController.default.createWarehouse);
app.delete('/warehouses/:id', warehousesController.default.disableWarehouse);

// Порт, на котором будет запущен сервер
const port = 5000;

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${ port }`);
});
