import os
import uuid as uuid_lib
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from sqlmodel import select

from app.api.deps import AdminUser, SessionDep
from app.core.logging_config import get_logger
from app.models import Media, MediaCreate, MediaPublic

logger = get_logger(__name__)

router = APIRouter(prefix="/media", tags=["media"])

# Allowed image extensions and MIME types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_upload_dir() -> Path:
    """Get the uploads directory, create if it doesn't exist"""
    upload_dir = Path("uploads/products")
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


@router.post("/upload", response_model=MediaPublic)
async def upload_image(
    *, session: SessionDep, admin_user: AdminUser, file: UploadFile = File(...)
) -> Any:
    """
    Upload a product image.
    Only admin users can upload images.
    """
    # Validate file
    if not file.content_type or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB",
        )

    # Get file extension
    file_ext = Path(file.filename or "image.jpg").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Generate unique filename with UUID
    file_uuid = str(uuid_lib.uuid4())
    unique_filename = f"{file_uuid}{file_ext}"

    # Get upload directory
    upload_dir = get_upload_dir()
    file_path = upload_dir / unique_filename

    # Save file and create database record in atomic transaction
    try:
        with open(file_path, "wb") as f:
            f.write(content)

        # Create media record in database with relative path
        relative_path = f"products/{unique_filename}"
        media_in = MediaCreate(
            file_path=relative_path,
            file_name=unique_filename,
            mime_type=file.content_type,
            size=len(content),
        )

        media = Media.model_validate(media_in)
        session.add(media)
        session.commit()
        session.refresh(media)
    except Exception as e:
        # Rollback database transaction if file save succeeded but DB failed
        session.rollback()
        # Try to clean up file if it was created
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass  # Ignore cleanup errors
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Create response with URL
    media_public = MediaPublic.model_validate(media)
    media_public.url = f"/api/v1/media/serve/{media.id}"

    return media_public


@router.get("/serve/{media_id}")
async def serve_image(media_id: uuid_lib.UUID, session: SessionDep) -> Any:  # type: ignore[return]
    """
    Serve an uploaded image.
    """
    from fastapi.responses import FileResponse

    # Get media record
    media = session.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Construct file path
    file_path = Path("uploads") / media.file_path

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(file_path),
        media_type=media.mime_type or "image/jpeg",
        filename=media.file_name,
    )


@router.delete("/{media_id}")
def delete_media(
    *, session: SessionDep, admin_user: AdminUser, media_id: uuid_lib.UUID
) -> dict[str, str]:
    """
    Delete a media file.
    Only admin users can delete media.
    """
    media = session.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Delete file from disk
    file_path = Path("uploads") / media.file_path
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception as e:
            # Log error but continue with database deletion
            logger.warning(f"Failed to delete file: {e}")

    # Delete from database
    session.delete(media)
    session.commit()

    return {"message": "Media deleted successfully"}


@router.get("/", response_model=list[MediaPublic])
def list_media(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    List all media files.
    """
    statement = select(Media).offset(skip).limit(limit)
    media_list = session.exec(statement).all()

    # Add URLs to media objects
    result = []
    for media in media_list:
        media_public = MediaPublic.model_validate(media)
        media_public.url = f"/api/v1/media/serve/{media.id}"
        result.append(media_public)

    return result
