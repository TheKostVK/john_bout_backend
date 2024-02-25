import { pool } from "../server.js";

const WarehousesController = {
    getAllWarehouses: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Warehouses');
            res.json(rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default WarehousesController;
