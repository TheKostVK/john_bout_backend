import { pool } from "../server.js";
import { contractStatusValue, contractTypeValue, customersCurrencyValue } from "../globalTypes.js";

const SupplyContractsController = {
    //TODO сделать возврат количества страниц всего и текущей страницы
    /**
     * Получает все договоры поставки из базы данных с учетом фильтров и пагинации.
     *
     * @param {Object} req - объект запроса
     * @param {Object} req.query - Параметры запроса
     * @param {number} [req.query.customer_id] - Идентификатор заказчика (необязательный)
     * @param {string} [req.query.contract_date] - Дата контракта (необязательный)
     * @param {boolean} [req.query.disable] - Статус отключения (необязательный)
     * @param {string} [req.query.produced_tokens] - Произведенные токены (необязательный)
     * @param {string} [req.query.description] - Описание контракта (необязательный)
     * @param {number} [req.query.contract_amount] - Сумма контракта (необязательный)
     * @param {string} [req.query.contract_type] - Тип контракта (необязательный)
     * @param {string} [req.query.currency] - Валюта контракта (необязательный)
     * @param {string} [req.query.contract_status] - Статус контракта (необязательный)
     * @param {number} [req.query.production_cost] - Стоимость производства (необязательный)
     * @param {number} [req.query.page] - Номер страницы (необязательный)
     * @param {number} [req.query.limit] - Количество объектов на странице (необязательный)
     * @param {Object} res - объект ответа
     * @return {Promise<*>} JSON-ответ со списком договоров поставки
     */
    getAllSupplyContracts: async (req, res) => {
        const {
            customer_id,
            contract_date,
            disable,
            produced_tokens,
            description,
            contract_amount,
            contract_type,
            currency,
            contract_status,
            production_cost,
            page = 1,
            limit = 10
        } = req.query;
        const offset = (page - 1) * limit;

        let filterConditions = 'WHERE 1=1';
        const filterValues = [];

        if (customer_id !== undefined) {
            filterConditions += ' AND customer_id = $' + (filterValues.length + 1);
            filterValues.push(Number(customer_id));
        }

        if (contract_date) {
            filterConditions += ' AND DATE(contract_date) = $' + (filterValues.length + 1);
            filterValues.push(contract_date);
        }

        if (disable !== undefined) {
            filterConditions += ' AND disable = $' + (filterValues.length + 1);
            filterValues.push(disable === 'true');
        }

        if (produced_tokens) {
            filterConditions += ' AND produced_tokens::text ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ produced_tokens }%`);
        }

        if (description) {
            filterConditions += ' AND description ILIKE $' + (filterValues.length + 1);
            filterValues.push(`%${ description }%`);
        }

        if (contract_amount !== undefined) {
            filterConditions += ' AND contract_amount >= $' + (filterValues.length + 1);
            filterValues.push(Number(contract_amount));
        }

        if (contract_type) {
            if (!contractTypeValue.includes(contract_type)) {
                return res.status(400).json({ success: false, message: 'Недопустимый тип контракта' });
            }
            filterConditions += ' AND contract_type = $' + (filterValues.length + 1);
            filterValues.push(contract_type);
        }

        if (currency) {
            if (!customersCurrencyValue.includes(currency)) {
                return res.status(400).json({ success: false, message: 'Недопустимая валюта контракта' });
            }
            filterConditions += ' AND currency = $' + (filterValues.length + 1);
            filterValues.push(currency);
        }

        if (contract_status) {
            if (!contractStatusValue.includes(contract_status)) {
                return res.status(400).json({ success: false, message: 'Недопустимый статус контракта' });
            }
            filterConditions += ' AND contract_status = $' + (filterValues.length + 1);
            filterValues.push(contract_status);
        }

        if (production_cost !== undefined) {
            filterConditions += ' AND production_cost >= $' + (filterValues.length + 1);
            filterValues.push(Number(production_cost));
        }

        const query = `SELECT * FROM Supply_Contracts ${filterConditions} LIMIT $${filterValues.length + 1} OFFSET $${filterValues.length + 2}`;
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
            produced_tokens,
            description,
            contract_amount,
            contract_type,
            currency,
            contract_status
        } = req.body;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Вычисляем общую стоимость производства
            let totalProductionCost = 0;
            // Проверка доступности токенов
            for (const token of produced_tokens) {
                const { jwt_token } = token;

                // Получаем информацию о произведенном товаре
                const getProductQuery = 'SELECT jwt_token, production_cost FROM produced_objects WHERE jwt_token = $1';
                const { rows } = await client.query(getProductQuery, [jwt_token]);

                if (rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: `Товар с токеном ${ jwt_token } не найден.`
                    });
                }

                // Умножаем стоимость производства одного товара на количество товаров в контракте
                totalProductionCost += Number(rows[0].production_cost);
            }

            // Проверка суммы контракта меньше общей стоимости производства
            if (contract_amount < totalProductionCost) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Сумма контракта меньше общей стоимости производства.'
                });
            } else if (totalProductionCost < 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Общая стоимость производства меньше нуля.'
                });
            }

            // Преобразование массива объектов JSON в строку JSON
            const producedTokensString = JSON.stringify(produced_tokens);

            // Вставка контракта в базу данных
            const insertContractQuery = `
                INSERT INTO Supply_Contracts (
                    customer_id, 
                    contract_date, 
                    disable, 
                    produced_tokens, 
                    description, 
                    contract_amount, 
                    contract_type, 
                    currency, 
                    contract_status, 
                    production_cost
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *;
            `;
            const insertContractValues = [
                customer_id,
                contract_date,
                false,
                producedTokensString,
                description,
                contract_amount,
                contract_type,
                currency,
                contract_status,
                totalProductionCost
            ];

            const { rows: insertedContract } = await client.query(insertContractQuery, insertContractValues);

            // Обновление состояния произведенных товаров
            for (const token of produced_tokens) {
                const { jwt_token } = token;

                const updateReservationQuery = `
                    UPDATE produced_objects
                    SET contract_id = $1
                    WHERE jwt_token = $2;
                `;
                const updateReservationValues = [insertedContract[0].id, jwt_token];

                await client.query(updateReservationQuery, updateReservationValues);
            }

            // Создаем запись в financial_situation
            const currentDate = new Date().toISOString().split('T')[0];
            const balanceQuery = 'SELECT current_balance FROM financial_situation ORDER BY report_date DESC LIMIT 1';
            const { rows: balanceRows } = await client.query(balanceQuery);

            const currentBalance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;
            const newBalance = currentBalance - totalProductionCost;
            const operationTypeId = 2; // ID операции "Создание контракта" из таблицы operation_types

            const insertFinancialSituationQuery = `
                INSERT INTO financial_situation (report_date, disable, income, expenditure, profit, current_balance, operation_type_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            const insertFinancialSituationValues = [currentDate, false, 0, totalProductionCost, -totalProductionCost, newBalance, operationTypeId];
            await client.query(insertFinancialSituationQuery, insertFinancialSituationValues);

            await client.query('COMMIT');

            res.status(201).json({ success: true, data: insertedContract[0] });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        } finally {
            client.release();
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
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Получаем информацию о контракте
            const getContractQuery = 'SELECT * FROM Supply_Contracts WHERE id = $1';
            const { rows: contractRows } = await client.query(getContractQuery, [contractId]);

            if (contractRows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Контракт не найден.'
                });
            }

            // Проверяем, был ли контракт уже завершен
            if (contractRows[0].disable) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Контракт уже завершен.'
                });
            }

            // Обновляем статус контракта и переводим его в "Выполнен"
            const updateContractQuery = 'UPDATE Supply_Contracts SET disable = true, contract_status = $2 WHERE id = $1 RETURNING *';
            const updateContractValues = [contractId, 'Выполнен'];

            await client.query(updateContractQuery, updateContractValues);

            // Получаем текущий баланс из последней записи в таблице financial_situation
            const getBalanceQuery = `
            SELECT current_balance 
            FROM financial_situation 
            ORDER BY report_date DESC 
            LIMIT 1`;

            const { rows: balanceRows } = await client.query(getBalanceQuery);

            const currentBalance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;

            // Рассчитываем изменение баланса на основе прибыли от контракта
            const profit = contractRows[0].contract_amount - contractRows[0].production_cost;
            const newBalance = currentBalance + profit;

            // Вставляем новую запись в таблицу financial_situation
            const insertFinancialSituationQuery = `
            INSERT INTO financial_situation (report_date, disable, income, expenditure, profit, current_balance, operation_type_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`;

            const currentDate = new Date().toISOString().split('T')[0]; // Получаем текущую дату в формате YYYY-MM-DD
            const operationTypeId = 3; // ID операции "Завершение контракта" из таблицы operation_types
            const insertFinancialSituationValues = [currentDate, false, contractRows[0].contract_amount, contractRows[0].production_cost, profit, newBalance, operationTypeId];

            await client.query(insertFinancialSituationQuery, insertFinancialSituationValues);

            await client.query('COMMIT');

            res.status(200).json({ success: true, message: `Контракт с id ${ contractId } завершен успешно.` });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        } finally {
            client.release();
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
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Проверяем, что новый статус контракта указан и является допустимым
            const allowedStatuses = ['Ожидает подтверждения', 'В процессе выполнения', 'Выполнен', 'Отменен'];

            if (!newStatus || !allowedStatuses.includes(newStatus)) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Не указан новый допустимый статус контракта.'
                });
            }

            // Если контракт отменяется, уменьшаем зарезервированное количество товаров
            if (newStatus === 'Отменен') {
                // Получаем информацию о произведенных товарах в контракте
                const getTokensQuery = 'SELECT produced_tokens FROM Supply_Contracts WHERE id = $1';
                const { rows: contractRows } = await client.query(getTokensQuery, [contractId]);

                const producedTokens = JSON.parse(contractRows[0].produced_tokens);

                // Обновляем состояние произведенных товаров
                for (const token of producedTokens) {
                    const { jwt_token } = token;
                    const updateProductQuery = `
                        UPDATE produced_objects 
                        SET contract_id = NULL 
                        WHERE jwt_token = $1
                    `;
                    const updateProductValues = [jwt_token];

                    await client.query(updateProductQuery, updateProductValues);
                }
            }

            // Обновляем статус контракта
            const updateContractQuery = 'UPDATE Supply_Contracts SET contract_status = $1 WHERE id = $2 RETURNING *';
            const updateContractValues = [newStatus, contractId];
            const { rows } = await client.query(updateContractQuery, updateContractValues);

            if (rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Контракт не найден.'
                });
            }

            await client.query('COMMIT');

            res.status(200).json({
                success: true,
                message: `Статус контракта с id ${ contractId } успешно изменен на "${ newStatus }".`
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        } finally {
            client.release();
        }
    }
};

export default SupplyContractsController;
