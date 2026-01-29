# Headless Mode Setup Guide

## Overview

For the worker to run in true headless mode (no browser window), you need to log in to each AI platform once and save the authentication cookies.

## Setup Process

### Step 1: Ensure `.env` is configured

Make sure your `.env` file has:
```env
HEADLESS=False  # Set to False during initial setup
USE_PROXY=True  # Can be True, but setup scripts will temporarily disable it
OXYLABS_USERNAME=your_username
OXYLABS_PASSWORD=your_password
```

**Note**: The setup scripts automatically disable proxy during cookie capture to avoid domain issues, then re-enable it after completion.

### Step 2: Run Login Setup for Each Platform

Run these scripts **one at a time** to set up authentication:

#### ChatGPT
```bash
python setup_chatgpt_login.py
```
1. Browser window will open at chat.openai.com
2. Log in with your OpenAI account
3. Wait for the chat interface to load
4. Script will automatically save cookies after 90 seconds

#### Gemini
```bash
python setup_gemini_login.py
```
1. Browser window will open at gemini.google.com
2. Log in with your Google account
3. Wait for the Gemini chat interface to load
4. Script will automatically save cookies after 90 seconds

#### Perplexity
```bash
python setup_perplexity_login.py
```
1. Browser window will open at perplexity.ai
2. Log in with your account
3. Wait for the Perplexity interface to load
4. Script will automatically save cookies after 90 seconds

### Step 3: Enable Headless Mode

After all platforms are set up, update your `.env`:
```env
HEADLESS=True  # Now enable headless mode
```

### Step 4: Run Workers in Headless Mode

Now you can run the workers without any browser windows:

```bash
# Single platform
python worker.py --ai-source chatgpt
python worker.py --ai-source gemini
python worker.py --ai-source perplexity

# All platforms at once
python worker.py --ai-source all
```

## Saved Cookie Locations

Cookies are saved in two places:
1. **Local files**: `./storage/{platform}_cookies.json`
2. **Supabase database**: `sessions` table

## Troubleshooting

### "Input field not found" errors in headless mode
- Your cookies may have expired
- Re-run the setup script for that platform: `python setup_{platform}_login.py`

### Screenshots for debugging
When running in headless mode, automatic screenshots are captured every 5 seconds to:
```
./storage/debug/{platform}/{timestamp}/
```

Check these screenshots to see what the browser is actually loading.

### Cookie expiration
- Most AI platform cookies last 30-90 days
- You'll need to re-run the setup scripts when they expire
- Look for "not logged in" or "input field not found" errors

## Production Deployment

For production servers (no GUI):
1. Run all setup scripts on your **local machine** (with GUI)
2. Copy the `./storage/*_cookies.json` files to your server
3. Set `HEADLESS=True` on the server
4. Run the workers - they'll use the saved cookies

## File Structure
```
backend/
├── setup_chatgpt_login.py    # ChatGPT login setup
├── setup_gemini_login.py      # Gemini login setup
├── setup_perplexity_login.py  # Perplexity login setup
└── storage/
    ├── chatgpt_cookies.json   # ChatGPT auth cookies
    ├── gemini_cookies.json    # Gemini auth cookies
    ├── perplexity_cookies.json # Perplexity auth cookies
    └── debug/                 # Headless screenshots
        ├── chatgpt/
        ├── gemini/
        └── perplexity/
```
