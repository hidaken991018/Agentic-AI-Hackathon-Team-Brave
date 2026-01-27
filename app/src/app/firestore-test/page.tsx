"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Document = {
  id: string;
  [key: string]: unknown;
};

type ApiResponse = {
  success: boolean;
  documents?: Document[];
  error?: string;
};

export default function FirestoreTestPage() {
  const [collection, setCollection] = useState("test");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新規ドキュメント用
  const [newDocKey, setNewDocKey] = useState("");
  const [newDocValue, setNewDocValue] = useState("");

  // 編集用
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});

  // ドキュメント一覧を取得
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/test-firestore?collection=${encodeURIComponent(collection)}`,
      );
      const data: ApiResponse = await res.json();

      if (data.success && data.documents) {
        setDocuments(data.documents);
      } else {
        setError(data.error || "Failed to fetch documents");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ドキュメント作成
  const createDocument = async () => {
    if (!newDocKey.trim()) {
      setError("Key is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/test-firestore?collection=${encodeURIComponent(collection)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [newDocKey]: newDocValue }),
        },
      );
      const data = await res.json();

      if (data.success) {
        setNewDocKey("");
        setNewDocValue("");
        fetchDocuments();
      } else {
        setError(data.error || "Failed to create document");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ドキュメント更新
  const updateDocument = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/test-firestore/${id}?collection=${encodeURIComponent(collection)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        },
      );
      const data = await res.json();

      if (data.success) {
        setEditingId(null);
        setEditData({});
        fetchDocuments();
      } else {
        setError(data.error || "Failed to update document");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ドキュメント削除
  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/test-firestore/${id}?collection=${encodeURIComponent(collection)}`,
        { method: "DELETE" },
      );
      const data = await res.json();

      if (data.success) {
        fetchDocuments();
      } else {
        setError(data.error || "Failed to delete document");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // 編集モード開始
  const startEdit = (doc: Document) => {
    setEditingId(doc.id);
    const data: Record<string, string> = {};
    Object.entries(doc).forEach(([key, value]) => {
      if (key !== "id" && key !== "createdAt" && key !== "updatedAt") {
        data[key] = String(value);
      }
    });
    setEditData(data);
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Firestore Test Console</h1>

      {/* コレクション選択 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Collection</CardTitle>
          <CardDescription>
            Select or enter a collection name to manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="Collection name"
            />
            <Button onClick={fetchDocuments} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 新規ドキュメント作成 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Document</CardTitle>
          <CardDescription>Add a new document to the collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newDocKey}
              onChange={(e) => setNewDocKey(e.target.value)}
              placeholder="Key"
              className="w-1/3"
            />
            <Input
              value={newDocValue}
              onChange={(e) => setNewDocValue(e.target.value)}
              placeholder="Value"
              className="flex-1"
            />
            <Button onClick={createDocument} disabled={loading}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* ドキュメント一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({documents.length})</CardTitle>
          <CardDescription>
            Documents in &quot;{collection}&quot; collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Loading...</p>}

          {!loading && documents.length === 0 && (
            <p className="text-muted-foreground">No documents found</p>
          )}

          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border p-4">
                {editingId === doc.id ? (
                  // 編集モード
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">ID: {doc.id}</p>
                    {Object.entries(editData).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <Input value={key} disabled className="w-1/3" />
                        <Input
                          value={value}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => updateDocument(doc.id)}
                        disabled={loading}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditData({});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <div>
                    <div className="mb-2 flex items-start justify-between">
                      <p className="text-muted-foreground text-sm">
                        ID: {doc.id}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(doc)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteDocument(doc.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <pre className="bg-muted overflow-x-auto rounded p-2 text-sm">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(doc).filter(([k]) => k !== "id"),
                        ),
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Firestore UI リンク */}
      <div className="text-muted-foreground mt-6 text-center text-sm">
        <a
          href="http://localhost:4000"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Open Firestore Emulator UI
        </a>
      </div>
    </div>
  );
}
