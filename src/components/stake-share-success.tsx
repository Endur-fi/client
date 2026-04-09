"use client";

import { motion, useMotionValue } from "framer-motion";
import React from "react";

import type { LSTAssetConfig } from "@/constants";
import { cn } from "@/lib/utils";

import { Icons } from "./Icons";

function stakeShareUnderlyingIcon(symbol: string, className: string) {
  switch (symbol) {
    case "STRK":
      return <Icons.strkLogo className={className} />;
    case "WBTC":
      return <Icons.wbtc className={className} />;
    case "tBTC":
      return <Icons.tbtc className={className} />;
    case "LBTC":
      return <Icons.lbtc className={className} />;
    case "solvBTC":
      return <Icons.solvbtc className={className} />;
    default:
      return <Icons.btcLogo className={className} />;
  }
}

export function stakeShareLstIcon(lstSymbol: string, className: string) {
  switch (lstSymbol) {
    case "xSTRK":
      return <Icons.endurLogo className={className} />;
    case "xWBTC":
      return <Icons.xwbtc className={className} />;
    case "xtBTC":
      return <Icons.xtbtc className={className} />;
    case "xLBTC":
      return <Icons.xlbtc className={className} />;
    case "xsBTC":
      return <Icons.xsbtc className={className} />;
    default:
      return <Icons.endurLogo className={className} />;
  }
}

/** Stake modal: underlying is always native STRK when category is STRK (not LST / Endur mark). */
export function stakeShareModalUnderlyingIcon(
  symbol: string,
  category: LSTAssetConfig["CATEGORY"],
  className: string,
) {
  if (category === "STRK") {
    return <Icons.strkLogo className={className} />;
  }
  return stakeShareUnderlyingIcon(symbol, className);
}

/** Share-dialog intro duration (must match phase timeout in stake.tsx). */
export const STAKE_SHARE_INTRO_DURATION_S = 5;

function smoothstep01(t0: number, t1: number, t: number) {
  if (t <= t0) return 0;
  if (t >= t1) return 1;
  const u = (t - t0) / (t1 - t0);
  return u * u * (3 - 2 * u);
}

function rocketAngularVelocity01(t: number): number {
  const envelope = Math.sin(Math.PI * t) ** 2;
  let bump: number;
  if (t <= 0.5) {
    const u = t / 0.5;
    bump = Math.log(1 + 16 * u) / Math.log(17);
  } else {
    const u = (1 - t) / 0.5;
    bump = Math.log(1 + 16 * u) / Math.log(17);
  }
  return envelope * bump;
}

function buildRotationAngleTable(totalDeg: number, steps: number) {
  const dt = 1 / steps;
  const v = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i++) {
    v[i] = rocketAngularVelocity01(i / steps);
  }
  let sumV = 0;
  for (let i = 0; i < steps; i++) {
    sumV += 0.5 * (v[i] + v[i + 1]) * dt;
  }
  const angles = new Float64Array(steps + 1);
  let acc = 0;
  for (let i = 1; i <= steps; i++) {
    acc += 0.5 * (v[i - 1] + v[i]) * dt;
    angles[i] = (totalDeg * acc) / sumV;
  }
  return angles;
}

function sampleAngleAt(angles: Float64Array, steps: number, t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return angles[steps];
  const x = t * steps;
  const i = Math.min(steps - 1, Math.floor(x));
  const f = x - i;
  return angles[i] + (angles[i + 1] - angles[i]) * f;
}

export function StakeShareIntroAnimation({
  symbol,
  lstSymbol,
  assetCategory,
  className,
}: {
  symbol: string;
  lstSymbol: string;
  assetCategory: LSTAssetConfig["CATEGORY"];
  className?: string;
}) {
  const iconWrapperClass =
    "flex size-full max-h-[min(220px,58vmin)] max-w-[min(220px,58vmin)] items-center justify-center [&_svg]:h-full [&_svg]:w-full [&_svg]:max-h-full [&_svg]:max-w-full";

  const rotate = useMotionValue(0);
  const underlyingOpacity = useMotionValue(1);
  const lstOpacity = useMotionValue(0);

  const angles = React.useMemo(
    () => buildRotationAngleTable(18 * 360, 960),
    [],
  );
  const steps = angles.length - 1;

  React.useLayoutEffect(() => {
    rotate.set(0);
    underlyingOpacity.set(1);
    lstOpacity.set(0);
  }, [rotate, underlyingOpacity, lstOpacity]);

  React.useEffect(() => {
    const start = performance.now();
    const durationMs = STAKE_SHARE_INTRO_DURATION_S * 1000;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      rotate.set(sampleAngleAt(angles, steps, t));
      underlyingOpacity.set(1 - smoothstep01(0.62, 0.94, t));
      lstOpacity.set(smoothstep01(0.64, 0.97, t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        rotate.set(angles[steps]);
        underlyingOpacity.set(0);
        lstOpacity.set(1);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [angles, lstOpacity, rotate, steps, underlyingOpacity]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-2xl p-16",
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-[40%] opacity-[0.35]"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "conic-gradient(from 0deg, transparent, rgba(23,135,109,0.22), transparent 40%, rgba(23,135,109,0.12), transparent 70%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(23,135,109,0.28),transparent_65%)]"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.55, 0.9, 0.55],
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute size-32 rounded-full bg-[#17876D]/25 blur-3xl"
          style={{
            left: `${18 + i * 22}%`,
            top: `${12 + (i % 2) * 28}%`,
          }}
          animate={{
            x: [0, 12, -8, 0],
            y: [0, -10, 6, 0],
            scale: [1, 1.25, 1.05, 1],
            opacity: [0.25, 0.45, 0.35, 0.25],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-[1] flex w-[60%] max-w-[220px] items-center justify-center">
        <div className="relative aspect-square w-full">
          <motion.div
            className="absolute inset-0 flex will-change-transform items-center justify-center"
            style={{ rotate }}
          >
            <motion.div
              className={cn("absolute inset-0", iconWrapperClass)}
              style={{ opacity: underlyingOpacity }}
            >
              {stakeShareModalUnderlyingIcon(
                symbol,
                assetCategory,
                "shrink-0",
              )}
            </motion.div>
            <motion.div
              className={cn("absolute inset-0", iconWrapperClass)}
              style={{ opacity: lstOpacity }}
            >
              {stakeShareLstIcon(lstSymbol, "shrink-0")}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
