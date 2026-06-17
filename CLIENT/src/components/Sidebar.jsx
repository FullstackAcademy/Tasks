import { useState } from "react";
import api from "../api";

function buildTree(categories, parentId = null) {
  return categories
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(categories, c.id) }));
}

function CategoryNode({ node, depth, selectedCategory, onSelect }) {
  return (
    <div>
      <button
        onClick={() => onSelect(node)}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        className={`flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm ${
          selectedCategory?.id === node.id
            ? "bg-gray-800 text-white"
            : "text-gray-300 hover:bg-gray-800/60"
        }`}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: node.color || "#3b82f6" }}
        />
        {node.name}
      </button>
      {node.children.map((child) => (
        <CategoryNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedCategory={selectedCategory}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function Sidebar({ categories, selectedCategory, onSelect, onChange }) {
  const [name, setName] = useState("");

  const tree = buildTree(categories);

  async function addCategory() {
    if (!name.trim()) return;
    await api.post("/categories", {
      name: name.trim(),
      parentId: selectedCategory?.id ?? null,
    });
    setName("");
    onChange();
  }

  async function deleteCategory(id) {
    await api.delete(`/categories/${id}`);
    if (selectedCategory?.id === id) {
      onSelect(null);
    }
    onChange();
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-900 p-4">
      <h2 className="mb-4 text-lg font-semibold text-white">TaskFlow</h2>
      <button
        onClick={() => onSelect(null)}
        className={`mb-2 rounded-md px-3 py-1.5 text-left text-sm ${
          selectedCategory === null
            ? "bg-gray-800 text-white"
            : "text-gray-300 hover:bg-gray-800/60"
        }`}
      >
        All
      </button>
      <div className="flex-1 overflow-y-auto">
        {tree.map((node) => (
          <CategoryNode
            key={node.id}
            node={node}
            depth={0}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
          />
        ))}
      </div>
      {selectedCategory && (
        <button
          onClick={() => deleteCategory(selectedCategory.id)}
          className="mb-2 rounded-md px-3 py-1.5 text-left text-xs text-red-400 hover:bg-gray-800/60"
        >
          Delete "{selectedCategory.name}"
        </button>
      )}
      <div className="mt-2 border-t border-gray-800 pt-3">
        <p className="mb-2 text-xs text-gray-500">
          {selectedCategory
            ? `New under "${selectedCategory.name}"`
            : "New top-level category"}
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={addCategory}
            className="rounded-md bg-blue-600 px-3 text-sm text-white hover:bg-blue-500"
          >
            +
          </button>
        </div>
      </div>
    </aside>
  );
}