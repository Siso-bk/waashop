export const formatMinis = (value: number) => {
  const amount = Number.isFinite(value) ? value : 0;
  const unit = Math.abs(amount) === 1 ? "MINI" : "MINIS";
  return `${amount.toLocaleString()} ${unit}`;
};
