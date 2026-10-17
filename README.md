# Analyzing urban heat in Thermopolis

A mobile-first teaching tool for a short pair activity in spatial landscape analytics. Students look at one fictional city, Thermopolis, through three phases of analysis and discuss what each tool reveals, and what it cannot.

| Phase | Question | Tools |
|---|---|---|
| **EXPLORE** | Where is the heat concentrated? | Temperature map, Side by side, Hot spots |
| **EXPLAIN** | What is associated with the heat pattern? | Distance to green, Correlation, Residuals |
| **MODEL** | Where might action be prioritized? | Temperature only, Vulnerability only, Combine both |

The phases follow Fagerholm et al. (2021), *A methodological framework for analysis of participatory mapping data in research, planning, and management*, International Journal of Geographical Information Science, https://doi.org/10.1080/13658816.2020.1869747.

Thermopolis is fictional and all data are synthetic.

## Run locally

```
npm install
npm run dev
```

## Build

```
npm run build   # output in dist/
```

Pushing to `main` builds and publishes the site with GitHub Pages (`.github/workflows/deploy.yml`; set Settings → Pages → Source to GitHub Actions). The site is static, works offline after the first visit, and sends no data anywhere.
