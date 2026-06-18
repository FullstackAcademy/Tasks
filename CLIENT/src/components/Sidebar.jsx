import { useRef, useState } from "react";
import api from "../api";

function buildTree(categories, parentId = null) {
  return categories
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(categories, c.id) }));
}

const COLORS = ["#3b82f6", "#7c3aed", "#10b981", "#f43f5e", "#f59e0b", "#06b6d4", "#ec4899", "#94a3b8"];

// turn a hex color into a faint rgba (for the light matching outline/tint)
function colorWithAlpha(hex, a) {
  const h = (hex || "#3b82f6").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

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
  const color = node.color || "#3b82f6";          // its dot color
  const active = selectedCategory?.id === node.id; // is it selected
  return (
    <div>
      <button
        onClick={() => onSelect(node)}
        style={{
          marginLeft: `${depth * 12}px`,
          borderColor: colorWithAlpha(color, active ? 0.9 : 0.4), // light outline matching the dot
          backgroundColor: active ? colorWithAlpha(color, 0.16) : "rgba(255,255,255,0.02)", // faint tint
        }}
        className="mb-2 flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm text-gray-200 transition hover:brightness-125"
      >
        <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate font-medium">{node.name}</span>
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
    <aside className="flex w-72 flex-col border-r border-gray-800 bg-gray-900 p-5">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">TaskFlow</h2>
        <p className="text-xs text-gray-500">Your spaces</p>
      </div>

      <button
        onClick={() => onSelect(null)}
        className={`mb-2 flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition ${
          selectedCategory === null
            ? "border-gray-600 bg-gray-800 text-white"
            : "border-gray-800 text-gray-300 hover:bg-gray-800/60"
        }`}
      >
        <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-gray-500" />
        <span className="font-medium">All tasks</span>
      </button>

      <div className="flex-1 overflow-y-auto pr-1">
        {tree.map((node) => (
          <CategoryNode
            key={node.id}
            node={node}
            depth={0}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
          />
        ))}
        {tree.length === 0 && (
          <p className="px-1 py-2 text-xs text-gray-600">No categories yet — add one below.</p>
        )}
      </div>

      {selectedCategory && (
        <div className="mb-3 mt-3 space-y-2 rounded-xl border border-gray-800 bg-gray-950/40 p-3">
          <p className="text-xs font-medium text-gray-400">Dot color</p>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((hex) => (
              <button
                key={hex}
                onClick={() => setColor(hex)}
                aria-label={`Color ${hex}`}
                style={{ backgroundColor: hex }}
                className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-gray-900 transition ${
                  (selectedCategory.color || "#3b82f6") === hex ? "ring-white" : "ring-transparent hover:ring-gray-600"
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
            className="w-full rounded-lg border border-gray-700 px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-800/60 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : selectedCategory.image ? "Change photo" : "Add photo"}
          </button>
          {selectedCategory.image && (
            <button
              onClick={removeImage}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-800/60"
            >
              Remove photo
            </button>
          )}
          <button
            onClick={() => deleteCategory(selectedCategory.id)}
            className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
          >
            Delete "{selectedCategory.name}"
          </button>
        </div>
      )}

      <div className="mt-2 border-t border-gray-800 pt-4">
        <p className="mb-2 text-xs text-gray-500">
          {selectedCategory ? `New under "${selectedCategory.name}"` : "New top-level category"}
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={addCategory}
            className="rounded-lg bg-blue-600 px-3.5 text-lg text-white hover:bg-blue-500"
          >
            +
          </button>
        </div>
      </div>
    </aside>
  );
}