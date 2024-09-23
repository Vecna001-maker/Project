import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';


const userSchema = new mongoose.Schema({
     username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true, 
     },
     email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
     },
     fullname:{
        type:String,
        required:true,
        trim:true,
        index:true, 
     },
     avatar:{
        type:String, //cloudinary se url milega image ka
        required:true,
     },
     coverImage:{
        type:String, //cloudinary se url milega image ka
     },
     watchHistory : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video",
        }
     ],
     password:{
        type:String,
        required:[true,"password is required"],
     },
     refreshToken:{
        type:String,
     }
},{
    timestamps:true,
});


userSchema.pre("save",async function(next){
   if(this.isModified("password")){
       this.password=await bcrypt.hash(this.password,10);
   }
   next();
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);   
}

userSchema.methods.generateAccessToken = async function(){
   const token = await jwt.sign(
      //payload
      {
       _id : this._id,
       username : this.username,
       fullname : this.fullname,
       email : this.email,
      },
      //jwt secret
      process.env.ACCESS_TOKEN_SECRET,

      //expiry for that token
      {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY,
      }
   )

   return token;
}

userSchema.methods.generateRefreshToken = async function(){
   const token = await jwt.sign(
      //payload
      {
         _id : this._id,
      },
      //jwt secret
      process.env.REFRESH_TOKEN_SECRET,

      //expiry for that token
      {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY,
      }

   )

   return token;
}

export const User = mongoose.model("User",userSchema);
