# Freelancer Time Tracker

A simple, static web application for freelancers to track their daily tasks and time allocation.

## Features

*   **Daily Time Slots**: Track work hour-by-hour (00:00 - 24:00).
*   **User Profile**: Save your Name and Job Position.
*   **Data Persistence**: All data is saved locally in your browser (LocalStorage).
*   **Export**: Download your logs as `.csv` or `.xlsx` (Excel).

## Project Structure

*   `index.html`: The main entry point and UI.
*   `app.js`: The application logic.
*   `tests.html`: Unit tests.

## How to Deploy (Hosting)

Since this is a static site (HTML/JS/CSS), it can be hosted for free on **Vercel**, **Netlify**, or **GitHub Pages**.

### Option 1: Vercel (Recommended)

1.  **Drag & Drop**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Drag this entire project folder onto the dashboard.
    *   Vercel will deploy it instantly.

2.  **Git Integration** (Best for updates):
    *   Push this code to a GitHub repository.
    *   Go to Vercel -> "Add New..." -> "Project".
    *   Select your GitHub repository.
    *   Click "Deploy".

### Option 2: GitHub Pages

1.  Push this code to a GitHub repository.
2.  Go to Repository Settings -> Pages.
3.  Select "main" branch as the source.
4.  Save.

## Domain Setup

To use a custom domain like `thearkstudio.timetracker`:
1.  Deploy the project (e.g., on Vercel).
2.  Go to the Project Settings -> Domains.
3.  Add your domain (`thearkstudio.timetracker` or `tracker.thearkstudio.com`).
4.  Follow the DNS configuration instructions provided by Vercel.
