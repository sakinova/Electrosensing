#include <NimBLEDevice.h>
#include <NimBLEServer.h>
#include <Adafruit_ADS1X15.h>
Adafruit_ADS1115 ads;  /* Use this for the 16-bit version */

#define SERVICE_UUID        "12345678-1234-1234-1234-1234567890ab"
#define CHARACTERISTIC_UUID "12345678-1234-1234-1234-1234567890ac"

NimBLECharacteristic* pChar = nullptr;
volatile bool deviceConnected = false;

class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s, NimBLEConnInfo& connInfo) override {
    deviceConnected = true;
    Serial.println("Device connected");
  }
  void onDisconnect(NimBLEServer* s, NimBLEConnInfo& connInfo, int reason) override {
    deviceConnected = false;
    Serial.printf("Device disconnected (reason=%d), restarting advertising...", reason);
    NimBLEDevice::startAdvertising();
    //s->startAdvertising(); // to restart advertising on that server
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);              // give USB a moment
  Serial.println();
  Serial.println("=== BOOTING SKETCH ===");

  //--- ADS1115 ----
  if (!ads.begin()) {
    Serial.println("Failed to initialize ADS.");
    while (1);
  } 
  Serial.println("Getting differential reading from AIN0 - AIN1");
  Serial.println("ADC Range: +/- 6.144V (1 bit = 3mV/ADS1015, 0.1875mV/ADS1115)");
 
  // The ADC input range (or gain) can be changed via the following
  // functions, but be careful never to exceed VDD +0.3V max, or to
  // exceed the upper and lower limits if you adjust the input range!
  // Setting these values incorrectly may destroy your ADC!
  //                                                                ADS1015  ADS1115
  //                                                                -------  -------
  // ads.setGain(GAIN_TWOTHIRDS);  // 2/3x gain +/- 6.144V  1 bit = 3mV      0.1875mV (default)
  // ads.setGain(GAIN_ONE);        // 1x gain   +/- 4.096V  1 bit = 2mV      0.125mV
  ads.setGain(GAIN_TWO);        // 2x gain   +/- 2.048V  1 bit = 1mV      0.0625mV
  // ads.setGain(GAIN_FOUR);       // 4x gain   +/- 1.024V  1 bit = 0.5mV    0.03125mV
  //ads.setGain(GAIN_EIGHT);      // 8x gain   +/- 0.512V  1 bit = 0.25mV   0.015625mV
  //ads.setGain(GAIN_SIXTEEN);    // 16x gain  +/- 0.256V  1 bit = 0.125mV  0.0078125mV
  Serial.println("ADS1115 ready");

  //--- BLE init ---

  NimBLEDevice::init("PlantSense");
  NimBLEDevice::setDeviceName("PlantSense");

  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCB());

  NimBLEService* svc = server->createService(SERVICE_UUID);
  pChar = svc->createCharacteristic(CHARACTERISTIC_UUID,
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  pChar->createDescriptor("2902");
  pChar->setValue("READY\n");
  svc->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();

  NimBLEAdvertisementData advData;
  advData.setCompleteServices(NimBLEUUID(SERVICE_UUID));
  adv->setAdvertisementData(advData);

  NimBLEAdvertisementData scanData;
  scanData.setName("PlantSense");
  adv->setScanResponseData(scanData);

  adv->setAppearance(0);
  NimBLEDevice::startAdvertising();
  Serial.println("ESP32 BLE advertising...");
}

void loop() {
  // Nothing to do here, just advertising
  int16_t adcDiff = ads.readADC_Differential_0_1();
  float voltage = ads.computeVolts(adcDiff) * 1000.0f;
  // Format as text "123.456\n"
  char line[24];
  snprintf(line, sizeof(line), "%.3f\n", voltage);

  if (deviceConnected) {
    pChar->setValue(line);  // will be base64'ed on the phone side
    pChar->notify();
  }
  delay(20);
}
