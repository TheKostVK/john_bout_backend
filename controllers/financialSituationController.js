import { pool } from "../server.js";

const FinancialSituationController = {
    getAllFinancialSituation: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Financial_Situation WHERE disable = false');
            res.status(200).json({ success: true, data: rows });
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ success: false, data: [], message: `Ошибка сервера. Причина: ${ error.detail }` });
        }
    }
};

export default FinancialSituationController;
