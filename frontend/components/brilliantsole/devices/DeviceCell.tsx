"use client";

import DeviceHeader from "./DeviceHeader";

export default function DeviceCell({ children }: { children?: React.ReactNode }) {
  return (
    <li className="col-span-1 rounded-lg shadow dark:outline-2 dark:outline-zinc-800 dark:outline">
      <DeviceHeader className="p-6 pt-5 pb-5" />
      {children && (
        <div>
          <div className="flex gap-x-3 gap-y-2 flex-wrap">{children}</div>
        </div>
      )}
    </li>
  );
}
