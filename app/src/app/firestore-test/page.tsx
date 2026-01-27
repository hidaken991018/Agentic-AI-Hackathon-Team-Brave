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
import { Label } from "@/components/ui/label";

// 固定のコレクション名
const COLLECTION_NAME = "session_tests";

type Document = {
  id: string;
  expireAt?: { _seconds: number; _nanoseconds: number };
  [key: string]: unknown;
};

type ApiResponse = {
  success: boolean;
  documents?: Document[];
  error?: string;
};

// TTLプリセット
const TTL_PRESETS = [
  { label: "なし", value: "" },
  { label: "1分", value: "60" },
  { label: "5分", value: "300" },
  { label: "1時間", value: "3600" },
  { label: "24時間", value: "86400" },
  { label: "7日", value: "604800" },
];

export default function FirestoreTestPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新規ドキュメント用
  const [newDocKey, setNewDocKey] = useState("");
  const [newDocValue, setNewDocValue] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState("");

  // 編集用
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});

  // ドキュメント一覧を取得
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/test-firestore?collection=${encodeURIComponent(COLLECTION_NAME)}`,
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
  }, []);

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
      const ttlParam = ttlSeconds ? `&ttl=${ttlSeconds}` : "";
      const res = await fetch(
        `/api/test-firestore?collection=${encodeURIComponent(COLLECTION_NAME)}${ttlParam}`,
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
        setTtlSeconds("");
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
        `/api/test-firestore/${id}?collection=${encodeURIComponent(COLLECTION_NAME)}`,
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
        `/api/test-firestore/${id}?collection=${encodeURIComponent(COLLECTION_NAME)}`,
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
      if (
        key !== "id" &&
        key !== "createdAt" &&
        key !== "updatedAt" &&
        key !== "expireAt"
      ) {
        data[key] = String(value);
      }
    });
    setEditData(data);
  };

  // expireAtを読みやすい形式に変換
  const formatExpireAt = (
    expireAt?: { _seconds: number; _nanoseconds: number },
  ) => {
    if (!expireAt) return null;
    const expireDate = new Date(expireAt._seconds * 1000);
    const now = new Date();
    const diffMs = expireDate.getTime() - now.getTime();

    if (diffMs < 0) {
      return { text: "期限切れ", isExpired: true };
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    let remaining = "";
    if (diffDay > 0) {
      remaining = `${diffDay}日後`;
    } else if (diffHour > 0) {
      remaining = `${diffHour}時間後`;
    } else if (diffMin > 0) {
      remaining = `${diffMin}分後`;
    } else {
      remaining = `${diffSec}秒後`;
    }

    return {
      text: `${expireDate.toLocaleString()} (${remaining}に削除)`,
      isExpired: false,
    };
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Firestore Test Console</h1>
      <p className="text-muted-foreground mb-6">
        Collection: <code className="bg-muted rounded px-2 py-1">{COLLECTION_NAME}</code>
      </p>

      {/* 新規ドキュメント作成 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Document</CardTitle>
          <CardDescription>
            Add a new document with optional TTL (auto-delete)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          </div>

          {/* TTL設定 */}
          <div className="space-y-2">
            <Label>TTL (自動削除)</Label>
            <div className="flex flex-wrap gap-2">
              {TTL_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  size="sm"
                  variant={ttlSeconds === preset.value ? "default" : "outline"}
                  onClick={() => setTtlSeconds(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={ttlSeconds}
                onChange={(e) => setTtlSeconds(e.target.value)}
                placeholder="カスタム（秒）"
                className="w-40"
              />
              <span className="text-muted-foreground text-sm">
                {ttlSeconds
                  ? `${parseInt(ttlSeconds, 10)}秒後に自動削除`
                  : "TTLなし（永続）"}
              </span>
            </div>
          </div>

          <Button onClick={createDocument} disabled={loading}>
            Create
          </Button>
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
            <Button
              size="sm"
              variant="outline"
              onClick={fetchDocuments}
              disabled={loading}
            >
              Refresh
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Loading...</p>}

          {!loading && documents.length === 0 && (
            <p className="text-muted-foreground">No documents found</p>
          )}

          <div className="space-y-4">
            {documents.map((doc) => {
              const expireInfo = formatExpireAt(doc.expireAt);

              return (
                <div key={doc.id} className="rounded-lg border p-4">
                  {editingId === doc.id ? (
                    // 編集モード
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        ID: {doc.id}
                      </p>
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
                        <div>
                          <p className="text-muted-foreground text-sm">
                            ID: {doc.id}
                          </p>
                          {expireInfo && (
                            <p
                              className={`text-xs ${expireInfo.isExpired ? "text-red-500" : "text-orange-500"}`}
                            >
                              TTL: {expireInfo.text}
                            </p>
                          )}
                        </div>
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
                            Object.entries(doc).filter(
                              ([k]) =>
                                k !== "id" &&
                                k !== "expireAt" &&
                                k !== "createdAt" &&
                                k !== "updatedAt",
                            ),
                          ),
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
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
