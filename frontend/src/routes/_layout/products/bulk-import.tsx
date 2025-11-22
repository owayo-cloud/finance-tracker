import { createFileRoute } from "@tanstack/react-router"
import { BulkImportPage } from "../../../components/Products/BulkImport"

export const Route = createFileRoute("/_layout/products/bulk-import")({
  component: BulkImportPage,
})
