import { pool } from "../server.js";

const CustomersController = {
    getAllCustomers: async (req, res): Promise<void> => {
        try {
            const { rows } = await pool.query('SELECT * FROM customers');

            res.json(rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default CustomersController;
