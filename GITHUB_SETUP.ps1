# 🚀 GitHub Setup Commands for CarbonEx
# Run these in order in your PowerShell terminal inside the project folder

# ──────────────────────────────────────────────────
# STEP 1 — Navigate to your project folder
# ──────────────────────────────────────────────────
cd "c:\Users\Mithil K Gowda\OneDrive\Desktop\CARBON PROJECT\b_ooDn5ZFoJg7-1774175227153 (2)\b_ooDn5ZFoJg7-1774175227153 (2)\b_ooDn5ZFoJg7-1774175227153"

# ──────────────────────────────────────────────────
# STEP 2 — Initialize Git repository
# ──────────────────────────────────────────────────
git init

# ──────────────────────────────────────────────────
# STEP 3 — Set your identity (if not done globally)
# ──────────────────────────────────────────────────
git config user.name "Mithil K Gowda"
git config user.email "your-email@example.com"   # replace with your GitHub email

# ──────────────────────────────────────────────────
# STEP 4 — Stage all files
# ──────────────────────────────────────────────────
git add .

# ──────────────────────────────────────────────────
# STEP 5 — Check what's staged (optional verification)
# ──────────────────────────────────────────────────
git status

# ──────────────────────────────────────────────────
# STEP 6 — First commit
# ──────────────────────────────────────────────────
git commit -m "feat: initial commit - CarbonEx AI-governed carbon trading platform"

# ──────────────────────────────────────────────────
# STEP 7 — Rename default branch to 'main'
# ──────────────────────────────────────────────────
git branch -M main

# ──────────────────────────────────────────────────
# STEP 8 — Add your GitHub remote
# (Replace YOUR_USERNAME and YOUR_REPO_NAME with actual values)
# ──────────────────────────────────────────────────
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# ──────────────────────────────────────────────────
# STEP 9 — Push to GitHub
# ──────────────────────────────────────────────────
git push -u origin main

# ══════════════════════════════════════════════════
# ✅ DONE! Your code is now on GitHub.
# ══════════════════════════════════════════════════

# ──────────────────────────────────────────────────
# ADDING TEAMMATES (do this on GitHub website)
# ──────────────────────────────────────────────────
# 1. Go to your repo on GitHub
# 2. Click "Settings" tab
# 3. Click "Collaborators" (left sidebar)
# 4. Click "Add people"
# 5. Type each teammate's GitHub username or email
# 6. Set their role: "Write" (can push) or "Maintain" (more control)
# 7. They'll get an email invite — they must ACCEPT it

# ──────────────────────────────────────────────────
# TEAMMATES: How to clone the repo after accepting invite
# ──────────────────────────────────────────────────
# git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
# cd YOUR_REPO_NAME
# npm install
# cp .env.example .env.local   # (you need to share .env values securely)
# npm run dev
