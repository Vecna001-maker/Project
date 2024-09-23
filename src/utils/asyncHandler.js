
//it is an higher order fucntion which can take fucntion as an argument

// const asyncHandler = (fn)=> async(req,res,next)=>{
//    try {

//     await fn(req,res,next);
//     console.log("success");
//     res.status(200);
    
//    } catch (error) {
//       res.status(error.code || 500).json({
//         success:false,
//         message:error.message,
//       })
//    }
// }



// export {asyncHandler};

const asyncHandler = (fn)=>{
    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((err)=>next(err));
    }

}

export {asyncHandler};


