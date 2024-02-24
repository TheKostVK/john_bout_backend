import { pool } from "../server.js";

const ProductsController = {
    getAllProducts: async (req, res): Promise<void> => {
        try {
            const { rows } = await pool.query('SELECT * FROM products');

            res.json(rows);
        } catch (err) {
            console.error('Error executing query', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

export default ProductsController;
