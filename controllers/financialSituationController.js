import { pool } from "../server.js";

const FinancialSituationController = {
    /**
     * Получает все записи финансовой ситуации из базы данных.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Promise<*>} Промис, который разрешается результатом запроса к базе данных
     */
    getAllFinancialSituation: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM financial_situation WHERE disable = false');
            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },

    /**
     * Обновляет баланс на счете в зависимости от типа операции.
     *
     * @param {Object} req - объект запроса
     * @param {Object} res - объект ответа
     * @return {Promise<*>} Промис, который разрешается результатом запроса к базе данных
     */
    updateBalance: async (req, res) => {
        const { amount, operation_type_id } = req.body;

        if (!amount || !operation_type_id) {
            return res.status(400).json({ success: false, message: 'Необходимо указать сумму и тип операции' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Получаем текущий баланс
            const balanceQuery = 'SELECT current_balance FROM financial_situation ORDER BY report_date DESC LIMIT 1';
            const { rows: balanceRows } = await client.query(balanceQuery);

            const currentBalance = balanceRows.length > 0 ? balanceRows[0].current_balance : 0;

            // Получаем информацию о типе операции
            const operationTypeQuery = 'SELECT name FROM operation_types WHERE id = $1';
            const { rows: operationTypeRows } = await client.query(operationTypeQuery, [ operation_type_id ]);

            if (operationTypeRows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Недопустимый тип операции' });
            }

            const operationType = operationTypeRows[0].name;

            let newBalance;
            let income = 0;
            let expenditure = 0;
            let profit;

            if ([ 'Sale', 'Other' ].includes(operationType)) {
                newBalance = currentBalance + amount;
                income = amount;
                profit = amount;
            } else if ([ 'Production', 'Purchase', 'Maintenance', 'Salary', 'Utilities' ].includes(operationType)) {
                if (amount > currentBalance) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: `Недостаточно средств на счете. Необходимо - ${ amount.toLocaleString('ru-RU', {
                            style: 'currency',
                            currency: 'RUB'
                        }) }, текущий баланс - ${ currentBalance.toLocaleString('ru-RU', {
                            style: 'currency',
                            currency: 'RUB'
                        }) }, недостаточно - ${ (amount - currentBalance).toLocaleString('ru-RU', {
                            style: 'currency',
                            currency: 'RUB'
                        }) }.`
                    });
                }
                newBalance = currentBalance - amount;
                expenditure = amount;
                profit = -amount;
            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Недопустимый тип операции' });
            }

            // Добавляем запись в financial_situation
            const currentDate = new Date().toISOString().split('T')[0];
            const insertFinancialSituationQuery = `
                INSERT INTO financial_situation (report_date, disable, income, expenditure, profit, current_balance, operation_type_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            const insertFinancialSituationValues = [
                currentDate,
                false,
                income,
                expenditure,
                profit,
                newBalance,
                operation_type_id
            ];
            await client.query(insertFinancialSituationQuery, insertFinancialSituationValues);

            await client.query('COMMIT');
            res.status(201).json({
                success: true,
                message: `Баланс успешно ${ income > 0 ? 'пополнен' : 'уменьшен' } на ${ amount.toLocaleString('ru-RU', {
                    style: 'currency',
                    currency: 'RUB'
                }) }`
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, message: `Ошибка сервера. Причина: ${ error.detail }` });
        } finally {
            client.release();
        }
    }
};

export default FinancialSituationController;
