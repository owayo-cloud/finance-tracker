export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// CSV Export utilities
function sanitizeCSVCell(cell: any): string {
  const cellStr = String(cell)
  if (
    cellStr.includes('"') ||
    cellStr.includes(",") ||
    cellStr.includes("\n")
  ) {
    return `"${cellStr.replace(/"/g, '""')}"`
  }
  return cellStr
}

export function downloadCSV(data: any[][], filename: string) {
  const csvContent = data
    .map((row) => row.map((cell) => sanitizeCSVCell(cell)).join(","))
    .join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
