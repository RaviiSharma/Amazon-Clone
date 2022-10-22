const CartModel = require("../models/cartModel");
const ProductModel = require("../models/productModel");
const {isValidInputBody,isValidInputValue,isValidOnlyCharacters,isValidAddress,isValidEmail,isValidPhone,
    isValidPassword,isValidNumber,isValidPincode,isValidPrice,isValidObjectId,isValidImageType} = require("../utilities/validator");

//*********************************************ADD PRODUCT TO CART***************************************************** */

const AddProductToCart = async function(req, res) {
    try {
        const requestBody = req.body;
        const queryParams = req.query;
        const userId = req.params.userId;

        // query params must be empty
        if (isValidInputBody(queryParams)) {
            return res
                .status(404)
                .send({ status: false, message: " page not found" });
        }

        // using destructuring
        const { productId } = requestBody;

        // validating product id
        if (!isValidInputValue(productId) ||!isValidObjectId(productId)) {
            return res
                .status(400)
                .send({status: false,message: "Product ID is required and should be valid"});
        }
        // product details
        const productByProductId = await ProductModel.findOne({
            _id: productId,
            isDeleted: false
        });
        console.log(productByProductId)

        if (!productByProductId) {
            return res
                .status(404)
                .send({ status: false, message: `No product found by ${productId}` });
        }

        // users cart details
        const userCartDetails = await CartModel.findOne({ userId: userId });

        // if cart is empty then adding product to cart's items array
        if (userCartDetails.items.length === 0) {
            const productData = {
                productId: productId,
                quantity: 1,
            };

            const cartData = {
                items: [productData],
                totalPrice: productByProductId.price,
                totalItems: 1,
            };

            const newCart = await CartModel.findOneAndUpdate({ userId: userId }, { $set: cartData }, { new: true });

            return res
                .status(201)
                .send({status: true,message: "Product added to cart",data: newCart});
        }

        // checking whether product exist in cart or not
        const isProductExistsInCart = userCartDetails.items.filter(
            (productData) => productData["productId"].toString() === productId
        );

        // if product exist thus increasing its quantity
        if (isProductExistsInCart.length > 0) {
            const updateExistingProductQuantity = await CartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, 
            {
                $inc: {totalPrice: +productByProductId.price,"items.$.quantity": +1,},
            },
            { new: true });

            return res
                .status(201)
                .send({status: true,message: "Product quantity updated to cart",data: updateExistingProductQuantity});
        }

        // if product id coming from request body is not present in cart thus adding new product to cart
        const addNewProductToCart = await CartModel.findOneAndUpdate({ userId: userId }, {
            $addToSet: { items: { productId: productId, quantity: 1 } },
            $inc: { totalItems: +1, totalPrice: +productByProductId.price },
        }, { new: true });

        return res
            .status(201)
            .send({status: true,message: "Item updated to cart",data: addNewProductToCart});

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

//****************************************REMOVE PRODUCT FROM CART************************************************** */

const removeProductFromCart = async function(req, res) {
    try {
        const requestBody = req.body;
        const queryParams = req.query;
        const userId = req.params.userId;

        //query params must be empty
        if (isValidInputBody(queryParams)) {
            return res
                .status(404)
                .send({ status: false, message: " page not found" });
        }

        if (!isValidInputBody(requestBody)) {
            return res
                .status(404)
                .send({status: false,message: "data is required to remove products in cart"});
        }

        // using destructuring on request body
        const { productId, removeProduct } = requestBody;

        // validating product ID
        if (!isValidObjectId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "Product ID is not valid" });
        }

        // getting product details by product ID
        const productByProductId = await ProductModel.findOne({
            _id: productId,
            isDeleted: false,
            deletedAt: null,
        });

        if (!productByProductId) {
            return res
                .status(404)
                .send({ status: false, message: `No product found by ${productId}` });
        }

        // removeProduct should be either 1 or 0
        if (!["0", "1"].includes(removeProduct)) {
            return res
                .status(400)
                .send({status: false,message: "Remove Product is required and its value must be either 0 or 1"});
        }

        // getting user's cart details
        const cartByUserId = await CartModel.findOne({ userId: userId });

        // checking whether product id already exist in cart
        const isProductExistInCart = cartByUserId.items.filter(
            (productData) => productData["productId"].toString() === productId
        );

        if (isProductExistInCart.length === 0) {
            return res
                .status(404)
                .send({status: false,message: "No product found by this product id inside cart"});
        }

        // identifying quantity of that product in cart
        const productQuantity = isProductExistInCart[0].quantity;

        // if client want to reduce the product quantity by one
        if (removeProduct === "1") {

            // if productQuantity is  greater than one then reducing the quantity else removing whole product
            if (productQuantity > 1) {
                const decreaseExistingProductQuantity =
                    await CartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, {
                        $inc: {
                            totalPrice: -productByProductId.price,
                            "items.$.quantity": -1,
                        },
                    }, { new: true });

                return res
                    .status(200)
                    .send({status: true,message: "product quantity reduced in cart",data: decreaseExistingProductQuantity});

            } else {
                const eraseProductFromCart = await CartModel.findOneAndUpdate({ userId: userId }, {
                    $pull: { items: isProductExistInCart[0] },
                    $inc: { totalItems: -1, totalPrice: -productByProductId.price },
                }, { new: true });

                return res
                    .status(200)
                    .send({status: true,message: "Product removed from cart",data: eraseProductFromCart});
            }
            // if client want to remove whole product from cart
        } else {
            const removeProductFromCart = await CartModel.findOneAndUpdate({ userId: userId }, {
                $pull: { items: isProductExistInCart[0] },
                $inc: {
                    totalItems: -1,
                    totalPrice: -(productQuantity * productByProductId.price),
                },
            }, { new: true });

            return res
                .status(200)
                .send({status: true,message: "product removed from cart",data: removeProductFromCart});
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};


//***********************************GET CART DETAILS********************************************* */

const getCartDetails = async function(req, res) {
    try {
        const userId = req.params.userId;
        const queryParams = req.query;
        const decodedToken = req.decodedToken

        if (isValidInputBody(queryParams)) {
            return res
                .status(404)
                .send({ status: false, message: " page not found" });
        }
        // validating userID
        if (!isValidObjectId(userId)) {
            return res
                .status(400)
                .send({ status: false, message: " enter a valid userId" })
        }

        // user cart details
        const cartByUserId = await CartModel.findOne({ userId: userId });

        if (!cartByUserId) {
            return res
                .status(404)
                .send({ status: false, message: " user does not exist" });
        }

        // authorization
        if (decodedToken.userId !== userId) {
            return res
                .status(403)
                .send({ status: false, message: "Authorization failed" });
        }

        return res
            .status(200)
            .send({status: true,message: "Cart details are here",data: cartByUserId,});

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

//************************************EMPTY CART***************************************************** */

const emptyCart = async function(req, res) {
    try {
        const userId = req.params.userId;
        const queryParams = req.query;
        const decodedToken = req.decodedToken

        // query params must be empty
        if (isValidInputBody(queryParams)) {
            return res
                .status(404)
                .send({ status: false, message: " page not found" });
        }

        // validating userID
        if (!isValidObjectId(userId)) {
            return res
                .status(400)
                .send({ status: false, message: " enter a valid userId" })
        }

        // user cart details
        const cartByUserId = await CartModel.findOne({ userId: userId });

        if (!cartByUserId) {
            return res
                .status(404)
                .send({ status: false, message: " user does not exist" });
        }

         // authorization
        if (decodedToken.userId !== userId) {
            return res
                .status(403)
                .send({ status: false, message: "Authorization failed" });
        }

        if (cartByUserId.items.length === 0) {
            return res
                .status(400)
                .send({status: false,message: `cart is already empty`});
        }

        const makeCartEmpty = await CartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true });


        return res
            .status(204)
            .send({status: true,message: "cart made empty successfully",data: makeCartEmpty});

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

//****************************************EXPORTING HANDLERS*************************************************/

module.exports = {
    AddProductToCart,
    removeProductFromCart,
    getCartDetails,
    emptyCart,
};
