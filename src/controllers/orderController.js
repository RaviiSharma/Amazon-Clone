const OrderModel = require("../models/orderModel");
const CartModel = require("../models/cartModel");
const ProductModel = require("../models/productModel");
const {isValidInputBody,isValidInputValue,isValidOnlyCharacters,isValidAddress,isValidEmail,isValidPhone,
    isValidPassword,isValidNumber,isValidPincode,isValidPrice,isValidObjectId,isValidImageType} = require("../utilities/validator");

//*******************************************CREATE ORDER*************************************************** */

const createOrder = async function(req, res) {
    try {
        const requestBody = req.body;
        const queryParams = req.query;
        const userId = req.params.userId;
        const decodedToken = req.decodedToken;

        // query params must be empty
        if (isValidInputBody(queryParams)) {
            return res
                .status(404)
                .send({ status: false, message: " page not found" });
        }

        if (!isValidObjectId(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid userId " });
        }

        // using destructuring
        let { cancellable } = requestBody;

        // getting user's cart details
        const userCartDetail = await CartModel.findOne({ userId: userId }).select({
            items: 1,
            userId: 1,
            totalItems: 1,
            totalPrice: 1,
        });

        if (!userCartDetail) {
            return res
                .status(404)
                .send({ status: false, message: "user not found" });
        }

        // authorization
        if (decodedToken.userId !== userId) {
            return res
                .status(403)
                .send({ status: false, message: "Authorization failed" });
        }

        if (userCartDetail.items.length === 0) {
            return res
                .status(400)
                .send({ status: false, message: "Cart is empty" });
        }

        //total product quantity in cart
        const totalQuantity = userCartDetail.items
        let totalQuantityInCart = 0
        for(let i=0;i < totalQuantity.length; i++){
            totalQuantityInCart += totalQuantity[i].quantity
        }

        if (cancellable) {
            if (typeof cancellable !== "boolean") {
                return res
                    .status(400)
                    .send({ status: false, message: "cancellable should be a boolean" });
            }
            cancellable = cancellable;
        } else {
            cancellable = true;
        }

        const orderData = {
            userId: userId,
            items: userCartDetail.items,
            totalItems: userCartDetail.totalItems,
            totalPrice: userCartDetail.totalPrice,
            totalQuantity: totalQuantityInCart,
            cancellable: cancellable,
            status: "pending",
            isDeleted: false,
            deletedAt: null,
        };

        const orderPlaced = await OrderModel.create(orderData);

        //making cart empty again
        const makeCartEmpty = await CartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true });

        res
            .status(201)
            .send({ status: true, message: "order placed", data: orderPlaced });
    } catch (error) {

        res
            .status(500)
            .send({ error: error.message });
    }
};

//***************************************UPDATE ORDER STATUS********************************************** */

const updateOrderStatus = async function(req, res) {
    try {
        const requestBody = req.body;
        const queryParams = req.query;
        const userIdFromParams = req.params.userId;

        // query params must be empty
        if (isValidInputBody(queryParams)) {
            return res
                .status(404)
                .send({ status: false, message: " page not found" });
        }

        if (!isValidInputBody(requestBody)) {
            return res
                .status(400)
                .send({ status: false, message: "Order data is required " });
        }
        // destructuring on request body
        const { orderId, status } = requestBody;

        if (!isValidObjectId(orderId)) {
            return res
                .status(400)
                .send({ status: false, message: "invalid orderId " });
        }

        const orderDetailsByOrderId = await OrderModel.findOne({
            _id: orderId,
            isDeleted: false,
            deletedAt: null,
        });

        if (!orderDetailsByOrderId) {
            return res
                .status(404)
                .send({ status: false, message: `no order found by ${orderId} ` });
        }

        if (orderDetailsByOrderId.userId.toString() !== userIdFromParams) {
            return res
                .status(403)
                .send({status: false,message: "unauthorize access: order is not of this user"});
        }

        if (!["pending", "completed", "cancelled"].includes(status)) {
            return res
                .status(400)
                .send({status: false,message: "status should be from [pending, completed, cancelled]"});
        }

        if (orderDetailsByOrderId.status === "completed") {
            return res
                .status(400)
                .send({status: false,message: "Order completed, now its status can not be updated"});
        }

        if (status === "cancelled" && orderDetailsByOrderId.cancellable === false) {
            return res
                .status(400)
                .send({ status: false, message: "This order can not be cancelled" });
        }

        if (status === "pending") {
            return res
                .status(400)
                .send({ status: false, message: "order status is already pending" });
        }

        const updateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true });

        res
            .status(201)
            .send({status: true,message: "order status updated",data: updateStatus});
            
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

//****************************************EXPORTING HANDLERS************************************************ */
module.exports = {
    createOrder,
    updateOrderStatus,
};
