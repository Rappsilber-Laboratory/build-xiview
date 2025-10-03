#!/bin/bash

# xiVIEW Project Update Script
# Updates main repo and all submodules, then ensures submodules are on correct branches

echo "🔄 Updating xiVIEW project..."

# Get the branch to pull (default to current branch if none specified)
BRANCH=${1:-$(git branch --show-current)}

echo "📥 Pulling latest changes from origin/$BRANCH..."
git pull origin "$BRANCH"

echo "🔄 Updating submodules..."
git submodule update --remote

echo "🌲 Checking out correct branches and pulling latest for each submodule..."

echo "  - xiview -> v2"
cd xiview && git checkout v2 && git pull origin v2 && cd ..

echo "  - CLMS-model -> v2"
cd CLMS-model && git checkout v2 && git pull origin v2 && cd ..

echo "  - crosslink-viewer -> master"
cd crosslink-viewer && git checkout master && git pull origin master && cd ..

echo "  - spectrum -> dev"
cd spectrum && git checkout dev && git pull origin dev && cd ..

echo "✅ Update complete! Current status:"
echo ""
echo "📋 Main project status:"
git status

echo ""
echo "📋 Submodule statuses:"

echo ""
echo "🔹 xiview (branch: $(cd xiview && git branch --show-current)):"
cd xiview && git status && cd ..

echo ""
echo "🔹 CLMS-model (branch: $(cd CLMS-model && git branch --show-current)):"
cd CLMS-model && git status && cd ..

echo ""
echo "🔹 crosslink-viewer (branch: $(cd crosslink-viewer && git branch --show-current)):"
cd crosslink-viewer && git status && cd ..

echo ""
echo "🔹 spectrum (branch: $(cd spectrum && git branch --show-current)):"
cd spectrum && git status && cd ..
