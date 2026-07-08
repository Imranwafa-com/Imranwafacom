#!/bin/bash

echo "Creating GitHub issues for imranhwafa/Imranwafacom..."

gh issue create -R imranhwafa/Imranwafacom --title "Replace null Suspense Fallback" --body "Update App.tsx to use a branded skeleton-style loading component instead of null to prevent dead screens."
gh issue create -R imranhwafa/Imranwafacom --title "Update noscript Fallback Colors" --body "Replace default Tailwind hex codes in app/index.html with our exact Stark/Carbon theme colors."
gh issue create -R imranhwafa/Imranwafacom --title "Migrate lite Fallback Colors" --body "Update the slow-load fallback in app/index.html to use CSS custom properties tied to the active theme."
gh issue create -R imranhwafa/Imranwafacom --title "Remove JS-Driven Viewport Breakpoints" --body "Replace window.innerWidth checks in Resume.tsx with pure CSS media queries to fix layout thrashing."
gh issue create -R imranhwafa/Imranwafacom --title "Bind Framer Motion to CSS Variables" --body "Offload Framer Motion dynamic positioning to native CSS custom properties instead of Javascript."
gh issue create -R imranhwafa/Imranwafacom --title "Elevate Resume Loading Text" --body "Upgrade the static 'unrolling the paper...' text in Resume.tsx to an engaging micro-animation or typographic reveal."
gh issue create -R imranhwafa/Imranwafacom --title "Refine Flat Fallback Elements" --body "Ensure secondary panels adopt the oklch colors and backdrop-blur techniques used in specimen.css."
gh issue create -R imranhwafa/Imranwafacom --title "Consistent Scrollbar Theming" --body "Ensure scrollable sub-components inherit the custom scrollbar styling defined at the root."
gh issue create -R imranhwafa/Imranwafacom --title "Eliminate Placeholder Content" --body "Audit network-fetching logic across charts and data displays to remove any generic loading strings."
gh issue create -R imranhwafa/Imranwafacom --title "Layer Shadows for Depth" --body "Update any remaining single-layer box-shadows to a multi-stop shadow approach for a premium feel."

echo "All 10 issues created successfully!"
