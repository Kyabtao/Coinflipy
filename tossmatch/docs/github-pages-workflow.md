# Optional GitHub Actions workflow (publish `tossmatch/` as site root)

Branch-based Pages (Settings → Pages → Deploy from a branch → `main` / `/`)
is enough. Use this workflow only if you want the player app at the Pages
root (`/`) instead of `/tossmatch/`.

1. Save the YAML below as `.github/workflows/deploy-pages.yml` on `main`.
2. Set **Settings → Pages → Source** to **GitHub Actions**.

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: tossmatch
          include-hidden-files: true

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
