# API Configuration Fix for Production

The issue you're experiencing is that the production frontend is trying to make API calls to `localhost:3000`, which doesn't work from a remote production environment.

## Root Cause
The frontend is deployed to Firebase Hosting (`dakshaa.ksrct.ac.in`) but the API calls are hardcoded or defaulting to `localhost:3000` instead of pointing to the production backend server.

## Solution

### Step 1: Deploy Backend to Vercel (if not already done)
```bash
cd Backend
vercel --prod
```

After deployment, Vercel will give you a URL like `https://your-app-name.vercel.app`

### Step 2: Update Production Environment Variables
Update the `.env.production` file in the Frontend folder:
```env
VITE_API_URL=https://your-backend-vercel-url.vercel.app
VITE_SUPABASE_URL=https://ltmyqtcirhsgfyortgfo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bXlxdGNpcmhzZ2Z5b3J0Z2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTIzODAsImV4cCI6MjA4MTk4ODM4MH0.UIDoHN0gNZCWh0l2sxqOCnlvngI3aOE-uWDWLh-8io8
```

### Step 3: Rebuild and Redeploy Frontend
```bash
cd Frontend
npm run build
firebase deploy
```

## Immediate Testing
To test locally with the production-like setup:
1. Start the backend server locally: `cd Backend && npm start`
2. Start the frontend development server: `cd Frontend && npm run dev`
3. Access the coordinator page at `http://localhost:5173`

The coordinator page should now load the team data correctly.

## Files Updated
- `/Frontend/src/config/api.js` - Created centralized API configuration
- `/Frontend/src/Components/TeamManagement/TeamDetailsView.jsx` - Updated to use configurable API URL
- `/Frontend/src/Pages/Teams/TeamsPage.jsx` - Updated to use configurable API URL
- `/Frontend/.env.production` - Created production environment configuration

All API calls now use the `VITE_API_URL` environment variable with localhost:3000 as fallback for development.