const mongoose = require("mongoose")
const { Schema } = mongoose;
const bcrypt = require('bcrypt')

const driverSchema = new Schema({
    username : {
        type: String,
        required: true
    },
    isAvailable : {
        type:Boolean,
        required : true
    },
    coordinates : {
        x: Number,
        y: Number
    },
    password :{
        type: String,
        required : true
    },
    cab_number : {
        type: String,
        required : true
    },
    ridingWith : {
        type: Schema.Types.ObjectId,
        ref: "Rider"
    },
    history :[{
        type: Schema.Types.ObjectId,
        ref: "Rider"
    }]
})

driverSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
})
driverSchema.statics.findAndValidate = async function (username, password) {
    const foundUser = await this.findOne({ username });
    if(!foundUser) return false;
    const isValid = await bcrypt.compare(password, foundUser.password);
    return isValid ? foundUser : false;
}
const Driver = mongoose.model("Driver", driverSchema)
module.exports = Driver