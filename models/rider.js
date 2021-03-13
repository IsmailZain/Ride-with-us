const mongoose = require("mongoose")
const { Schema } = mongoose;
const bcrypt = require('bcrypt')

const riderSchema = new Schema({
    username : {
        type: String,
        required: true
    },
    wantToRide : {
        type:Boolean,
        required : true
    },
    initial_coordinates : {
        x: Number,
        y: Number
    },
    destination_coordinates : {
        x: Number,
        y: Number
    },
    password :{
        type: String,
        required : true
    },
    history :[{
        type: Schema.Types.ObjectId,
        ref: "Driver"
    }],
    ridingWith : {
        type: Schema.Types.ObjectId,
        ref: "Driver"
    },
    state: {
        type: String,
        enum : ["notride","readytoride","journeycompleted"],
       
    },
})

riderSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
})
riderSchema.statics.findAndValidate = async function (username, password) {
    const foundUser = await this.findOne({ username });
    if(!foundUser) return false;
    const isValid = await bcrypt.compare(password, foundUser.password);
    return isValid ? foundUser : false;
}

const Rider = mongoose.model("Rider", riderSchema)
module.exports = Rider