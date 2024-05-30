var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt');
const { response, options } = require('../app');
const saltRounds = 10;
var ObjectId = require('mongodb').ObjectId;

const Razorpay = require('razorpay');


var instance = new Razorpay({
    key_id: 'rzp_test_ci8GshvIwumzgQ',
    key_secret: '971PDwR28OV84gLLK4Aiy7pB',
});


module.exports = {

    doSignUp: (userData) => {

        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, saltRounds)
            db.get().collection(collection.userCollection).insertOne(userData).then((data) => {

                resolve(data.ops[0])
            })

        })


    },

    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {

            let loginStatus = false
            let response = {}

            let user = await db.get().collection(collection.userCollection).findOne({ email: userData.email })

            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {

                    if (status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)

                    } else {

                        console.log('login failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })
    },

    addToCart: (productId, userId) => {

        let productObject = {
            item: ObjectId(productId),
            quantity: 1

        }
        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collection.cartCollection).findOne({ user: ObjectId(userId) })
            if (userCart) {

                let productExist = userCart.products.findIndex(product => product.item == productId)
                console.log(productExist);

                if (productExist != -1) {

                    db.get().collection(collection.cartCollection).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(productId) },

                        {

                            $inc: { 'products.$.quantity': 1 }
                        }
                    ).then(() => {

                        resolve()
                    })
                } else {

                    db.get().collection(collection.cartCollection).updateOne({ user: ObjectId(userId) },



                        {

                            $push: { products: productObject }

                        }
                    ).then((response) => {
                        resolve()
                    })
                }



            } else {

                let cartObj = {
                    user: ObjectId(userId),
                    products: [productObject]

                }

                db.get().collection(collection.cartCollection).insertOne(cartObj).then((response) => {

                    resolve()
                })
            }
        })

    },

    getCartProducts: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.cartCollection).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },

                {

                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {

                        from: collection.productCollection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {

                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {

        return new Promise(async (resolve, reject) => {

            let count = 0
            let cart = await db.get().collection(collection.cartCollection).findOne({ user: ObjectId(userId) })

            if (cart) {
                count = cart.products.length;
            }
            resolve(count)

        })
    },

    changeProductQuantity: (details) => {

        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collection.cartCollection).updateOne({ _id: ObjectId(details.cart) },

                    {

                        $pull: { products: { item: ObjectId(details.product) } }
                    }

                ).then((response) => {

                    resolve({ removeProduct: true })
                })

            } else {


                db.get().collection(collection.cartCollection).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },

                    {

                        $inc: { 'products.$.quantity': details.count }
                    }
                ).then((response) => {

                    resolve({ status: true })

                })

            }

        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.cartCollection).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },

                {

                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {

                        from: collection.productCollection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {

                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        productPrice: { $toDouble: '$product.price' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$quantity", "$productPrice"] } }
                    }
                }

            ]).toArray()
            if (total.length > 0) {
                resolve(total[0].total);

                console.log(total);
            } else {
                resolve(0);
            }

            // console.log(total);
            // resolve(total)
        })

    },

    placeOrder: (order, products, total) => {

        return new Promise((resolve, reject) => {

            console.log(order, products, total);

            let status = order['payment-method'] === 'COD' ? 'Placed' : 'Pending' ;

            let orderObj = {

                deliveryDetails: {

                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: ObjectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                date: new Date(),
                status: status
            }
            db.get().collection(collection.orderCollection).insertOne(orderObj).then((response) => {

                db.get().collection(collection.cartCollection).removeOne({ user: ObjectId(order.userId) })

                resolve(response.ops[0]._id)
            })
        })


    },
    getCartProductList: (userId) => {

        return new Promise(async (resolve, reject) => {

            let cart = await db.get().collection(collection.cartCollection).findOne({ user: ObjectId(userId) })

            resolve(cart.products)
        })


    },

    getUserOrders: (userId) => {

        console.log(userId);

        return new Promise(async (resolve, reject) => {

            let orders = await db.get().collection(collection.orderCollection).find({ userId: ObjectId(userId) }).toArray()
            console.log(orders);
            resolve(orders)


        })

    },

    getOrderProducts: (orderId) => {

        return new Promise(async (resolve, reject) => {

            let orderItems = await db.get().collection(collection.orderCollection).aggregate([


                {
                    $match: { _id: ObjectId(orderId) }
                },

                {

                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {

                        from: collection.productCollection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {

                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(orderItems)

        })


    },

    generateRazorPay: (orderId, total) => {


        console.log("total : " + total);
        return new Promise((resolve, reject) => {

            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);
                resolve(order)
            });




        })
    },

    verifyPayment: (details) => {

        return new Promise((resolve, reject) => {
            const {
                createHmac,
            } = require('node:crypto');


            let hmac = createHmac('sha256', '971PDwR28OV84gLLK4Aiy7pB');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);

            hmac = hmac.digest('hex')

            if (hmac == details['payment[razorpay_signature]']) {

                resolve()
            } else {

                reject()
            }
        })
    },

    changePaymentStatus: (orderId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.orderCollection).updateOne({_id: ObjectId(orderId) },
            {
                $set: {
                    status:'Placed'
                }
            }).then(()=>{

                resolve()
            })

        })
    }

}