const mongoose = require('mongoose')
mongoose.connect(`mongodb://localhost:27017/makeapost`)

const userModel = mongoose.Schema({
    username : String,
    email : String,
    password : String,
    profilepic : {
        type : String,
        default : 'profile.jpg'
    },
    posts : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'post'
        }
    ]
})

module.exports =  mongoose.model('user', userModel)