export const numberFormatter = new Intl.NumberFormat("en-US");

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

export const formatMetricValue = (value, type) => {
  if (type === "percentage") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (type === "currency") {
    return currencyFormatter.format(value);
  }
  return numberFormatter.format(value);
};

export const getHeatmapColor = (value, min, max) => {
  if (max === min) {
    return "#e5e7eb";
  }
  const ratio = (value - min) / (max - min);
  const saturation = 75;
  const lightness = 90 - ratio * 45;
  return `hsl(12, ${saturation}%, ${lightness}%)`;
};
