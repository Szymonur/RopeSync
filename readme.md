# 🧗‍♂️ RopeSync - Mobile & Web App

RopeSync is an innovative platform for climbers that combines the functionality of a climbing logbook with social activity tracking. The app allows users to search for routes, manually log their ascents, and track personal statistics. 

Ultimately, the app integrates with a dedicated wearable measurement device (based on ESP32) worn by the climber. It visualizes the climb using an innovative **Heightline** (a height-based timeline), which records events such as clips, falls, and their specific parameters.

## Features

### Account & Community
* **JWT Authentication:** Secure login and session management with built-in data encryption (Expo Secure Store).
* **Account Management:** User registration, login, and password reset workflows.
* **Profile & Statistics:** Comprehensive overview of personal climbing achievements.
* **Community:** Follow other climbers and keep up with their ascents via a dynamic activity feed.

###  Logging & Route Database
* **Database & Maps:** Search for regions, sectors, and specific climbing routes using interactive maps.
* **Manual Logbook:** Manually log ascents along with detailed metadata.
* **Offline Mode:** Local SQLite database support for essential offline capabilities.

### Hardware Integration
* **Bluetooth Low Energy (BLE):** Direct communication with the ESP32 hardware module.
* **Heightline:** A unique climb visualization drawn dynamically based on telemetry data (SVG charts). *Currently supports mock data for testing purposes.*
* **Data Enrichment:** Link hardware-recorded tracks with specific route names, add personal descriptions, and save the enriched data directly to your profile.

## Tech Stack

* **Framework:** React Native / Expo (featuring the modern Expo Router)
* **Language:** TypeScript
* **API State Management:** TanStack React Query + Axios
* **Local DB & Storage:** Expo SQLite, Expo Secure Store
* **BLE Communication:** react-native-ble-plx
* **Maps & Graphics:** React Native Maps, React Native SVG
* **Icons & UI:** @expo/vector-icons, react-native-ui-datepicker

## 🚀 Getting Started

### Prerequisites
* Node.js environment
* Expo Go app installed on a physical smartphone (required for testing BLE features), or an Android/iOS emulator for standard UI testing.

### Installation & Setup
1. Clone the repository:
   ```bash
   https://github.com/Szymonur/RopeSync.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (create a .env file and define the backend API URL [http://localhost:8443])

4. Start the application:
    ```bash
    npm start
    # Use the Expo Go app to scan the QR code and run the project on your device.
    ```