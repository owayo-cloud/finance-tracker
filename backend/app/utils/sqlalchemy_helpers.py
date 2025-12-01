from typing import Any, cast

from sqlalchemy.orm import QueryableAttribute, selectinload
from sqlalchemy.orm.strategy_options import _AbstractLoad


def _cast_attribute(attribute: Any) -> QueryableAttribute[Any]:
    return cast(QueryableAttribute[Any], attribute)


def qload(attribute: Any) -> _AbstractLoad:
    """
    Cast a SQLModel attribute to QueryableAttribute so selectinload works with mypy.
    """
    return selectinload(_cast_attribute(attribute))


def qload_chain(*attributes: Any) -> _AbstractLoad:
    """
    Build a nested selectinload call that mypy accepts.
    """
    if not attributes:
        raise ValueError("qload_chain requires at least one attribute")

    loader: _AbstractLoad = selectinload(_cast_attribute(attributes[0]))
    for attribute in attributes[1:]:
        loader = loader.selectinload(_cast_attribute(attribute))
    return loader

