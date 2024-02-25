import { pool } from "../server.js";

const WarehousesController = {
    getAllWarehouses: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Warehouses');
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500:' });
        }
    }
};

export default WarehousesController;
