import { pool } from "../server.js";

const WarehousesController = {
    /**
     * Получает все склады из базы данных, где disable равно false.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Promise} промис, который разрешается с полученными данными или отклоняется с ошибкой
     */
    getAllWarehouses: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Warehouses WHERE disable = false');
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
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
        const { name, address, currentCapacity, capacity } = req.body;

        try {
            const query = 'INSERT INTO Warehouses (Name, Address, Current_Capacity, Capacity, disable) VALUES ($1, $2, $3, $4, $5) RETURNING *';
            const values = [name, address, currentCapacity, capacity, false];
            const { rows } = await pool.query(query, values);
            res.status(201).json({ success: true, data: rows[0] });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
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
                res.status(400).json({ success: false, error: 'Невозможно отключить склад, так как на нем есть товары.' });
                return;
            }

            // Если склад пустой, отключаем его
            const updateQuery = 'UPDATE Warehouses SET disable = true WHERE ID = $1 RETURNING *';
            const updateValues = [id];
            const { rows } = await pool.query(updateQuery, updateValues);
            if (rows.length === 0) {
                res.status(404).json({ success: false, error: 'Склад с указанным ID не найден.' });
            } else {
                res.status(200).json({ success: true, message: `Склад с ID ${id} был успешно отключен.` });
            }
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    }
};

export default WarehousesController;
