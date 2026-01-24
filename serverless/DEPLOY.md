# Deep Research Engine - Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud SDK**: Install from https://cloud.google.com/sdk/docs/install
2. **Docker**: Ensure Docker Desktop is running
3. **Project Access**: Access to project `gen-lang-client-0334944767`

## Quick Deploy

### Option 1: Using gcloud CLI (Recommended)

```bash
# 1. Authenticate and set project
gcloud auth login
gcloud config set project gen-lang-client-0334944767

# 2. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Build and deploy in one command
cd serverless
gcloud run deploy deep-research-engine \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 1200s \
    --concurrency 10 \
    --min-instances 0 \
    --max-instances 5
```

### Option 2: Manual Docker Build

```bash
# 1. Build locally
cd serverless
docker build -t deep-research-engine:latest .

# 2. Tag for GCR
docker tag deep-research-engine:latest gcr.io/gen-lang-client-0334944767/deep-research-engine:latest

# 3. Push to GCR
docker push gcr.io/gen-lang-client-0334944767/deep-research-engine:latest

# 4. Deploy to Cloud Run
gcloud run deploy deep-research-engine \
    --image gcr.io/gen-lang-client-0334944767/deep-research-engine:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --timeout 1200s
```

## Post-Deployment

After deployment, you'll get a Cloud Run URL like:
```
https://deep-research-engine-xxxxxxxxxx-uc.a.run.app
```

### Configure the Actor

Set the Cloud Run URL as an environment variable in your Apify Actor:

```
CLOUD_RUN_URL=https://deep-research-engine-xxxxxxxxxx-uc.a.run.app
```

Or pass it directly in the Actor input:
```json
{
    "query": "Your research query",
    "use_cloud_run": true,
    "cloud_run_url": "https://deep-research-engine-xxxxxxxxxx-uc.a.run.app"
}
```

## Cost Estimates

Cloud Run Free Tier (monthly):
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

**Typical Research Run (~10 minutes, 2GB memory):**
- Memory: 10 min × 2 GB = 20 GB-seconds
- With free tier: ~18,000 runs/month free

**Apify Cost Savings:**
- Before: 10-20 min compute @ $0.001/min = $0.01-0.02 per run
- After: ~10 sec dispatch @ $0.001/min = $0.0002 per run
- **Savings: 95%+**

## Troubleshooting

### Check service health
```bash
curl https://YOUR-CLOUD-RUN-URL/health
```

### View logs
```bash
gcloud run logs read deep-research-engine --region us-central1
```

### Test research endpoint
```bash
curl -X POST https://YOUR-CLOUD-RUN-URL/research \
    -H "Content-Type: application/json" \
    -d '{"query": "Test query", "template": "investigative", "granularity": "quick", "gemini_api_key": "YOUR_KEY"}'
```
