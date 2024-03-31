import { pool } from "../server.js";

const DealHistoryController = {
    getAllDealHistory: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Deal_History WHERE disable = false');
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, data: [], message: 'Ошибка сервера, код - 500' });
        }
    }
};

export default DealHistoryController;
