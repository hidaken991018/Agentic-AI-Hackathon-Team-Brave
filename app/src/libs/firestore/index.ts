export {
  getFirestoreClient,
  getCollection,
  getDocument,
  // TTL関連
  Timestamp,
  createExpireAt,
  addDocumentWithTTL,
  setDocumentWithTTL,
} from "./client";
