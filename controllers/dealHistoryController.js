import { pool } from "../server.js";

const DealHistoryController = {
    getAllDealHistory: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Deal_History');
            res.json(rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default DealHistoryController;
