const mongoose= require('mongoose');

const BannerSchema = new mongoose.Schema({
    bannerImage:{
        type:String,
        required:true,
    },
    mainTitle:{
        type:String,
        required:true,
    },
    subtitle:{
        type:String,
        required:true,
    },
})

const Banner =mongoose.model("Banner",BannerSchema);

module.exports = Banner;