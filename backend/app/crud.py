import uuid
from datetime import datetime, timezone
from typing import Any, Generic, TypeVar

from sqlalchemy import func
from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    GRN,
    GRNCreate,
    GRNItem,
    GRNItemCreate,
    GRNItemUpdate,
    GRNUpdate,
    Product,
    ProductCreate,
    ProductUpdate,
    Supplier,
    SupplierCreate,
    SupplierUpdate,
    Transporter,
    TransporterCreate,
    TransporterUpdate,
    User,
    UserCreate,
    UserUpdate,
)
from app.utils.sqlalchemy_helpers import qload, qload_chain


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def get_user_by_username(*, session: Session, username: str) -> User | None:
    """Get user by username (case insensitive)"""
    statement = select(User).where(func.lower(User.username) == func.lower(username))
    session_user = session.exec(statement).first()
    return session_user


def get_user_by_email_or_username(*, session: Session, identifier: str) -> User | None:
    """Get user by email or username (case insensitive for username)"""
    # Try email first (case sensitive)
    user = get_user_by_email(session=session, email=identifier)
    if user:
        return user
    # Try username (case insensitive)
    return get_user_by_username(session=session, username=identifier)


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    """Authenticate user by email or username (case insensitive for username)"""
    db_user = get_user_by_email_or_username(session=session, identifier=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


# Generic types for CRUD base
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType]):
        self.model = model


class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def create(
        self, db: Session, *, obj_in: ProductCreate, created_by_id: uuid.UUID
    ) -> Product:
        db_obj = Product.model_validate(
            obj_in, update={"created_by_id": created_by_id}
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # Eagerly load relationships for the newly created object
        statement = (
            select(Product)
            .where(Product.id == db_obj.id)
            .options(
                qload(Product.category),
                qload(Product.status),
                qload(Product.image),
            )
        )
        refreshed_obj = db.exec(statement).one()
        return refreshed_obj

    def update(self, db: Session, *, db_obj: Product, obj_in: ProductUpdate) -> Product:
        obj_data = obj_in.model_dump(exclude_unset=True)
        db_obj.sqlmodel_update(obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # Eagerly load relationships for the updated object
        statement = (
            select(Product)
            .where(Product.id == db_obj.id)
            .options(
                qload(Product.category),
                qload(Product.status),
                qload(Product.image),
            )
        )
        refreshed_obj = db.exec(statement).one()
        return refreshed_obj

    def remove(self, db: Session, *, id: uuid.UUID) -> Product:
        obj = db.get(Product, id)
        db.delete(obj)
        db.commit()
        return obj


product = CRUDProduct(Product)


# ==================== SUPPLIER CRUD ====================

class CRUDSupplier(CRUDBase[Supplier, SupplierCreate, SupplierUpdate]):
    def create(self, db: Session, *, obj_in: SupplierCreate) -> Supplier:
        db_obj = Supplier.model_validate(obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Supplier, obj_in: SupplierUpdate) -> Supplier:
        obj_data = obj_in.model_dump(exclude_unset=True)
        db_obj.sqlmodel_update(obj_data)
        db_obj.updated_at = datetime.now(timezone.utc)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_name(self, db: Session, *, name: str) -> Supplier | None:
        statement = select(Supplier).where(func.lower(Supplier.name) == func.lower(name))
        return db.exec(statement).first()


supplier = CRUDSupplier(Supplier)


# ==================== TRANSPORTER CRUD ====================

class CRUDTransporter(CRUDBase[Transporter, TransporterCreate, TransporterUpdate]):
    def create(self, db: Session, *, obj_in: TransporterCreate) -> Transporter:
        db_obj = Transporter.model_validate(obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Transporter, obj_in: TransporterUpdate) -> Transporter:
        obj_data = obj_in.model_dump(exclude_unset=True)
        db_obj.sqlmodel_update(obj_data)
        db_obj.updated_at = datetime.now(timezone.utc)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_name(self, db: Session, *, name: str) -> Transporter | None:
        statement = select(Transporter).where(func.lower(Transporter.name) == func.lower(name))
        return db.exec(statement).first()


transporter = CRUDTransporter(Transporter)


# ==================== GRN CRUD ====================

class CRUDGRN(CRUDBase[GRN, GRNCreate, GRNUpdate]):
    def generate_grn_number(self, db: Session) -> str:
        """Generate unique GRN number in format GRN-YYYYMMDD-XXXX"""
        today = datetime.now(timezone.utc)
        date_prefix = today.strftime("GRN-%Y%m%d")
        
        # Get count of GRNs created today
        statement = select(func.count(GRN.id)).where(
            func.date(GRN.created_at) == today.date()
        )
        count = db.exec(statement).one() + 1
        
        return f"{date_prefix}-{count:04d}"

    def create(
        self, db: Session, *, obj_in: GRNCreate, created_by_id: uuid.UUID
    ) -> GRN:
        # Generate GRN number
        grn_number = self.generate_grn_number(db)
        
        # Extract items from the create model
        items_data = obj_in.items
        obj_data = obj_in.model_dump(exclude={"items"})
        
        # Create GRN
        db_obj = GRN.model_validate(
            obj_data, 
            update={
                "created_by_id": created_by_id,
                "grn_number": grn_number
            }
        )
        db.add(db_obj)
        db.flush()  # Flush to get the GRN ID
        
        # Create GRN items
        for item_data in items_data:
            grn_item = GRNItem.model_validate(
                item_data,
                update={"grn_id": db_obj.id}
            )
            db.add(grn_item)
            
            # Update product stock if approved
            if obj_in.is_approved:
                product = db.get(Product, item_data.product_id)
                if product:
                    product.current_stock = (product.current_stock or 0) + item_data.received_quantity
                    db.add(product)
        
        db.commit()
        db.refresh(db_obj)
        
        # Eagerly load relationships
        statement = (
            select(GRN)
            .where(GRN.id == db_obj.id)
            .options(
                qload(GRN.supplier),
                qload(GRN.transporter),
                qload_chain(GRN.items, GRNItem.product),
            )
        )
        refreshed_obj = db.exec(statement).one()
        return refreshed_obj

    def update(self, db: Session, *, db_obj: GRN, obj_in: GRNUpdate) -> GRN:
        obj_data = obj_in.model_dump(exclude_unset=True)
        
        # Handle approval
        was_approved = db_obj.is_approved
        will_be_approved = obj_data.get("is_approved", was_approved)
        
        if will_be_approved and not was_approved:
            # Update stock for all items when approving
            obj_data["approved_at"] = datetime.now(timezone.utc)
            for item in db_obj.items:
                product = db.get(Product, item.product_id)
                if product:
                    product.current_stock = (product.current_stock or 0) + item.received_quantity
                    db.add(product)
        
        db_obj.sqlmodel_update(obj_data)
        db_obj.updated_at = datetime.now(timezone.utc)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Eagerly load relationships
        statement = (
            select(GRN)
            .where(GRN.id == db_obj.id)
            .options(
                qload(GRN.supplier),
                qload(GRN.transporter),
                qload_chain(GRN.items, GRNItem.product),
            )
        )
        refreshed_obj = db.exec(statement).one()
        return refreshed_obj


grn = CRUDGRN(GRN)


# ==================== GRN ITEM CRUD ====================

class CRUDGRNItem(CRUDBase[GRNItem, GRNItemCreate, GRNItemUpdate]):
    def create(self, db: Session, *, obj_in: GRNItemCreate) -> GRNItem:
        db_obj = GRNItem.model_validate(obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: GRNItem, obj_in: GRNItemUpdate) -> GRNItem:
        obj_data = obj_in.model_dump(exclude_unset=True)
        db_obj.sqlmodel_update(obj_data)
        db_obj.updated_at = datetime.now(timezone.utc)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


grn_item = CRUDGRNItem(GRNItem)


# ==================== NOTIFICATION CRUD OPERATIONS ====================

def create_notification(
    *,
    session: Session,
    user_id: uuid.UUID,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "info",
    link_url: str | None = None,
    link_text: str | None = None,
    extra_data: dict | None = None,
) -> Any:
    """Create a notification for a specific user"""
    from app.models import Notification, NotificationCreate
    
    notification_in = NotificationCreate(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        priority=priority,
        link_url=link_url,
        link_text=link_text,
        extra_data=extra_data,
    )
    
    notification = Notification.model_validate(notification_in)
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification


def create_notification_for_admins(
    *,
    session: Session,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "info",
    link_url: str | None = None,
    link_text: str | None = None,
    extra_data: dict | None = None,
) -> list[Any]:
    """Create notification for all admin users who have opted in"""
    # Get admin users who receive this type of notification
    statement = select(User).where(User.role == "admin")
    
    # Filter based on notification type
    if "supplier_debt" in notification_type:
        statement = statement.where(User.receives_supplier_debt_alerts == True)
    elif "reorder" in notification_type:
        statement = statement.where(User.receives_reorder_alerts == True)
    elif "grn_approval" in notification_type:
        statement = statement.where(User.receives_grn_approval_requests == True)
    
    admin_users = session.exec(statement).all()
    
    notifications = []
    for user in admin_users:
        notification = create_notification(
            session=session,
            user_id=user.id,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            link_url=link_url,
            link_text=link_text,
            extra_data=extra_data,
        )
        notifications.append(notification)
    
    return notifications


def mark_notification_read(
    *, session: Session, notification_id: uuid.UUID, user_id: uuid.UUID
) -> Any:
    """Mark a notification as read"""
    from app.models import Notification
    
    statement = (
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == user_id)
    )
    notification = session.exec(statement).first()
    
    if not notification:
        return None
    
    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return notification


def delete_old_notifications(*, session: Session, days: int = 30) -> int:
    """Delete read notifications older than specified days"""
    from app.models import Notification
    from datetime import timedelta
    
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    statement = (
        select(Notification)
        .where(Notification.is_read == True)
        .where(Notification.created_at < cutoff_date)
    )
    old_notifications = session.exec(statement).all()
    
    count = len(old_notifications)
    for notification in old_notifications:
        session.delete(notification)
    
    session.commit()
    return count

