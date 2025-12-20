import { Buffer } from "buffer";
import { createContext, PropsWithChildren, useRef, useState } from "react";
import { BleManager, Device, Subscription } from "react-native-ble-plx";

// --- ensure single BleManager ---
let _manager: BleManager | null = null;
function getManager() {
  if (!_manager) _manager = new BleManager();
  return _manager;
}
const manager = getManager();

const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHAR_UUID    = "12345678-1234-1234-1234-1234567890ac";

type Sample = { t: number; v: number };

type AuthState = {
    attachMonitor : (device:Device) => void;
    scanAndConnect : () => void;
    disconnect : () => void;
    device : Device | null;
    scanning: boolean;
    lastValue : number | null;
    windowData: Sample[];
    isConnected : boolean
};

export const AuthContext = createContext<AuthState>({
    attachMonitor : ()=>{},
    scanAndConnect : () => {},
    disconnect : () => {},
    device : null,
    scanning: false,
    lastValue: null,
    windowData : [],
    isConnected: false,
});

export function AuthProvider({children} : PropsWithChildren){

  const [device, setDevice] = useState<Device | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastValue, setLastValue] = useState<number | null>(null);
  const [windowData, setWindowData] = useState<Sample[]>([]); // ~20s window

   // keep a handle for the characteristic subscription
    const subRef = useRef<Subscription | null>(null);
    // keep a disconnect listener to auto-reconnect
    const dcRef = useRef<Subscription | null>(null);

const attachMonitor = async (dev: Device) => {
    // subscribe to notifications
    try { subRef.current?.remove(); } catch {}
    const sub = dev.monitorCharacteristicForService(
      SERVICE_UUID,
      CHAR_UUID,
      (err, ch) => {
        if (err || !ch?.value) return;
        const utf8 = Buffer.from(ch.value, "base64").toString("utf8");

        for (const line of utf8.split(/\r?\n/)) {
          const s = line.trim();
          if (!s) continue;

          for (const tok of s.split(",")) {
            const v = Number(tok);
            if (Number.isNaN(v)) continue;

            const t = Date.now();
            setLastValue(v);
            setWindowData(prev => {
              const cutoff = t - 20_000;
              const next = [...prev, { t, v }];
              let i = 0;
              while (i < next.length && next[i].t < cutoff) i++;
              return i ? next.slice(i) : next;
            });
          }
        }
      }
    );
    subRef.current = sub;
  };

  const scanAndConnect = async () => {
  setScanning(true);

  manager.startDeviceScan(null, null, async (error, d) => {
    if (error) {
      console.log("scan error:", error);
      setScanning(false);
      return;
    }
    if (!d || !d.name?.includes("PlantSense")) return;

    // Found target
    manager.stopDeviceScan();

    try {
      const dev = await manager.connectToDevice(d.id, { timeout: 10000 });
      await dev.discoverAllServicesAndCharacteristics();
      setDevice(dev);

      // on disconnect -> clear state
      try { dcRef.current?.remove(); } catch {}
      dcRef.current = manager.onDeviceDisconnected(dev.id, () => {
        console.log("device disconnected");
        setDevice(null);
        setLastValue(null);
        setWindowData([]);
        try { subRef.current?.remove(); } catch {}
        subRef.current = null;
      });

      await attachMonitor(dev);
      console.log("connected:", dev.name || dev.id);
    } catch (e) {
      console.log("connect error:", e);
      setDevice(null);
    } finally {
      setScanning(false);            // <— ensure we end scanning state
      manager.stopDeviceScan();      // <— be explicit/safe
    }
  });
};


  const disconnect = async () => {
    try { subRef.current?.remove(); } catch {}
    try { dcRef.current?.remove(); } catch {}
    subRef.current = null;
    dcRef.current = null;
    if (device) {
      try { await manager.cancelDeviceConnection(device.id); } catch {}
    }
    setDevice(null);
    setLastValue(null);
    setWindowData([]);
    console.log("disconnected");
  };

  const isConnected = !!device;


    return(
        <AuthContext.Provider 
          value={{
            attachMonitor,
            scanAndConnect,
            disconnect,
            device,
            lastValue,
            scanning, 
            windowData,
            isConnected,
            }}
          >
            {children}
        </AuthContext.Provider>
    )
}
