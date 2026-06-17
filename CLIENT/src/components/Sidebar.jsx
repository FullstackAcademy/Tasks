import { useRef, useState } from "react";
import api from "../api";

function buildTree(categories, parentId = null) {
  return categories
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(categories, c.id) }));
}

// the colors I can pick for a category dot
const COLORS = ["#3b82f6", "#7c3aed", "#10b981", "#f43f5e", "#f59e0b", "#06b6d4", "#ec4899", "#94a3b8"];

function downscaleImage(file, maxDim = 3840, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
        {/* the little dot - color comes from the category itself */}
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const tree = buildTree(categories);

  async function addCategory() {
    if (!name.trim()) return;
    try {
      await api.post("/categories", {
        name: name.trim(),
        parentId: selectedCategory?.id ?? null,
      });
      setName("");
      onChange();
    } catch (err) {
      alert(`Couldn't add category: ${err.response?.data?.error ?? err.message}`);
    }
  }

  async function deleteCategory(id) {
    try {
      await api.delete(`/categories/${id}`);
      if (selectedCategory?.id === id) {
        onSelect(null);
      }
      onChange();
    } catch (err) {
      alert(`Couldn't delete category: ${err.response?.data?.error ?? err.message}`);
    }
  }

  // set the dot color for the selected category and save it to the DB
  async function setColor(hex) {
    if (!selectedCategory) return;
    try {
      await api.patch(`/categories/${selectedCategory.id}`, { color: hex });
      onChange();
    } catch (err) {
      alert(`Couldn't set color: ${err.response?.data?.error ?? err.message}`);
    }
  }

  async function uploadImage(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !selectedCategory) return;
    setUploading(true);
    try {
      const image = await downscaleImage(file);
      await api.patch(`/categories/${selectedCategory.id}`, { image });
      onChange();
    } catch (err) {
      alert(`Image upload failed: ${err.response?.data?.error ?? err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function removeImage() {
    if (!selectedCategory) return;
    try {
      await api.patch(`/categories/${selectedCategory.id}`, { image: null });
      onChange();
    } catch (err) {
      alert(`Couldn't remove photo: ${err.response?.data?.error ?? err.message}`);
    }
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
        <div className="mb-2 space-y-1 border-t border-gray-800 pt-3">
          {/* color picker for the selected category's dot */}
          <p className="px-3 pb-1 text-xs text-gray-500">Dot color</p>
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-1">
            {COLORS.map((hex) => (
              <button
                key={hex}
                onClick={() => setColor(hex)}
                aria-label={`Color ${hex}`}
                style={{ backgroundColor: hex }}
                className={`h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-gray-900 transition ${
                  (selectedCategory.color || "#3b82f6") === hex
                    ? "ring-white"
                    : "ring-transparent hover:ring-gray-600"
                }`}
              />
            ))}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={uploadImage}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-md px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-800/60 disabled:opacity-50"
          >
            {uploading
              ? "Uploading…"
              : selectedCategory.image
              ? "Change photo"
              : "Add photo"}
          </button>
          {selectedCategory.image && (
            <button
              onClick={removeImage}
              className="w-full rounded-md px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-800/60"
            >
              Remove photo
            </button>
          )}
          <button
            onClick={() => deleteCategory(selectedCategory.id)}
            className="w-full rounded-md px-3 py-1.5 text-left text-xs text-red-400 hover:bg-gray-800/60"
          >
            Delete "{selectedCategory.name}"
          </button>
        </div>
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