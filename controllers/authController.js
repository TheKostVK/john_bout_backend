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
}, {
    timestamps: false,
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
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${error.detail}` });
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
            const { username, password } = req.body;
            const user = await User.findOne({ where: { username, password } });

            if (!user) {
                return res.status(401).json({ success: false, message: 'Неверные учетные данные' });
            }

            res.status(200).json({ success: true, data: user });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, message: `Ошибка сервера: ${ error.message }` });
        }
    }
};

export default authController;