
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken';


const generateAccessTokenandRefreshToken = async (userId) => {
    try {
        //await lagana nhi bhulna hai bhaii
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.accessToken = accessToken;
        user.refreshToken = refreshToken;

        // //ab agar user ko save krenge to validate krega to bolega fulname , password is empty
        // //to iss liye mark validateBeforeSave = false
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        console.log(error);
        throw new ApiError("500", "Error generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //STEPS TO REGISTER A USER

    //get user details from frontend
    //validation [Not empty ]{fields which are marked required}
    //check if user already exists{fields marked as unique}
    //create user object . create entry in database
    //remove password and refresh token field from response(select method use krke)
    //check for user creation
    //return response



    const { username, email, fullname, password } = req.body;
    console.log(username," ",email);
    // // console.log(req.body);
    // console.log("email",email);

    //you can use if else to validate each field , and check if its empty return an error
    //or use array.some method taught by chai with code
    if (
        [fullname, email, password, username].some((field) => field?.trim === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    //checking if user already exists
    // const existingUser = await User.findOne({
    //     $or : [username,email]
    // })

    // if(existingUser){
    //     throw new ApiError(409,"User with this email or username already exists");
    // }
    if (await User.findOne({ username })) {
        throw new ApiError(409, "User with this username already exists");
    }
    if (await User.findOne({ email })) {
        throw new ApiError(409, "User with this email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenght > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is needed");
    }

    //it will take time
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname: fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username,
        password,

    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user");
    }

    await res.status(201).json(
        new ApiResponse(200, createdUser, "User successfully registered")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //STEPS FOR USER LOGIN

    //get user details from frontend
    //check if username or email exists in database
    //use isPasswordCorrect method to compare password it correct or not
    //send access and refresh token to user
    //send cookies
    //return response


    //database dusre continent mae hota hai , time lgta hai process karane ,
    //await use kiya kro bsdvale

    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(400, "Email or username is required for login");
    }

    //yahan $or refers ki isme se jo bhi mil jaye , find krleao
    const loggingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!loggingUser) {
        throw new ApiError(404, "Invalid username or email")
    }

    //to check for password , try using the methods we made
    const chkpassword = await loggingUser.isPasswordCorrect(password);

    if (!chkpassword) {
        throw new ApiError(401, "Password is Incorrect");
    }


    //this method will return {accessToken,refreshToken} as an object
    //await harr jagah lagao yaar , nhi to code phatt skta hai
    const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(loggingUser._id);

    //logged user ke andar tokens bhi honge
    //kyuki generate method mae ham log , user mae
    //token insert krke save kr diye the
    //using select to remove password and refreshToken
    const loggedInUser = await User.findById(loggingUser._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    }

    //we can set cookies like this .cookie("name",value)
    return res.status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken,
                },
                "user logged in successfully",

            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw ApiError(401, "Unauthorized Access");
    }

    try {
        const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        //this decoded token will have payload data , and we gave _id as a payload;
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw ApiError(401, "Unauthorized Access");
        }

        const { accessToken, newRefreshToken } = await generateAccessTokenandRefreshToken(user._id);

        const options = {
            httpOnly: true,
            secure: true,
        }

        //we can set cookies like this .cookie("name",value)
        return res.status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", newRefreshToken)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: accessToken, newRefreshToken,
                    },
                    "Access Token Refresed",
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    //it might need to be changed
    //video writing update controllers with js

    const { oldPassword, newPassword } = req.body;

    try {
        const access_Token = req.cookies.accessToken || req.body.accessToken;

        if (!access_Token) {
            throw new ApiError(404, "Unauthorized User");
        }


        const decodedToken = await jwt.verify(access_Token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id);
        console.log(user);

        if (!user) {
            throw new ApiError(400, "User not Found");
        }

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Password is incorrect");
        }

        user.password = newPassword;

        await user.save({ validateBeforeSave: false });

        return res.status(200)
            .json(new ApiResponse(
                200,
                {},
                "Password successfully changed",
            ));
    } catch (error) {
        throw new ApiError('500', "Error Occured Changing Password");
    }

})

const getCurrentUser = asyncHandler(async(req,res)=>{
try {
        //it might need to be changed
        //video writing update controllers with js
        const ref_Token = req?.cookies.refreshToken || req.body.refreshToken;

        const decodedToken = await jwt.verify(ref_Token,process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id);

        res.status(200)
        .json(new ApiResponse(200,user,"User data fetched"));
} catch (error) {
    throw new ApiError('500',"Error fetching user info");
}
})

const updateUserDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required");
    }

    const ref_Token = req.cookies.refreshToken || req.body.refreshToken;

    const decodedToken = await jwt.verify(ref_Token,process.env.REFRESH_TOKEN_SECRET);

    // const user = await User.findById(decodedToken._id);

    const user = await User.findByIdAndUpdate(
        decodedToken._id,
        {
            $set:{
                //fullname:fullname do , ya fullname , vo fullname ke andar naya data daal dega
                fullname:fullname,
                email:email
            }
        },

        //isse kya hoga ki jo update ke baad result aayega usko return kr dega ye fucntion
        {new:true}
    ).select("-password");


    res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account updated"
    ))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{

      const newAvatar = req.file?.path;

      const accessToken = req.cookies.accessToken || req.body.accessToken;
      const decodedToken = await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken._id);

      const previousAvatar = user.avatar;

      const avatar = await uploadOnCloudinary(newAvatar);

      if(!avatar.url){
        throw new ApiError("Error updating Avatar");
      }

      user.avatar = avatar.url;
      await user.save();

      const updatedUser = await User.findById(decodedToken._id).select("-password -refreshToken");

      res
      .status(200)
      .json(new ApiResponse(
        200,
        updatedUser,
        "User Avatar successfully Updated"
      ))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
      
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"User not Found");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            } 
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },

                channelSubscribedToCount:{
                    $size:"subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false,
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
            }
        }

    ])

    if(!channel.length){
        throw new ApiError(404,"Channel does not Exist");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User channel Fetched succesfully"));
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    getUserChannelProfile,
};