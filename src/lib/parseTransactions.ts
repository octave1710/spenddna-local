import miaCsv from "../../data/mia_transactions.csv?raw";

export interface Transaction {
  date: string;
  amount_eur: number;
  merchant_name: string;
  category: string;
  time_of_day: string;
  weekday: string;
}

export function parseTransactions(): Transaction[] {
  const [, ...rows] = miaCsv.trim().split("\n");
  return rows
    .filter((r) => r.trim())
    .map((row) => {
      const cols = row.split(",");
      return {
        date: cols[0].trim(),
        amount_eur: parseFloat(cols[1]),
        merchant_name: cols[2].trim(),
        category: cols[3].trim(),
        time_of_day: cols[6].trim(),
        weekday: cols[7].trim(),
      };
    });
}

export function buildTransactionSummary(): string {
  const txns = parseTransactions();

  const byCategory: Record<string, { count: number; total: number }> = {};
  const byMerchant: Record<string, number> = {};

  for (const t of txns) {
    byCategory[t.category] ??= { count: 0, total: 0 };
    byCategory[t.category].count++;
    byCategory[t.category].total += t.amount_eur;
    byMerchant[t.merchant_name] = (byMerchant[t.merchant_name] ?? 0) + 1;
  }

  const topMerchants = Object.entries(byMerchant)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([n, c]) => `${n}(${c}x)`)
    .join(", ");

  const catLines = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, d]) => `${cat}: ${d.count} visits, €${d.total.toFixed(0)}`)
    .join("; ");

  const morningCount = txns.filter(
    (t) => parseInt(t.time_of_day.split(":")[0]) < 10,
  ).length;
  const weekdayCount = txns.filter(
    (t) => !["Saturday", "Sunday"].includes(t.weekday),
  ).length;

  return [
    `90-day Sparkasse transaction history for Mia Schmidt, Stuttgart Old Town (${txns.length} transactions total):`,
    `Top merchants by frequency: ${topMerchants}`,
    `Category breakdown: ${catLines}`,
    `Timing: ${morningCount} transactions before 10am; ${weekdayCount}/${txns.length} on weekdays`,
  ].join("\n");
}
