import mongoose from "mongoose";

const billingSchema = new mongoose.Schema({
    billNumber: { type: String, required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    patientName: { type: String, required: true },
    patientContact: { type: String, required: true },
    billType: { 
        type: String, 
        required: true,
        enum: ['Consultation', 'Procedure', 'Surgery', 'Medicine', 'Lab Test', 'Room Charges', 'Emergency', 'Other', 'OPD', 'IPD', 'Diagnostic', 'Pharmacy']
    },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment' },
    admissionId: { type: String }, // For IPD cases
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor' },
    doctorName: { type: String },
    
    services: [{
        serviceName: { type: String, required: true },
        serviceCode: { type: String },
        category: { 
            type: String, 
            enum: ['Consultation', 'Diagnostic', 'Treatment', 'Surgery', 'Medicine', 'Room Charges', 'Other']
        },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 }
    }],
    
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Partially Paid', 'Partial', 'Overdue', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },
    
    // Direct payment fields for simple payments
    paymentMethod: { 
        type: String, 
        enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance', 'Cheque', 'Dummy Payment']
    },
    paidDate: { type: Date },
    
    payments: [{
        paymentId: { type: String, required: true },
        amount: { type: Number, required: true },
        paymentMethod: { 
            type: String, 
            enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance', 'Cheque'],
            required: true
        },
        transactionId: { type: String },
        paymentDate: { type: Date, default: Date.now },
        status: { 
            type: String, 
            enum: ['Success', 'Failed', 'Pending'],
            default: 'Success'
        }
    }],
    
    insurance: {
        hasInsurance: { type: Boolean, default: false },
        insuranceProvider: { type: String },
        policyNumber: { type: String },
        claimAmount: { type: Number, default: 0 },
        approvedAmount: { type: Number, default: 0 },
        claimStatus: { 
            type: String, 
            enum: ['Not Applicable', 'Pending', 'Approved', 'Rejected', 'Partial']
        }
    },
    
    billingDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    
    notes: { type: String },
    generatedBy: { type: String, required: true }, // Staff ID or system
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate totals
billingSchema.pre('save', function(next) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    this.services.forEach(service => {
        subtotal += service.totalPrice;
        totalDiscount += service.discount || 0;
        totalTax += service.tax || 0;
    });
    
    this.subtotal = subtotal;
    this.totalDiscount = totalDiscount;
    this.totalTax = totalTax;
    this.totalAmount = subtotal - totalDiscount + totalTax;
    
    // Calculate payment status
    const totalPaid = this.payments.reduce((sum, payment) => {
        return payment.status === 'Success' ? sum + payment.amount : sum;
    }, 0);
    
    if (totalPaid >= this.totalAmount) {
        this.paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
        this.paymentStatus = 'Partial';
    } else {
        this.paymentStatus = 'Pending';
    }
    
    this.updatedAt = new Date();
    next();
});

const billingModel = mongoose.models.billing || mongoose.model("billing", billingSchema);
export default billingModel;
