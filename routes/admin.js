var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-Helpers')

/* GET users listing. */


let products = [

  
]

router.get('/', function(req, res, next) {

  productHelpers.getAllProducts().then((products)=>{

    // console.log(products);
    res.render('admin/viewProducts',{admin:true,products})
   

  })


});

router.get('/addProduct',function(req,res){

  res.render('admin/addProduct',{admin:true,products})
})

router.post('/addProduct',(req,res)=>{
  // console.log(req.body);
  // console.log(req.files.image);

  productHelpers.addProduct(req.body,(id)=>{

    let Image=req.files.image
    Image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{

      if(!err){

        res.render('admin/addProduct')
      }
      else{
        console.log(err);
      }
    })

   
  })
})




router.get('/delete-product/:id',(req,res)=>{
let productId=req.params.id
console.log(productId);

productHelpers.deleteProduct(productId).then((response)=>{

  res.redirect('/admin/')
})
})




router.get('/editProduct/:id',async(req,res)=>{

  let product=await productHelpers.getProductDetails(req.params.id)
console.log(product);
  res.render('admin/editProduct',{product})
})
 



router.post('/editProduct/:id',(req,res)=>{

  id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{

    res.redirect('/admin')

    if(req.files.image){

      let Image=req.files.image
      Image.mv('./public/product-images/'+id+'.jpg')
    }
  
  })
})



module.exports = router;
