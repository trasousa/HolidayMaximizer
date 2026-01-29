# Agent / Developer Guide

## Architecture Overview

**Holiday Maximizer** is a client-side React application. It requires no backend server; all data fetching is done directly from the browser to public APIs.

### Key Services

1.  **`services/locationService.ts`**:
    *   Fetches the list of supported countries from `https://date.nager.at/api/v3/AvailableCountries`.
    *   Provides normalization logic to map user input to ISO-3166-1 country codes.
    
2.  **`services/holidayService.ts`**:
    *   Fetches public holidays for a specific year and country code.
    *   Handles filtering (though currently simplified to National holidays).

3.  **`services/optimizationService.ts`**:
    *   Contains the core algorithm for finding "Bridges".
    *   Scans the calendar for existing holidays/weekends and finds gaps (workdays).
    *   Accepts `UserSettings` to respect min/max PTO and efficiency thresholds.
    *   Returns formatted date ranges (e.g., "Apr 14 - Apr 18") instead of generic names.

### Data Flow & State Management

1.  **Landing Page**: 
    *   Handles Profile CRUD (Create, Update, Delete).
    *   Manages the global `year` selection, which initializes the application context.
    *   Uses `fetchSupportedCountries` to populate the country autocomplete.

2.  **App Main (`App.tsx`)**: 
    *   Holds the "Truth" for `profiles` and `settings`.
    *   **Year Changes**: When the year is changed via the header or landing page, `useEffect` triggers a re-fetch of holiday data for the active profile.
    *   **Suggestion Preview**: Manages `previewSuggestion` state to conditionally render visual overlays on `YearCalendar`.

3.  **Optimization**: 
    *   Triggered via `fetchProfileData`.
    *   Runs strictly client-side using the fetched holiday dates and the configured year.

### Notes for Future AI Integration

*   Previous versions utilized `@google/genai` for cultural descriptions of holidays and loose text-to-region normalization.
*   This has been removed for reliability and simplicity, but the `types.ts` `Holiday` interface still contains an optional `description` field if you wish to re-enable such a feature in the future.