import { pool } from "../server.js";
import { isValidProductSubtype, isValidProductType } from "../utils/productValidation.js";

const ProductsController = {
    //TODO сделать возврат количества страниц всего и текущей страницы
    /**
     * Получить все продукты из базы данных с учетом фильтров и пагинации и отправить результат в виде JSON-ответа.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} req.query - Параметры запроса
     * @param {string} [req.query.name] - Имя продукта (необязательный)
     * @param {string} [req.query.product_type] - Тип продукта (необязательный)
     * @param {string} [req.query.product_subtype] - Подтип продукта (необязательный)
     * @param {string} [req.query.characteristics] - Характеристики продукта (необязательный)
     * @param {boolean} [req.query.disable] - Статус отключения (необязательный)
     * @param {number} [req.query.storage_location] - Место хранения (необязательный)
     * @param {number} [req.query.quantity] - Количество (необязательный)
     * @param {number} [req.query.occupied_space] - Занимаемое пространство (необязательный)
     * @param {number} [req.query.price] - Цена (необязательный)
     * @param {number} [req.query.reserved_quantity] - Зарезервированное количество (необязательный)
     * @param {number} [req.query.production_cost] - Стоимость производства (необязательный)
     * @param {string} [req.query.product_description] - Описание продукта (необязательный)
     * @param {number} [req.query.page] - Номер страницы (необязательный)
     * @param {number} [req.query.limit] - Количество объектов на странице (необязательный)
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} JSON-ответ со списком продуктов
     */
    getAllProducts: async (req, res) => {
        const {
            name,
            product_type,
            product_subtype,
            characteristics,
            disable,
            storage_location,
            quantity,
            occupied_space,
            price,
            reserved_quantity,
            production_cost,
            product_description,
            page = 1,
            limit = 10
        } = req.query;
        const offset = (page - 1) * limit;

        let filterConditions = 'WHERE 1=1';
        const filterValues = [];

        if (name) {
            filterConditions += ' AND name ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ name }%`);
        }

        if (product_type) {
            if (!isValidProductType(product_type)) {
                return res.status(400).json({ success: false, message: 'Недопустимый тип продукта' });
            }
            filterConditions += ' AND product_type = $' + (filterValues.length + 1);
            filterValues.push(product_type);
        }

        if (product_subtype) {
            if (!isValidProductSubtype(product_type, product_subtype)) {
                return res.status(400).json({ success: false, message: 'Недопустимый подтип продукта' });
            }
            filterConditions += ' AND product_subtype = $' + (filterValues.length + 1);
            filterValues.push(product_subtype);
        }

        if (characteristics) {
            filterConditions += ' AND characteristics::text ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ characteristics }%`);
        }

        if (disable !== undefined) {
            filterConditions += ' AND disable = $' + (filterValues.length + 1);
            filterValues.push(disable === 'true');
        }

        if (storage_location !== undefined) {
            filterConditions += ' AND storage_location = $' + (filterValues.length + 1);
            filterValues.push(Number(storage_location));
        }

        if (quantity !== undefined) {
            filterConditions += ' AND quantity >= $' + (filterValues.length + 1);
            filterValues.push(Number(quantity));
        }

        if (occupied_space !== undefined) {
            filterConditions += ' AND occupied_space >= $' + (filterValues.length + 1);
            filterValues.push(Number(occupied_space));
        }

        if (price !== undefined) {
            filterConditions += ' AND price >= $' + (filterValues.length + 1);
            filterValues.push(Number(price));
        }

        if (reserved_quantity !== undefined) {
            filterConditions += ' AND reserved_quantity >= $' + (filterValues.length + 1);
            filterValues.push(Number(reserved_quantity));
        }

        if (production_cost !== undefined) {
            filterConditions += ' AND production_cost >= $' + (filterValues.length + 1);
            filterValues.push(Number(production_cost));
        }

        if (product_description) {
            filterConditions += ' AND product_description ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ product_description }%`);
        }

        const query = `SELECT * FROM products ${filterConditions} LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}`;
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
            product_subtype,
            characteristics,
            storage_location,
            quantity,
            occupied_space,
            price,
            imgUrl,
            production_cost,
            product_description
        } = req.body;

        // Проверка валидности типа товара
        if (!isValidProductType(product_type)) {
            return res.status(400).json({ success: false, message: 'Недопустимый тип товара.' });
        }

        // Проверка валидности подтипа товара
        if (!isValidProductSubtype(product_type, product_subtype)) {
            return res.status(400).json({ success: false, message: 'Недопустимый подтип товара.' });
        }

        try {
            // Преобразование массива объектов JSON в строку JSON
            const characteristicsString = JSON.stringify(characteristics);

            // Получаем информацию о складе, в который добавляется товар
            const warehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1 AND disable = false';
            const warehouseValues = [storage_location];
            const { rows: warehouseRows } = await pool.query(warehouseQuery, warehouseValues);

            // Если склад не найден, возвращаем ошибку
            if (warehouseRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Склад не найден.' });
            }

            // Проверяем соответствие типа товара и типа склада
            if (product_type === 'Военные самолеты' && warehouseRows[0].warehouse_type !== 'Авиационный ангар') {
                return res.status(400).json({
                    success: false,
                    message: 'Военные самолеты должны храниться в авиационном ангаре.'
                });
            } else if (product_type === 'Тяжелая техника' && warehouseRows[0].warehouse_type !== 'Ангар для техники') {
                return res.status(400).json({
                    success: false,
                    message: 'Тяжелая техника должна храниться в ангаре для техники.'
                });
            } else if ((product_type === 'Оружие' || product_type === 'Амуниция') && warehouseRows[0].warehouse_type !== 'Обычный') {
                return res.status(400).json({
                    success: false,
                    message: 'Оружие и амуниция должны храниться на обычном складе.'
                });
            }

            // Проверяем, есть ли достаточно свободного места на складе
            const totalOccupiedSpace = occupied_space * quantity;
            if (totalOccupiedSpace > (warehouseRows[0].capacity - warehouseRows[0].current_capacity)) {
                return res.status(400).json({ success: false, message: 'Недостаточно свободного места на складе.' });
            }

            // Добавляем товар
            const query = 'INSERT INTO products (name, product_type, product_subtype, characteristics, disable, storage_location, quantity, occupied_space, price, reserved_quantity, image_url, production_cost, product_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *';
            const values = [name, product_type, product_subtype, characteristicsString, false, storage_location, quantity, occupied_space, price, 0, imgUrl, production_cost, product_description];
            const { rows } = await pool.query(query, values);

            // Увеличиваем занимаемое место на складе на соответствующее количество
            const updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity + $1 WHERE id = $2 RETURNING *';
            const updateWarehouseValues = [totalOccupiedSpace, storage_location];
            await pool.query(updateWarehouseQuery, updateWarehouseValues);

            res.status(201).json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
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
                return res.status(404).json({ success: false, message: 'Товар не найден.' });
            } else if (productRows[0].reserved_quantity > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Товар зарезервирован в количестве ${ productRows[0].reserved_quantity }.`
                });
            }

            // Получаем информацию о складе, к которому относится товар
            const warehouseId = productRows[0].storage_location;
            const getWarehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1';
            const getWarehouseValues = [warehouseId];
            const { rows: warehouseRows } = await pool.query(getWarehouseQuery, getWarehouseValues);

            if (warehouseRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Склад не найден.' });
            }

            // Вычисляем количество мест, которые занимает товар на складе
            const occupiedSpace = productRows[0].occupied_space;
            const quantity = productRows[0].quantity;
            const totalOccupiedSpace = occupiedSpace * quantity;

            // Проверяем, не превышает ли текущая емкость склада вычитаемое значение
            if (warehouseRows[0].current_capacity < totalOccupiedSpace) {
                return res.status(400).json({
                    success: false,
                    message: 'Недостаточно товара на складе для отключения.'
                });
            }

            // Уменьшаем текущее количество товара на складе на количество мест, которые он занимает
            const updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity - $1 WHERE id = $2';
            const updateWarehouseValues = [totalOccupiedSpace, warehouseId];
            await pool.query(updateWarehouseQuery, updateWarehouseValues);

            // Устанавливаем статус товара как отключенный
            const updateProductQuery = 'UPDATE products SET disable = true WHERE id = $1 RETURNING *';
            const updateProductValues = [productId];
            await pool.query(updateProductQuery, updateProductValues);

            res.json({ success: true, message: `Товар с id ${ productId } успешно отключен.` });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
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
        const {
            name,
            product_type,
            product_subtype,
            characteristics,
            storage_location,
            quantity,
            imgUrl,
            production_cost,
            product_description
        } = req.body;

        // Проверка валидности типа товара
        if (!isValidProductType(product_type)) {
            return res.status(400).json({ success: false, message: 'Недопустимый тип товара.' });
        }

        // Проверка валидности подтипа товара
        if (!isValidProductSubtype(product_type, product_subtype)) {
            return res.status(400).json({ success: false, message: 'Недопустимый подтип товара.' });
        }

        try {
            // Преобразование массива объектов JSON в строку JSON
            const characteristicsString = JSON.stringify(characteristics);

            // Получаем информацию о товаре, который обновляем
            const getProductQuery = 'SELECT * FROM products WHERE id = $1';
            const getProductValues = [productId];
            const { rows: productRows } = await pool.query(getProductQuery, getProductValues);

            if (productRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Товар не найден.' });
            }

            // Получаем информацию о складе, к которому относится товар
            const warehouseId = storage_location || productRows[0].storage_location;
            const getWarehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1';
            const getWarehouseValues = [warehouseId];
            const { rows: warehouseRows } = await pool.query(getWarehouseQuery, getWarehouseValues);

            if (warehouseRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Склад не найден.' });
            }

            // Вычисляем изменение количества товара на складе
            const initialQuantity = productRows[0].quantity;
            const updatedQuantity = quantity - initialQuantity;

            // Проверяем, достаточно ли свободного места на складе
            const occupiedSpace = productRows[0].occupied_space;
            const totalOccupiedSpace = occupiedSpace * quantity;

            if (quantity < productRows[0].reserved_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Количество товара меньше необходимого для резервирования. Текущий резерв: ${ productRows[0].reserved_quantity }`,
                });
            }

            if (((warehouseRows[0].current_capacity - (productRows[0].quantity * productRows[0].occupied_space)) + totalOccupiedSpace) > warehouseRows[0].capacity) {
                return res.status(400).json({ success: false, message: 'Недостаточно свободного места на складе.' });
            }

            // Обновляем товар
            const query = 'UPDATE products SET name = $1, product_type = $2, product_subtype = $3, characteristics = $4, storage_location = $6, quantity = $7, image_url = $8, production_cost = $9, product_description = $10 WHERE id = $5 RETURNING *';
            const values = [name, product_type, product_subtype, characteristicsString, productId, warehouseId, quantity, imgUrl, production_cost, product_description];
            const { rows } = await pool.query(query, values);

            if (rows.length === 0) {
                res.status(404).json({ success: false, message: 'Товар не найден.' });
            } else {
                // Обновляем количество товара на складе
                let updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity ';
                let updateWarehouseValues;

                if (updatedQuantity > 0) {
                    updateWarehouseQuery += '+ $1';
                    updateWarehouseValues = [updatedQuantity * occupiedSpace];
                } else if (updatedQuantity < 0) {
                    updateWarehouseQuery += '- $1';
                    updateWarehouseValues = [-updatedQuantity * occupiedSpace];
                } else {
                    return res.json({ success: true, data: rows[0] });
                }

                updateWarehouseQuery += ' WHERE id = $2';
                updateWarehouseValues.push(warehouseId);
                await pool.query(updateWarehouseQuery, updateWarehouseValues);

                res.json({ success: true, data: rows[0] });
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },
};

export default ProductsController;
