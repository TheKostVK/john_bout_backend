import { pool } from "../server.js";

const SupplyContractsController = {
    getAllSupplyContracts: async (req, res) => {
        try {
            const { rows } = await pool.query('SELECT * FROM Supply_Contracts');
            res.json(rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default SupplyContractsController;
