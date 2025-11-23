import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Container,
  Heading,
  VStack,
  HStack,
  Box,
  Input,
  Button,
  Table,
  IconButton,
  Badge,
  Text,
  DrawerRoot,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerCloseTrigger,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";

import { GrnService } from "@/client";
import type { SupplierPublic, SupplierCreate, SupplierUpdate } from "@/client";
import useCustomToast from "@/hooks/useCustomToast";

export const Route = createFileRoute("/_layout/suppliers")({
  component: SuppliersPage,
});

function SuppliersPage() {
  const queryClient = useQueryClient();
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierPublic | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  // Validation state
  const [nameError, setNameError] = useState("");
  const [nameWarning, setNameWarning] = useState("");

  // Fetch suppliers
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ["suppliers", searchTerm],
    queryFn: () =>
      GrnService.readSuppliers({
        skip: 0,
        limit: 1000,
        search: searchTerm || undefined,
      }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: SupplierCreate) =>
      GrnService.createSupplier({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Supplier created successfully!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      handleCloseDrawer();
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred";
      showErrorToast(detail);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierUpdate }) =>
      GrnService.updateSupplier({ supplierId: id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Supplier updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      handleCloseDrawer();
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred";
      showErrorToast(detail);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => GrnService.deleteSupplier({ supplierId: id }),
    onSuccess: () => {
      showSuccessToast("Supplier deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: any) => {
      const detail = error?.body?.detail || "An error occurred";
      showErrorToast(detail);
    },
  });

  const validateSupplierName = (value: string) => {
    // Check for invalid characters (only letters, spaces, and dashes allowed)
    const invalidChars = /[^A-Za-z\s-]/;
    if (invalidChars.test(value)) {
      setNameError("Only letters, spaces, and dashes are allowed");
      return false;
    }

    // Clear error if valid
    setNameError("");

    // Check for duplicate (case-insensitive)
    const upperValue = value.toUpperCase().trim();
    if (upperValue && suppliersData?.data) {
      const duplicate = suppliersData.data.find(
        (supplier) => 
          supplier.name.toUpperCase() === upperValue && 
          supplier.id !== editingSupplier?.id
      );
      
      if (duplicate) {
        setNameWarning("A supplier with this name already exists");
      } else {
        setNameWarning("");
      }
    }

    return true;
  };

  const handleNameChange = (value: string) => {
    // Convert to uppercase
    const upperValue = value.toUpperCase();
    setName(upperValue);
    validateSupplierName(upperValue);
  };

  const handleOpenDrawer = (supplier?: SupplierPublic) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setName(supplier.name);
      setContactPerson(supplier.contact_person || "");
      setPhone(supplier.phone || "");
      setEmail(supplier.email || "");
      setAddress(supplier.address || "");
      setIsActive(supplier.is_active ?? true);
    } else {
      setEditingSupplier(null);
      setName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setIsActive(true);
    }
    setNameError("");
    setNameWarning("");
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setEditingSupplier(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setIsActive(true);
    setNameError("");
    setNameWarning("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      showErrorToast("Supplier name is required");
      return;
    }

    // Validate name format
    if (!validateSupplierName(name)) {
      showErrorToast("Please fix the supplier name errors");
      return;
    }

    // Check for duplicates on submit
    if (nameWarning) {
      showErrorToast("A supplier with this name already exists");
      return;
    }

    const supplierData = {
      name,
      contact_person: contactPerson || undefined,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      is_active: isActive,
    };

    if (editingSupplier) {
      updateMutation.mutate({
        id: editingSupplier.id,
        data: supplierData,
      });
    } else {
      createMutation.mutate(supplierData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Container maxW="full" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="2xl">Suppliers</Heading>
          <Button
            colorPalette="teal"
            onClick={() => handleOpenDrawer()}
          >
            <FiPlus /> Add Supplier
          </Button>
        </HStack>

        {/* Search Bar */}
        <Box>
          <Input
            placeholder="Search suppliers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW="400px"
          />
        </Box>

        {/* Suppliers Table */}
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
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Address</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell colSpan={7} textAlign="center" py={8}>
                    Loading...
                  </Table.Cell>
                </Table.Row>
              ) : suppliersData?.data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} textAlign="center" py={8} color="gray.500">
                    No suppliers found. Click "Add Supplier" to create one.
                  </Table.Cell>
                </Table.Row>
              ) : (
                suppliersData?.data.map((supplier: SupplierPublic) => (
                  <Table.Row key={supplier.id}>
                    <Table.Cell fontWeight="500">{supplier.name}</Table.Cell>
                    <Table.Cell>{supplier.contact_person || "-"}</Table.Cell>
                    <Table.Cell>{supplier.phone || "-"}</Table.Cell>
                    <Table.Cell>{supplier.email || "-"}</Table.Cell>
                    <Table.Cell>{supplier.address || "-"}</Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={supplier.is_active ? "green" : "red"}
                        size="sm"
                      >
                        {supplier.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1}>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorPalette="blue"
                          onClick={() => handleOpenDrawer(supplier)}
                        >
                          <FiEdit2 />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => handleDelete(supplier.id)}
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
              {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DrawerTitle>
            <DrawerCloseTrigger />
          </DrawerHeader>
          <DrawerBody p={6}>
            <VStack gap={4} align="stretch">
              <Box>
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Supplier Name <span style={{ color: "red" }}>*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter supplier name (UPPERCASE)"
                  borderColor={nameError ? "red.500" : undefined}
                  style={{ textTransform: "uppercase" }}
                />
                {nameError && (
                  <Text fontSize="sm" color="red.500" mt={1}>
                    {nameError}
                  </Text>
                )}
                {nameWarning && !nameError && (
                  <Text fontSize="sm" color="orange.500" mt={1}>
                    ⚠️ {nameWarning}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Only letters, spaces, and dashes allowed
                </Text>
              </Box>
              <Box>
                <label
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
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Enter contact person name"
                />
              </Box>
              <Box>
                <label
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </Box>
              <Box>
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </Box>
              <Box>
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Address
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </Box>
              <Box>
                <HStack>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    id="active-checkbox"
                  />
                  <label
                    htmlFor="active-checkbox"
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
                {editingSupplier ? "Update" : "Create"} Supplier
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerRoot>
    </Container>
  );
}