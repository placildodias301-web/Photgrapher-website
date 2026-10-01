"use client";
import { useState } from "react";
import { inputCls } from "@/components/ui/Notice";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/** A password <input> with an eye icon to reveal what was typed. Forwards every other prop as-is. */
export default function PasswordField({ className, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className ?? inputCls} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-mute hover:text-gold"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.83 2.83" strokeLinecap="round" />
            <path d="M9.4 5.3A10.9 10.9 0 0 1 12 5c6 0 9.7 5.5 10 7a10.6 10.6 0 0 1-3.1 3.9M6.3 6.9C4 8.4 2.4 10.6 2 12c.4 1.6 2.7 5 7 6.6a10.6 10.6 0 0 0 3.2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M2 12c.4-1.6 4-7 10-7s9.6 5.4 10 7c-.4 1.6-4 7-10 7s-9.6-5.4-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
