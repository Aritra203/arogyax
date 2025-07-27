import jwt from 'jsonwebtoken'

// doctor authentication middleware
const authDoctor = async (req, res, next) => {
    try {
        const { dtoken, authorization } = req.headers
        let token = dtoken
        
        // Also check Authorization header (Bearer format)
        if (!token && authorization) {
            if (authorization.startsWith('Bearer ')) {
                token = authorization.slice(7)
            } else {
                token = authorization
            }
        }
        
        console.log('🔐 Doctor auth check:', { 
            hasDtoken: !!dtoken, 
            hasAuthorization: !!authorization,
            tokenFound: !!token 
        });
        
        if (!token) {
            console.log('❌ No doctor token found');
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.docId = token_decode.id
        console.log('✅ Doctor authenticated successfully');
        next()
    } catch (error) {
        console.log('❌ Doctor auth error:', error)
        res.json({ success: false, message: error.message })
    }
}

export default authDoctor;