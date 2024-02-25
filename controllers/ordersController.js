import { pool } from "../server.js";

const OrdersController = {
    getAllOrders: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM orders');

            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    },
    getAllOrderItems: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Order_Items');
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    }
};

export default OrdersController;
