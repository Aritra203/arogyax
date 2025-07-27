import jwt from 'jsonwebtoken'

// user authentication middleware
const authUser = async (req, res, next) => {
    try {
        const { token, authorization } = req.headers
        let authToken = token
        
        // Also check Authorization header (Bearer format)
        if (!authToken && authorization) {
            if (authorization.startsWith('Bearer ')) {
                authToken = authorization.slice(7)
            } else {
                authToken = authorization
            }
        }
        
        console.log('🔐 User auth check:', { 
            hasToken: !!token, 
            hasAuthorization: !!authorization,
            tokenFound: !!authToken 
        });
        
        if (!authToken) {
            console.log('❌ No user token found');
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        
        const token_decode = jwt.verify(authToken, process.env.JWT_SECRET)
        req.body.userId = token_decode.id
        console.log('✅ User authenticated successfully');
        next()
    } catch (error) {
        console.log('❌ User auth error:', error)
        res.json({ success: false, message: error.message })
    }
}

export default authUser;