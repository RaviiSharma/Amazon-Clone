const express = require('express')
const router = express.Router()
const UserController = require('../controllers/userController')
const Auth = require('../middleWares/auth')
const ProductController = require('../controllers/productController')
const CartController = require('../controllers/cartController')
const OrderController = require('../controllers/orderController')


//test-api
router.get('/test-me', function(req, res) {
    res.send({ status: true, message: "test-api working fine" })
})


//*********************************USER API************************************************** */
router.post('/register', UserController.userRegistration)
router.post('/login', UserController.userLogin)
router.get('/user/:userId/profile', Auth.authentication, UserController.profileDetails)
router.put('/user/:userId/profile', Auth.authentication, UserController.userProfileUpdate)


//*********************************PRODUCT API**************************************************** */
router.post('/products', ProductController.registerProduct)
router.get('/products', ProductController.filterProducts)
router.get('/products/:productId', ProductController.getProduct)
router.put('/products/:productId', ProductController.updateProductDetails)
router.delete('/products/:productId', ProductController.deleteProduct)


//*************************************CART API***************************************************** */
router.post('/users/:userId/cart', Auth.authentication, Auth.authorization, CartController.AddProductToCart)
router.put('/users/:userId/cart', Auth.authentication, Auth.authorization, CartController.removeProductFromCart)
router.get('/users/:userId/cart', Auth.authentication, CartController.getCartDetails)
router.delete('/users/:userId/cart', Auth.authentication, CartController.emptyCart)

//*************************************ORDER API***************************************************** */
router.post('/users/:userId/orders', Auth.authentication, OrderController.createOrder)
router.put('/users/:userId/orders', Auth.authentication, Auth.authorization, OrderController.updateOrderStatus)


router.all("/*", function (req, res) {
    res
        .status(400)
        .send({ status: false, message: "invalid http request" });
});

module.exports = router