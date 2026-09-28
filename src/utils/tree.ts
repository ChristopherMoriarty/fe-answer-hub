import { arrayMove } from '@dnd-kit/sortable'

import type { NodeTreeItem } from '../types/node'

export function findNode(items: NodeTreeItem[], id: string): NodeTreeItem | null {
  for (const item of items) {
    if (item.id === id) return item
    const found = findNode(item.children, id)
    if (found) return found
  }
  return null
}

export function getAncestorIds(
  items: NodeTreeItem[],
  id: string,
): string[] {
  const ancestors: string[] = []
  let currentId: string | null | undefined = findParentId(items, id)

  while (currentId) {
    ancestors.push(currentId)
    currentId = findParentId(items, currentId)
  }

  return ancestors
}

export function findParentId(
  items: NodeTreeItem[],
  id: string,
  parentId: string | null = null,
): string | null | undefined {
  for (const item of items) {
    if (item.id === id) return parentId
    const found = findParentId(item.children, id, item.id)
    if (found !== undefined) return found
  }
  return undefined
}

export function isDescendant(
  items: NodeTreeItem[],
  ancestorId: string,
  nodeId: string,
): boolean {
  const ancestor = findNode(items, ancestorId)
  if (!ancestor) return false
  return findNode(ancestor.children, nodeId) !== null
}

export function getSiblings(
  items: NodeTreeItem[],
  parentId: string | null,
): NodeTreeItem[] {
  if (parentId === null) return items

  const parent = findNode(items, parentId)
  return parent?.children ?? []
}

export function folderDropId(nodeId: string): string {
  return `folder:${nodeId}`
}

export function parseFolderDropId(id: string): string | null {
  return id.startsWith('folder:') ? id.slice('folder:'.length) : null
}

export interface ReorderPayload {
  parent_id: string | null
  ordered_ids: string[]
}

export function buildSiblingReorder(
  items: NodeTreeItem[],
  activeId: string,
  overId: string,
): ReorderPayload | null {
  const parentId = findParentId(items, activeId)
  if (parentId === undefined) return null

  const overParentId = findParentId(items, overId)
  if (overParentId === undefined || overParentId !== parentId) return null

  const siblings = getSiblings(items, parentId)
  const oldIndex = siblings.findIndex((node) => node.id === activeId)
  const newIndex = siblings.findIndex((node) => node.id === overId)
  if (oldIndex === -1 || newIndex === -1) return null

  return {
    parent_id: parentId,
    ordered_ids: arrayMove(
      siblings.map((node) => node.id),
      oldIndex,
      newIndex,
    ),
  }
}

export function buildMoveIntoFolder(
  items: NodeTreeItem[],
  activeId: string,
  folderId: string,
): ReorderPayload | null {
  if (activeId === folderId || isDescendant(items, activeId, folderId)) {
    return null
  }

  const folder = findNode(items, folderId)
  if (!folder || folder.has_content) return null

  const childIds = folder.children.map((child) => child.id)
  if (!childIds.includes(activeId)) {
    childIds.push(activeId)
  }

  return {
    parent_id: folderId,
    ordered_ids: childIds,
  }
}

export function buildMoveToSiblingParent(
  items: NodeTreeItem[],
  activeId: string,
  overId: string,
): ReorderPayload | null {
  const activeParentId = findParentId(items, activeId)
  const overParentId = findParentId(items, overId)
  if (activeParentId === undefined || overParentId === undefined) return null
  if (activeParentId === overParentId) return null

  if (overParentId !== null && isDescendant(items, activeId, overParentId)) {
    return null
  }

  const siblings = getSiblings(items, overParentId)
  const overIndex = siblings.findIndex((node) => node.id === overId)
  if (overIndex === -1) return null

  const orderedIds = siblings
    .filter((node) => node.id !== activeId)
    .map((node) => node.id)
  orderedIds.splice(overIndex, 0, activeId)

  return {
    parent_id: overParentId,
    ordered_ids: orderedIds,
  }
}

export function willNestOnDrop(
  items: NodeTreeItem[],
  activeId: string,
  overId: string,
): boolean {
  const overNode = findNode(items, overId)
  if (!overNode || overNode.has_content || activeId === overId) return false

  const activeParentId = findParentId(items, activeId)
  const overParentId = findParentId(items, overId)
  if (activeParentId === undefined || overParentId === undefined) return false

  return activeParentId !== overParentId
}

export function resolveReorderPayload(
  items: NodeTreeItem[],
  activeId: string,
  overId: string,
): ReorderPayload | null {
  const folderId = parseFolderDropId(overId)
  if (folderId) {
    return buildMoveIntoFolder(items, activeId, folderId)
  }

  const overNode = findNode(items, overId)
  if (overNode && !overNode.has_content && overId !== activeId) {
    const activeParentId = findParentId(items, activeId)
    const overParentId = findParentId(items, overId)
    if (
      activeParentId !== undefined &&
      overParentId !== undefined &&
      activeParentId !== overParentId
    ) {
      return buildMoveIntoFolder(items, activeId, overId)
    }
  }

  const siblingReorder = buildSiblingReorder(items, activeId, overId)
  if (siblingReorder) return siblingReorder

  return buildMoveToSiblingParent(items, activeId, overId)
}
