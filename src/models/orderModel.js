const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User",
        required: [true, "userId is required"],
    },
    items: [{
        productId: {
            type: ObjectId,
            ref: "Product",
            required: [true, "product id is required"],
        },
        quantity: {
            type: Number,
            required: [true, "product quantity is required"],
            min: 1,
        },
    }, ],
    totalPrice: { 
        type: Number, 
        required: [true, "totalPrice is required"] 
    },
    totalItems: { 
        type: Number, 
        required: [true, "totalItems is required"] 
    },
    totalQuantity: {
        type: Number,
        required: [true, "total product quantity is required"],
    },
    cancellable: { 
        type: Boolean, 
        default: true 
    },
    status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending",
    },
    deletedAt: { 
        type: Date, 
        default: null 
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
}, { timestamps: true });


module.exports = mongoose.model("Order", orderSchema)