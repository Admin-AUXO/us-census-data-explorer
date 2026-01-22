# Deployment Guide

## GitHub Repository Setup

### 1. Repository Permissions

**IMPORTANT**: Before deploying, configure repository permissions:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
4. Click **Save**

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

### 3. CI/CD Pipeline

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml`:

- **Build & Test**: Runs on every push and pull request
  - Installs dependencies
  - Builds the application
  - Verifies build artifacts

- **Deploy**: Runs automatically on pushes to `main` or `master` branch
  - Requires `pages: write` and `id-token: write` permissions
  - Builds the application
  - Deploys to GitHub Pages
  - Configures custom domain `auxodata.com` (if configured)

### 4. Custom Domain Setup (Optional)

If you want to use `auxodata.com`:

1. The workflow automatically creates a `CNAME` file with `auxodata.com`
2. Configure DNS records:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `YOUR_USERNAME.github.io`
3. Wait for DNS propagation (can take up to 48 hours)

### 5. Troubleshooting

**Permission Denied (403) Error:**
- Ensure repository workflow permissions are set to "Read and write"
- Verify the deploy job has `pages: write` and `id-token: write` permissions
- Check that GitHub Pages is enabled in repository settings

**Build Fails:**
- Check that all dependencies are in `package.json`
- Verify `package-lock.json` is committed
- Review build logs in Actions tab

**Deployment Fails:**
- Verify GitHub Pages is enabled
- Check that the `gh-pages` branch is created (first deployment may take a few minutes)
- Ensure repository has proper permissions configured

**Custom Domain Not Working:**
- Verify DNS records are configured correctly
- Check that CNAME file exists in `gh-pages` branch
- Wait for DNS propagation

## Manual Deployment

If you prefer manual deployment:

```bash
npm run build
# Then upload the dist/ folder to your hosting provider
```
