"use client";

import { useState } from "react";

type TestSample = {
  id: number;
  message: string;
  createdAt: string;
};

type ApiResponse = {
  success: boolean;
  data?: TestSample | TestSample[];
  count?: number;
  error?: string;
  message?: string;
};

export default function DbTestPage() {
  const [samples, setSamples] = useState<TestSample[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // 全件取得（同期）
  const fetchSamples = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/db-test");
      const json: ApiResponse = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setSamples(json.data);
        setLastAction(`Synced: ${json.count} items`);
      } else {
        setError(json.error || "Failed to fetch");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // 新規作成
  const createSample = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/db-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      const json: ApiResponse = await res.json();

      if (json.success) {
        setNewMessage("");
        setLastAction("Created successfully");
        await fetchSamples();
      } else {
        setError(json.error || "Failed to create");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // 更新
  const updateSample = async () => {
    if (!editId || !editMessage.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/db-test", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, message: editMessage }),
      });
      const json: ApiResponse = await res.json();

      if (json.success) {
        setEditId(null);
        setEditMessage("");
        setLastAction("Updated successfully");
        await fetchSamples();
      } else {
        setError(json.error || "Failed to update");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // 削除
  const deleteSample = async (id: number) => {
    if (!confirm(`Delete item #${id}?`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/db-test?id=${id}`, {
        method: "DELETE",
      });
      const json: ApiResponse = await res.json();

      if (json.success) {
        setLastAction(`Deleted #${id}`);
        await fetchSamples();
      } else {
        setError(json.error || "Failed to delete");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // 編集モード開始
  const startEdit = (sample: TestSample) => {
    setEditId(sample.id);
    setEditMessage(sample.message);
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditId(null);
    setEditMessage("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>DB Test (TestSample CRUD)</h1>

      {/* ステータス表示 */}
      {error && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#fee",
            border: "1px solid #f00",
            borderRadius: "4px",
          }}
        >
          Error: {error}
        </div>
      )}
      {lastAction && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#efe",
            border: "1px solid #0a0",
            borderRadius: "4px",
          }}
        >
          {lastAction}
        </div>
      )}

      {/* 同期ボタン */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={fetchSamples}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading..." : "Sync (Fetch All)"}
        </button>
      </div>

      {/* 新規作成フォーム */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Create New</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter message"
            style={{
              flex: 1,
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button
            onClick={createSample}
            disabled={loading || !newMessage.trim()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor:
                loading || !newMessage.trim() ? "not-allowed" : "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* 編集フォーム */}
      {editId && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#fff3cd",
            borderRadius: "4px",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>Edit #{editId}</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              placeholder="Enter new message"
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <button
              onClick={updateSample}
              disabled={loading || !editMessage.trim()}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ffc107",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                cursor:
                  loading || !editMessage.trim() ? "not-allowed" : "pointer",
              }}
            >
              Update
            </button>
            <button
              onClick={cancelEdit}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* リスト表示 */}
      <div>
        <h3 style={{ marginBottom: "10px" }}>Items ({samples.length})</h3>
        {samples.length === 0 ? (
          <p style={{ color: "#666" }}>
            No items. Click &quot;Sync&quot; to fetch.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #ddd",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "left",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "left",
                  }}
                >
                  Message
                </th>
                <th
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "left",
                  }}
                >
                  Created At
                </th>
                <th
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.id}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {sample.id}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {sample.message}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {new Date(sample.createdAt).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => startEdit(sample)}
                      style={{
                        padding: "4px 8px",
                        marginRight: "5px",
                        backgroundColor: "#ffc107",
                        color: "#000",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSample(sample.id)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
