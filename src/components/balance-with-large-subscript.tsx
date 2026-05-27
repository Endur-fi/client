import { formatBalance } from "@/lib/utils";

const SUBSCRIPT_TO_DIGIT: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
};

const SUBSCRIPT_PART = /([\u2080-\u2089]+)/;

export function BalanceWithLargeSubscript({
  value,
  decimals,
  className,
}: {
  value: number | string;
  decimals?: number;
  className?: string;
}) {
  const text = formatBalance(value, decimals);

  if (!/[\u2080-\u2089]/.test(text)) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {text.split(SUBSCRIPT_PART).map((part, i) =>
        /[\u2080-\u2089]/.test(part) ? (
          <span
            key={i}
            className="align-sub text-[1em] font-semibold leading-none"
          >
            {part.replace(/[\u2080-\u2089]/g, (c) => SUBSCRIPT_TO_DIGIT[c] ?? c)}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}
