export const formatMinis = (value: number) => {
  const amount = Number.isFinite(value) ? value : 0;
  const unit = Math.abs(amount) === 1 ? "⧖" : "⧖";
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${unit}`;
};
