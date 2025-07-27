import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        const { atoken, aToken, authorization } = req.headers
        let token = atoken || aToken
        
        // Also check Authorization header (Bearer format)
        if (!token && authorization) {
            if (authorization.startsWith('Bearer ')) {
                token = authorization.slice(7)
            } else {
                token = authorization
            }
        }
        
        console.log('🔐 Admin auth check:', { 
            hasAtoken: !!atoken, 
            hasAToken: !!aToken, 
            hasAuthorization: !!authorization,
            tokenFound: !!token 
        });
        
        if (!token) {
            console.log('❌ No admin token found');
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            console.log('❌ Invalid admin token');
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        
        console.log('✅ Admin authenticated successfully');
        next()
    } catch (error) {
        console.log('❌ Admin auth error:', error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin;