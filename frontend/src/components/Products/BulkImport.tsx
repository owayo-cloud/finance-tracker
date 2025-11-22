/**
 * Bulk Product Import - Complete Single-File Implementation
 * 
 * This component implements a 5-stage bulk import workflow:
 * 1. Pre-Import Instructions & Template Download
 * 2. File Upload (CSV/Excel)
 * 3. Column Mapping
 * 4. Data Validation & Error Fixing
 * 5. Final Import & Success Summary
 */

import { useState, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  List,
  Icon,
  Alert,
  Input,
  Table,
  Grid,
  Spinner,
  createListCollection,
} from "@chakra-ui/react"
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select"
import {
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiArrowRight,
  FiArrowLeft,
  FiAlertTriangle,
  FiEdit,
  FiRefreshCw,
  FiChevronRight,
  FiTrash2,
} from "react-icons/fi"

import { ProductsService } from "@/client"
import useCustomToast from "../../hooks/useCustomToast"
import { Field } from "../ui/field"
import { Tooltip } from "../ui/tooltip"

// ==================== TYPES ====================

enum ImportStage {
  INSTRUCTIONS = 1,
  UPLOAD = 2,
  MAPPING = 3,
  VALIDATION = 4,
  COMPLETE = 5,
}

interface ValidationError {
  field: string
  message: string
  severity: "error" | "warning"
}

interface ImportRow {
  row_number: number
  data: Record<string, any>
  mapped_data?: Record<string, any>
  errors: ValidationError[]
  warnings: string[]
  is_duplicate: boolean
  duplicate_product_id?: string
  status: "valid" | "error" | "warning" | "duplicate"
}

interface BulkImportState {
  currentStage: ImportStage
  sessionId: string | null
  filename: string | null
  totalRows: number
  validRows: number
  errorRows: number
  duplicateRows: number
  columns: string[]
  columnMapping: Record<string, string>
  autoMapping: Record<string, string>
  defaultCategoryId: string | null
  defaultStatusId: string | null
  validatedRows: ImportRow[]
  duplicateAction: "skip" | "update" | "create"
  importTags: string[]
  importNotes: string
}

// ==================== MAIN COMPONENT ====================

export function BulkImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [importState, setImportState] = useState<BulkImportState>({
    currentStage: ImportStage.INSTRUCTIONS,
    sessionId: null,
    filename: null,
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    duplicateRows: 0,
    columns: [],
    columnMapping: {},
    autoMapping: {},
    defaultCategoryId: null,
    defaultStatusId: null,
    validatedRows: [],
    duplicateAction: "skip",
    importTags: [],
    importNotes: "",
  })

  const handleBack = () => {
    if (importState.currentStage > ImportStage.INSTRUCTIONS) {
      setImportState({
        ...importState,
        currentStage: importState.currentStage - 1,
      })
    } else {
      navigate({ to: "/products", search: { page: 1, search: "", category: "", status: "", pageSize: 25 } })
    }
  }

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel the import? All progress will be lost.")) {
      navigate({ to: "/products", search: { page: 1, search: "", category: "", status: "", pageSize: 25 } })
    }
  }

  const getStageLabel = (stage: ImportStage): string => {
    switch (stage) {
      case ImportStage.INSTRUCTIONS:
        return "Instructions"
      case ImportStage.UPLOAD:
        return "Upload File"
      case ImportStage.MAPPING:
        return "Map Columns"
      case ImportStage.VALIDATION:
        return "Review & Fix"
      case ImportStage.COMPLETE:
        return "Complete"
      default:
        return ""
    }
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>
            Bulk Product Import
          </Heading>
          <Text color="fg.muted">
            Import multiple products at once using CSV or Excel files
          </Text>
        </Box>

        {/* Stage Progress Breadcrumbs */}
        <Box 
          p={4} 
          borderWidth="1px" 
          borderRadius="lg" 
          bg={{ base: "gray.800", _light: "white" }}
          borderColor={{ base: "gray.700", _light: "gray.200" }}
          shadow="sm"
        >
          <HStack gap={3} fontSize="sm" flexWrap="wrap" justify="center">
            {[
              { stage: ImportStage.UPLOAD, label: "Upload File" },
              { stage: ImportStage.MAPPING, label: "Column Mapping" },
              { stage: ImportStage.VALIDATION, label: "Repair" },
              { stage: ImportStage.COMPLETE, label: "Import" },
            ].map((item, index, arr) => (
              <HStack key={item.stage} gap={3}>
                <HStack 
                  gap={2}
                  px={3}
                  py={2}
                  borderRadius="md"
                  bg={importState.currentStage === item.stage ? { base: "teal.900", _light: "teal.50" } : "transparent"}
                  color={importState.currentStage >= item.stage ? "teal.500" : "fg.muted"}
                  fontWeight={importState.currentStage === item.stage ? "semibold" : "medium"}
                  transition="all 0.2s"
                >
                  {importState.currentStage > item.stage ? (
                    <Icon as={FiCheckCircle} boxSize={5} />
                  ) : (
                    <Box
                      w={5}
                      h={5}
                      borderRadius="full"
                      borderWidth={2}
                      borderColor={importState.currentStage === item.stage ? "teal.500" : "gray.400"}
                      bg={importState.currentStage === item.stage ? "teal.500" : "transparent"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    />
                  )}
                  <Text fontSize="md">{item.label}</Text>
                </HStack>
                {index < arr.length - 1 && (
                  <Icon as={FiChevronRight} boxSize={4} color="gray.400" />
                )}
              </HStack>
            ))}
          </HStack>
        </Box>

        {/* Stage Content */}
        <Box 
          p={8} 
          borderWidth="1px" 
          borderRadius="lg" 
          minH="400px"
          bg={{ base: "gray.800", _light: "white" }}
          borderColor={{ base: "gray.700", _light: "gray.200" }}
          shadow="sm"
        >
          {importState.currentStage === ImportStage.INSTRUCTIONS && (
            <InstructionsStage
              onContinue={() =>
                setImportState({ ...importState, currentStage: ImportStage.UPLOAD })
              }
            />
          )}
          {importState.currentStage === ImportStage.UPLOAD && (
            <UploadStage
              onFileUploaded={(
                sessionId: string,
                filename: string,
                totalRows: number,
                columns: string[],
                autoMapping: Record<string, string>
              ) => {
                setImportState({
                  ...importState,
                  sessionId,
                  filename,
                  totalRows,
                  columns,
                  autoMapping,
                  columnMapping: autoMapping,
                  currentStage: ImportStage.MAPPING,
                })
              }}
            />
          )}
          {importState.currentStage === ImportStage.MAPPING && (
            <MappingStage
              sessionId={importState.sessionId!}
              columns={importState.columns}
              autoMapping={importState.autoMapping}
              totalRows={importState.totalRows}
              onMappingComplete={(
                validRows: number,
                errorRows: number,
                duplicateRows: number,
                columnMapping: Record<string, string>,
                defaultCategoryId: string,
                defaultStatusId: string,
                validatedRows: ImportRow[]
              ) => {
                setImportState({
                  ...importState,
                  validRows,
                  errorRows,
                  duplicateRows,
                  columnMapping,
                  defaultCategoryId,
                  defaultStatusId,
                  validatedRows,
                  currentStage: ImportStage.VALIDATION,
                })
              }}
            />
          )}
          {importState.currentStage === ImportStage.VALIDATION && (
            <ValidationStage
              sessionId={importState.sessionId!}
              validRows={importState.validRows}
              errorRows={importState.errorRows}
              duplicateRows={importState.duplicateRows}
              validatedRows={importState.validatedRows}
              onImportComplete={(successCount, errorCount, duplicateCount) => {
                setImportState({
                  ...importState,
                  validRows: successCount,
                  errorRows: errorCount,
                  duplicateRows: duplicateCount,
                  currentStage: ImportStage.COMPLETE,
                })
                queryClient.invalidateQueries({ queryKey: ["products"] })
              }}
              duplicateAction={importState.duplicateAction}
              onDuplicateActionChange={(action) =>
                setImportState({ ...importState, duplicateAction: action })
              }
            />
          )}
          {importState.currentStage === ImportStage.COMPLETE && (
            <CompleteStage
              validRows={importState.validRows}
              errorRows={importState.errorRows}
              duplicateRows={importState.duplicateRows}
              sessionId={importState.sessionId!}
            />
          )}
        </Box>

        {/* Navigation Buttons */}
        <Flex justify="space-between">
          <Button variant="outline" onClick={handleBack}>
            <HStack gap={2}>
              <Icon as={FiArrowLeft} />
              <Text>
                {importState.currentStage === ImportStage.INSTRUCTIONS ? "Back to Products" : "Back"}
              </Text>
            </HStack>
          </Button>

          <HStack gap={3}>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            {importState.currentStage === ImportStage.COMPLETE && (
              <Button
                colorScheme="green"
                onClick={() => navigate({ to: "/products", search: { page: 1, search: "", category: "", status: "", pageSize: 25 } })}
              >
                Back to Products
              </Button>
            )}
          </HStack>
        </Flex>
      </VStack>
    </Container>
  )
}

// ==================== STAGE 1: INSTRUCTIONS ====================

interface InstructionsStageProps {
  onContinue: () => void
}

function InstructionsStage({ onContinue }: InstructionsStageProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/products/bulk/template`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })

      if (!response.ok) throw new Error("Failed to download template")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "product_import_template.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showSuccessToast("Template downloaded successfully!")
    } catch (error) {
      showErrorToast("Failed to download template")
      console.error("Download error:", error)
    }
  }

  return (
    <VStack gap={4} align="stretch">
      <Alert.Root status="info">
        <Alert.Indicator>
          <Icon as={FiInfo} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Before You Begin</Alert.Title>
          <Alert.Description>
            Make sure you have your product data ready in CSV or Excel format. Review the guidelines below.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      {/* Compact Guidelines Grid */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
        <Box p={4} borderWidth="1px" borderRadius="md" bg={{ base: "gray.750", _light: "gray.50" }}>
          <Text fontWeight="bold" fontSize="sm" mb={2} color={{ base: "blue.300", _light: "blue.600" }}>
            Supported Formats
          </Text>
          <List.Root fontSize="sm" pl={4}>
            <List.Item>CSV</List.Item>
            <List.Item>Excel (XLSX/XLS)</List.Item>
          </List.Root>
        </Box>

        <Box p={4} borderWidth="1px" borderRadius="md" bg={{ base: "gray.750", _light: "gray.50" }}>
          <Text fontWeight="bold" fontSize="sm" mb={2} color={{ base: "blue.300", _light: "blue.600" }}>
            File Limits
          </Text>
          <List.Root fontSize="sm" pl={4}>
            <List.Item>Max size: 10MB</List.Item>
            <List.Item>Max rows: 1000</List.Item>
          </List.Root>
        </Box>

        <Box p={4} borderWidth="1px" borderRadius="md" bg={{ base: "gray.750", _light: "gray.50" }}>
          <Text fontWeight="bold" fontSize="sm" mb={2} color={{ base: "red.300", _light: "red.600" }}>
            Required Fields
          </Text>
          <List.Root fontSize="sm" pl={4}>
            <List.Item>Product Name</List.Item>
            <List.Item>Selling Price</List.Item>
          </List.Root>
        </Box>

        <Box p={4} borderWidth="1px" borderRadius="md" bg={{ base: "gray.750", _light: "gray.50" }}>
          <Text fontWeight="bold" fontSize="sm" mb={2} color={{ base: "green.300", _light: "green.600" }}>
            Optional Fields
          </Text>
          <List.Root fontSize="sm" pl={4}>
            <List.Item>Buying Price</List.Item>
            <List.Item>Current Stock</List.Item>
            <List.Item>Description</List.Item>
          </List.Root>
        </Box>
      </Grid>

      <Alert.Root status="warning" size="sm">
        <Alert.Indicator>
          <Icon as={FiAlertCircle} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Description>
            Category and Status will be assigned during mapping. All products will initially use the same category and status.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <Box 
        p={3}
        bg={{ base: "gray.800", _light: "white" }}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={{ base: "gray.700", _light: "gray.200" }}
      >
        <Heading
          size="sm"
          mb={3}
          color={{ base: "white", _light: "gray.800" }}
        >
          Example Data Format
        </Heading>
        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Product Name</Table.ColumnHeader>
                <Table.ColumnHeader>Selling Price</Table.ColumnHeader>
                <Table.ColumnHeader>Buying Price</Table.ColumnHeader>
                <Table.ColumnHeader>Category</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Smirnoff Vodka 750ml</Table.Cell>
                <Table.Cell>1200.00</Table.Cell>
                <Table.Cell>980.00</Table.Cell>
                <Table.Cell>Vodka</Table.Cell>
                <Table.Cell>Premium vodka</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Coca-Cola 500ml</Table.Cell>
                <Table.Cell>80.00</Table.Cell>
                <Table.Cell>60.00</Table.Cell>
                <Table.Cell>Soft-Drinks</Table.Cell>
                <Table.Cell>Classic cola</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Balozi Lager 500ml</Table.Cell>
                <Table.Cell>150.00</Table.Cell>
                <Table.Cell>120.00</Table.Cell>
                <Table.Cell>Beers</Table.Cell>
                <Table.Cell>Budget lager</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      <Button
        colorScheme="blue"
        size="lg"
        width="full"
        onClick={onContinue}
      >
        <HStack gap={2}>
          <Text>Continue to Upload</Text>
          <Icon as={FiArrowRight} />
        </HStack>
      </Button>
    </VStack>
  )
}

// ==================== STAGE 2: UPLOAD ====================

interface UploadStageProps {
  onFileUploaded: (
    sessionId: string,
    filename: string,
    totalRows: number,
    columns: string[],
    autoMapping: Record<string, string>
  ) => void
}

function UploadStage({ onFileUploaded }: UploadStageProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/products/bulk/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Upload failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      showSuccessToast(`File uploaded successfully! Found ${data.total_rows} rows.`)
      onFileUploaded(data.id, data.filename, data.total_rows, data.columns || [], data.auto_mapping || {})
    },
    onError: (error: any) => {
      showErrorToast(error.message || "Failed to upload file")
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showErrorToast(`File too large. Maximum size is 10MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
        return
      }

      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        showErrorToast("Invalid file format. Please upload CSV or Excel files only")
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      await uploadMutation.mutateAsync(selectedFile)
      
      clearInterval(interval)
      setUploadProgress(100)
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      const fakeEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(fakeEvent)
    }
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="md" mb={2}>
          Step 1 of 5: Upload File
        </Heading>
        <Text color="fg.muted">Select or drag & drop your CSV/Excel file</Text>
      </Box>

      <Box
        p={12}
        borderWidth="2px"
        borderRadius="lg"
        borderStyle="dashed"
        borderColor={selectedFile ? "green.500" : "gray.200"}
        _dark={{ borderColor: selectedFile ? "green.500" : "gray.600" }}
        bg={selectedFile ? "green.50" : "gray.50"}
        _dark={{ bg: selectedFile ? "green.900" : "gray.700" }}
        textAlign="center"
        cursor="pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
        transition="all 0.2s"
        _hover={{
          borderColor: selectedFile ? "green.600" : "blue.400",
          bg: selectedFile ? "green.100" : "gray.100",
          _dark: {
            bg: selectedFile ? "green.800" : "gray.600"
          }
        }}
      >
        <VStack gap={4}>
          <Icon
            as={selectedFile ? FiCheckCircle : FiUpload}
            boxSize={16}
            color={selectedFile ? "green.500" : "gray.400"}
          />
          {selectedFile ? (
            <>
              <Heading size="md" color="green.700" _dark={{ color: "green.200" }}>
                {selectedFile.name}
              </Heading>
              <Text color="fg.muted">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                }}
              >
                Change File
              </Button>
            </>
          ) : (
            <>
              <Heading size="md">Drag & drop your file here</Heading>
              <Text color="fg.muted">or</Text>
              <Button colorScheme="blue" size="lg">
                Select File
              </Button>
              <Text fontSize="sm" color="fg.muted">
                Supported: CSV, Excel (max 10MB)
              </Text>
            </>
          )}
        </VStack>
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          hidden
          onChange={handleFileSelect}
        />
      </Box>

      {isUploading && (
        <Box>
          <Text mb={2}>Uploading and processing: {uploadProgress}%</Text>
          {/* Custom Progress Bar */}
          <Box h="8px" w="full" bg="gray.100" _dark={{ bg: "gray.700" }} borderRadius="full" overflow="hidden">
            <Box h="full" w={`${uploadProgress}%`} bg="blue.500" transition="width 0.3s" />
          </Box>
          <Text fontSize="sm" color="fg.muted" mt={2}>
            Please wait while we parse your file...
          </Text>
        </Box>
      )}

      {selectedFile && !isUploading && (
        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleUpload}
          loading={uploadMutation.isPending}
        >
          <HStack gap={2}>
            <Text>Continue to Column Mapping</Text>
            <Icon as={FiArrowRight} />
          </HStack>
        </Button>
      )}
    </VStack>
  )
}

// ==================== STAGE 3: MAPPING ====================

interface MappingStageProps {
  sessionId: string
  columns: string[]
  autoMapping: Record<string, string>
  totalRows: number
  onMappingComplete: (
    validRows: number,
    errorRows: number,
    duplicateRows: number,
    columnMapping: Record<string, string>,
    defaultCategoryId: string,
    defaultStatusId: string,
    validatedRows: ImportRow[]
  ) => void
}

function MappingStage({
  sessionId,
  columns,
  autoMapping,
  totalRows,
  onMappingComplete,
}: MappingStageProps) {
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(autoMapping)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>("")
  const [defaultStatusId, setDefaultStatusId] = useState<string>("")
  const [sampleData, setSampleData] = useState<Record<string, any>[]>([])
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  })

  const { data: statuses, isLoading: statusesLoading } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => ProductsService.readStatuses(),
  })

  // Auto-select "Active" status when statuses are loaded
  useEffect(() => {
    if (statuses && statuses.length > 0) {
      const activeStatus = statuses.find((s: any) => s.name.toLowerCase() === "active")
      if (activeStatus && !defaultStatusId) {
        setDefaultStatusId(activeStatus.id)
      }
    }
  }, [statuses])

  // Fetch sample data preview
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ["bulk-import-preview", sessionId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/products/bulk/validate/${sessionId}?filter=all&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      )
      if (!response.ok) throw new Error("Failed to fetch preview")
      const data = await response.json()
      setSampleData(data.rows?.slice(0, 3).map((r: any) => r.data) || [])
      return data
    },
    enabled: !!sessionId,
  })

  const mapColumnsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/products/bulk/map-columns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            column_mapping: columnMapping,
            default_category_id: defaultCategoryId && defaultCategoryId.trim() !== "" ? defaultCategoryId : null,
            default_status_id: defaultStatusId && defaultStatusId.trim() !== "" ? defaultStatusId : null,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Column mapping failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      showSuccessToast("Column mapping complete! Validation successful.")
      onMappingComplete(
        data.valid_rows,
        data.error_rows,
        data.duplicate_rows,
        columnMapping,
        defaultCategoryId,
        defaultStatusId,
        []
      )
    },
    onError: (error: any) => {
      showErrorToast(error.message || "Failed to map columns")
    },
  })

  const handleSubmit = () => {
    const hasName = Object.values(columnMapping).includes("name")
    const hasSellingPrice = Object.values(columnMapping).includes("selling_price")
    const hasCategory = Object.values(columnMapping).includes("category")

    if (!hasName) {
      showErrorToast("Please map the Product Name field")
      return
    }

    if (!hasSellingPrice) {
      showErrorToast("Please map the Selling Price field")
      return
    }

    if (!hasCategory) {
      showErrorToast("Please map the Category column - it's required for import")
      return
    }

    if (!defaultStatusId || defaultStatusId.trim() === "") {
      showErrorToast("Please select a default status for all products")
      return
    }

    mapColumnsMutation.mutate()
  }

  const systemFields = [
    { value: "name", label: "Product Name", required: true, description: "The name of the product as it will appear in the system" },
    { value: "category", label: "Category", required: false, description: "Product category (Bottles, Cans, Wines, etc.)" },
    { value: "selling_price", label: "Selling Price (SP)", required: true, description: "Price at which the product is sold to customers" },
    { value: "buying_price", label: "Buying Price (BP)", required: false, description: "Cost price paid to supplier (optional)" },
  ]

  if (categoriesLoading || statusesLoading || previewLoading) {
    return (
      <VStack gap={6}>
        <Spinner size="xl" />
        <Text>Loading categories and statuses...</Text>
      </VStack>
    )
  }

  const getSampleValues = (csvColumn: string): string[] => {
    if (!csvColumn || sampleData.length === 0) return []
    return sampleData.map(row => row[csvColumn] || "-")
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="md" mb={2}>
          Step 2 of 5: Map Columns
        </Heading>
        <Text color="fg.muted">
          Match your CSV columns to system fields. Found {totalRows} rows total.
        </Text>
      </Box>

      <Alert.Root status="info">
        <Alert.Indicator>
          <Icon as={FiInfo} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Description>
            Review the automatic column matching below. Fields marked with * are required.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <Box>
        <Heading size="sm" mb={4}>
          Column Mapping
        </Heading>
        
        {/* Professional 3-Column Table - Iterate over CSV columns */}
        <Box 
          borderWidth="1px" 
          borderRadius="lg" 
          overflow="hidden"
          bg={{ base: "gray.800", _light: "white" }}
          borderColor={{ base: "gray.700", _light: "gray.200" }}
        >
          <Table.Root size="sm" variant="outline">
            <Table.Header bg={{ base: "gray.700", _light: "gray.50" }}>
              <Table.Row>
                <Table.ColumnHeader width="30%" fontWeight="bold">
                  Your CSV Columns
                </Table.ColumnHeader>
                <Table.ColumnHeader width="30%" fontWeight="bold">
                  Maps to System Field
                </Table.ColumnHeader>
                <Table.ColumnHeader width="40%" fontWeight="bold">
                  Sample Data Preview
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {columns.map((csvColumn) => {
                const mappedSystemField = columnMapping[csvColumn] || ""
                const sampleValues = getSampleValues(csvColumn)
                const isAutoMapped = autoMapping[csvColumn] !== undefined
                const matchedField = systemFields.find(f => f.value === mappedSystemField)

                return (
                  <Table.Row 
                    key={csvColumn}
                    _hover={{ bg: { base: "gray.750", _light: "gray.50" } }}
                  >
                    {/* CSV Column Name */}
                    <Table.Cell>
                      <HStack>
                        {isAutoMapped && (
                          <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                        )}
                        <Text fontWeight="medium">{csvColumn}</Text>
                      </HStack>
                    </Table.Cell>

                    {/* System Field Dropdown */}
                    <Table.Cell>
                      <Box
                        as="select"
                        value={mappedSystemField}
                        onChange={(e: any) => {
                          const newMapping = { ...columnMapping }
                          if (e.target.value) {
                            newMapping[csvColumn] = e.target.value
                          } else {
                            delete newMapping[csvColumn]
                          }
                          setColumnMapping(newMapping)
                        }}
                        w="full"
                        p={2}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
                        bg="white"
                        _dark={{ 
                          borderColor: "gray.600", 
                          bg: "gray.700" 
                        }}
                        _focus={{ 
                          borderColor: "blue.500", 
                          outline: "none",
                          boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)"
                        }}
                      >
                        <option value="">-- Select System Field --</option>
                        {systemFields.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label} {field.required ? "*" : ""}
                          </option>
                        ))}
                      </Box>
                    </Table.Cell>

                    {/* Sample Data Preview */}
                    <Table.Cell>
                      {sampleValues.length > 0 ? (
                        <VStack align="start" gap={1}>
                          {sampleValues.map((value, idx) => (
                            <Text 
                              key={idx} 
                              fontSize="xs" 
                              color="fg.muted"
                              fontFamily="mono"
                              noOfLines={1}
                            >
                              {value.length > 40 ? `${value.substring(0, 40)}...` : value}
                            </Text>
                          ))}
                        </VStack>
                      ) : (
                        <Text fontSize="xs" color="fg.muted" fontStyle="italic">
                          No preview data
                        </Text>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table.Root>
        </Box>

        {/* Required Fields Info */}
        <Alert.Root status="info" mt={4}>
          <Alert.Indicator>
            <Icon as={FiInfo} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Description>
              <strong>Required mappings:</strong> Product Name, Selling Price. 
              <br />
              <strong>Note:</strong> If "Category" is not in your CSV, all products will use the default category selected below.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      </Box>

      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="lg" 
        bg="blue.50" 
        _dark={{ bg: "blue.900", borderColor: "blue.800" }}
        borderColor="blue.100"
      >
        <Heading size="sm" mb={4} color="blue.800" _dark={{ color: "blue.200" }}>
          Default Values (Applied to all imported products)
        </Heading>
        <VStack gap={4} align="stretch">
          <Field label="Default Status" required>
            <Box
              as="select"
              value={defaultStatusId}
              onChange={(e: any) => setDefaultStatusId(e.target.value)}
              w="full"
              p={2}
              borderRadius="md"
              borderWidth="1px"
              borderColor={!defaultStatusId ? "red.300" : "gray.200"}
              bg="white"
              _dark={{ 
                borderColor: !defaultStatusId ? "red.500" : "gray.600", 
                bg: "gray.700" 
              }}
              _focus={{ borderColor: "blue.500", outline: "none" }}
            >
              <option value="">-- Select Status --</option>
              {statuses?.map((status: any) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Box>
          </Field>
        </VStack>
      </Box>

      <Button
        colorScheme="blue"
        size="lg"
        onClick={handleSubmit}
        loading={mapColumnsMutation.isPending}
      >
        <HStack gap={2}>
          <Text>Continue to Validation</Text>
          <Icon as={FiArrowRight} />
        </HStack>
      </Button>
    </VStack>
  )
}

// ==================== STAGE 4: VALIDATION ====================

interface ValidationStageProps {
  sessionId: string
  validRows: number
  errorRows: number
  duplicateRows: number
  validatedRows: ImportRow[]
  onImportComplete: (successCount: number, errorCount: number, duplicateCount: number) => void
  duplicateAction: "skip" | "update" | "create"
  onDuplicateActionChange: (action: "skip" | "update" | "create") => void
}

function ValidationStage({
  sessionId,
  validRows,
  errorRows,
  duplicateRows,
  validatedRows: initialValidatedRows,
  onImportComplete,
  duplicateAction,
  onDuplicateActionChange,
}: ValidationStageProps) {
  const [filter, setFilter] = useState<"all" | "errors" | "duplicates">("all")
  const [showOnlyProblems, setShowOnlyProblems] = useState(false)
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editedData, setEditedData] = useState<Record<string, any>>({})
  const [categorySearch, setCategorySearch] = useState<string>("")
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: validationData, isLoading, refetch } = useQuery({
    queryKey: ["bulk-import-validation", sessionId, filter],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/products/bulk/validate/${sessionId}?filter=${filter}&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch validation results")
      }

      return response.json()
    },
    enabled: initialValidatedRows.length === 0,
  })

  const validatedRows = validationData?.rows || initialValidatedRows

  // Calculate dynamic error/duplicate counts based on deleted rows
  const activeErrorRows = validatedRows.filter((r: ImportRow) => r.status === "error" && !deletedRows.has(r.row_number)).length
  const activeDuplicateRows = validatedRows.filter((r: ImportRow) => r.status === "duplicate" && !deletedRows.has(r.row_number)).length
  const activeValidRows = validatedRows.filter((r: ImportRow) => r.status === "valid" && !deletedRows.has(r.row_number)).length

  // Fetch categories for the dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  })

  // Extract the actual categories array from the response
  const categories = categoriesData?.data || []

  const fixRowMutation = useMutation({
    mutationFn: async ({ rowNumber, updatedData }: { rowNumber: number; updatedData: Record<string, any> }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/products/bulk/fix-row/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            row_number: rowNumber,
            updated_data: updatedData,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fix row")
      }

      return response.json()
    },
    onSuccess: () => {
      showSuccessToast("Row fixed successfully!")
      setEditingRow(null)
      setEditedData({})
      setCategorySearch("")
      refetch()
    },
    onError: () => {
      showErrorToast("Failed to fix row")
    },
  })

  const deleteRowMutation = useMutation({
    mutationFn: async (rowNumber: number) => {
      return Promise.resolve({ rowNumber })
    },
    onSuccess: (data) => {
      showSuccessToast(`Row ${data.rowNumber} excluded from import`)
      const newDeletedRows = new Set(deletedRows)
      newDeletedRows.add(data.rowNumber)
      setDeletedRows(newDeletedRows)
    },
    onError: () => {
      showErrorToast("Failed to exclude row")
    },
  })

  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/products/bulk/import/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            skip_errors: true,
            duplicate_action: duplicateAction,
            tags: [],
            notes: "",
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Import failed")
      }

      return response.json()
    },
    onSuccess: (data) => {
      showSuccessToast(`Import complete! ${data.success_count} products imported successfully.`)
      onImportComplete(data.success_count, data.error_count, data.duplicate_count)
    },
    onError: () => {
      showErrorToast("Import failed")
      setIsImporting(false)
    },
  })

  const handleEdit = (row: ImportRow) => {
    setEditingRow(row.row_number)
    setEditedData(row.mapped_data || row.data)
  }

  const handleSaveEdit = (rowNumber: number) => {
    fixRowMutation.mutate({
      rowNumber,
      updatedData: editedData,
    })
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditedData({})
    setCategorySearch("")
  }

  const handleDeleteRow = (rowNumber: number) => {
    if (window.confirm(`Are you sure you want to exclude row ${rowNumber} from the import?`)) {
      deleteRowMutation.mutate(rowNumber)
    }
  }

  const handleImport = () => {
    setIsImporting(true)
    setImportProgress(0)

    const interval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90))
    }, 500)

    importMutation.mutate()

    setTimeout(() => {
      clearInterval(interval)
      setImportProgress(100)
    }, 5000)
  }

  const toggleRowSelection = (rowNumber: number) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(rowNumber)) {
      newSelection.delete(rowNumber)
    } else {
      newSelection.add(rowNumber)
    }
    setSelectedRows(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredRows.map(r => r.row_number)))
    }
  }

  const getCellError = (row: ImportRow, field: string): ValidationError | undefined => {
    return row.errors.find(e => e.field === field)
  }

  // Helper function to format column names for display
  const formatColumnName = (column: string): string => {
    const specialNames: Record<string, string> = {
      'name': 'Product Name',
      'selling_price': 'Selling Price',
      'buying_price': 'Buying Price',
      'category': 'Category',
      'category_id': 'Category ID',
      'status_id': 'Status ID',
      'current_stock': 'Current Stock',
      'reorder_level': 'Reorder Level',
      'description': 'Description',
    }

    return specialNames[column] || column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const filteredRows = (showOnlyProblems 
    ? validatedRows.filter(r => r.status === "error" || r.status === "duplicate")
    : validatedRows
  ).filter(r => !deletedRows.has(r.row_number))

  const totalPages = Math.ceil(filteredRows.length / pageSize)
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Get all unique column names from the data, excluding internal fields
  const allColumns = paginatedRows.length > 0 
    ? Object.keys(paginatedRows[0].mapped_data || paginatedRows[0].data)
        .filter(col => !['current_stock', 'status_id', 'category_id'].includes(col))
    : []

  if (isLoading) {
    return (
      <VStack gap={6}>
        <Spinner size="xl" />
        <Text>Loading validation results...</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="md" mb={2}>
          Step 3 of 5: Review & Fix Errors
        </Heading>
        <Text color="fg.muted">
          Review validation results and fix any errors before importing
        </Text>
      </Box>

      {/* Clean Summary Card */}
      <Box 
        p={6} 
        borderWidth="1px" 
        borderRadius="lg" 
        bg={{ base: "gray.800", _light: "white" }}
        borderColor={{ base: "gray.700", _light: "gray.200" }}
      >
        <VStack gap={4} align="stretch">
          {/* Primary Status */}
          <HStack justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                Import Status
              </Text>
              <Heading size="lg">
                {activeValidRows} of {validatedRows.length - deletedRows.size} rows ready
              </Heading>
            </VStack>
            
            {activeValidRows > 0 && (
              <Badge 
                colorScheme="green" 
                fontSize="md" 
                px={4} 
                py={2}
                borderRadius="full"
              >
                <HStack gap={2}>
                  <Icon as={FiCheckCircle} />
                  <Text>Ready to import</Text>
                </HStack>
              </Badge>
            )}
          </HStack>

          {/* Issues Summary - Only show if there are problems */}
          {(activeErrorRows > 0 || activeDuplicateRows > 0) && (
            <Box 
              p={4} 
              borderRadius="md" 
              bg={{ base: "gray.750", _light: "gray.50" }}
              borderWidth="1px"
              borderColor={{ base: "gray.600", _light: "gray.200" }}
            >
              <HStack justify="space-between" align="center" mb={3}>
                <HStack gap={2}>
                  <Icon as={FiAlertCircle} color="orange.500" boxSize={5} />
                  <Text fontWeight="semibold" fontSize="md">
                    Issues to Review
                  </Text>
                </HStack>
                <Text fontSize="sm" color="fg.muted">
                  {activeErrorRows + activeDuplicateRows} total
                </Text>
              </HStack>

              <VStack gap={2} align="stretch">
                {activeErrorRows > 0 && (
                  <HStack 
                    justify="space-between" 
                    p={3} 
                    borderRadius="md"
                    bg={{ base: "red.950", _light: "red.50" }}
                    borderWidth="1px"
                    borderColor={{ base: "red.900", _light: "red.200" }}
                  >
                    <HStack gap={3}>
                      <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg="red.500"
                      />
                      <Text fontWeight="medium">
                        {activeErrorRows} row{activeErrorRows !== 1 ? 's' : ''} with errors
                      </Text>
                    </HStack>
                    <HStack gap={2}>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setFilter("errors")}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          const errorRowNumbers = validatedRows
                            .filter(r => r.status === "error" && !deletedRows.has(r.row_number))
                            .map(r => r.row_number)
                          
                          const newDeletedRows = new Set(deletedRows)
                          errorRowNumbers.forEach(rowNum => newDeletedRows.add(rowNum))
                          setDeletedRows(newDeletedRows)
                          setSelectedRows(new Set())
                          showSuccessToast(`${errorRowNumbers.length} error rows excluded`)
                        }}
                        leftIcon={<Icon as={FiTrash2} />}
                      >
                        Exclude All
                      </Button>
                    </HStack>
                  </HStack>
                )}

                {activeDuplicateRows > 0 && (
                  <HStack 
                    justify="space-between" 
                    p={3} 
                    borderRadius="md"
                    bg={{ base: "orange.950", _light: "orange.50" }}
                    borderWidth="1px"
                    borderColor={{ base: "orange.900", _light: "orange.200" }}
                  >
                    <HStack gap={3}>
                      <Box
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg="orange.500"
                      />
                      <Text fontWeight="medium">
                        {activeDuplicateRows} duplicate{activeDuplicateRows !== 1 ? 's' : ''} found
                      </Text>
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setFilter("duplicates")}
                    >
                      View
                    </Button>
                  </HStack>
                )}
              </VStack>
            </Box>
          )}

          {deletedRows.size > 0 && (
            <Text fontSize="sm" color="fg.muted">
              {deletedRows.size} row{deletedRows.size !== 1 ? 's' : ''} excluded from import
            </Text>
          )}
        </VStack>
      </Box>

      {/* Refined Filter Tabs */}
      <HStack gap={2} borderBottomWidth="2px" borderColor={{ base: "gray.700", _light: "gray.200" }} pb={-2}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilter("all")}
          borderBottomWidth="2px"
          borderBottomColor={filter === "all" ? "blue.500" : "transparent"}
          borderRadius={0}
          pb={2}
          fontWeight={filter === "all" ? "semibold" : "normal"}
        >
          All Rows ({validatedRows.length - deletedRows.size})
        </Button>
        
        {activeErrorRows > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("errors")}
            borderBottomWidth="2px"
            borderBottomColor={filter === "errors" ? "red.500" : "transparent"}
            borderRadius={0}
            pb={2}
            fontWeight={filter === "errors" ? "semibold" : "normal"}
          >
            <HStack gap={2}>
              <Text>Errors</Text>
              <Badge colorScheme="red" borderRadius="full" px={2}>
                {activeErrorRows}
              </Badge>
            </HStack>
          </Button>
        )}
        
        {activeDuplicateRows > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("duplicates")}
            borderBottomWidth="2px"
            borderBottomColor={filter === "duplicates" ? "orange.500" : "transparent"}
            borderRadius={0}
            pb={2}
            fontWeight={filter === "duplicates" ? "semibold" : "normal"}
          >
            <HStack gap={2}>
              <Text>Duplicates</Text>
              <Badge colorScheme="orange" borderRadius="full" px={2}>
                {activeDuplicateRows}
              </Badge>
            </HStack>
          </Button>
        )}
      </HStack>

      {duplicateRows > 0 && (
        <Box 
          p={4} 
          borderWidth="1px" 
          borderRadius="lg" 
          bg="orange.50" 
          _dark={{ bg: "orange.900", borderColor: "orange.800" }}
          borderColor="orange.100"
        >
          <Heading size="sm" mb={3} color="orange.800" _dark={{ color: "orange.200" }}>
            Duplicate Handling
          </Heading>
          <Field label="What should we do with duplicates?">
            <Box
              as="select"
              value={duplicateAction}
              onChange={(e: any) => onDuplicateActionChange(e.target.value as any)}
              w="full"
              p={2}
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
              bg="white"
              _dark={{ borderColor: "gray.600", bg: "gray.700" }}
              _focus={{ borderColor: "blue.500", outline: "none" }}
            >
              <option value="skip">Skip duplicates (keep existing products)</option>
              <option value="update">Update existing products with new data</option>
              <option value="create">Import as new products (create duplicates)</option>
            </Box>
          </Field>
        </Box>
      )}

      {/* Enhanced Validation Table with Dynamic Columns */}
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={{ base: "gray.800", _light: "white" }}>
        <Box maxH="600px" overflowX="auto" overflowY="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header bg={{ base: "gray.700", _light: "gray.50" }} position="sticky" top={0} zIndex={1}>
              <Table.Row>
                <Table.ColumnHeader width="50px" position="sticky" left={0} bg={{ base: "gray.700", _light: "gray.50" }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                    onChange={toggleSelectAll}
                  />
                </Table.ColumnHeader>
                <Table.ColumnHeader width="60px" position="sticky" left="50px" bg={{ base: "gray.700", _light: "gray.50" }}>
                  Row
                </Table.ColumnHeader>
                {allColumns.map((column) => (
                  <Table.ColumnHeader key={column} minW="150px">
                    {formatColumnName(column)}
                  </Table.ColumnHeader>
                ))}
                <Table.ColumnHeader width="120px">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginatedRows.map((row: ImportRow) => (
                <Table.Row 
                  key={row.row_number}
                  borderLeftWidth={row.status === "error" || row.status === "duplicate" ? "3px" : "0"}
                  borderLeftColor={
                    row.status === "error" 
                      ? "red.500"
                      : row.status === "duplicate"
                      ? "orange.500"
                      : "transparent"
                  }
                  _hover={{ bg: { base: "gray.750", _light: "gray.100" } }}
                >
                  {/* Selection Checkbox with Status Icon - Sticky */}
                  <Table.Cell position="sticky" left={0} bg={{ base: "gray.800", _light: "white" }}>
                    <HStack gap={2}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.row_number)}
                        onChange={() => toggleRowSelection(row.row_number)}
                      />
                      {row.status === "error" && (
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg="red.500"
                          title="Has errors"
                        />
                      )}
                      {row.status === "duplicate" && (
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg="orange.500"
                          title="Duplicate"
                        />
                      )}
                      {row.status === "valid" && (
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg="green.500"
                          title="Valid"
                        />
                      )}
                    </HStack>
                  </Table.Cell>

                  {/* Row Number - Sticky */}
                  <Table.Cell position="sticky" left="50px" fontWeight="medium" bg={{ base: "gray.800", _light: "white" }}>
                    {row.row_number}
                  </Table.Cell>

                  {/* Dynamic Data Columns */}
                  {allColumns.map((column) => {
                    const cellData = row.mapped_data?.[column] || row.data[column] || "-"
                    const cellError = getCellError(row, column)
                    
                    return (
                      <Table.Cell
                        key={column}
                        position="relative"
                        borderLeftWidth={cellError ? "2px" : "0"}
                        borderLeftColor={cellError ? "red.500" : "transparent"}
                      >
                        {editingRow === row.row_number ? (
                          column === 'category' ? (
                            <SelectRoot
                              collection={createListCollection({
                                items: categories
                                  .filter((cat: any) => 
                                    !categorySearch || 
                                    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                  )
                                  .map((cat: any) => ({ 
                                    label: cat.name, 
                                    value: cat.name 
                                  }))
                              })}
                              size="sm"
                              value={[editedData[column] || cellData]}
                              onValueChange={(e) => {
                                setEditedData({ ...editedData, [column]: e.value[0] })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValueText placeholder="Select Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <Input
                                  size="sm"
                                  placeholder="Search categories..."
                                  value={categorySearch}
                                  onChange={(e) => setCategorySearch(e.target.value)}
                                  mb={2}
                                  mx={2}
                                />
                                {categories
                                  .filter((cat: any) => 
                                    !categorySearch || 
                                    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                  )
                                  .map((cat: any) => (
                                    <SelectItem key={cat.id} item={{ label: cat.name, value: cat.name }}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </SelectRoot>
                          ) : (
                            <Input
                              size="sm"
                              value={editedData[column] || cellData}
                              onChange={(e) => setEditedData({ ...editedData, [column]: e.target.value })}
                            />
                          )
                        ) : (
                          <HStack gap={2} justify="space-between">
                            <Text lineClamp={2} flex="1">{String(cellData)}</Text>
                            {cellError && (
                              <Tooltip content={cellError.message}>
                                <Box
                                  as="span"
                                  display="inline-flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  w="18px"
                                  h="18px"
                                  borderRadius="full"
                                  bg="red.500"
                                  color="white"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  flexShrink={0}
                                  cursor="help"
                                >
                                  !
                                </Box>
                              </Tooltip>
                            )}
                          </HStack>
                        )}
                      </Table.Cell>
                    )
                  })}

                  {/* Actions */}
                  <Table.Cell>
                    {editingRow === row.row_number ? (
                      <HStack gap={1}>
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => handleSaveEdit(row.row_number)}
                          loading={fixRowMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </HStack>
                    ) : (
                      <HStack gap={1}>
                        {row.status === "error" && (
                          <Tooltip content="Fix errors">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleEdit(row)}
                            >
                              <Icon as={FiEdit} />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip content="Exclude from import">
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => handleDeleteRow(row.row_number)}
                            loading={deleteRowMutation.isPending}
                          >
                            <Icon as={FiTrash2} />
                          </Button>
                        </Tooltip>
                      </HStack>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <Box 
            p={4} 
            borderTopWidth="1px" 
            bg={{ base: "gray.750", _light: "gray.50" }}
            borderColor={{ base: "gray.700", _light: "gray.200" }}
          >
            <HStack justify="space-between">
              <Text fontSize="sm" color="fg.muted">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} rows
              </Text>
              
              <HStack gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <HStack gap={1}>
                  <Text fontSize="sm">Page</Text>
                  <Input
                    size="sm"
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value)
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page)
                      }
                    }}
                    w="60px"
                    textAlign="center"
                  />
                  <Text fontSize="sm">of {totalPages}</Text>
                </HStack>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </HStack>
          </Box>
        )}
      </Box>

      {isImporting && (
        <Box 
          p={6} 
          borderWidth="1px" 
          borderRadius="lg"
          bg={{ base: "blue.950", _light: "blue.50" }}
          borderColor={{ base: "blue.900", _light: "blue.200" }}
        >
          <VStack gap={4}>
            <HStack gap={3}>
              <Spinner size="sm" color="blue.500" />
              <Text fontWeight="semibold">Importing products...</Text>
            </HStack>
            <Box w="full">
              <Box h="6px" w="full" bg={{ base: "gray.700", _light: "gray.200" }} borderRadius="full" overflow="hidden">
                <Box 
                  h="full" 
                  w={`${importProgress}%`} 
                  bg="blue.500" 
                  transition="width 0.3s"
                  borderRadius="full"
                />
              </Box>
              <Text fontSize="sm" color="fg.muted" mt={2} textAlign="center">
                {importProgress}% complete • Please don't close this window
              </Text>
            </Box>
          </VStack>
        </Box>
      )}

      {/* Import Action Section */}
      <Box 
        p={6} 
        borderWidth="1px" 
        borderRadius="lg"
        bg={{ base: "gray.800", _light: "white" }}
        borderColor={{ base: "gray.700", _light: "gray.200" }}
      >
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Text fontWeight="semibold" fontSize="lg">
              Ready to Import
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {activeValidRows} product{activeValidRows !== 1 ? 's' : ''} will be imported
              {activeErrorRows > 0 && ` • ${activeErrorRows} row${activeErrorRows !== 1 ? 's' : ''} will be skipped`}
            </Text>
          </VStack>

          <Button
            colorScheme="green"
            size="lg"
            onClick={handleImport}
            loading={importMutation.isPending || isImporting}
            disabled={activeValidRows === 0}
            rightIcon={<Icon as={FiArrowRight} />}
          >
            {activeErrorRows > 0 ? "Import Valid Rows" : "Import All Products"}
          </Button>
        </HStack>
      </Box>
    </VStack>
  )
}

// ==================== STAGE 5: COMPLETE ====================

interface CompleteStageProps {
  validRows: number
  errorRows: number
  duplicateRows: number
  sessionId: string
}

function CompleteStage({
  validRows,
  errorRows,
  duplicateRows,
  sessionId,
}: CompleteStageProps) {
  return (
    <VStack gap={8} align="center" py={8}>
      <Icon as={FiCheckCircle} boxSize={24} color="green.500" />
      
      <Heading size="2xl">Import Complete!</Heading>

      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          Import Summary
        </Text>
        <VStack gap={3}>
          <HStack>
            <Badge colorScheme="green" px={4} py={2} fontSize="md">
              <HStack gap={2}>
                <Icon as={FiCheckCircle} />
                <Text>{validRows} products imported successfully</Text>
              </HStack>
            </Badge>
          </HStack>
          {errorRows > 0 && (
            <HStack>
              <Badge colorScheme="red" px={4} py={2} fontSize="md">
                <HStack gap={2}>
                  <Icon as={FiAlertCircle} />
                  <Text>{errorRows} rows skipped due to errors</Text>
                </HStack>
              </Badge>
            </HStack>
          )}
          {duplicateRows > 0 && (
            <HStack>
              <Badge colorScheme="orange" px={4} py={2} fontSize="md">
                <HStack gap={2}>
                  <Icon as={FiRefreshCw} />
                  <Text>{duplicateRows} duplicates handled</Text>
                </HStack>
              </Badge>
            </HStack>
          )}
        </VStack>
      </Box>

      <Text color="fg.muted" fontSize="sm">
        Import Session ID: {sessionId}
      </Text>

      <VStack gap={3} width="100%" maxW="md">
        <Button
          colorScheme="blue"
          size="lg"
          width="full"
          onClick={() => window.location.href = "/products"}
        >
          View Imported Products
        </Button>
        <Button
          variant="outline"
          size="lg"
          width="full"
          onClick={() => window.location.reload()}
        >
          Import Another File
        </Button>
      </VStack>
    </VStack>
  )
}