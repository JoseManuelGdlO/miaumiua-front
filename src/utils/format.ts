const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const countFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number) {
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatCount(amount: number) {
  return countFormatter.format(Number.isFinite(amount) ? amount : 0);
}
