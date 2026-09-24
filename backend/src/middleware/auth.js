import jwt from "jsonwebtoken"

export function authenticate(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success: false,
            message: "Authentication token missing or invalid"
        })
    }
    const token = authHeader.split(" ")[1];
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        if(
            typeof payload !== "object" ||
            typeof payload.sub !== "string" 
        ){
            throw new Error("Invalid token payload")
        }
        req.userId = payload.sub;
        next()
    } catch (error){
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        })
    }
}
