import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    itemCode: { type: String, required: true, unique: true },
    category: { 
        type: String, 
        required: true,
        enum: ['Medicines', 'Medical Equipment', 'Surgical Instruments', 'Consumables', 'Others']
    },
    description: { type: String },
    manufacturer: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    reorderLevel: { type: Number, required: true, default: 10 },
    maxStockLevel: { type: Number, required: true },
    unit: { 
        type: String, 
        required: true,
        enum: ['Pieces', 'Bottles', 'Boxes', 'Vials', 'Tablets', 'Capsules', 'ML', 'Grams', 'KG']
    },
    supplier: {
        name: { type: String, required: true },
        contact: { type: String },
        email: { type: String }
    },
    location: {
        section: { type: String, required: true },
        shelf: { type: String },
        row: { type: String }
    },
    usage: [{
        date: { type: Date, default: Date.now },
        quantityUsed: { type: Number },
        department: { type: String },
        purpose: { type: String }
    }],
    restockHistory: [{
        date: { type: Date, default: Date.now },
        quantity: { type: Number },
        unitPrice: { type: Number },
        supplier: { type: String },
        batchNumber: { type: String }
    }],
    status: {
        type: String,
        enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired', 'Discontinued'],
        default: 'In Stock'
    },
    alerts: [{
        type: { type: String, enum: ['Low Stock', 'Expiry Warning', 'Expired'] },
        message: { type: String },
        date: { type: Date, default: Date.now },
        acknowledged: { type: Boolean, default: false }
    }],
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
});

// Update status based on quantity and expiry
inventorySchema.pre('save', function(next) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    if (this.expiryDate && this.expiryDate < now) {
        this.status = 'Expired';
    } else if (this.quantity <= 0) {
        this.status = 'Out of Stock';
    } else if (this.quantity <= this.reorderLevel) {
        this.status = 'Low Stock';
    } else {
        this.status = 'In Stock';
    }
    
    this.lastUpdated = now;
    next();
});

const inventoryModel = mongoose.models.inventory || mongoose.model("inventory", inventorySchema);
export default inventoryModel;
