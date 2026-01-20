import { pool } from "../server.js";
import { customersTypeValue } from "../globalTypes.js";

const CustomersController = {
    //TODO сделать возврат количества страниц всего и текущей страницы
    /**
     * Получает всех клиентов из базы данных с учетом фильтров и пагинации и отправляет результат в виде JSON-ответа.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} Промис, который разрешается, когда операция завершена
     */
    getAllCustomers: async (req, res) => {
        const { page = 1, limit = 10, name, type, address, contact_info, disable } = req.query;
        const offset = (page - 1) * limit;

        let filterConditions = 'WHERE 1=1';
        const filterValues = [];

        if (name) {
            filterConditions += ' AND name ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ name }%`);
        }

        if (type) {
            if (!customersTypeValue.includes(type)) {
                return res.status(400).json({ success: false, message: 'Недопустимый тип заказчика' });
            }
            filterConditions += ' AND type = $' + (filterValues.length + 1);
            filterValues.push(type);
        }

        if (address) {
            filterConditions += ' AND address ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ address }%`);
        }

        if (contact_info) {
            filterConditions += ' AND contact_info ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ contact_info }%`);
        }

        if (disable !== undefined) {
            filterConditions += ' AND disable = $' + (filterValues.length + 1);
            filterValues.push(disable === 'true');
        }

        const query = `SELECT * FROM customers ${filterConditions} LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}`;
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
     * Создает нового покупателя с предоставленной информацией из тела запроса.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Object} вновь созданный объект покупателя
     */
    createCustomer: async (req, res) => {
        const { name, type, address, contactInfo } = req.body;

        if (!customersTypeValue.includes(type)) {
            return res.status(400).json({ success: false, message: 'Недопустимый тип заказчика' });
        }

        try {
            const insertQuery = 'INSERT INTO customers (name, type, address, contact_info, disable) VALUES ($1, $2, $3, $4, $5) RETURNING *';
            const values = [name, type, address, contactInfo, false];

            const { rows } = await pool.query(insertQuery, values);
            const newUser = rows[0];

            res.status(201).json({ success: true, data: newUser });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ message: `Ошибка сервера, код - 500: ${ error.detail }` });
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

            res.json({ success: true, message: `Пользователь с id ${ customerId } успешно отключен.` });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ message: `Ошибка сервера, код - 500: ${ error.detail }` });
        }
    }
};

export default CustomersController;