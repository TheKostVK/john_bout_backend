import { pool } from "../server.js";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { isValidProductType, isValidProductSubtype } from '../utils/productValidation.js';

dotenv.config();

const FactoryController = {
    /**
     * Получение списка произведенных товаров
     * @param {Object} req - Объект запроса
     * @param {Object} req.query - Параметры запроса
     * @param {number} [req.query.product_id] - Идентификатор товара (необязательный)
     * @param {number} [req.query.contract_id] - Идентификатор контракта (необязательный)
     * @param {number} [req.query.storage_location] - Идентификатор склада (необязательный)
     * @param {string} [req.query.serial_number] - Серийный номер (необязательный)
     * @param {string} [req.query.created_at] - Дата создания (необязательный)
     * @param {Object} res - Объект ответа
     * @return {Promise<*>} - JSON-ответ со списком произведенных товаров
     */
    getProducedProducts: async (req, res) => {
        try {
            const { product_id, contract_id, storage_location, serial_number, created_at } = req.query;

            let query = 'SELECT * FROM produced_objects WHERE 1=1';
            let values = [];

            if (product_id) {
                values.push(product_id);
                query += ` AND product_id = $${ values.length }`;
            }

            if (contract_id) {
                values.push(contract_id);
                query += ` AND contract_id = $${ values.length }`;
            }

            if (storage_location) {
                values.push(storage_location);
                query += ` AND storage_location = $${ values.length }`;
            }

            if (serial_number) {
                values.push(serial_number);
                query += ` AND serial_number = $${ values.length }`;
            }

            if (created_at) {
                values.push(created_at);
                query += ` AND DATE(created_at) = $${ values.length }`;
            }

            const { rows } = await pool.query(query, values);

            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },
    /**
     * Производство товара
     * @param {Object} req - Объект запроса
     * @param {Object} req.body - Тело запроса
     * @param {number} req.body.storage_location - Идентификатор склада, на котором будет храниться произведенный товар
     * @param {number} req.body.product_id - Идентификатор товара, который будет произведен
     * @param {number} req.body.quantity - Количество произведенных товаров
     * @param {Object} res - Объект ответа
     * @return {Promise<*>} - JSON-ответ с результатом операции
     */
    createProducedProducts: async (req, res) => {
        const client = await pool.connect();
        try {
            const { storage_location, product_id, quantity } = req.body;

            if (!storage_location || !product_id || !quantity) {
                return res.status(400).json({ success: false, message: 'Необходимые параметры отсутствуют' });
            }

            await client.query('BEGIN');

            // Получаем информацию о товаре
            const productQuery = 'SELECT * FROM products WHERE id = $1 AND disable = false';
            const productValues = [ product_id ];
            const { rows: productRows } = await client.query(productQuery, productValues);

            if (productRows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Товар не найден.' });
            }

            const product = productRows[0];

            // Проверка валидности типа товара
            if (!isValidProductType(product.product_type)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Недопустимый тип товара.' });
            }

            // Проверка валидности подтипа товара
            if (!isValidProductSubtype(product.product_type, product.product_subtype)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Недопустимый подтип товара.' });
            }

            // Получаем информацию о складе
            const warehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1 AND disable = false';
            const warehouseValues = [ storage_location ];
            const { rows: warehouseRows } = await client.query(warehouseQuery, warehouseValues);

            if (warehouseRows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Склад не найден.' });
            }

            const warehouse = warehouseRows[0];

            // Проверка соответствия типа товара и типа склада
            if (product.product_type === 'Военные самолеты' && warehouse.warehouse_type !== 'Авиационный ангар') {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Военные самолеты должны храниться в авиационном ангаре.'
                });
            } else if (product.product_type === 'Тяжелая техника' && warehouse.warehouse_type !== 'Ангар для техники') {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Тяжелая техника должна храниться в ангаре для техники.'
                });
            } else if ((product.product_type === 'Оружие' || product.product_type === 'Амуниция') && warehouse.warehouse_type !== 'Обычный') {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Оружие и амуниция должны храниться на обычном складе.'
                });
            }

            // Проверяем, есть ли достаточно свободного места на складе
            const totalOccupiedSpace = product.occupied_space * quantity;
            if (totalOccupiedSpace > (warehouse.capacity - warehouse.current_capacity)) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Недостаточно свободного места на складе. Необходимо - ${ totalOccupiedSpace }, доступное место на складе - ${ warehouse.capacity - warehouse.current_capacity }`
                });
            }

            // Получаем текущий баланс
            const balanceQuery = 'SELECT current_balance FROM financial_situation ORDER BY report_date DESC LIMIT 1';
            const { rows: balanceRows } = await client.query(balanceQuery);

            const currentBalance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;

            // Рассчитываем общую стоимость производства
            const totalProductionCost = product.production_cost * quantity;

            // Проверяем, достаточно ли средств на счете
            if (totalProductionCost > currentBalance) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Недостаточно средств на счете для производства товаров. Необходимо - ${ totalProductionCost.toLocaleString('ru-RU', {
                        style: 'currency',
                        currency: 'RUB'
                    }) }, текущий баланс - ${ currentBalance.toLocaleString('ru-RU', {
                        style: 'currency',
                        currency: 'RUB'
                    }) }, недостаточно - ${ (totalProductionCost - currentBalance).toLocaleString('ru-RU', {
                        style: 'currency',
                        currency: 'RUB'
                    }) }.`
                });
            }

            // Генерация объектов
            const products = [];
            const secretKey = process.env.JWT_SECRET_KEY;

            if (!secretKey) {
                await client.query('ROLLBACK');
                return res.status(500).json({ success: false, message: 'Секретный ключ не установлен' });
            }

            for (let i = 0; i < quantity; i++) {
                const serialNumber = uuidv4();
                const payload = {
                    id: product.id,
                    name: product.name,
                    product_type: product.product_type,
                    product_subtype: product.product_subtype,
                    characteristics: product.characteristics,
                    price: product.price,
                    production_cost: product.production_cost,
                    serial_number: serialNumber,
                    created_at: new Date()
                };
                const jwtToken = jwt.sign(payload, secretKey);

                products.push({
                    storage_location,
                    product_id,
                    serial_number: serialNumber,
                    jwt_token: jwtToken
                });
            }

            const values = products.map(p => `(${ p.storage_location }, NULL, ${ p.product_id }, '${ p.serial_number }', '${ p.jwt_token }', NOW())`).join(',');

            const query = `
                INSERT INTO produced_objects (storage_location, contract_id, product_id, serial_number, jwt_token, created_at)
                VALUES ${values}
            `;

            await client.query(query);

            // Увеличиваем занимаемое место на складе на соответствующее количество
            const updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity + $1 WHERE id = $2 RETURNING *';
            const updateWarehouseValues = [ totalOccupiedSpace, storage_location ];
            await client.query(updateWarehouseQuery, updateWarehouseValues);

            // Создаем запись в financial_situation
            const newBalance = currentBalance - totalProductionCost;
            const currentDate = new Date().toISOString().split('T')[0];

            const insertFinancialSituationQuery = `
                INSERT INTO financial_situation (report_date, disable, income, expenditure, profit, current_balance, operation_type_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            const operationTypeId = 1;
            const insertFinancialSituationValues = [ currentDate, false, 0, totalProductionCost, -totalProductionCost, newBalance, operationTypeId ];
            await client.query(insertFinancialSituationQuery, insertFinancialSituationValues);

            await client.query('COMMIT');

            res.status(201).json({ success: true, message: `${ quantity } объектов успешно создано` });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, message: `Ошибка сервера. Причина: ${ error.detail }` });
        } finally {
            client.release();
        }
    }
};

export default FactoryController;