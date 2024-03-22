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
            // Вычисляем общую стоимость производства
            let totalProductionCost = 0;
            // Проверка доступности товаров на складе
            for (const product of products_sales) {
                const { id, quantity } = product;

                // Получаем информацию о товаре
                const getProductQuery = 'SELECT quantity, reserved_quantity, production_cost FROM products WHERE id = $1';
                const { rows } = await pool.query(getProductQuery, [ id ]);

                if (rows.length === 0) return res.status(404).json({
                    success: false,
                    error: `Товар с id ${ id } не найден.`
                });


                const availableQuantity = rows[0].quantity - rows[0].reserved_quantity;

                if (quantity > availableQuantity) return res.status(400).json({
                    success: false,
                    error: `Недостаточное количество товара с id ${ id } на складе.`
                });

                // Умножаем стоимость производства одного товара на количество товаров в контракте
                totalProductionCost += rows[0].production_cost * quantity;
            }

            // Проверка суммы контракта меньше общей стоимости производства
            if (contract_amount < totalProductionCost) {
                return res.status(400).json({
                    success: false,
                    error: 'Сумма контракта меньше общей стоимости производства.'
                });
            } else if (totalProductionCost < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Общая стоимость производства меньше нуля.'
                });
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
                    contract_status, 
                    production_cost
                )
                VALUES ($1, $2, false, $3, $4, $5, $6, $7, $8, $9)
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
                contract_status,
                totalProductionCost
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
                const updateReservationValues = [ quantity, id ];

                await pool.query(updateReservationQuery, updateReservationValues);
            }

            res.status(201).json({ success: true, data: insertedContract[0] });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    },
    /**
     * Завершает контракт и обновляет количество товаров.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Object} - результат обновления контракта
     */
    completeContract: async (req, res) => {
        const contractId = req.params.id;

        try {
            // Получаем информацию о контракте
            const getContractQuery = 'SELECT * FROM Supply_Contracts WHERE id = $1';
            const { rows: contractRows } = await pool.query(getContractQuery, [ contractId ]);

            if (contractRows.length === 0) return res.status(404).json({
                success: false,
                error: 'Контракт не найден.'
            });

            // Проверяем, был ли контракт уже завершен
            if (contractRows[0].disable) return res.status(400).json({
                success: false,
                error: 'Контракт уже завершен.'
            });

            // Обновляем количество товаров
            const productsSales = contractRows[0].products_sales;

            for (const product of productsSales) {
                const { id, quantity } = product;
                const updateProductQuery = 'UPDATE products SET quantity = quantity - $1, reserved_quantity = reserved_quantity - $1 WHERE id = $2';
                const updateProductValues = [ quantity, id ];
                await pool.query(updateProductQuery, updateProductValues);
            }

            // Вставляем данные контракта в таблицу deal_history
            const insertDealQuery = `
            INSERT INTO deal_history (deal_date, deal_description, deal_amount, deal_type, disable, product_sales, currency, deal_status, customer_id, production_cost)
            SELECT contract_date, description, contract_amount, contract_type, false, products_sales, currency, 'Выполнен', customer_id, production_cost
            FROM Supply_Contracts WHERE id = $1`;

            await pool.query(insertDealQuery, [ contractId ]);

            // Обновляем статус контракта и переводим его в "Выполнен"
            const updateContractQuery = 'UPDATE Supply_Contracts SET disable = true, contract_status = $2 WHERE id = $1 RETURNING *';
            const updateContractValues = [ contractId, 'Выполнен' ];

            await pool.query(updateContractQuery, updateContractValues);

            // Получаем текущий баланс из последней записи в таблице financial_situation
            const getBalanceQuery = `
            SELECT COALESCE(current_balance, 0) 
            FROM financial_situation 
            ORDER BY report_date DESC 
            LIMIT 1`;

            const { rows: balanceRows } = await pool.query(getBalanceQuery);

            const currentBalance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;

            // Рассчитываем изменение баланса на основе прибыли от контракта
            const profit = contractRows[0].contract_amount - contractRows[0].production_cost;
            const newBalance = currentBalance + profit;

            // Вставляем новую запись в таблицу financial_situation
            const insertFinancialSituationQuery = `
            INSERT INTO financial_situation (report_date, income, expenditure, profit, current_balance)
            VALUES ($1, $2, $3, $4, $5)`;

            const currentDate = new Date().toISOString().split('T')[0]; // Получаем текущую дату в формате YYYY-MM-DD
            const insertFinancialSituationValues = [currentDate, contractRows[0].contract_amount, contractRows[0].production_cost, profit, newBalance];

            await pool.query(insertFinancialSituationQuery, insertFinancialSituationValues);

            res.status(200).json({ success: true, message: `Контракт с id ${ contractId } завершен успешно.` });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    },
    /**
     * Метод для изменения статуса контракта.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Object} - результат изменения статуса контракта
     */
    changeContractStatus: async (req, res) => {
        const contractId = req.params.id;
        const newStatus = req.body.newStatus;

        try {
            // Проверяем, что новый статус контракта указан и является допустимым
            const allowedStatuses = [ 'В ожидании', 'В процессе производства', 'В процессе доставки', 'Выполнен', 'Отменен' ];
            if (!newStatus || !allowedStatuses.includes(newStatus)) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан новый допустимый статус контракта.'
                });
            }

            // Если контракт отменяется, уменьшаем зарезервированное количество товаров
            if (newStatus === 'Отменен') {
                // Получаем информацию о товарах в контракте
                const getProductsQuery = 'SELECT products_sales FROM Supply_Contracts WHERE id = $1';
                const { rows: contractRows } = await pool.query(getProductsQuery, [ contractId ]);

                // Уменьшаем зарезервированное количество для каждого товара в контракте
                for (const product of contractRows[0].products_sales) {
                    const { id, quantity } = product;
                    const updateProductQuery = 'UPDATE products SET reserved_quantity = reserved_quantity - $1 WHERE id = $2';
                    const updateProductValues = [ quantity, id ];

                    await pool.query(updateProductQuery, updateProductValues);
                }
            }

            // Обновляем статус контракта
            const updateContractQuery = 'UPDATE Supply_Contracts SET contract_status = $1 WHERE id = $2 RETURNING *';
            const updateContractValues = [ newStatus, contractId ];
            const { rows } = await pool.query(updateContractQuery, updateContractValues);

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Контракт не найден.'
                });
            }

            res.status(200).json({
                success: true,
                message: `Статус контракта с id ${ contractId } успешно изменен на "${ newStatus }".`
            });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера, код - 500'
            });
        }
    }
};

export default SupplyContractsController;
