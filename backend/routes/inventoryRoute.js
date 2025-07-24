import express from 'express';
import {
    addInventoryItem,
    getAllInventoryItems,
    updateInventoryItem,
    recordUsage,
    restockItem,
    getLowStockAlerts,
    getExpiryAlerts,
    deleteInventoryItem
} from '../controllers/inventoryController.js';
import authAdmin from '../middleware/authAdmin.js';

const inventoryRouter = express.Router();

inventoryRouter.post("/add", authAdmin, addInventoryItem);
inventoryRouter.get("/list", authAdmin, getAllInventoryItems);
inventoryRouter.put("/update/:itemId", authAdmin, updateInventoryItem);
inventoryRouter.post("/usage/:itemId", authAdmin, recordUsage);
inventoryRouter.post("/restock/:itemId", authAdmin, restockItem);
inventoryRouter.get("/alerts/low-stock", authAdmin, getLowStockAlerts);
inventoryRouter.get("/alerts/expiry", authAdmin, getExpiryAlerts);
inventoryRouter.delete("/delete/:itemId", authAdmin, deleteInventoryItem);

export default inventoryRouter;
