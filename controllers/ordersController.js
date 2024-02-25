import { pool } from "../server.js";

const OrdersController = {
    getAllOrders: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM orders');

            res.json(rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getAllOrderItems: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Order_Items');
            res.json(rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default OrdersController;
