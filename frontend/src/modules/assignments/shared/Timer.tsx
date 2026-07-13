import React, { useState, useEffect, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface TimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  warningThresholdMinutes?: number; // default: 5 mins
  startedAt?: string | null;
}

export const Timer: React.FC<TimerProps> = ({
  durationMinutes,
  onTimeUp,
  warningThresholdMinutes = 5,
  startedAt,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (startedAt && durationMinutes > 0) {
      const startedTimeMs = new Date(startedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedTimeMs) / 1000);
      const remaining = durationMinutes * 60 - elapsedSeconds;
      return remaining > 0 ? remaining : 0;
    }
    return durationMinutes * 60;
  });
  const onTimeUpRef = useRef(onTimeUp);

  // Keep ref updated to handle closures safely without re-triggering effect
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!startedAt || durationMinutes <= 0) {
      // Fallback mode: standard countdown timer
      if (secondsRemaining <= 0) {
        onTimeUpRef.current();
        return;
      }

      const intervalId = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            onTimeUpRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(intervalId);
    }

    // Dynamic mode: calculate relative to startedAt timestamp and Date.now()
    const checkTime = () => {
      const startedTimeMs = new Date(startedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedTimeMs) / 1000);
      const remaining = durationMinutes * 60 - elapsedSeconds;

      if (remaining <= 0) {
        setSecondsRemaining(0);
        onTimeUpRef.current();
      } else {
        setSecondsRemaining(remaining);
      }
    };

    checkTime(); // check immediately
    const intervalId = setInterval(checkTime, 1000);
    return () => clearInterval(intervalId);
  }, [startedAt, durationMinutes]);

  // Format seconds into HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isWarningState = secondsRemaining <= warningThresholdMinutes * 60;
  const percentageRemaining = (secondsRemaining / (durationMinutes * 60)) * 100;

  return (
    <div
      id="timer-pill"
      className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl border transition-all duration-300 shadow-sm ${
        isWarningState
          ? "bg-[#FF6200]/10 border-[#FF6200]/25 text-[#FF6200] animate-pulse"
          : "bg-[#6C1D5F]/5 border-[#6C1D5F]/15 text-[#6C1D5F]"
      }`}
    >
      <div className="flex items-center gap-2">
        {isWarningState ? (
          <AlertTriangle className="w-5 h-5 text-[#FF6200] animate-bounce" />
        ) : (
          <Clock className="w-5 h-5 text-[#6C1D5F]" />
        )}
        <div className="text-right">
          <p className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-opacity-70 text-current leading-none mb-1">
            {isWarningState ? "Time Critical" : "Time Left"}
          </p>
          <span className="text-lg font-black tracking-normal font-mono leading-none">
            {formatTime(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Mini Visual Progress bar indicator using brand colours */}
      <div className="w-16 h-1.5 bg-gray-200/50 rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isWarningState ? "bg-[#FF6200]" : "bg-[#01AC9F]"
          }`}
          style={{ width: `${percentageRemaining}%` }}
        />
      </div>
    </div>
  );
};
