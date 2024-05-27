var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-Helpers')
var userHelper=require('../helpers/user-helpers');
const { response } = require('../app');
// const { response } = require('../app');

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {

  let user=req.session.user

  let cartCount=null

  if(req.session.user){

    cartCount=await userHelper.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products)=>{
    res.render('user/viewProducts',{products,user,cartCount})  
   
  })
});


router.get('/login',(req,res)=>{
 if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{'loginError':req.session.loginError})
    req.session.loginError=false
  }

})



router.get('/signup',(req,res)=>{
  res.render('user/signup')
})



router.post('/signup',(req,res)=>{

userHelper.doSignUp(req.body).then((response)=>{
  res.redirect('/login')
  console.log(response);
  req.session.loggedIn=true
  req.session.user=response
  res.redirect('/')
})
})

router.post('/login',(req,res)=>{

  userHelper.doLogin(req.body).then((response)=>{

    if (response.status){

      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')

    }else{

      req.session.loginError="Invalid username or password"
    
      res.redirect('/login') 
    }

   
  })

  router.get('/logout',(req,res)=>{
    req.session.destroy()

    res.redirect('/')
  })

})



// Router Code


router.get('/cart',verifyLogin,async(req,res)=>{
  let products= await userHelper.getCartProducts(req.session.user._id)
  res.render('user/cart', { products,user: req.session.user});

  })
  


router.get('/add-to-cart/:id',(req,res)=>{

  // console.log('api call');

  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status:true }); // Ensure a response is sent back to the client
})
});

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
userHelper.changeProductQuantity(req.body).then((response)=>{

res.render('user/cart',response)

})
})



module.exports = router;
