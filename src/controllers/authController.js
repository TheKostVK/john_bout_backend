import { pool } from "../server.js";

const authController = {
    /**
     * Проверяет данные пользователя для входа в систему и отправляет результат в виде JSON-ответа.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} Промис, который разрешается, когда операция завершена
     */
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
            const values = [username, password];
            const { rows } = await pool.query(query, values);

            if (rows.length === 0) {
                return res.status(200).json({ success: false, data: [], message: 'Не авторизован' });
            }

            return res.status(200).json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },
};

export default authController;