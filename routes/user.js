var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-Helpers')
var userHelper = require('../helpers/user-helpers');
const { response } = require('../app');
// const { response } = require('../app');

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {

  let user = req.session.user

  let cartCount = null

  if (req.session.user) {

    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products) => {
    res.render('user/viewProducts', { products, user, cartCount })

  })
});


router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginError': req.session.userLoginError })
    req.session.userLoginError = false
  }

})



router.get('/signup', (req, res) => {
  res.render('user/signup')
})



router.post('/signup', (req, res) => {

  userHelper.doSignUp(req.body).then((response) => {
    
    console.log(response);
   
    req.session.user = response
    req.session.user.loggedIn = true
    // res.redirect('/')
    res.redirect('/login')
  })
})

router.post('/login', (req, res) => {

  userHelper.doLogin(req.body).then((response) => {

    if (response.status) {

      
      req.session.user = response.user
      req.session.user.loggedIn = true
      res.redirect('/')

    } else {

      req.session.userLoginError = "Invalid username or password"

      res.redirect('/login')
    }


  })

  router.get('/logout', (req, res) => {
    
    req.session.user=null
    req.session.userLoggedIn=false

    res.redirect('/')
  })

})



// Router Code


router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)

  let totalValue=0

  if(products.lenght>0){
    totalValue = await userHelper.getTotalAmount(req.session.user._id)
  }
  res.render('user/cart', { products, user: req.session.user._id, totalValue });

})



router.get('/add-to-cart/:id', (req, res) => {

  // console.log('api call');

  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true }); // Ensure a response is sent back to the client
  })
});

router.post('/change-product-quantity', (req, res, next) => {

  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user)

    res.json(response)

  })
})

router.get('/placeOrder', verifyLogin, async (req, res) => {

  let total = await userHelper.getTotalAmount(req.session.user._id)

  res.render('user/placeOrder', { user: req.session.user, total: total })
})

router.post('/placeOrder',async(req,res) => {

  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {

    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelper.generateRazorPay(orderId, totalPrice).then((response) => {

        res.json(response)
      })
    }


  })


})

router.get('/orderSuccess', (req, res) => {

  res.render('user/orderSuccess', { user: req.session.user })
})

router.get('/orders', verifyLogin, async (req, res) => {

  let userId = req.session.user._id

  let orders = await userHelper.getUserOrders(userId)

  res.render('user/orders', { user: req.session.user, orders })

})

router.get('/viewOrderProducts/:id', async (req, res) => {

  let products = await userHelper.getOrderProducts(req.params.id)

  res.render('user/viewOrderProducts', { user: req.session.user, products })
  console.log(products);
})

router.post('/verify-payment',(req,res)=>{

  console.log(req.body);

userHelper.verifyPayment(req.body).then(()=>{
userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
console.log('successfull');
  res.json({status:true})

})

}).catch((err)=>{

  console.log(err);
  res.json({status:false,errMsg:''})
})



})
module.exports = router;
