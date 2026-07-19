# DigitalGarden Project Context

This file serves as context for future AI sessions to understand the current state of the DigitalGarden project and pick up where the last session left off.

## Project Overview
**DigitalGarden** is a community-driven digital plant database application built to capture photos, extract metadata (EXIF GPS), auto-identify plants via AI, and archive them through an admin-approval workflow.

## Architecture
- **Frontend Framework:** React 19 + Vite.
- **Mobile Wrapper:** Capacitor (ready for iOS/Android builds, configured to use native Camera).
- **Styling:** Tailwind CSS (v3).
- **Routing:** React Router DOM (v7).
- **Backend/Database:** Google Apps Script (GAS) acting as a REST API, storing data in Google Sheets and images in Google Drive.
- **Third-Party APIs:**
  - **PlantNet API:** Used for AI-based plant identification from images.
  - **POWO (Plants of the World Online) API:** Used to automatically fetch taxonomic data (synonyms, accepted names, authors) based on the identified plant name.

## Current State
All initial scaffolding and core frontend flows have been built:
1. **Submission Flow (`/submit`):**
   - User can snap/select a photo (`CameraCapture.jsx`).
   - Image is converted to Base64.
   - User can click "Identify Photo" (`PlantNetIdentifier.jsx`) to ping the backend PlantNet proxy.
   - Selecting a candidate auto-fills the plant name and triggers a POWO API fetch to get synonyms (`MetadataForm.jsx`).
2. **Admin Dashboard (`/admin`):**
   - Fetches pending submissions from GAS.
   - Admin can review, Approve (updates status in Sheet), or Reject (deletes from Sheet and trashes in Drive).
3. **Backend Logic (`apps-script/Code.gs`):**
   - A `.gs` file has been generated with all `doGet`, `doPost`, and Drive/Sheets logic.

## Pending Tasks (Next Steps)
1. **Backend Deployment (User Action):** The user needs to deploy `apps-script/Code.gs` to Google Apps Script, attach their Google Sheet ID, Drive Folder ID, and PlantNet API Key, and publish it as a Web App.
2. **Hook Up Frontend API:** Once the Web App URL is generated, it must be pasted into `src/services/api.js` (`API_URL`).
3. **EXIF GPS Extraction:** The frontend currently captures Base64 images. We need to implement the EXIF parsing logic (using `exif-js` or reading Capacitor's returned metadata) to auto-fill the Lat/Lng fields in the form.
4. **Error Handling & Polish:** Improve loading states and handle Google Drive upload timeouts if images are very large.
5. **Mobile Build:** Run `npx cap sync` and test on Android/iOS via Android Studio/Xcode.

## Helpful Files
- `src/services/api.js`: The central hub for all backend communication.
- `apps-script/Code.gs`: The backend server logic.
- `src/pages/SubmitPage.jsx`: The orchestrator for the camera, identification, and form submission.
