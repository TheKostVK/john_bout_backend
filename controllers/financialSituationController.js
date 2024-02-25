import { pool } from "../server.js";

const FinancialSituationController = {
    getAllFinancialSituation: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Financial_Situation WHERE disable = false');
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    }
};

export default FinancialSituationController;
