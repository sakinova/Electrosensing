# PlantSense ESP32 Firmware

This repository contains the ESP32 firmware used by the PlantSense system to acquire plant electrical signals using an ADS1115 ADC and transmit the data wirelessly to the PlantSense mobile application via Bluetooth Low Energy (BLE).

---

## Overview

This firmware performs the following functions:

- Reads differential voltage from an ADS1115 ADC (AIN0 – AIN1)
- Converts ADC readings to millivolts
- Advertises as a BLE device named `PlantSense`
- Streams voltage values over BLE using notifications
- Interfaces directly with the PlantSense React Native mobile application

---

## Hardware Requirements

- **ESP32 Dev Module**
- **ADS1115 16-bit ADC**
- I²C connection between ESP32 and ADS1115
- Differential signal connected to:
  - AIN0 (positive)
  - AIN1 (negative)
- External reference electrode as defined in the PlantSense hardware design

---

## Software Requirements

### Arduino IDE

Download and install the Arduino IDE from:

https://www.arduino.cc/en/software

---

### ESP32 Board Support

In Arduino IDE:

1. Open **Preferences**
2. Open **Tools → Board → Boards Manager**
3. Search for `esp32`
4. Install **esp32 by Espressif Systems**

---

## Required Libraries

Install the following libraries using **Sketch → Include Library → Manage Libraries…**

NimBLE-Arduino h2zero 2.3.x
Adafruit ADS1X15 Adafruit 2.6.0
Adafruit BusIO Adafruit 1.17.x

**Note:** Adafruit BusIO is required by the ADS1X15 library.

---

## Board Configuration

Configure the following settings in **Tools** before uploading:

| Board | ESP32 Dev Module |
| Port | `/dev/cu.usbserial-XXXX` |
| CPU Frequency | 240MHz (WiFi/BT) |
| Flash Frequency | 80MHz |
| Flash Mode | QIO |
| Flash Size | 4MB |
| Partition Scheme | Default 4MB with SPIFFS |
| Upload Speed | 115200 |
| Core Debug Level | None |

---

## Serial Monitor Settings

- **Baud rate:** `115200`
- Used for debug output only
- Sensor data is transmitted via BLE, not Serial

---

## BLE Configuration

### Service and Characteristic UUIDs

```cpp
#define SERVICE_UUID        "12345678-1234-1234-1234-1234567890ab"
#define CHARACTERISTIC_UUID "12345678-1234-1234-1234-1234567890ac"
```

### UUID Security Note
- These UUIDs are placeholder values.
- For production or research deployments, it is recommended to:
- Generate custom UUIDs using a UUID generator

### Update both: The ESP32 firmware + React Native BLE code in the mobile application
- The UUIDs must match exactly on both sides for the BLE connection to succeed.
