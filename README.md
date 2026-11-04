# Student Performance Data Analysis Dashboard

A responsive, beginner-friendly student analytics dashboard built with HTML5, CSS3, JavaScript and Chart.js. It loads a 30-record fictional sample dataset immediately and can analyze a user-uploaded CSV file.

## Files

- `index.html` — dashboard structure and Chart.js dependency
- `style.css` — responsive SaaS-style interface
- `script.js` — CSV parsing, validation, analysis, filtering, charts and exports
- `sample-data.csv` — 30 fictional student records
- `README.md` — setup and usage guide

## Run locally

The dashboard fetches `sample-data.csv`, so run it from a local web server rather than opening the HTML file directly.

**Option 1 — VS Code**
1. Open this folder in Visual Studio Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html` and choose **Open with Live Server**.

**Option 2 — Python**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

An internet connection is required to load Chart.js and the optional Google Fonts / Font Awesome assets from their CDNs. CSV parsing and analysis run locally in the browser; no data is sent to a server.

## CSV format

Required columns (header names are case-insensitive; spaces and punctuation are ignored):

- `Name`
- `Mathematics`
- `Science`
- `English`
- `Computer`

Recommended columns:

- `Student ID` (generated IDs are used if omitted)
- `Attendance` (defaults to 100 when omitted)

Marks and attendance must be numeric values from 0 to 100. Blank or invalid records are skipped safely. Quoted CSV fields and escaped quotes are supported.

Example:
```csv
Student ID,Name,Mathematics,Science,English,Computer,Attendance
STU001,Aarav Sharma,86,82,79,91,96
```

## Analysis rules

- Student average: arithmetic mean of the four subject marks.
- Performance categories: Excellent ≥ 85; Good ≥ 70; Average ≥ 50; Needs Improvement < 50.
- Pass: a student must score at least 40 in **every** subject.
- Attendance watchlist: attendance below 75%.
- Subject chart: average for each subject among the currently filtered students.
- Overall average marks: mean of all subject marks in the current filtered view.
- Highest / lowest cards: highest and lowest individual subject mark across the current filtered students; the supporting label identifies the student and their overall average.

Filters and search update the cards, charts, insights, and student table together. Export summary downloads analysis metrics; Export filtered records downloads the visible student rows.

## Notes

- The sample names and scores are fictional.
- Data is processed in browser memory. No database, backend, or external data service is connected.
- Chart.js is loaded from jsDelivr CDN.
