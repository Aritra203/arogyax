# Deploying Arogya X to Render

## Prerequisites
1. GitHub account
2. Render account (free at render.com)
3. Your code pushed to a GitHub repository

## Step 1: Push Your Code to GitHub

1. Create a new repository on GitHub called "arogya-x"
2. Initialize git in your project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Arogya X Hospital Management System"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/arogya-x.git
   git push -u origin main
   ```

## Step 2: Deploy Backend to Render

1. Go to https://render.com and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: arogya-x-backend
   - **Environment**: Node
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Set Environment Variables:
   - NODE_ENV: production
   - MONGODB_URI: your_mongodb_atlas_connection_string
   - CLOUDINARY_API_KEY: your_cloudinary_api_key
   - CLOUDINARY_API_SECRET: your_cloudinary_api_secret
   - CLOUDINARY_NAME: your_cloudinary_name
   - JWT_SECRET: your_jwt_secret
   - RAZORPAY_KEY_ID: your_razorpay_key
   - RAZORPAY_KEY_SECRET: your_razorpay_secret
   - STRIPE_SECRET_KEY: your_stripe_secret_key
   - CURRENCY: inr
   - ADMIN_EMAIL: admin@arogya-x.com
   - ADMIN_PASSWORD: admin123
   - PORT: 10000

6. Click "Create Web Service"

## Step 3: Deploy Frontend to Render (or Vercel)

### Option A: Deploy Frontend to Render
1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: arogya-x-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Publish Directory**: dist

4. Set Environment Variable:
   - VITE_BACKEND_URL: https://your-backend-url.onrender.com

### Option B: Deploy Frontend to Vercel (Recommended for React apps)
1. Go to vercel.com and connect your GitHub
2. Import your repository
3. Configure:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: dist
   - Environment Variable: VITE_BACKEND_URL = https://your-backend-url.onrender.com

## Step 4: Deploy Admin Panel

Follow the same steps as the frontend, but use the admin folder instead.

## Step 5: Update Environment Variables

After deployment, update your frontend .env file:
```
VITE_BACKEND_URL=https://your-backend-service-name.onrender.com
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

## Important Notes

1. **MongoDB Atlas**: Make sure to whitelist all IP addresses (0.0.0.0/0) in MongoDB Atlas for production
2. **CORS**: Your backend CORS is already configured to accept all origins
3. **Environment Variables**: Never commit .env files to GitHub
4. **Build Time**: Render free tier may take 10-15 minutes to build
5. **Cold Start**: Free tier services sleep after 15 minutes of inactivity

## Troubleshooting

1. **Build Fails**: Check logs in Render dashboard
2. **Database Connection**: Verify MongoDB Atlas connection string
3. **Environment Variables**: Ensure all required env vars are set
4. **CORS Issues**: Check if backend URL is correct in frontend

## Cost Optimization

- Backend: Use Render's free tier (750 hours/month)
- Frontend: Use Vercel free tier (unlimited for personal projects)
- Database: MongoDB Atlas free tier (512MB storage)
- File Storage: Cloudinary free tier (25GB monthly bandwidth)

Your application will be live at:
- Backend: https://arogya-x-backend.onrender.com
- Frontend: https://arogya-x-frontend.vercel.app
- Admin: https://arogya-x-admin.vercel.app
