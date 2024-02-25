import { pool } from "../server.js";

const CustomersController = {
    /**
     * Получает всех клиентов из базы данных и отправляет результат в виде JSON-ответа.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} Промис, который разрешается, когда операция завершена
     */
    getAllCustomers: async (req, res) => {
        try {
            const query = 'SELECT * FROM customers WHERE disable = false';
            const { rows } = await pool.query(query);

            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    },
    /**
     * Создает нового покупателя с предоставленной информацией из тела запроса.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Object} вновь созданный объект покупателя
     */
    createCustomer: async (req, res) => {
        const { name, type, address, contactInfo } = req.body;

        try {
            const insertQuery = 'INSERT INTO customers (name, type, address, contact_info, disable) VALUES ($1, $2, $3, $4, $5) RETURNING *';
            const values = [name, type, address, contactInfo, false];

            const { rows } = await pool.query(insertQuery, values);

            // После успешного создания пользователя извлекаем данные из результата запроса
            const newUser = rows[0];

            res.status(201).json({ success: true, data: newUser });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ error: 'Ошибка сервера, код - 500:' });
        }
    },
    /**
     * Удаляет клиента, устанавливая поле 'disable' в базе данных в значение true.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} Промис, который разрешается, когда клиент успешно удален
     */
    deleteCustomer: async (req, res) => {
        const customerId = req.params.id;

        try {
            const updateQuery = 'UPDATE customers SET disable = true WHERE id = $1';
            const values = [customerId];

            await pool.query(updateQuery, values);

            res.json({ success: true, message: `Пользователь с id ${customerId} успешно отключен.` });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ error: 'Ошибка сервера, код - 500:' });
        }
    }
};

export default CustomersController;
