import uuid
from typing import Any, Generic, TypeVar

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.core.security import get_password_hash, verify_password
from app.models import User, UserCreate, UserUpdate, Product, ProductCreate, ProductUpdate


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


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
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
                selectinload(Product.category),
                selectinload(Product.status),
                selectinload(Product.image),
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
                selectinload(Product.category),
                selectinload(Product.status),
                selectinload(Product.image),
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
