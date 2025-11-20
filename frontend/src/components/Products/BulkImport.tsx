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

import { useState } from "react"
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
} from "@chakra-ui/react"
import {
  FiDownload,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiArrowRight,
  FiArrowLeft,
  FiAlertTriangle,
  FiEdit2,
  FiRefreshCw,
} from "react-icons/fi"

import { ProductsService } from "@/client"
import useCustomToast from "../../hooks/useCustomToast"
import { Field } from "../ui/field"

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

        {/* Progress Indicator */}
        <Box 
          p={6} 
          borderWidth="1px" 
          borderRadius="lg" 
          bg={{ base: "gray.800", _light: "white" }}
          borderColor={{ base: "gray.700", _light: "gray.200" }}
          shadow="sm"
        >
          <HStack gap={4} justify="space-between" mb={4}>
            {[1, 2, 3, 4, 5].map((stage) => (
              <Flex key={stage} direction="column" align="center" flex={1}>
                <Box
                  w={10}
                  h={10}
                  borderRadius="full"
                  bg={
                    stage < importState.currentStage
                      ? "teal.500"
                      : stage === importState.currentStage
                      ? "blue.500"
                      : "gray.200"
                  }
                  _dark={{
                    bg: stage < importState.currentStage
                      ? "teal.500"
                      : stage === importState.currentStage
                      ? "blue.500"
                      : "gray.700"
                  }}
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  mb={2}
                  transition="all 0.2s"
                >
                  {stage < importState.currentStage ? (
                    <Icon as={FiCheckCircle} />
                  ) : (
                    stage
                  )}
                </Box>
                <Text
                  fontSize="sm"
                  fontWeight={stage === importState.currentStage ? "bold" : "medium"}
                  color={stage === importState.currentStage ? "blue.500" : "fg.muted"}
                >
                  {getStageLabel(stage)}
                </Text>
              </Flex>
            ))}
          </HStack>
          {/* Custom Progress Bar */}
          <Box h="8px" w="full" bg="gray.100" _dark={{ bg: "gray.700" }} borderRadius="full" overflow="hidden">
            <Box
              h="full"
              w={`${(importState.currentStage / 5) * 100}%`}
              bg="blue.500"
              transition="width 0.3s ease-in-out"
            />
          </Box>
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
    <VStack gap={6} align="stretch">
      <Alert.Root status="info">
        <Alert.Indicator>
          <Icon as={FiInfo} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>Before You Begin</Alert.Title>
          <Alert.Description>
            Make sure you have your product data ready in CSV or Excel format.
            Download our template below to see the expected format.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <Box>
        <Heading size="md" mb={4}>
          Import Guidelines
        </Heading>

        <VStack gap={4} align="stretch">
          <Box>
            <Text fontWeight="bold" mb={2}>
              Supported Formats
            </Text>
            <List.Root pl={6}>
              <List.Item>CSV (Comma-Separated Values)</List.Item>
              <List.Item>XLSX/XLS (Microsoft Excel)</List.Item>
            </List.Root>
          </Box>

          <Box>
            <Text fontWeight="bold" mb={2}>
              File Limits
            </Text>
            <List.Root pl={6}>
              <List.Item>Maximum file size: 10MB</List.Item>
              <List.Item>Maximum rows: 1000 products</List.Item>
            </List.Root>
          </Box>

          <Box>
            <Text fontWeight="bold" mb={2}>
              Required Fields
            </Text>
            <List.Root pl={6}>
              <List.Item>
                <Badge colorScheme="red" mr={2}>
                  Required
                </Badge>
                Product Name
              </List.Item>
              <List.Item>
                <Badge colorScheme="red" mr={2}>
                  Required
                </Badge>
                Selling Price
              </List.Item>
            </List.Root>
          </Box>

          <Box>
            <Text fontWeight="bold" mb={2}>
              Optional Fields
            </Text>
            <List.Root pl={6}>
              <List.Item>Buying Price</List.Item>
              <List.Item>Current Stock</List.Item>
              <List.Item>Reorder Level</List.Item>
              <List.Item>Description</List.Item>
            </List.Root>
          </Box>

          <Alert.Root status="warning">
            <Alert.Indicator>
              <Icon as={FiAlertCircle} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Description>
                <strong>Note:</strong> Category and Status will be assigned during the mapping stage.
                All imported products will use the same category and status initially.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        </VStack>
      </Box>

      <Box 
        p={6} 
        borderWidth="2px" 
        borderRadius="lg" 
        borderStyle="dashed" 
        bg="gray.50" 
        _dark={{ bg: "gray.700", borderColor: "gray.600" }}
      >
        <VStack gap={4}>
          <Icon as={FiDownload} boxSize={12} color="blue.500" />
          <Heading size="md">Download Template</Heading>
          <Text fontSize="sm" color="fg.muted" textAlign="center">
            Get our CSV template with sample data to see the expected format
          </Text>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleDownloadTemplate}
          >
            <HStack gap={2}>
              <Icon as={FiDownload} />
              <Text>Download CSV Template</Text>
            </HStack>
          </Button>
        </VStack>
      </Box>

      <Box 
        p={4} 
        bg={{ base: "gray.800", _light: "white" }}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={{ base: "gray.700", _light: "gray.200" }}
      >
        <Heading
          size="sm"
          mb={2}
          color={{ base: "white", _light: "gray.800" }}
        >
          Example Data
        </Heading>
        <Box
          as="pre"
          p={3}
          bg={{ base: "gray.800", _light: "white" }}
          borderRadius="md"
          overflow="auto"
          fontSize="sm"
          fontFamily="mono"
          borderWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: "gray.700" }}
        >
          {`Product Name,Selling Price,Buying Price,Description
2 Share Sweet Red 750ML,850.00,650.00,Sweet red wine
Coca Cola 300ML,120.00,80.00,Soft drink
Tusker Lager 500ML,200.00,150.00,Beer`}
        </Box>
      </Box>

      <Button
        colorScheme="blue"
        size="lg"
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
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => ProductsService.readCategories(),
  })

  const { data: statuses, isLoading: statusesLoading } = useQuery({
    queryKey: ["statuses"],
    queryFn: () => ProductsService.readStatuses(),
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
            default_category_id: defaultCategoryId || null,
            default_status_id: defaultStatusId || null,
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

    if (!hasName) {
      showErrorToast("Please map the Product Name field")
      return
    }

    if (!hasSellingPrice) {
      showErrorToast("Please map the Selling Price field")
      return
    }

    if (!defaultCategoryId) {
      showErrorToast("Please select a category for all products")
      return
    }

    if (!defaultStatusId) {
      showErrorToast("Please select a status for all products")
      return
    }

    mapColumnsMutation.mutate()
  }

  const systemFields = [
    { value: "name", label: "Product Name *", required: true },
    { value: "selling_price", label: "Selling Price *", required: true },
    { value: "buying_price", label: "Buying Price", required: false },
    { value: "current_stock", label: "Current Stock", required: false },
    { value: "reorder_level", label: "Reorder Level", required: false },
    { value: "description", label: "Description", required: false },
    { value: "", label: "(Skip this column)", required: false },
  ]

  if (categoriesLoading || statusesLoading) {
    return (
      <VStack gap={6}>
        <Spinner size="xl" />
        <Text>Loading categories and statuses...</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="md" mb={2}>
          Step 2 of 5: Map Columns
        </Heading>
        <Text color="fg.muted">
          Map your spreadsheet columns to our system fields. Found {totalRows} rows.
        </Text>
      </Box>

      <Alert.Root status="info">
        <Alert.Indicator>
          <Icon as={FiCheckCircle} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Description>
            Columns with a checkmark have been auto-matched. Review and adjust mappings as needed.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <Box>
        <Heading size="sm" mb={4}>
          Column Mapping
        </Heading>
        <VStack gap={3} align="stretch">
          {columns.map((column, index) => {
            const isAutoMapped = autoMapping[column] !== undefined
            return (
              <Grid key={index} templateColumns="1fr 2fr" gap={4} alignItems="center">
                <HStack>
                  {isAutoMapped && (
                    <Icon as={FiCheckCircle} color="green.500" />
                  )}
                  <Text fontWeight="medium">{column}</Text>
                </HStack>
                <Field>
                  <Box
                    as="select"
                    value={columnMapping[column] || ""}
                    onChange={(e: any) => {
                      setColumnMapping({
                        ...columnMapping,
                        [column]: e.target.value,
                      })
                    }}
                    w="full"
                    p={2}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                    bg="white"
                    _dark={{ borderColor: "gray.600", bg: "gray.700" }}
                    _focus={{ borderColor: "blue.500", outline: "none" }}
                  >
                    <option value="">-- Select Field --</option>
                    {systemFields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </Box>
                </Field>
              </Grid>
            )
          })}
        </VStack>
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
          Required Fields for All Products
        </Heading>
        <VStack gap={4} align="stretch">
          <Field label="Category *" required>
            <Box
              as="select"
              value={defaultCategoryId}
              onChange={(e: any) => setDefaultCategoryId(e.target.value)}
              w="full"
              p={2}
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
              bg="white"
              _dark={{ borderColor: "gray.600", bg: "gray.700" }}
              _focus={{ borderColor: "blue.500", outline: "none" }}
            >
              <option value="">-- Select Category --</option>
              {categories?.data.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Box>
          </Field>

          <Field label="Status *" required>
            <Box
              as="select"
              value={defaultStatusId}
              onChange={(e: any) => setDefaultStatusId(e.target.value)}
              w="full"
              p={2}
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
              bg="white"
              _dark={{ borderColor: "gray.600", bg: "gray.700" }}
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
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editedData, setEditedData] = useState<Record<string, any>>({})
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
      refetch()
    },
    onError: () => {
      showErrorToast("Failed to fix row")
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <Icon as={FiCheckCircle} color="green.500" />
      case "warning":
        return <Icon as={FiAlertTriangle} color="orange.500" />
      case "error":
        return <Icon as={FiAlertCircle} color="red.500" />
      case "duplicate":
        return <Icon as={FiRefreshCw} color="blue.500" />
      default:
        return null
    }
  }

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
          Review the validation results and fix any errors before importing
        </Text>
      </Box>

      <HStack gap={4} justify="center" p={4} borderWidth="1px" borderRadius="lg">
        <Badge colorScheme="gray" fontSize="lg" px={4} py={2}>
          Total: {validatedRows.length}
        </Badge>
        <Badge colorScheme="green" fontSize="lg" px={4} py={2}>
          Valid: {validRows}
        </Badge>
        <Badge colorScheme="red" fontSize="lg" px={4} py={2}>
          Errors: {errorRows}
        </Badge>
        <Badge colorScheme="orange" fontSize="lg" px={4} py={2}>
          Duplicates: {duplicateRows}
        </Badge>
      </HStack>

      <HStack gap={3}>
        <Button
          variant={filter === "all" ? "solid" : "outline"}
          onClick={() => setFilter("all")}
        >
          Show All ({validatedRows.length})
        </Button>
        <Button
          variant={filter === "errors" ? "solid" : "outline"}
          colorScheme="red"
          onClick={() => setFilter("errors")}
        >
          Errors Only ({errorRows})
        </Button>
        <Button
          variant={filter === "duplicates" ? "solid" : "outline"}
          colorScheme="orange"
          onClick={() => setFilter("duplicates")}
        >
          Duplicates Only ({duplicateRows})
        </Button>
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

      <Box maxH="500px" overflowY="auto" borderWidth="1px" borderRadius="lg">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Row</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Product Name</Table.ColumnHeader>
              <Table.ColumnHeader>Selling Price</Table.ColumnHeader>
              <Table.ColumnHeader>Buying Price</Table.ColumnHeader>
              <Table.ColumnHeader>Issues</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {validatedRows.slice(0, 100).map((row: ImportRow) => (
              <Table.Row key={row.row_number}>
                <Table.Cell>{row.row_number}</Table.Cell>
                <Table.Cell>{getStatusIcon(row.status)}</Table.Cell>
                <Table.Cell>
                  {editingRow === row.row_number ? (
                    <Input
                      size="sm"
                      value={editedData.name || ""}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                    />
                  ) : (
                    <Text>{row.mapped_data?.name || row.data.name || "-"}</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {editingRow === row.row_number ? (
                    <Input
                      size="sm"
                      type="number"
                      value={editedData.selling_price || ""}
                      onChange={(e) =>
                        setEditedData({ ...editedData, selling_price: e.target.value })
                      }
                    />
                  ) : (
                    <Text>{row.mapped_data?.selling_price || row.data.selling_price || "-"}</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {editingRow === row.row_number ? (
                    <Input
                      size="sm"
                      type="number"
                      value={editedData.buying_price || ""}
                      onChange={(e) =>
                        setEditedData({ ...editedData, buying_price: e.target.value })
                      }
                    />
                  ) : (
                    <Text>{row.mapped_data?.buying_price || row.data.buying_price || "-"}</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {row.errors.length > 0 && (
                    <VStack align="start" gap={1}>
                      {row.errors.map((error: ValidationError, idx: number) => (
                        <Text key={idx} fontSize="xs" color="red.600" _dark={{ color: "red.300" }}>
                          {error.field}: {error.message}
                        </Text>
                      ))}
                    </VStack>
                  )}
                  {row.warnings.length > 0 && (
                    <VStack align="start" gap={1}>
                      {row.warnings.map((warning: string, idx: number) => (
                        <Text key={idx} fontSize="xs" color="orange.600" _dark={{ color: "orange.300" }}>
                          Warning: {warning}
                        </Text>
                      ))}
                    </VStack>
                  )}
                  {row.is_duplicate && (
                    <Text fontSize="xs" color="blue.600" _dark={{ color: "blue.300" }}>
                      Duplicate product
                    </Text>
                  )}
                </Table.Cell>
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
                    row.status === "error" && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleEdit(row)}
                      >
                        <HStack gap={1}>
                          <Icon as={FiEdit2} />
                          <Text>Fix</Text>
                        </HStack>
                      </Button>
                    )
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {isImporting && (
        <Box>
          <Text mb={2}>Importing products: {importProgress}%</Text>
          <Box h="8px" w="full" bg="gray.200" borderRadius="full" overflow="hidden">
            <Box h="full" w={`${importProgress}%`} bg="blue.500" transition="width 0.3s" />
          </Box>
          <Text fontSize="sm" color="fg.muted" mt={2}>
            Please don't close this window...
          </Text>
        </Box>
      )}

      <HStack justify="space-between">
        {errorRows > 0 && (
          <Alert.Root status="warning">
            <Alert.Indicator>
              <Icon as={FiAlertTriangle} />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Description>
                {errorRows} row(s) have errors and will be skipped during import
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <Button
          colorScheme="green"
          size="lg"
          onClick={handleImport}
          loading={importMutation.isPending || isImporting}
          disabled={validRows === 0}
        >
          <HStack gap={2}>
            <Text>{errorRows > 0 ? "Import Valid Rows" : "Import All Products"}</Text>
            <Icon as={FiArrowRight} />
          </HStack>
        </Button>
      </HStack>
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
