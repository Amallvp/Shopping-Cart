var db = require('../config/connection')
var collection = require('../config/collections')

var ObjectId = require('mongodb').ObjectId;

module.exports = {

    addProduct: (products,callback) => {
        console.log(products);

        db.get().collection('product').insertOne(products).then((data) => {

            console.log(data);
            callback(data.ops[0]._id)

        })
    },

    getAllProducts: () => {

        return new Promise(async (resolve, reject) => {

            let products = await db.get().collection(collection.productCollection).find().toArray()
            resolve(products)
        })
    },

deleteProduct:(productId)=>{

return new Promise ((resolve,reject)=>{
// console.log(productId);
// console.log(ObjectId(productId));

    db.get().collection(collection.productCollection).removeOne({_id:ObjectId(productId)}).then((response)=>{

resolve(response)
    })
})
},

getProductDetails:(productId)=>{

    return new Promise((resolve,reject)=>{

        db.get().collection(collection.productCollection).findOne({_id:ObjectId(productId)}).then((product)=>{

            resolve(product)
        })
    })
},

updateProduct:(productId,productDetails)=>{

    return new Promise((resolve,reject)=>{

        db.get().collection(collection.productCollection).updateOne({_id:ObjectId(productId)},{

            $set:{
                name:productDetails.name,
                category:productDetails.category,
                description:productDetails.description
            }
        }).then((response)=>{

            resolve(response)
        })
    })
}

}