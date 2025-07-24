import inventoryModel from '../models/inventoryModel.js';

// Add new inventory item
const addInventoryItem = async (req, res) => {
    try {
        const {
            itemName, category, description, manufacturer, batchNumber,
            expiryDate, unitPrice, quantity, reorderLevel, maxStockLevel,
            unit, supplier, location
        } = req.body;

        // Generate item code
        const categoryCode = category.substring(0, 3).toUpperCase();
        const count = await inventoryModel.countDocuments();
        const itemCode = `${categoryCode}${String(count + 1).padStart(4, '0')}`;

        const inventoryData = {
            itemName,
            itemCode,
            category,
            description,
            manufacturer,
            batchNumber,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            unitPrice: Number(unitPrice),
            quantity: Number(quantity),
            reorderLevel: Number(reorderLevel),
            maxStockLevel: Number(maxStockLevel),
            unit,
            supplier: JSON.parse(supplier),
            location: JSON.parse(location)
        };

        const newItem = new inventoryModel(inventoryData);
        await newItem.save();

        // Check for alerts
        await checkAndCreateAlerts(newItem);

        res.json({ success: true, message: 'Inventory item added successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get all inventory items
const getAllInventoryItems = async (req, res) => {
    try {
        const { category, status } = req.query;
        let filter = {};

        if (category && category !== 'All') {
            filter.category = category;
        }
        if (status && status !== 'All') {
            filter.status = status;
        }

        const items = await inventoryModel.find(filter).select('-__v').sort({ itemName: 1 });
        res.json({ success: true, items });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const updateData = { ...req.body };

        // Parse JSON fields if they exist
        if (updateData.supplier && typeof updateData.supplier === 'string') {
            updateData.supplier = JSON.parse(updateData.supplier);
        }
        if (updateData.location && typeof updateData.location === 'string') {
            updateData.location = JSON.parse(updateData.location);
        }

        // Convert dates and numbers
        if (updateData.expiryDate) {
            updateData.expiryDate = new Date(updateData.expiryDate);
        }
        if (updateData.unitPrice) {
            updateData.unitPrice = Number(updateData.unitPrice);
        }
        if (updateData.quantity) {
            updateData.quantity = Number(updateData.quantity);
        }
        if (updateData.reorderLevel) {
            updateData.reorderLevel = Number(updateData.reorderLevel);
        }

        const updatedItem = await inventoryModel.findByIdAndUpdate(itemId, updateData, { new: true });
        
        if (!updatedItem) {
            return res.json({ success: false, message: 'Item not found' });
        }

        // Check for alerts
        await checkAndCreateAlerts(updatedItem);

        res.json({ success: true, message: 'Item updated successfully', item: updatedItem });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Record usage
const recordUsage = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantityUsed, department, purpose } = req.body;

        const item = await inventoryModel.findById(itemId);
        if (!item) {
            return res.json({ success: false, message: 'Item not found' });
        }

        if (item.quantity < quantityUsed) {
            return res.json({ success: false, message: 'Insufficient quantity available' });
        }

        // Update quantity
        item.quantity -= quantityUsed;

        // Record usage
        item.usage.push({
            quantityUsed: Number(quantityUsed),
            department,
            purpose
        });

        await item.save();

        // Check for alerts
        await checkAndCreateAlerts(item);

        res.json({ success: true, message: 'Usage recorded successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Restock item
const restockItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity, unitPrice, supplier, batchNumber } = req.body;

        const item = await inventoryModel.findById(itemId);
        if (!item) {
            return res.json({ success: false, message: 'Item not found' });
        }

        // Update quantity
        item.quantity += Number(quantity);

        // Record restock
        item.restockHistory.push({
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            supplier,
            batchNumber
        });

        // Update unit price if provided
        if (unitPrice) {
            item.unitPrice = Number(unitPrice);
        }

        await item.save();

        // Check for alerts
        await checkAndCreateAlerts(item);

        res.json({ success: true, message: 'Item restocked successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get low stock alerts
const getLowStockAlerts = async (req, res) => {
    try {
        const lowStockItems = await inventoryModel.find({
            $or: [
                { status: 'Low Stock' },
                { status: 'Out of Stock' }
            ]
        }).select('itemName itemCode quantity reorderLevel status category');

        res.json({ success: true, alerts: lowStockItems });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get expiry alerts
const getExpiryAlerts = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        const expiringItems = await inventoryModel.find({
            expiryDate: {
                $lte: thirtyDaysFromNow,
                $gte: now
            }
        }).select('itemName itemCode expiryDate quantity status category');

        const expiredItems = await inventoryModel.find({
            expiryDate: { $lt: now }
        }).select('itemName itemCode expiryDate quantity status category');

        res.json({ 
            success: true, 
            expiringItems, 
            expiredItems 
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Helper function to check and create alerts
const checkAndCreateAlerts = async (item) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Clear existing alerts for this item
    item.alerts = [];

    // Check for low stock
    if (item.quantity <= item.reorderLevel && item.quantity > 0) {
        item.alerts.push({
            type: 'Low Stock',
            message: `${item.itemName} is running low. Current quantity: ${item.quantity}, Reorder level: ${item.reorderLevel}`
        });
    }

    // Check for expiry warnings
    if (item.expiryDate) {
        if (item.expiryDate < now) {
            item.alerts.push({
                type: 'Expired',
                message: `${item.itemName} has expired on ${item.expiryDate.toDateString()}`
            });
        } else if (item.expiryDate <= thirtyDaysFromNow) {
            const daysToExpiry = Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24));
            item.alerts.push({
                type: 'Expiry Warning',
                message: `${item.itemName} will expire in ${daysToExpiry} days on ${item.expiryDate.toDateString()}`
            });
        }
    }

    await item.save();
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const deletedItem = await inventoryModel.findByIdAndDelete(itemId);
        
        if (!deletedItem) {
            return res.json({ success: false, message: 'Item not found' });
        }

        res.json({ success: true, message: 'Item deleted successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    addInventoryItem,
    getAllInventoryItems,
    updateInventoryItem,
    recordUsage,
    restockItem,
    getLowStockAlerts,
    getExpiryAlerts,
    deleteInventoryItem
};
