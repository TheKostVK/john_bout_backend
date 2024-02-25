import { pool } from "../server.js";

const ProductsController = {
    /**
     * Получить все продукты из базы данных и отправить результат в виде JSON-ответа.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} JSON-ответ с списком продуктов
     */
    getAllProducts: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM products WHERE disable = false');

            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    },
    /**
     * Асинхронно добавляет продукт в базу данных.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Object} данные о добавленном продукте
     */
    addProduct: async (req, res) => {
        const { name, product_type, subtype, characteristics, storage_location, quantity } = req.body;

        try {
            const query = 'INSERT INTO products (name, product_type, subtype, characteristics, disable, storage_location, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
            const values = [ name, product_type, subtype, characteristics, false, storage_location, quantity ];

            const { rows } = await pool.query(query, values);

            res.status(201).json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    },
    /**
     * Выключает продукт путем обновления его статуса в базе данных.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Promise<void>} - Promise, который разрешается обновленными данными продукта
     */
    disableProduct: async (req, res) => {
        const productId = req.params.id;

        try {
            const query = 'UPDATE products SET disable = true WHERE id = $1 RETURNING *';
            const values = [ productId ];

            const { rows } = await pool.query(query, values);

            if (rows.length === 0) {
                res.status(404).json({ success: false, error: 'Товар не найден.' });
            } else {
                res.json({ success: true, message: `Товар с id ${ productId } успешно отключен.` });
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    },
    /**
     * Обновляет продукт в базе данных.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Promise} Промис, который разрешается обновленными данными о продукте
     */
    updateProduct: async (req, res) => {
        const productId = req.params.id;
        const { name, product_type, subtype, characteristics, storage_location, quantity } = req.body;

        try {
            const query = 'UPDATE products SET name = $1, product_type = $2, subtype = $3, characteristics = $4, storage_location = $6, quantity = $7 WHERE id = $5 RETURNING *';
            const values = [ name, product_type, subtype, characteristics, productId, storage_location, quantity ];

            const { rows } = await pool.query(query, values);

            if (rows.length === 0) {
                res.status(404).json({ success: false, error: 'Товар не найден.' });
            } else {
                res.json({ success: true, data: rows[0] });
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    },
};

export default ProductsController;
