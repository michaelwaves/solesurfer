"use client";

import * as BS from "brilliantsole/browser";

export default function BluetoothNotSupported() {
  if (BS.Environment.isBluetoothSupported) {
    return null;
  }

  if (BS.Environment.isSafari) {
    if (BS.Environment.isMac) {
      return (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Bluetooth is not supported in Safari on Mac. Please use{" "}
          <a href="https://www.google.com/chrome/" target="_blank" className="underline">
            Chrome
          </a>
          .
        </p>
      );
    }
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Bluetooth is not supported in Safari on iOS. Please use{" "}
        <a href="https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055" target="_blank" className="underline">
          Bluefy
        </a>
        .
      </p>
    );
  }

  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      Bluetooth is not supported in this browser.
    </p>
  );
}
