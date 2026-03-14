"use client";

import Image from "next/image";
import clsx from "clsx";
import { DeviceType } from "brilliantsole/browser";

export default function DeviceIcon({ type }: { type: DeviceType }) {
  const isRight = type?.toLowerCase().includes("right");
  return (
    <Image
      priority
      className={clsx("size-7 dark:invert", isRight ? "" : "-scale-x-100")}
      src="/right-shoe.svg"
      width={800}
      height={800}
      alt={type ?? "device"}
    />
  );
}
