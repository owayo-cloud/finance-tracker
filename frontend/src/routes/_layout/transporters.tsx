import {
  Badge,
  Box,
  Button,
  Container,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  Heading,
  HStack,
  IconButton,
  Input,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useId, useState } from "react"
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi"
import type {
  TransporterCreate,
  TransporterPublic,
  TransporterUpdate,
} from "@/client"
import { GrnService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/transporters")({
  component: TransportersPage,
})

function TransportersPage() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const nameId = useId()
  const contactPersonId = useId()
  const phoneId = useId()
  const activeCheckboxId = useId()

  const [showDrawer, setShowDrawer] = useState(false)
  const [editingTransporter, setEditingTransporter] =
    useState<TransporterPublic | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [phone, setPhone] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Fetch transporters
  const { data: transportersData, isLoading } = useQuery({
    queryKey: ["transporters", searchTerm],
    queryFn: () =>
      GrnService.readTransporters({
        skip: 0,
        limit: 1000,
        search: searchTerm || undefined,
      }),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TransporterCreate) =>
      GrnService.createTransporter({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Transporter created successfully!")
      queryClient.invalidateQueries({ queryKey: ["transporters"] })
      handleCloseDrawer()
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred"
      showErrorToast(detail)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransporterUpdate }) =>
      GrnService.updateTransporter({ transporterId: id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Transporter updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["transporters"] })
      handleCloseDrawer()
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred"
      showErrorToast(detail)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      GrnService.deleteTransporter({ transporterId: id }),
    onSuccess: () => {
      showSuccessToast("Transporter deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["transporters"] })
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred"
      showErrorToast(detail)
    },
  })

  const handleOpenDrawer = (transporter?: TransporterPublic) => {
    if (transporter) {
      setEditingTransporter(transporter)
      setName(transporter.name)
      setContactPerson(transporter.contact_person || "")
      setPhone(transporter.phone || "")
      setIsActive(transporter.is_active ?? true)
    } else {
      setEditingTransporter(null)
      setName("")
      setContactPerson("")
      setPhone("")
      setIsActive(true)
    }
    setShowDrawer(true)
  }

  const handleCloseDrawer = () => {
    setShowDrawer(false)
    setEditingTransporter(null)
    setName("")
    setContactPerson("")
    setPhone("")
    setIsActive(true)
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      showErrorToast("Transporter name is required")
      return
    }

    const transporterData = {
      name,
      contact_person: contactPerson || undefined,
      phone: phone || undefined,
      is_active: isActive,
    }

    if (editingTransporter) {
      updateMutation.mutate({
        id: editingTransporter.id,
        data: transporterData,
      })
    } else {
      createMutation.mutate(transporterData)
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transporter?")) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <Container maxW="full" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="2xl">Transporters</Heading>
          <Button colorPalette="teal" onClick={() => handleOpenDrawer()}>
            <FiPlus /> Add Transporter
          </Button>
        </HStack>

        {/* Search Bar */}
        <Box>
          <Input
            placeholder="Search transporters by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW="400px"
          />
        </Box>

        {/* Transporters Table */}
        <Box
          borderWidth="1px"
          borderRadius="md"
          overflow="hidden"
          bg={{ base: "gray.900", _light: "white" }}
        >
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg={{ base: "gray.800", _light: "gray.100" }}>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Contact Person</Table.ColumnHeader>
                <Table.ColumnHeader>Phone</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell colSpan={5} textAlign="center" py={8}>
                    Loading...
                  </Table.Cell>
                </Table.Row>
              ) : transportersData?.data.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={5}
                    textAlign="center"
                    py={8}
                    color="gray.500"
                  >
                    No transporters found. Click "Add Transporter" to create
                    one.
                  </Table.Cell>
                </Table.Row>
              ) : (
                transportersData?.data.map((transporter: TransporterPublic) => (
                  <Table.Row key={transporter.id}>
                    <Table.Cell fontWeight="500">{transporter.name}</Table.Cell>
                    <Table.Cell>{transporter.contact_person || "-"}</Table.Cell>
                    <Table.Cell>{transporter.phone || "-"}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={transporter.is_active ? "green" : "red"}
                        size="sm"
                      >
                        {transporter.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1}>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorPalette="blue"
                          onClick={() => handleOpenDrawer(transporter)}
                        >
                          <FiEdit2 />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => handleDelete(transporter.id)}
                        >
                          <FiTrash2 />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </VStack>

      {/* Add/Edit Drawer */}
      <DrawerRoot
        open={showDrawer}
        onOpenChange={(e) => setShowDrawer(e.open)}
        placement="end"
        size="md"
      >
        <DrawerBackdrop />
        <DrawerContent
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "400px",
            maxWidth: "90vw",
          }}
        >
          <DrawerHeader borderBottomWidth="1px">
            <DrawerTitle>
              {editingTransporter ? "Edit Transporter" : "Add New Transporter"}
            </DrawerTitle>
            <DrawerCloseTrigger />
          </DrawerHeader>
          <DrawerBody p={6}>
            <VStack gap={4} align="stretch">
              <Box>
                <label
                  htmlFor={nameId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Transporter Name <span style={{ color: "red" }}>*</span>
                </label>
                <Input
                  id={nameId}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter transporter name"
                />
              </Box>
              <Box>
                <label
                  htmlFor={contactPersonId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Contact Person
                </label>
                <Input
                  id={contactPersonId}
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Enter contact person name"
                />
              </Box>
              <Box>
                <label
                  htmlFor={phoneId}
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Phone
                </label>
                <Input
                  id={phoneId}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </Box>
              <Box>
                <HStack>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    id={activeCheckboxId}
                  />
                  <label
                    htmlFor={activeCheckboxId}
                    style={{ fontSize: "14px", fontWeight: "500" }}
                  >
                    Active
                  </label>
                </HStack>
              </Box>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            <HStack width="full" justify="flex-end" gap={3}>
              <Button variant="outline" onClick={handleCloseDrawer}>
                Cancel
              </Button>
              <Button
                colorPalette="teal"
                loading={createMutation.isPending || updateMutation.isPending}
                onClick={handleSubmit}
              >
                {editingTransporter ? "Update" : "Create"} Transporter
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerRoot>
    </Container>
  )
}
