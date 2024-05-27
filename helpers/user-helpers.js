var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt');
const { response } = require('../app');
const saltRounds = 10;
var ObjectId = require('mongodb').ObjectId;


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

                    db.get().collection(collection.cartCollection).updateOne({user:ObjectId(userId),'products.item': ObjectId(productId) },

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
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{

                        from:collection.productCollection,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{

                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
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

            if (cart && cart.products) {
                count = cart.products.length;
            }
            resolve(count)

            console.log(count);
        })
    },

    changeProductQuantity:(details)=>{

    details.count=parseInt(details.count)


return new Promise((resolve , reject)=>{
    db.get().collection(collection.cartCollection).updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product) },

    {

        $inc: { 'products.$.quantity':details.count }
    }
).then((response) => {
console.log(response);
    resolve(response)
})

})
},

}