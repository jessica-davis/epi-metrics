# Forecast Evaluation Metrics

Interactive documentation for understanding epidemic forecast evaluation metrics (WIS, Coverage, Prediction Intervals) - developed by EPISTORM.

## 🚀 Quick Deploy to GitHub Pages

### Option 1: GitHub UI (Easiest)

1. Create a new repository on GitHub
2. Upload `index.html` to the repository
3. Go to **Settings** → **Pages**
4. Under "Source", select **Deploy from a branch**
5. Select **main** branch and **/ (root)** folder
6. Click **Save**
7. Wait ~1 minute, your site will be live at `https://yourusername.github.io/repo-name/`

### Option 2: Command Line

```bash
# Create a new repo and push
git init
git add index.html
git commit -m "Initial commit: Forecast Metrics documentation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/forecast-metrics.git
git push -u origin main

# Then enable GitHub Pages in Settings → Pages
```

## 📁 Files

- `index.html` - Self-contained React app (no build step needed)
- `ForecastMetricsV3.jsx` - Source component for reference/modification

## 🎨 Features

- **IBM Plex Sans** font (matches epistorm.org)
- **Blue/slate color palette** (per Charting the Next Pandemic design guidelines)
- **Wave border decorations**
- **Interactive visualizations** for WIS, Coverage, and Prediction Intervals
- **Mobile responsive**

## 📚 Based on

- CDC FluSight forecasting initiative
- EPISTORM consortium documentation
- Charting the Next Pandemic (Vespignani et al., 2019)

---

Developed by [EPISTORM](https://www.epistorm.org) · CDC cooperative agreement CDC-RFA-FT-23-0069
