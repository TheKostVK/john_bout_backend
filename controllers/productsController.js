import { pool } from "../server.js";
import * as url from "url";

// Проверка соответствия типа товара ограничениям
const isValidProductType = (productType) => {
    const validTypes = [ 'Военные самолеты', 'Тяжелая техника', 'Оружие', 'Амуниция', 'Боеприпасы различного калибра', 'Ракеты класса земля-воздух', 'Ракеты класса воздух-воздух', 'Ракеты класса воздух-земля', 'Межконтинентальные ракеты' ];
    return validTypes.includes(productType);
};

// Проверка соответствия подтипа товара ограничениям
const isValidProductSubtype = (productType, product_subtype) => {
    switch (productType) {
        case 'Военные самолеты':
            return [
                'Истребители',
                'Бомбардировщики',
                'Разведчики',
                'Транспортные самолеты',
                'Беспилотные летательные аппараты (БПЛА)',
                'Разведывательные вертолеты',
                'Ударные вертолеты',
                'Патрульные самолеты',
                'Специальные самолеты (например, для борьбы с беспилотниками)',
                'Учебно-тренировочные самолеты',
                'Танкеры (для воздушной дозаправки)',
                'Эвакуационные самолеты'
            ].includes(product_subtype);
        case 'Тяжелая техника':
            return [
                "Ракетные комплексы",
                "РСЗО",
                "Бронетранспортеры",
                "Танки",
                "Бронеавтомобили",
                "Самоходные артиллерийские установки",
                "Тяжелые гаубицы",
                "Тяжелые минометы",
                "Разведывательные машины",
                "Инженерная техника"
            ].includes(product_subtype);
        case 'Оружие':
            return [
                "Тактические винтовки",
                "Штурмовые винтовки",
                "Пистолеты-пулеметы",
                "Пистолеты",
                "Ручные пулеметы",
                "Снайперские и пехотные винтовки"
            ].includes(product_subtype);
        case 'Амуниция':
            return [
                "Бронежилеты стандартного уровня защиты",
                "Бронежилеты с улучшенной защитой",
                "Бронежилеты с керамическими пластинами",
                "Бронежилеты для общевойсковых подразделений",
                "Бронежилеты для специальных операций (ССО)",
                "Кевларовые бронежилеты",
                "Тканевые бронежилеты",
                "Летные бронежилеты для летного состава",
                "Бронежилеты для бронетехники",
                "Каски боевые стандартного уровня защиты",
                "Каски боевые с улучшенной защитой",
                "Каски боевые с интегрированными коммуникационными средствами",
                "Каски боевые для общевойсковых подразделений",
                "Каски боевые для специальных операций (ССО)",
                "Каски боевые для танкистов",
                "Каски боевые для пилотов",
                "Каски боевые для десантников",
                "Гранаты дымовые",
                "Гранаты осколочные",
                "Гранаты огнемётные",
                "Гранаты штурмовые",
                "Гранаты светозвуковые",
                "Гранаты противотанковые",
                "Гранаты реактивные",
                "Гранаты ударные",
                "Гранаты газовые",
            ].includes(product_subtype);
        case 'Боеприпасы различного калибра':
            return [
                "Патроны калибра 5,45 мм",
                "Патроны калибра 7,62 мм",
                "Патроны калибра 12,7 мм",
                "Патроны калибра 14,5 мм",
                "Снаряды калибра 30 мм",
                "Снаряды калибра 85 мм",
                "Снаряды калибра 125 мм",
                "Снаряды калибра 152 мм",
                "Снаряды калибра 203 мм",
                "Снаряды калибра 240 мм",
                "Снаряды калибра 300 мм"
            ].includes(product_subtype);
        case 'Ракеты класса воздух-земля':
            return [
                "Управляемые авиационные бомбы",
                "Противокорабельные ракеты",
                "Управляемые ракетные комплексы наземного базирования",
                "Ракеты с ИК наведением",
                "Ракеты с радиолокационным наведением",
                "Ракеты с лазерным наведением",
                "Ракеты с ТВ наведением",
                "Ракеты с инерциальным наведением"
            ].includes(product_subtype);
        case 'Ракеты класса воздух-воздух':
            return [
                "Ближнего радиуса действия с ИК наведением",
                "Ближнего радиуса действия с радиолокационным наведением",
                "Среднего радиуса действия с радиолокационным наведением",
                "Дальнего радиуса действия с радиолокационным наведением",
                "Ракеты с активной радиолокационной головкой",
                "Ракеты с полуактивной радиолокационной головкой",
                "Ракеты с тепловой головкой",
                "Ракеты с радиоволновой головкой"
            ].includes(product_subtype);
        case 'Ракеты класса земля-воздух':
            return [
                "Зенитные ракетные комплексы с головками самонаведения по радиолокационной разведке (ГСН)",
                "Зенитные ракетные комплексы с головками самонаведения по радару",
                "Зенитные ракетные комплексы с инфракрасными головками самонаведения",
                "Зенитные ракетные комплексы с лазерными головками самонаведения",
                "Переносные зенитные ракетные комплексы с радиолокационным наведением",
                "Стрелково-пушечные зенитные комплексы с головками самонаведения по радару"
            ].includes(product_subtype);
        case 'Межконтинентальные ракеты':
            return [
                "Баллистические ракеты с одной боеголовкой",
                "Баллистические ракеты с множественными боеголовками",
                "Маневрирующие баллистические ракеты",
                "Баллистические ракеты с ядерным зарядом",
                "Баллистические ракеты с термоядерным зарядом",
                "Баллистические ракеты с конвенциональными боеприпасами",
                "Баллистические ракеты с гиперзвуковыми боеголовками",
                "Межконтинентальные ракеты-носители космических аппаратов",
                "Баллистические ракеты с разделяющимися блоками"
            ].includes(product_subtype);
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
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
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
            return res.status(400).json({ success: false, error: 'Недопустимый тип товара.' });
        }

        // Проверка валидности подтипа товара
        if (!isValidProductSubtype(product_type, product_subtype)) {
            return res.status(400).json({ success: false, error: 'Недопустимый подтип товара.' });
        }

        try {
            // Преобразование массива объектов JSON в строку JSON
            const characteristicsString = JSON.stringify(characteristics);

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

            // Добавляем товар
            const query = 'INSERT INTO products (name, product_type, product_subtype, characteristics, disable, storage_location, quantity, occupied_space, price, reserved_quantity, image_url, production_cost, product_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *';
            const values = [ name, product_type, product_subtype, characteristicsString, false, storage_location, quantity, occupied_space, price, 0, imgUrl, production_cost, product_description ];
            const { rows } = await pool.query(query, values);

            // Увеличиваем занимаемое место на складе на соответствующее количество
            const updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity + $1 WHERE id = $2 RETURNING *';
            const updateWarehouseValues = [ totalOccupiedSpace, storage_location ];
            await pool.query(updateWarehouseQuery, updateWarehouseValues);

            res.status(201).json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
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
            const getProductValues = [ productId ];
            const { rows: productRows } = await pool.query(getProductQuery, getProductValues);

            if (productRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Товар не найден.' });
            } else if (productRows[0].reserved_quantity > 0) {
                return res.status(400).json({
                    success: false,
                    error: `Товар зарезервирован в количестве ${ productRows[0].reserved_quantity }.`
                });
            }

            // Получаем информацию о складе, к которому относится товар
            const warehouseId = productRows[0].storage_location;
            const getWarehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1';
            const getWarehouseValues = [ warehouseId ];
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
                return res.status(400).json({ success: false, error: 'Недостаточно товара на складе для отключения.' });
            }

            // Уменьшаем текущее количество товара на складе на количество мест, которые он занимает
            const updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity - $1 WHERE id = $2';
            const updateWarehouseValues = [ totalOccupiedSpace, warehouseId ];
            await pool.query(updateWarehouseQuery, updateWarehouseValues);

            // Устанавливаем статус товара как отключенный
            const updateProductQuery = 'UPDATE products SET disable = true WHERE id = $1 RETURNING *';
            const updateProductValues = [ productId ];
            await pool.query(updateProductQuery, updateProductValues);

            res.json({ success: true, message: `Товар с id ${ productId } успешно отключен.` });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
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
            return res.status(400).json({ success: false, error: 'Недопустимый тип товара.' });
        }

        // Проверка валидности подтипа товара
        if (!isValidProductSubtype(product_type, product_subtype)) {
            return res.status(400).json({ success: false, error: 'Недопустимый подтип товара.' });
        }

        try {
            // Преобразование массива объектов JSON в строку JSON
            const characteristicsString = JSON.stringify(characteristics);

            // Получаем информацию о товаре, который обновляем
            const getProductQuery = 'SELECT * FROM products WHERE id = $1';
            const getProductValues = [ productId ];
            const { rows: productRows } = await pool.query(getProductQuery, getProductValues);

            if (productRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Товар не найден.' });
            }

            // Получаем информацию о складе, к которому относится товар
            const warehouseId = storage_location || productRows[0].storage_location;
            const getWarehouseQuery = 'SELECT * FROM Warehouses WHERE id = $1';
            const getWarehouseValues = [ warehouseId ];
            const { rows: warehouseRows } = await pool.query(getWarehouseQuery, getWarehouseValues);

            if (warehouseRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Склад не найден.' });
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
                    error: `Количество товара меньше необходимого для резервирования. Текущий резерв: ${ productRows[0].reserved_quantity }`,
                });
            }

            if (((warehouseRows[0].current_capacity - (productRows[0].quantity * productRows[0].occupied_space)) + totalOccupiedSpace) > warehouseRows[0].capacity) {
                return res.status(400).json({ success: false, error: 'Недостаточно свободного места на складе.' });
            }

            // Обновляем товар
            const query = 'UPDATE products SET name = $1, product_type = $2, product_subtype = $3, characteristics = $4, storage_location = $6, quantity = $7, image_url = $8, production_cost = $9, product_description = $10 WHERE id = $5 RETURNING *';
            const values = [ name, product_type, product_subtype, characteristicsString, productId, warehouseId, quantity, imgUrl, production_cost, product_description ];
            const { rows } = await pool.query(query, values);

            if (rows.length === 0) {
                res.status(404).json({ success: false, error: 'Товар не найден.' });
            } else {
                // Обновляем количество товара на складе
                let updateWarehouseQuery = 'UPDATE Warehouses SET current_capacity = current_capacity ';
                let updateWarehouseValues;

                if (updatedQuantity > 0) {
                    updateWarehouseQuery += '+ $1';
                    updateWarehouseValues = [ updatedQuantity * occupiedSpace ];
                } else if (updatedQuantity < 0) {
                    updateWarehouseQuery += '- $1';
                    updateWarehouseValues = [ -updatedQuantity * occupiedSpace ];
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
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    },
};

export default ProductsController;
