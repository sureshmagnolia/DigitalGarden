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
   - **EXIF & Geolocation:** GPS coordinates (Latitude, Longitude, and Altitude) are reliably extracted natively from the raw binary via the `exifr` library for gallery uploads, and via `@capacitor/geolocation` for live photos.
   - User can click "Identify Photo" (`PlantNetIdentifier.jsx`) to ping the backend PlantNet proxy.
   - Selecting a candidate auto-fills the plant name and triggers a POWO API fetch to get synonyms (`MetadataForm.jsx`). The POWO search utilizes a wildcard (`*`) to ensure robust partial matching on species queries.
   - Form fields have been organized to clearly separate `Location Name` from `Notes`.
2. **Admin Dashboard (`/admin`):**
   - Fetches pending submissions from GAS.
   - Admin can review, Approve (updates status in Sheet), or Reject (deletes from Sheet and trashes in Drive).
3. **Backend Logic (`apps-script/Code.gs`):**
   - A `.gs` file has been generated with all `doGet`, `doPost`, and Drive/Sheets logic.
   - `Code.gs` explicitly parses extended metadata (like Altitude, Location Name, and Notes) and archives them seamlessly into the `POWO_Data` JSON column to prevent breaking the spreadsheet layout.

## Pending Tasks (Next Steps)
1. **Backend Deployment (User Action):** The user needs to deploy the latest `apps-script/Code.gs` to Google Apps Script as a **New Version** to ensure backend modifications take effect.
2. **Hook Up Frontend API:** Make sure `src/services/api.js` (`API_URL`) points to the latest active deployment.
3. **Error Handling & Polish:** Improve loading states and handle Google Drive upload timeouts if images are very large.
4. **Mobile Build:** Run `npx cap sync` and test on Android/iOS via Android Studio/Xcode.

## Helpful Files
- `src/services/api.js`: The central hub for all backend communication.
- `apps-script/Code.gs`: The backend server logic.
- `src/pages/SubmitPage.jsx`: The orchestrator for the camera, identification, and form submission.
