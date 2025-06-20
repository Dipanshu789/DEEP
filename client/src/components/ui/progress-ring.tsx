interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  className?: string;
  color?: string;
}

export default function ProgressRing({
  size = 120,
  strokeWidth = 8,
  progress,
  className = "",
  color = "currentColor",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`progress-ring ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-ring-fill transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  );
}
