import { pool } from "../server.js";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize('JohnBout', 'postgres', 'admin', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
});

const User = sequelize.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: Sequelize.STRING,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

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
                return res.status(200).json({ success: false, data: [], message: `Не авторизован` });
            }

            const { username, password } = req.body;

            if (username === rows[0].username && password === rows[0].password) {
                return res.status(200).json({ success: true, data: rows[0] });
            } else {
                return res.status(200).json({ success: false, data: [], message: `Не авторизован` });
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    },
    /**
     * Тестовый ORM запрос на авторизацию пользователя.
     *
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @return {Promise<void>} Промис, который разрешается, когда операция завершена
     */
    loginORM: async (req, res) => {
        try {
            const user = await User.findOne({ where: { username: req.body.username, password: req.body.password } });

            if (!user) {
                return res.status(200).json({ success: false, data: [], message: `Не авторизован` });
            }

            res.status(200).json({ success: true, data: user });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    }
};

export default authController;