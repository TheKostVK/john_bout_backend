import { pool } from "../server.js";

// Проверка соответствия типа товара ограничениям
const isValidProductType = (productType) => {
    const validTypes = [ 'Военные самолеты', 'Тяжелая техника', 'Оружие', 'Амуниция', 'Боеприпасы различного калибра', 'Ракеты класса земля-воздух', 'Ракеты класса воздух-воздух', 'Ракеты класса воздух-земля', 'Межконтинентальные ракеты' ];
    return validTypes.includes(productType);
};

// Проверка соответствия подтипа товара ограничениям
const isValidProductSubtype = (productType, subtype) => {
    switch (productType) {
        case 'Военные самолеты':
            return [ 'Истребители', 'Бомбардировщики' ].includes(subtype);
        case 'Тяжелая техника':
            return [ 'Ракетные комплексы', 'РСЗО', 'Бронетранспортеры' ].includes(subtype);
        case 'Оружие':
            return [ 'Тактические винтовки', 'Штурмовые винтовки', 'Пистолеты-пулеметы', 'Пистолеты', 'Ручные пулеметы', 'Снайперские и пехотные винтовки' ].includes(subtype);
        case 'Амуниция':
            return [ 'Бронежилеты', 'Гранаты' ].includes(subtype);
        default:
            return true; // Подтип не определен или не ограничен для других типов товаров
    }
};

const ProductsController = {
    /**
     * Получить все продукты из базы данных и отправить результат в виде JSON-ответа.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} JSON-ответ со списком продуктов
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
        const {
            name,
            product_type,
            subtype,
            characteristics,
            storage_location,
            quantity,
            occupied_space,
            price
        } = req.body;

        // Проверка валидности типа товара
        if (!isValidProductType(product_type)) {
            return res.status(400).json({ success: false, error: 'Недопустимый тип товара.' });
        }

        // Проверка валидности подтипа товара
        if (!isValidProductSubtype(product_type, subtype)) {
            return res.status(400).json({ success: false, error: 'Недопустимый подтип товара.' });
        }

        try {
            // Получаем информацию о складе, в который добавляется товар
            const warehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1 AND disable = false';
            const warehouseValues = [ storage_location ];
            const { rows: warehouseRows } = await pool.query(warehouseQuery, warehouseValues);

            // Если склад не найден, возвращаем ошибку
            if (warehouseRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Склад не найден.' });
            }

            // Проверяем соответствие типа товара и типа склада
            if (product_type === 'Военные самолеты' && warehouseRows[0].warehouse_type !== 'Авиационный ангар') {
                return res.status(400).json({
                    success: false,
                    error: 'Военные самолеты должны храниться в авиационном ангаре.'
                });
            } else if (product_type === 'Тяжелая техника' && warehouseRows[0].warehouse_type !== 'Ангар для техники') {
                return res.status(400).json({
                    success: false,
                    error: 'Тяжелая техника должна храниться в ангаре для техники.'
                });
            } else if ((product_type === 'Оружие' || product_type === 'Амуниция') && warehouseRows[0].warehouse_type !== 'Обычный') {
                return res.status(400).json({
                    success: false,
                    error: 'Оружие и амуниция должны храниться на обычном складе.'
                });
            }

            // Проверяем, есть ли достаточно свободного места на складе
            const totalOccupiedSpace = occupied_space * quantity;
            if (totalOccupiedSpace > (warehouseRows[0].capacity - warehouseRows[0].current_capacity)) {
                return res.status(400).json({ success: false, error: 'Недостаточно свободного места на складе.' });
            }

            // Добавляем товар на склад
            const query = 'INSERT INTO products (name, product_type, subtype, characteristics, disable, storage_location, quantity, occupied_space, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
            const values = [ name, product_type, subtype, characteristics, false, storage_location, quantity, occupied_space, price ];
            const { rows } = await pool.query(query, values);

            // Увеличиваем занимаемое место на складе на соответствующее количество
            const updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity + $1 WHERE id = $2 RETURNING *';
            const updateWarehouseValues = [ totalOccupiedSpace, storage_location ];
            await pool.query(updateWarehouseQuery, updateWarehouseValues);

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
            // Получаем информацию о товаре, который отключаем
            const getProductQuery = 'SELECT * FROM products WHERE id = $1';
            const getProductValues = [productId];
            const { rows: productRows } = await pool.query(getProductQuery, getProductValues);

            if (productRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Товар не найден.' });
            }

            // Получаем информацию о складе, к которому относится товар
            const warehouseId = productRows[0].storage_location;
            const getWarehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1';
            const getWarehouseValues = [warehouseId];
            const { rows: warehouseRows } = await pool.query(getWarehouseQuery, getWarehouseValues);

            if (warehouseRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Склад не найден.' });
            }

            // Вычисляем количество мест, которые занимает товар на складе
            const occupiedSpace = productRows[0].occupied_space;
            const quantity = productRows[0].quantity;
            const totalOccupiedSpace = occupiedSpace * quantity;

            // Проверяем, не превышает ли текущая емкость склада вычитаемое значение
            if (warehouseRows[0].current_capacity < totalOccupiedSpace) {
                return res.status(400).json({ success: false, error: 'Недостаточно свободного места на складе.' });
            }

            // Уменьшаем текущее количество товара на складе на количество мест, которые он занимает
            const updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity - $1 WHERE id = $2';
            const updateWarehouseValues = [totalOccupiedSpace, warehouseId];
            await pool.query(updateWarehouseQuery, updateWarehouseValues);

            // Устанавливаем статус товара как отключенный
            const updateProductQuery = 'UPDATE products SET disable = true WHERE id = $1 RETURNING *';
            const updateProductValues = [productId];
            await pool.query(updateProductQuery, updateProductValues);

            res.json({ success: true, message: `Товар с id ${productId} успешно отключен.` });
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

        // Проверка валидности типа товара
        if (!isValidProductType(product_type)) {
            return res.status(400).json({ success: false, error: 'Недопустимый тип товара.' });
        }

        // Проверка валидности подтипа товара
        if (!isValidProductSubtype(product_type, subtype)) {
            return res.status(400).json({ success: false, error: 'Недопустимый подтип товара.' });
        }

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
