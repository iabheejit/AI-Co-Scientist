# Deploying AI Co-Scientist to Vercel

This guide provides step-by-step instructions for deploying the AI Co-Scientist platform to Vercel.

## Prerequisites

1. [GitHub](https://github.com/) account
2. [Vercel](https://vercel.com/) account
3. Git installed on your local machine

## Deployment Steps

### 1. Push your code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
# Initialize git repository (if needed)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add remote repository
git remote add origin https://github.com/yourusername/ai-co-scientist.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel

#### Option 1: Deploy using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Run deployment from the project root:
```bash
vercel
```

4. Follow the prompts to configure your deployment.

#### Option 2: Deploy through the Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Select your GitHub repository
4. Configure your project:
   - **Framework preset**: Custom
   - **Root Directory**: ./
   - **Build Command**: cd frontend && npm install && npm run build
   - **Output Directory**: frontend/build

5. In the project settings after deployment:
   - Set environment variables if needed
   - Configure the production branch

### 3. Configure Project on Vercel

After the initial deployment, you may need to make these adjustments:

1. **Environment Variables**:
   - Go to your project > Settings > Environment Variables
   - Add any necessary environment variables:
     - `VERCEL_PYTHON_RUNTIME=3.9` (specify the Python version)

2. **Build Settings**:
   - Ensure the project is using the `vercel.json` configuration

### 4. Test the Deployment

Once deployed, visit your Vercel URL to test the application:

1. Navigate to your deployed URL (e.g., https://ai-co-scientist.vercel.app)
2. Test the application functionality

## Troubleshooting

### Backend Issues

If your backend API is not working:

1. Check Vercel Function Logs:
   - Go to your Vercel project
   - Navigate to Deployments > Latest Deployment > Functions
   - Check the logs for your API endpoints

2. Check API Routes:
   - Ensure the `/api/*` routes are correctly configured in `vercel.json`

3. Python Dependencies:
   - Make sure all dependencies are listed in `requirements.txt`
   - Consider using fewer dependencies if you're hitting size limits

### Frontend Issues

If the frontend has problems:

1. Check Build Logs:
   - Go to your Vercel project > Deployments > Latest Deployment
   - View the build logs to identify any errors

2. Check API URL:
   - Ensure the frontend is using the correct API URL in production

## Optimizing for Vercel

### Serverless Functions Limitations

Vercel serverless functions have limitations:

1. **Execution Time**: Maximum of 10 seconds for Hobby plan
2. **Memory**: Limited to 1GB on Hobby plan
3. **Size**: Deployment size limits

For the AI Co-Scientist platform, consider:

1. **Optimization**:
   - Reduce dependencies
   - Optimize code for faster startup
   - Use async processing where possible

2. **Upgrade Plan**:
   - Consider upgrading to a paid Vercel plan for longer function execution times

3. **Alternative Backend**:
   - For heavy processing, consider hosting the backend separately on a platform that supports long-running processes (AWS, GCP, etc.)
   - Use Vercel for the frontend only

## Alternatives to Vercel for Backend

If the backend requirements exceed Vercel's limitations:

1. **Railway.app**: Good for full-stack applications with longer process times
2. **Render.com**: Supports web services with longer running times
3. **Heroku**: Classic platform with more flexible runtime options
4. **AWS Lambda**: For serverless with up to 15-minute execution time
5. **Google Cloud Run**: For containerized applications with flexible timeouts

When using a separate backend, update the `REACT_APP_API_URL` in your frontend configuration to point to the external API.
