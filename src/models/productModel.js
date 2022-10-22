const mongoose = require("mongoose");
const {isValidPrice} = require("../utilities/validator")


const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "title is required"],
        unique: [true, "title is unique"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "product description is required"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "product price is required"],
        validate: [isValidPrice, "enter a valid price"],
    },
    currencyId: {
        type: String,
        required: [true, "currencyId is required"],
        trim: true,
        uppercase: true,
    },
    currencyFormat: {
        type: String,
        required: [true, "currencyFormat is required"],
    },
    isFreeShipping: {
        type: Boolean,
        default: false
    },
    productImage: {
        type: String,
        required: [true, "product image is required"],
    },
    style: {
        type: String
    },
    availableSizes: [
        {
            type: String,
            enum: ["S", "XS", "M", "X", "L", "XXL", "XL"]
        },
    ],
    installments: {
        type: Number
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

module.exports = mongoose.model("Product", productSchema);