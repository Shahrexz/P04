# Manzil - Testing & Evaluation

This document outlines the **testing strategy**, **tools used**, and **sample test cases** for validating the core functionality of the **Manzil** application.

---

## Testing Strategy

The testing for **Manzil** was designed to ensure that both **UI and logic** work as expected under various conditions. The strategy includes:

- **Unit & Integration Testing**: Focused on React Native components like `HomeScreen` and `Index`.
- **Mocking External Dependencies**:
  - `expo-router` for navigation
  - `axios` for HTTP requests
  - `@react-native-async-storage/async-storage` for local storage
- **User Interaction Simulation**:
  - Used `fireEvent` from `@testing-library/react-native` to simulate user actions.
- **Navigation Testing**:
  - Checked if navigation functions like `router.push()` were triggered correctly.
- **API Call Validation**:
  - Ensured `axios.get()` was called with correct endpoints.
- **Snapshot Testing**:
  - Used to detect unintended changes in rendered UI.
- **Asynchronous Handling**:
  - Applied `async/await` and `act()` to handle async logic in components.

---

## Sample Test Cases

| # | Test Case |
|---|-----------|
| 1 | ✅ Ensure `HomeScreen` renders properly with necessary UI elements. |
| 2 | 🔄 Clicking on the `"Hotels"` tab triggers the correct API endpoint. |
| 3 | 🚀 Clicking the **Profile** icon navigates to the `Profile` screen. |
| 4 | 🌆 Changing the selected city updates the city state correctly. |
| 5 | 🚗 `"Car Rentals"` tab fetches and displays car rental companies from the right API. |
| 6 | 🗺️ `"Navigate"` button takes the user to `GoogleMapScreen` with correct props. |
| 7 | 📄 Clicking `"Details"` on a car rental card opens `CarRentalDetailsPage`. |
| 8 | 🏁 `<Index />` renders correctly with "MANZIL", "Login", and "Sign Up" buttons. |

---

## Testing Tools & Libraries

| Tool | Purpose |
|------|---------|
| **Jest** | Main test runner and assertion library |
| **@testing-library/react-native** | For rendering and interacting with React Native components |
| **expo-router (mocked)** | Mocked to test navigation logic |
| **axios (mocked)** | Mocked to test API request logic |
| **@react-native-async-storage/async-storage (mocked)** | Mocked to isolate local storage logic |

---
