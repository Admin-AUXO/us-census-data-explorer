# Deployment Guide

## GitHub Repository Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository (e.g., `us-census-data-explorer`)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)

### 2. Connect Local Repository to GitHub

```bash
cd webapp
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace:
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

### 4. CI/CD Pipeline

The CI/CD pipeline is already configured in `.github/workflows/ci-cd.yml`:

- **Build & Test**: Runs on every push and pull request
  - Installs dependencies
  - Builds the application
  - Verifies build artifacts

- **Deploy**: Runs automatically on pushes to `main` or `master` branch
  - Builds the application
  - Deploys to GitHub Pages
  - Configures custom domain `auxodata.com` (if configured in repository settings)

### 5. Custom Domain Setup (Optional)

If you want to use `auxodata.com`:

1. Add a `CNAME` file in the repository root with content: `auxodata.com`
2. Configure DNS records:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `YOUR_USERNAME.github.io`
3. The workflow will automatically handle the CNAME file during deployment

## Manual Deployment

If you prefer manual deployment:

```bash
npm run build
# Then upload the dist/ folder to your hosting provider
```

## Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json`
- **Deployment fails**: Verify GitHub Pages is enabled and the `gh-pages` branch exists
- **Custom domain not working**: Ensure DNS records are configured correctly and CNAME file exists
