import { pool } from "../server.js";
import CustomersController from "./customersController.js";
import e from "express";

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
            const query = 'SELECT * FROM users';
            const { rows } = await pool.query(query);

            if (!rows[0]) {
                res.status(200).json({ success: false, data: [], message: `Нет пользователей` });
            }

            const { email, password } = req.body;

            if (email === rows[0].email && password === rows[0].password) {
                res.status(200).json({ success: true, data: rows[0] });
            } else {
                res.status(200).json({ success: false, data: [], message: `Не авторизован` });
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },
};

export default authController;