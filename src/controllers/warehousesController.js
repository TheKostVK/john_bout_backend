import { pool } from "../server.js";
import { validWarehouseTypes } from "../globalTypes.js";

const WarehousesController = {
    //TODO сделать возврат количества страниц всего и текущей страницы
    /**
     * Получает все склады из базы данных с учетом фильтров и пагинации.
     *
     * @param {Object} req - объект запроса
     * @param {Object} req.query - Параметры запроса
     * @param {string} [req.query.Name] - Название склада (необязательный)
     * @param {string} [req.query.Address] - Адрес склада (необязательный)
     * @param {number} [req.query.Current_Capacity] - Текущая вместимость (необязательный)
     * @param {number} [req.query.Capacity] - Общая вместимость (необязательный)
     * @param {string} [req.query.Warehouse_type] - Тип склада (необязательный)
     * @param {boolean} [req.query.disable] - Статус отключения (необязательный)
     * @param {number} [req.query.page] - Номер страницы (необязательный)
     * @param {number} [req.query.limit] - Количество объектов на странице (необязательный)
     * @param {Object} res - объект ответа
     * @return {Promise<*>} JSON-ответ со списком складов
     */
    getAllWarehouses: async (req, res) => {
        const { Name, Address, Current_Capacity, Capacity, Warehouse_type, disable, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let filterConditions = 'WHERE 1=1';
        const filterValues = [];

        if (Name) {
            filterConditions += ' AND Name ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ Name }%`);
        }

        if (Address) {
            filterConditions += ' AND Address ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ Address }%`);
        }

        if (Current_Capacity !== undefined) {
            filterConditions += ' AND Current_Capacity >= $' + (filterValues.length + 1);
            filterValues.push(Number(Current_Capacity));
        }

        if (Capacity !== undefined) {
            filterConditions += ' AND Capacity >= $' + (filterValues.length + 1);
            filterValues.push(Number(Capacity));
        }

        if (Warehouse_type) {
            if (!validWarehouseTypes.includes(Warehouse_type)) {
                return res.status(400).json({ success: false, message: 'Недопустимый тип склада' });
            }
            filterConditions += ' AND Warehouse_type = $' + (filterValues.length + 1);
            filterValues.push(Warehouse_type);
        }

        if (disable !== undefined) {
            filterConditions += ' AND disable = $' + (filterValues.length + 1);
            filterValues.push(disable === 'true');
        }

        const query = `SELECT * FROM Warehouses ${filterConditions} LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}`;
        filterValues.push(limit, offset);

        try {
            const { rows } = await pool.query(query, filterValues);
            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },
    /**
     * Создает новый склад.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Object} данные созданного склада
     */
    createWarehouse: async (req, res) => {
        const { name, address, current_capacity, capacity, type } = req.body;

        if (!validWarehouseTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Недопустимый тип склада.' });
        }

        try {
            const query = 'INSERT INTO Warehouses (Name, Address, Current_Capacity, Capacity, Warehouse_type, disable) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
            const values = [name, address, current_capacity, capacity, type, false];
            const { rows } = await pool.query(query, values);

            res.status(201).json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },
    /**
     * Отключает склад.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Promise<void>} Промис, который разрешается, когда склад отключен
     */
    disableWarehouse: async (req, res) => {
        const { id } = req.params;

        try {
            // Проверяем, есть ли на складе товары
            const checkQuery = 'SELECT COUNT(*) FROM Products WHERE Storage_Location = $1';
            const checkValues = [id];
            const { rows: productCount } = await pool.query(checkQuery, checkValues);

            // Если на складе есть товары, отправляем сообщение об ошибке
            if (productCount[0].count > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Невозможно отключить склад, так как на нем есть товары.'
                });
                return;
            }

            // Если склад пустой, отключаем его
            const updateQuery = 'UPDATE Warehouses SET disable = true WHERE ID = $1 RETURNING *';
            const updateValues = [id];
            const { rows } = await pool.query(updateQuery, updateValues);

            if (rows.length === 0) {
                res.status(404).json({ success: false, message: 'Склад с указанным ID не найден.' });
            } else {
                res.status(200).json({ success: true, message: `Склад с ID ${ id } был успешно отключен.` });
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    }
};

export default WarehousesController;
