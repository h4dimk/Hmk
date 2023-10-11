const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code:{
        type:String,
        required:true,
    },
    discountPercentage:{
        type:Number,
        required:true,
    },
    minPurchaseAmount : {
        type: Number,
        require : true
    },
    createdAt: {
        type: Date,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    active : {
        type: Boolean,
        require : true
    },
    maxRedimableAmount : {
        type : Number,
        required : true
    }
})

const Coupon = mongoose.model('Coupon', CouponSchema);

module.exports = Coupon;