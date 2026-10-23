import Svg, { Circle } from 'react-native-svg';

/** Circular progress ring. `segments` are drawn in order, as shares of the full circle. */
export function Ring({
  size,
  stroke,
  track,
  segments,
}: {
  size: number;
  stroke: number;
  track: string;
  segments: { value: number; color: string }[];
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 6 : 0;
  const offsets = segments.map((_, i) => segments.slice(0, i).reduce((sum, s) => sum + s.value * circumference, 0));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      {segments.map((s, i) => {
        if (s.value <= 0) return null;
        const len = Math.max(0, s.value * circumference - gap);
        return (
          <Circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${len} ${circumference}`}
            strokeDashoffset={-offsets[i]}
          />
        );
      })}
    </Svg>
  );
}
