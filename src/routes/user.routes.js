import { Router } from "express";
import { loginUser, registerUser,logoutUser, refreshAccessToken, changeCurrentPassword, updateUserDetails, getCurrentUser, updateUserAvatar, getUserChannelProfile } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//prefix is added to it , i.e https://localhost:8000/api/v1/users then register
//https://localhost:8000/api/v1/users/register
router.route('/register').post(
    upload.fields([
        {
           name:'avatar',
           maxCount:1
        },

        {
           name:'coverImage',
           maxCount:1
        }
    ]),
    registerUser
    );

router.route('/login').post(loginUser);

//secured routes

//verifyJWT is a middleware , jo ki logout route pe execute hoga
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/refresh-token').post(refreshAccessToken);

router.route('/change-password').post(changeCurrentPassword);
router.route('/user-details').post(getCurrentUser);
router.route('/update-user').post(updateUserDetails);
router.route('/updateAvatar').post(
    verifyJWT,
    upload.fields([
        {
           name:'avatar',
           maxCount:1
        },
    ]),
    updateUserAvatar
);
router.route('/getChannelDetails').post(getUserChannelProfile);

export default router;