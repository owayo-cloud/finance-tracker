"""
Bulk Product Import API Endpoints

This module provides endpoints for bulk importing products via CSV/Excel files.
It implements a 5-stage workflow:
1. File upload and parsing
2. Column mapping
3. Data validation with error detection
4. Error fixing and duplicate handling
5. Final import with progress tracking

Only accessible to admin users.
"""

import csv
import io
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

import openpyxl  # type: ignore[import]  # For Excel file parsing
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.api.deps import AdminUser, SessionDep
from app.models import (
    BulkImportFinalRequest,
    BulkImportResult,
    BulkImportSession,
    BulkImportSessionCreate,
    BulkImportSessionPublic,
    BulkImportValidationResponse,
    ColumnMappingRequest,
    ColumnMappingResponse,
    FixRowRequest,
    ImportRow,
    ImportRowStatus,
    Product,
    ProductCategory,
    ProductCreate,
    ProductStatus,
    ValidationError,
)

router = APIRouter(prefix="/products/bulk", tags=["bulk-import"])

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_ROWS = 1000
SUPPORTED_FORMATS = ["csv", "xlsx"]
CHUNK_SIZE = 50  # Process in chunks for progress updates

# In-memory storage for session data (in production, use Redis or database)
import_sessions_data: dict[str, dict[str, Any]] = {}


# ==================== HELPER FUNCTIONS ====================


def parse_csv_file(
    file_content: bytes, filename: str
) -> tuple[list[str], list[dict[str, str]]]:
    """Parse CSV file and return columns and rows."""
    try:
        # Try UTF-8 first
        content = file_content.decode("utf-8")
    except UnicodeDecodeError:
        # Fallback to latin-1
        try:
            content = file_content.decode("latin-1")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Unable to read file. Please save as UTF-8 encoded CSV",
            )

    # Parse CSV
    csv_file = io.StringIO(content)
    reader = csv.DictReader(csv_file)

    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file has no column headers")

    columns = list(reader.fieldnames)
    rows = []

    for idx, row in enumerate(reader, start=1):
        if idx > MAX_ROWS:
            break
        rows.append(row)

    return columns, rows


def parse_excel_file(
    file_content: bytes, filename: str
) -> tuple[list[str], list[dict[str, str]]]:
    """Parse Excel (XLSX) file and return columns and rows."""
    try:
        workbook = openpyxl.load_workbook(
            io.BytesIO(file_content), read_only=True, data_only=True
        )
        sheet = workbook.active

        # Get headers from first row
        headers = []
        for cell in sheet[1]:
            headers.append(str(cell.value) if cell.value is not None else "")

        if not headers or all(h == "" for h in headers):
            raise HTTPException(
                status_code=400, detail="Excel file has no column headers"
            )

        # Read data rows
        rows = []
        for idx, row in enumerate(
            sheet.iter_rows(min_row=2, values_only=True), start=1
        ):
            if idx > MAX_ROWS:
                break

            row_dict = {}
            for col_idx, value in enumerate(row):
                if col_idx < len(headers):
                    # Convert all values to strings
                    row_dict[headers[col_idx]] = str(value) if value is not None else ""
            rows.append(row_dict)

        workbook.close()
        return headers, rows

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to parse Excel file: {str(e)}"
        )


def auto_map_columns(uploaded_columns: list[str]) -> dict[str, str]:
    """
    Automatically map uploaded column names to system fields.

    Returns a dictionary mapping uploaded column names to system field names.
    """
    # Mapping rules: uploaded column name patterns -> system field name
    mapping_rules = {
        "name": ["product name", "name", "product", "item name", "item"],
        "selling_price": ["selling price", "price", "sell price", "retail price", "sp"],
        "buying_price": [
            "buying price",
            "cost price",
            "buy price",
            "purchase price",
            "bp",
            "cost",
        ],
        "description": ["description", "desc", "details", "notes"],
        "current_stock": ["stock", "current stock", "inventory", "quantity", "qty"],
        "reorder_level": ["reorder level", "reorder", "min stock", "minimum stock"],
        "category": ["category", "product category", "type", "group"],
        "tags": ["tags", "product tags", "labels", "keywords"],
    }

    auto_mapping = {}

    for uploaded_col in uploaded_columns:
        col_lower = uploaded_col.lower().strip()

        # Try to find a match
        for system_field, patterns in mapping_rules.items():
            if any(pattern in col_lower for pattern in patterns):
                auto_mapping[uploaded_col] = system_field
                break

    return auto_mapping


def validate_row_data(
    row_data: dict,
    row_number: int,
    session: Session,
    default_category_id: uuid.UUID | None = None,
    default_status_id: uuid.UUID | None = None,
) -> ImportRow:
    """
    Validate a single row of product data.

    Returns ImportRow with validation errors and warnings.
    """
    errors: list[ValidationError] = []
    warnings: list[str] = []
    mapped_data = row_data.copy()

    # Required field: name
    if not row_data.get("name") or not str(row_data["name"]).strip():
        errors.append(
            ValidationError(
                field="name", message="Product name is required", severity="error"
            )
        )
    else:
        name = str(row_data["name"]).strip()
        if len(name) < 2:
            errors.append(
                ValidationError(
                    field="name",
                    message="Product name must be at least 2 characters",
                    severity="error",
                )
            )
        elif len(name) > 200:
            errors.append(
                ValidationError(
                    field="name",
                    message="Product name must not exceed 200 characters",
                    severity="error",
                )
            )
        mapped_data["name"] = name

    # Required field: selling_price
    if not row_data.get("selling_price"):
        errors.append(
            ValidationError(
                field="selling_price",
                message="Selling price is required",
                severity="error",
            )
        )
    else:
        try:
            selling_price = Decimal(
                str(row_data["selling_price"]).strip().replace(",", "")
            )
            if selling_price <= 0:
                errors.append(
                    ValidationError(
                        field="selling_price",
                        message="Selling price must be a positive number",
                        severity="error",
                    )
                )
            else:
                mapped_data["selling_price"] = selling_price
        except (InvalidOperation, ValueError):
            errors.append(
                ValidationError(
                    field="selling_price",
                    message=f"Selling price must be a number. Found: '{row_data['selling_price']}'",
                    severity="error",
                )
            )

    # Optional field: buying_price
    if row_data.get("buying_price"):
        try:
            buying_price = Decimal(
                str(row_data["buying_price"]).strip().replace(",", "")
            )
            if buying_price < 0:
                errors.append(
                    ValidationError(
                        field="buying_price",
                        message="Buying price cannot be negative",
                        severity="error",
                    )
                )
            else:
                mapped_data["buying_price"] = buying_price

                # Warning if buying price > selling price
                if (
                    "selling_price" in mapped_data
                    and buying_price > mapped_data["selling_price"]
                ):
                    warnings.append(
                        f"Buying price ({buying_price}) is higher than selling price ({mapped_data['selling_price']}). "
                        "This will result in a loss."
                    )
        except (InvalidOperation, ValueError):
            errors.append(
                ValidationError(
                    field="buying_price",
                    message=f"Buying price must be a number. Found: '{row_data['buying_price']}'",
                    severity="error",
                )
            )
    else:
        # Set default buying price to 0 if not provided
        mapped_data["buying_price"] = Decimal("0.00")

    # Optional field: current_stock
    if row_data.get("current_stock"):
        try:
            current_stock = int(str(row_data["current_stock"]).strip())
            if current_stock < 0:
                errors.append(
                    ValidationError(
                        field="current_stock",
                        message="Stock cannot be negative",
                        severity="error",
                    )
                )
            else:
                mapped_data["current_stock"] = current_stock
        except ValueError:
            errors.append(
                ValidationError(
                    field="current_stock",
                    message=f"Stock must be a whole number. Found: '{row_data['current_stock']}'",
                    severity="error",
                )
            )
    else:
        mapped_data["current_stock"] = 0

    # Optional field: reorder_level
    if row_data.get("reorder_level"):
        try:
            reorder_level = int(str(row_data["reorder_level"]).strip())
            if reorder_level < 0:
                errors.append(
                    ValidationError(
                        field="reorder_level",
                        message="Reorder level cannot be negative",
                        severity="error",
                    )
                )
            else:
                mapped_data["reorder_level"] = reorder_level
        except ValueError:
            errors.append(
                ValidationError(
                    field="reorder_level",
                    message=f"Reorder level must be a whole number. Found: '{row_data['reorder_level']}'",
                    severity="error",
                )
            )

    # Optional field: description
    if row_data.get("description"):
        description = str(row_data["description"]).strip()
        if len(description) > 1000:
            errors.append(
                ValidationError(
                    field="description",
                    message="Description must not exceed 1000 characters",
                    severity="error",
                )
            )
        else:
            mapped_data["description"] = description

    # Required: category_id
    # If category name is provided in CSV, look it up; otherwise use default
    category_id_to_use = None

    if row_data.get("category"):
        # Category name provided in CSV - look it up
        category_name = str(row_data["category"]).strip()
        existing_category = session.exec(
            select(ProductCategory).where(ProductCategory.name == category_name)
        ).first()

        if existing_category:
            category_id_to_use = existing_category.id
        else:
            errors.append(
                ValidationError(
                    field="category",
                    message=f"Category '{category_name}' not found in system",
                    severity="error",
                )
            )
    elif default_category_id:
        # Use default category
        category_id_to_use = default_category_id
    else:
        # No category provided at all
        errors.append(
            ValidationError(
                field="category_id",
                message="Category must be selected or provided in CSV",
                severity="error",
            )
        )

    if category_id_to_use:
        mapped_data["category_id"] = str(category_id_to_use)

    # Required: status_id
    if not default_status_id:
        errors.append(
            ValidationError(
                field="status_id", message="Status must be selected", severity="error"
            )
        )
    else:
        mapped_data["status_id"] = str(default_status_id)

    # Check for duplicates (by exact name match)
    is_duplicate = False
    duplicate_product_id = None

    if mapped_data.get("name"):
        existing_product = session.exec(
            select(Product).where(Product.name == mapped_data["name"])
        ).first()

        if existing_product:
            is_duplicate = True
            duplicate_product_id = existing_product.id
            warnings.append(
                f"Duplicate - Product '{mapped_data['name']}' already exists in system (ID: {existing_product.id})"
            )

    # Determine status
    if is_duplicate:
        status = ImportRowStatus.DUPLICATE
    elif errors:
        status = ImportRowStatus.ERROR
    elif warnings:
        status = ImportRowStatus.WARNING
    else:
        status = ImportRowStatus.VALID

    return ImportRow(
        row_number=row_number,
        data=row_data,
        mapped_data=mapped_data,
        errors=errors,
        warnings=warnings,
        is_duplicate=is_duplicate,
        duplicate_product_id=duplicate_product_id,
        status=status,
    )


def generate_csv_template() -> str:
    """Generate a CSV template with sample data."""
    template_data = [
        [
            "Product Name",
            "Selling Price",
            "Buying Price",
            "Product Category",
            "Description",
            "Current Stock",
            "Reorder Level",
        ],
        [
            "2 Share Sweet Red 750ML",
            "850.00",
            "650.00",
            "Wine",
            "Sweet red wine 750ml bottle",
            "24",
            "10",
        ],
        [
            "2 Share Sweet White 750ML",
            "850.00",
            "650.00",
            "Wine",
            "Sweet white wine 750ml bottle",
            "18",
            "10",
        ],
        [
            "Coca Cola 300ML",
            "120.00",
            "80.00",
            "Beverages",
            "Coca Cola 300ml bottle",
            "48",
            "20",
        ],
        [
            "Tusker Lager 500ML",
            "200.00",
            "150.00",
            "Beer",
            "Tusker Lager beer 500ml bottle",
            "36",
            "15",
        ],
    ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(template_data)

    return output.getvalue()


# ==================== API ENDPOINTS ====================


@router.get("/template")
def download_template(current_user: AdminUser) -> Any:
    """
    Download CSV template for bulk product import.

    Returns a CSV file with sample data showing the expected format.
    """
    csv_content = generate_csv_template()

    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=product_import_template.csv"
        },
    )


@router.post("/upload", response_model=BulkImportSessionPublic)
async def upload_file(
    *,
    session: SessionDep,
    current_user: AdminUser,
    file: UploadFile = File(...),
) -> Any:
    """
    Upload CSV/Excel file for bulk import.

    Validates file format and size, parses the file, and creates an import session.
    Saves the file to uploads/bulk-imports directory.

    Returns session ID and basic file information.
    """

    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB. Current size: {file_size / 1024 / 1024:.2f}MB",
        )

    # Validate file format
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Supported formats: {', '.join(SUPPORTED_FORMATS.upper())}",
        )

    # Parse file based on format
    try:
        if file_ext == "csv":
            columns, rows = parse_csv_file(file_content, file.filename)
        elif file_ext in ["xlsx", "xls"]:
            columns, rows = parse_excel_file(file_content, file.filename)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    if len(rows) > MAX_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"Too many rows. Maximum allowed: {MAX_ROWS}. Found: {len(rows)}",
        )

    if len(rows) == 0:
        raise HTTPException(status_code=400, detail="File contains no data rows")

    # Save uploaded file to uploads/bulk-imports directory
    upload_dir = Path("uploads/bulk-imports")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename with timestamp
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = upload_dir / safe_filename

    # Write file to disk
    with open(file_path, "wb") as f:
        f.write(file_content)

    # Create import session
    session_create = BulkImportSessionCreate(
        filename=file.filename,
        total_rows=len(rows),
    )

    db_session = BulkImportSession(
        **session_create.model_dump(),
        created_by_id=current_user.id,
    )
    session.add(db_session)
    session.commit()
    session.refresh(db_session)

    # Store raw data in memory (in production, use Redis or file storage)
    import_sessions_data[str(db_session.id)] = {
        "columns": columns,
        "rows": rows,
        "validated_rows": [],
        "auto_mapping": auto_map_columns(columns),
        "file_path": str(file_path),  # Store file path for reference
    }

    # Return session with columns and auto_mapping for frontend
    response = BulkImportSessionPublic.model_validate(db_session)
    response.columns = columns
    response.auto_mapping = auto_map_columns(columns)

    return response


@router.post("/map-columns", response_model=ColumnMappingResponse)
def map_columns(
    *,
    session: SessionDep,
    current_user: AdminUser,
    request: ColumnMappingRequest,
) -> Any:
    """
    Submit column mapping and validate data.

    Maps uploaded columns to system fields and performs initial validation.
    Returns preview of first 5 rows with validation results.
    """
    # Get import session
    db_session = session.get(BulkImportSession, request.session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Import session not found")

    if db_session.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get session data
    session_data = import_sessions_data.get(str(request.session_id))
    if not session_data:
        raise HTTPException(status_code=404, detail="Import session data not found")

    # Validate category and status
    if request.default_category_id:
        category = session.get(ProductCategory, request.default_category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    if request.default_status_id:
        status_obj = session.get(ProductStatus, request.default_status_id)
        if not status_obj:
            raise HTTPException(status_code=404, detail="Status not found")

    # Apply column mapping to raw rows
    raw_rows = session_data["rows"]
    validated_rows = []

    valid_count = 0
    error_count = 0
    duplicate_count = 0

    for idx, raw_row in enumerate(raw_rows, start=1):
        # Map columns
        mapped_row = {}
        for uploaded_col, system_field in request.column_mapping.items():
            if uploaded_col in raw_row:
                mapped_row[system_field] = raw_row[uploaded_col]

        # Validate row
        validated_row = validate_row_data(
            mapped_row,
            idx,
            session,
            request.default_category_id,
            request.default_status_id,
        )

        validated_rows.append(validated_row)

        # Count statuses
        if validated_row.status == ImportRowStatus.VALID:
            valid_count += 1
        elif validated_row.status == ImportRowStatus.ERROR:
            error_count += 1
        elif validated_row.status == ImportRowStatus.DUPLICATE:
            duplicate_count += 1
        elif validated_row.status == ImportRowStatus.WARNING:
            valid_count += 1  # Warnings are still importable

    # Update session
    session_data["validated_rows"] = validated_rows
    session_data["column_mapping"] = request.column_mapping
    session_data["default_category_id"] = (
        str(request.default_category_id) if request.default_category_id else None
    )
    session_data["default_status_id"] = (
        str(request.default_status_id) if request.default_status_id else None
    )

    db_session.column_mapping = request.column_mapping
    db_session.valid_rows = valid_count
    db_session.error_rows = error_count
    db_session.duplicate_rows = duplicate_count
    db_session.status = "validated"
    session.add(db_session)
    session.commit()
    session.refresh(db_session)

    # Return preview (first 5 rows)
    preview_rows = validated_rows[:5]

    return ColumnMappingResponse(
        session_id=request.session_id,
        total_rows=len(validated_rows),
        valid_rows=valid_count,
        error_rows=error_count,
        duplicate_rows=duplicate_count,
        preview_rows=preview_rows,
    )


@router.get("/validate/{session_id}", response_model=BulkImportValidationResponse)
def get_validation_results(
    *,
    session: SessionDep,
    current_user: AdminUser,
    session_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    filter: str | None = None,  # all, errors, duplicates, warnings
) -> Any:
    """
    Get validation results for all rows.

    Supports filtering by status and pagination.
    """
    # Get import session
    db_session = session.get(BulkImportSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Import session not found")

    if db_session.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get session data
    session_data = import_sessions_data.get(str(session_id))
    if not session_data:
        raise HTTPException(status_code=404, detail="Import session data not found")

    validated_rows = session_data.get("validated_rows", [])

    # Apply filter
    if filter == "errors":
        filtered_rows = [r for r in validated_rows if r.status == ImportRowStatus.ERROR]
    elif filter == "duplicates":
        filtered_rows = [
            r for r in validated_rows if r.status == ImportRowStatus.DUPLICATE
        ]
    elif filter == "warnings":
        filtered_rows = [
            r for r in validated_rows if r.status == ImportRowStatus.WARNING
        ]
    else:
        filtered_rows = validated_rows

    # Apply pagination
    paginated_rows = filtered_rows[skip : skip + limit]

    # Count by status
    valid_count = sum(
        1
        for r in validated_rows
        if r.status in [ImportRowStatus.VALID, ImportRowStatus.WARNING]
    )
    error_count = sum(1 for r in validated_rows if r.status == ImportRowStatus.ERROR)
    duplicate_count = sum(
        1 for r in validated_rows if r.status == ImportRowStatus.DUPLICATE
    )

    return BulkImportValidationResponse(
        session_id=session_id,
        rows=paginated_rows,
        total_count=len(filtered_rows),
        valid_count=valid_count,
        error_count=error_count,
        duplicate_count=duplicate_count,
    )


@router.patch("/fix-row/{session_id}")
def fix_row(
    *,
    session: SessionDep,
    current_user: AdminUser,
    session_id: uuid.UUID,
    request: FixRowRequest,
) -> Any:
    """
    Fix data for a specific row.

    Re-validates the row after applying fixes.
    """
    # Get import session
    db_session = session.get(BulkImportSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Import session not found")

    if db_session.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get session data
    session_data = import_sessions_data.get(str(session_id))
    if not session_data:
        raise HTTPException(status_code=404, detail="Import session data not found")

    validated_rows = session_data.get("validated_rows", [])

    # Find row
    row_index = request.row_number - 1
    if row_index < 0 or row_index >= len(validated_rows):
        raise HTTPException(status_code=404, detail="Row not found")

    # Get category and status IDs
    default_category_id = session_data.get("default_category_id")
    default_status_id = session_data.get("default_status_id")

    if default_category_id:
        default_category_id = uuid.UUID(default_category_id)
    if default_status_id:
        default_status_id = uuid.UUID(default_status_id)

    # Re-validate with updated data
    updated_row = validate_row_data(
        request.updated_data,
        request.row_number,
        session,
        default_category_id,
        default_status_id,
    )

    # Update in memory
    validated_rows[row_index] = updated_row
    session_data["validated_rows"] = validated_rows

    # Recalculate counts
    valid_count = sum(
        1
        for r in validated_rows
        if r.status in [ImportRowStatus.VALID, ImportRowStatus.WARNING]
    )
    error_count = sum(1 for r in validated_rows if r.status == ImportRowStatus.ERROR)
    duplicate_count = sum(
        1 for r in validated_rows if r.status == ImportRowStatus.DUPLICATE
    )

    # Update session
    db_session.valid_rows = valid_count
    db_session.error_rows = error_count
    db_session.duplicate_rows = duplicate_count
    session.add(db_session)
    session.commit()

    return {"success": True, "row": updated_row}


@router.post("/import/{session_id}", response_model=BulkImportResult)
def import_products(
    *,
    session: SessionDep,
    current_user: AdminUser,
    session_id: uuid.UUID,
    request: BulkImportFinalRequest,
) -> Any:
    """
    Execute final import of validated products.

    Imports all valid rows, handles duplicates according to specified action.
    """
    start_time = time.time()

    # Get import session
    db_session = session.get(BulkImportSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Import session not found")

    if db_session.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get session data
    session_data = import_sessions_data.get(str(session_id))
    if not session_data:
        raise HTTPException(status_code=404, detail="Import session data not found")

    validated_rows = session_data.get("validated_rows", [])

    # Filter rows to import
    rows_to_import = []
    for row in validated_rows:
        if request.skip_errors and row.status == ImportRowStatus.ERROR:
            continue

        if row.status == ImportRowStatus.DUPLICATE:
            if request.duplicate_action == "skip":
                continue
            elif request.duplicate_action == "update":
                # Update existing product
                rows_to_import.append(("update", row))
                continue
            elif request.duplicate_action == "create":
                # Create as new product anyway
                rows_to_import.append(("create", row))
                continue
        else:
            rows_to_import.append(("create", row))

    # Import products
    imported_product_ids = []
    failed_imports = []
    success_count = 0

    for action, row in rows_to_import:
        try:
            if action == "create":
                # Create new product
                product_data = ProductCreate(
                    name=row.mapped_data["name"],
                    selling_price=row.mapped_data["selling_price"],
                    buying_price=row.mapped_data.get("buying_price", Decimal("0.00")),
                    current_stock=row.mapped_data.get("current_stock", 0),
                    reorder_level=row.mapped_data.get("reorder_level"),
                    description=row.mapped_data.get("description"),
                    category_id=uuid.UUID(row.mapped_data["category_id"]),
                    status_id=uuid.UUID(row.mapped_data["status_id"]),
                )

                db_product = Product(
                    **product_data.model_dump(),
                    created_by_id=current_user.id,
                )
                session.add(db_product)
                session.commit()
                session.refresh(db_product)

                imported_product_ids.append(db_product.id)
                success_count += 1

            elif action == "update" and row.duplicate_product_id:
                # Update existing product
                existing_product = session.get(Product, row.duplicate_product_id)
                if existing_product:
                    # Update fields
                    existing_product.selling_price = row.mapped_data["selling_price"]
                    existing_product.buying_price = row.mapped_data.get(
                        "buying_price", Decimal("0.00")
                    )
                    existing_product.current_stock = row.mapped_data.get(
                        "current_stock", 0
                    )
                    if row.mapped_data.get("reorder_level") is not None:
                        existing_product.reorder_level = row.mapped_data[
                            "reorder_level"
                        ]
                    if row.mapped_data.get("description"):
                        existing_product.description = row.mapped_data["description"]
                    existing_product.updated_at = datetime.now(timezone.utc)

                    session.add(existing_product)
                    session.commit()

                    imported_product_ids.append(existing_product.id)
                    success_count += 1

        except Exception as e:
            failed_imports.append(
                {
                    "row_number": row.row_number,
                    "error": str(e),
                    "data": row.data,
                }
            )

    # Update session
    db_session.imported_rows = success_count
    db_session.status = "completed"
    db_session.completed_at = datetime.now(timezone.utc)
    db_session.import_options = {
        "tags": request.tags,
        "notes": request.notes,
        "duplicate_action": request.duplicate_action,
    }
    session.add(db_session)
    session.commit()

    duration = time.time() - start_time

    return BulkImportResult(
        import_id=db_session.id,
        session_id=session_id,
        success_count=success_count,
        error_count=len(failed_imports),
        duplicate_count=db_session.duplicate_rows or 0,
        total_processed=len(rows_to_import),
        duration_seconds=duration,
        imported_product_ids=imported_product_ids,
        errors=failed_imports,
    )


@router.get("/status/{session_id}", response_model=BulkImportSessionPublic)
def get_import_status(
    *,
    session: SessionDep,
    current_user: AdminUser,
    session_id: uuid.UUID,
) -> Any:
    """
    Get current status of an import session.
    """
    db_session = session.get(BulkImportSession, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Import session not found")

    if db_session.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return db_session
