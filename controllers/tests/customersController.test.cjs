// Мокаем объект pool
const pool = {
    query: jest.fn()
};

const { getAllCustomers } = {
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
            res.status(500).json({ success: false, data: [], message: 'Ошибка сервера, код - 500' });
        }
    }
};

// Мокаем объекты запроса и ответа
const req = {};
const res = {
    status: jest.fn(() => res),
    json: jest.fn()
};

describe('getAllCustomers', () => {
    it('должна возвращать всех клиентов из базы данных', async () => {
        // Мокаем результат запроса
        const mockQueryResult = [{ id: 1, name: 'Клиент 1' }, { id: 2, name: 'Клиент 2' }];
        pool.query.mockResolvedValueOnce({ rows: mockQueryResult });

        // Вызываем функцию
        await getAllCustomers(req, res);

        // Проверяем, был ли вызван pool.query с правильным SQL-запросом
        expect(pool.query).toHaveBeenCalledWith('SELECT * FROM customers WHERE disable = false');

        // Проверяем, был ли вызван res.status с кодом 200
        expect(res.status).toHaveBeenCalledWith(200);

        // Проверяем, был ли вызван res.json с правильными данными
        expect(res.json).toHaveBeenCalledWith({ success: true, data: mockQueryResult });
    });

    it('должна обрабатывать ошибки', async () => {
        // Мокаем запрос, чтобы выбросить ошибку
        const error = new Error('Ошибка базы данных');
        pool.query.mockRejectedValueOnce(error);

        // Вызываем функцию
        await getAllCustomers(req, res);

        // Проверяем, был ли вызван res.status с кодом 500
        expect(res.status).toHaveBeenCalledWith(500);

        // Проверяем, был ли вызван res.json с правильным сообщением об ошибке
        expect(res.json).toHaveBeenCalledWith({ success: false, data: [], message: 'Ошибка сервера, код - 500' });
    });
});
