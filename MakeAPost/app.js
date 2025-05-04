const express = require("express")
const userModel = require('./model/user')
const postModel = require('./model/post')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cookieParser = require("cookie-parser")
const post = require("./model/post")
const multer = require('multer')
const crypto = require('crypto')
const path = require('path')

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(express.static(path.join(__dirname , 'public')))
app.set('view engine', 'ejs')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
     crypto.randomBytes(12, (error, name)=>{
        const fn = name.toString('hex') + path.extname(file.originalname)
        cb(null, fn)
     })     
    }
  })
  
  const upload = multer({ storage: storage })

app.get('/', (req, res)=>{
    res.render('index')
})
app.get('/home', isAutUser ,async (req, res)=>{
    const user = await userModel.findOne({email : req.user.email})
    
    res.render('home', {user})
})

app.get('/404' ,(req, res)=>{
    res.render('404')
})


app.post('/login',async (req, res)=>{
    let user = await userModel.findOne({email : req.body.email})
    if(!user) return res.status(400).render('404')
    
        bcrypt.compare(req.body.password, user.password, function(err, result) {
            if(!result) return res.status(500).render('404')
            else{
                const token = jwt.sign({email: req.body.email}, 'secret')
                res.cookie('token', token)
                res.redirect('/home')
            }
        });
        
})

app.get

app.get('/register', (req, res)=>{
    res.render('signup')
})

app.post('/register',async (req, res)=>{
    let {username,email,password} = req.body

    let existuser = await userModel.findOne({email})
    if(existuser) return res.status(500).send('user already exist')

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt,async function(err, hash) {
            // Store hash in your password DB.
            let user = await userModel.create({
                username,
                email,
                password : hash
            })
            const token = jwt.sign({email}, 'secret')
            res.cookie('token', token)
            res.redirect('/')
        });
    });

    
    
})

app.get('/home/createpost',isAutUser ,async (req, res)=>{
    const user = await userModel.findOne({email : req.user.email}).populate('posts')
    res.render('createpost', {user})
})

app.post('/home/create',isAutUser ,async (req, res)=>{
    let user = await userModel.findOne({email: req.user.email})
    let { content } = req.body
    const post = await postModel.create({
        user : user._id,
        content
    })
    
    user.posts.push(post._id)
    await user.save()
    res.redirect('/home/createpost')
})


app.get('/home/allposts',isAutUser ,async (req, res)=>{
    const user = await userModel.findOne({email : req.user.email})
    const posts = await postModel.find().populate('user')
    res.render('allposts' , {posts, user})
    
})

app.post('/profilepic/update', isAutUser, upload.single('image') ,async (req, res)=>{
    let user = await userModel.findOne({email : req.user.email});
    user.profilepic = req.file.filename;
    await user.save();
    console.log(user.profilepic)
    res.redirect('/home')
})

app.get('/home/createpost/delete/:userid',isAutUser ,async (req, res)=>{

    await postModel.findOneAndDelete({_id : req.params.userid})
    res.redirect('/home/createpost')
})

app.post('/home/createpost/update/:userid',isAutUser ,async (req, res)=>{
    let user = await userModel.findOne({email : req.user.email}).populate('posts')
    let posts = await postModel.findOne({_id : req.params.userid}).populate('user')

    let {content} = req.body;
    let update = await postModel.findOneAndUpdate({content : posts.content}, {content : content}, {new : true})
    console.log(update)
    res.redirect('/home/allposts')
})

app.get('/home/createpost/edit/:userid',isAutUser ,async (req, res)=>{
    let user = await userModel.findOne({email : req.user.email}).populate('posts')
    let posts = await postModel.findOne({_id : req.params.userid}).populate('user')

   
    res.render('editpost',{posts, user})
})


app.get('/logout', (req, res)=>{
    res.cookie('token', '')
    res.redirect('/')
})

app.get('/profile', isAutUser, (req, res)=>{
    res.render('profileupload',)
})

function isAutUser(req, res, next){
    if(req.cookies.token === '') return res.redirect('/404')
    else {
    let data = jwt.verify(req.cookies.token, 'secret')
    req.user = data
    next()
    }
}


const PORT = 3000;
app.listen(PORT, ()=>{
    console.log(`server is running at [http://localhost:${PORT}]`)
})