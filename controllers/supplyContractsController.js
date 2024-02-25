import { pool } from "../server.js";

const SupplyContractsController = {
    getAllSupplyContracts: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Supply_Contracts WHERE disable = false');
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error('Ошибка запроса:', err);
            res.status(500).json({ success: false, error: 'Ошибка сервера, код - 500' });
        }
    }
};

export default SupplyContractsController;
