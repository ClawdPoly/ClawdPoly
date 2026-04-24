import React from "react";

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <img
      src="/logo.png"
      alt="ClawdPoly"
      className={`${className} rounded-md object-cover`}
      draggable="false"
    />
  );
}
