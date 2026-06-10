from __future__ import annotations

import string
from pathlib import Path

from .models import DirectoryEntry, DirectoryListResponse


def list_roots() -> DirectoryListResponse:
    roots: list[DirectoryEntry] = []
    for letter in string.ascii_uppercase:
        root = Path(f"{letter}:\\")
        if root.exists():
            roots.append(DirectoryEntry(name=f"{letter}:\\", path=str(root)))
    return DirectoryListResponse(path="", parent=None, directories=roots)


def list_directories(path: str) -> DirectoryListResponse:
    root = Path(path).expanduser()
    if not root.exists() or not root.is_dir():
        return DirectoryListResponse(path=path, parent=None, directories=[])

    directories: list[DirectoryEntry] = []
    try:
        for child in sorted(root.iterdir(), key=lambda item: item.name.lower()):
            if child.is_dir():
                directories.append(
                    DirectoryEntry(
                        name=child.name,
                        path=str(child),
                        parent=str(child.parent),
                    )
                )
    except PermissionError:
        directories = []

    parent = str(root.parent) if root.parent != root else None
    return DirectoryListResponse(path=str(root), parent=parent, directories=directories)
