# Context Layer (Bluetooth & Data Streaming)

This folder contains the global application context responsible for **Bluetooth Low Energy (BLE) communication**, **live data streaming**, and **device connection state** for the PlantSense mobile application.

All BLE-related logic is centralized here so that UI screens remain focused only on presentation and user interaction.

---

## Purpose of This Context

The context is responsible for:

- Scanning for PlantSense BLE devices
- Connecting and disconnecting from the device
- Subscribing to BLE notifications
- Decoding incoming voltage data
- Maintaining a rolling data window for live visualization
- Exposing connection state and data to the rest of the app

All BLE interaction happens **inside this context**, not inside individual screens.

---

## Folder Structure

```text
contexte/
└── authContext.tsx
```
## authContext.tsx

This file defines the core Bluetooth Low Energy (BLE) and data-streaming logic for the PlantSense mobile application.

It is responsible for managing device connections, receiving live voltage data, and exposing that data to the rest of the app through a shared React context.

---

## What This File Defines

- A React Context (`AuthContext`)
- A Context Provider (`AuthProvider`)
- Shared BLE state and helper functions

The context provider should be wrapped around the application at a high level so that **all screens** can access BLE data and connection state.

---

## Data Provided by the Context

The context exposes the following values to the rest of the application:

### `device`

- The currently connected BLE device
- `null` if no device is connected

### `lastValue`

- The most recent voltage reading
- Units: millivolts (mV)

### `windowData`

- A rolling array of live samples used for real-time graphing
- Sample format:
- ts { t: number; v: number }
  - t = timestamp (milliseconds)
  - v = voltage (millivolts)
 
### `connect(device)`
- Connects to a selected BLE device
- Subscribes to voltage notifications from the device

### `disconnect(device)`
- Disconnects from the currently connected BLE device
- Stops notifications and clears connection state

