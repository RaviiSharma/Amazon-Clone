const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User",
        required: [true, "userId is required"],
    },
    items: [{
        productId: {
            type: ObjectId,
            ref: "Product",
            required: [true, "productId is required"],
        },
        quantity: {
            type: Number,
            required: [true, "product quantity is required"],
            min: 1,
        },
         _id : false
    }],
    totalPrice: { 
        type: Number, 
        required: [true, "total Price is required"]
    },
    totalItems: { 
        type: Number, 
        required: [true, "total Items is required"]
    },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);