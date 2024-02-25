import { pool } from "../server.js";

const SupplyContractsController = {
    /**
     * Получает все договоры поставки из базы данных.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Promise} Промис, который разрешается результатом запроса к базе данных
     */
    getAllSupplyContracts: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Supply_Contracts WHERE disable = false');
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    },
    /**
     * Создает поставочный контракт на основе предоставленных данных запроса.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Object} данные созданного поставочного контракта
     */
    createSupplyContract: async (req, res) => {
        const {
            customer_id,
            contract_date,
            products_sales,
            description,
            contract_amount,
            contract_type,
            currency,
            contract_status
        } = req.body;

        try {
            // Проверка доступности товаров на складе
            for (const product of products_sales) {
                const { id, quantity } = product;

                // Получаем информацию о товаре
                const getProductQuery = 'SELECT quantity, reserved_quantity FROM products WHERE id = $1';
                const { rows } = await pool.query(getProductQuery, [id]);

                if (rows.length === 0) {
                    return res.status(404).json({ success: false, error: `Товар с id ${id} не найден.` });
                }

                const availableQuantity = rows[0].quantity - rows[0].reserved_quantity;

                if (quantity > availableQuantity) {
                    return res.status(400).json({ success: false, error: `Недостаточное количество товара с id ${id} на складе.` });
                }
            }

            // Преобразование массива объектов JSON в строку JSON
            const productsSalesString = JSON.stringify(products_sales);

            // Вставка контракта в базу данных
            const insertContractQuery = `
                INSERT INTO Supply_Contracts (
                    customer_id, 
                    contract_date, 
                    disable, 
                    products_sales, 
                    description, 
                    contract_amount, 
                    contract_type, 
                    currency, 
                    contract_status
                )
                VALUES ($1, $2, false, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const insertContractValues = [
                customer_id,
                contract_date,
                productsSalesString,
                description,
                contract_amount,
                contract_type,
                currency,
                contract_status
            ];

            const { rows: insertedContract } = await pool.query(insertContractQuery, insertContractValues);

            // Обновление количества зарезервированных товаров
            for (const product of products_sales) {
                const { id, quantity } = product;

                const updateReservationQuery = `
                    UPDATE products
                    SET reserved_quantity = reserved_quantity + $1
                    WHERE id = $2;
                `;
                const updateReservationValues = [quantity, id];

                await pool.query(updateReservationQuery, updateReservationValues);
            }

            res.status(201).json({ success: true, data: insertedContract[0] });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    },
};

export default SupplyContractsController;
