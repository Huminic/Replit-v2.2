import type { Express } from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";

const upload = multer({
  storage: multer.diskStorage({ destination: os.tmpdir() }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        if (current.length > 0) {
          throw new Error(`Illegal quote placement at position ${i}`);
        }
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  if (inQuotes) {
    throw new Error("Unclosed quote at end of line");
  }
  result.push(current.trim());
  return result;
}

export function registerDocumentRoutes(app: Express) {
  app.get("/api/documents", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const agentId = req.query.agentId as string | undefined;
      const docs = await storage.getDocuments(req.user.organizationId, agentId);
      return res.json(docs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/check-duplicate", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const { filename } = req.body;
      if (!filename) return res.status(400).json({ message: "filename is required" });

      const existing = await storage.getDocumentByNameAndOrg(filename, req.user.organizationId);
      if (existing) {
        const result: any = {
          isDuplicate: true,
          existingDocument: {
            id: existing.id,
            name: existing.name,
            type: existing.type,
            size: existing.size,
            status: existing.status,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          },
        };

        if (existing.type === "csv") {
          const existingRows = await storage.getDocumentsBySourceName(existing.name, req.user.organizationId);
          result.existingCsvData = {
            rowCount: existingRows.length,
            headers: existing.content ? existing.content.replace(/^CSV file with \d+ rows\. Columns: /, "").split(", ") : [],
            previewRows: existingRows.slice(0, 5).map(r => r.content || ""),
          };
        }

        return res.json(result);
      }
      return res.json({ isDuplicate: false, existingDocument: null });
    } catch (err) {
      return res.status(500).json({ message: "Failed to check for duplicate" });
    }
  });

  app.post("/api/documents", authenticateToken, upload.single("file"), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      if (file.size === 0) {
        try { fs.unlinkSync(file.path); } catch {}
        return res.status(400).json({ message: "File is empty" });
      }

      const ext = file.originalname.split(".").pop()?.toLowerCase() || "unknown";
      const typeMap: Record<string, string> = { pdf: "pdf", docx: "docx", doc: "docx", csv: "csv", txt: "txt", html: "html", htm: "html" };
      const docType = typeMap[ext] || ext;

      const replaceExisting = req.body.replaceExisting === "true" || req.body.replaceExisting === true;
      if (replaceExisting) {
        const existing = await storage.getDocumentByNameAndOrg(file.originalname, req.user.organizationId);
        if (existing) {
          await storage.deleteDocument(existing.id);
          await storage.deleteDocumentsBySourceName(file.originalname, req.user.organizationId);
        }
      }

      if (ext === "csv") {
        let rawContent: string;
        try {
          rawContent = fs.readFileSync(file.path, "utf-8");
        } catch (encErr) {
          try { fs.unlinkSync(file.path); } catch {}
          return res.status(400).json({ message: "File encoding error: unable to read file as UTF-8 text" });
        }

        if (!rawContent || rawContent.trim().length === 0) {
          try { fs.unlinkSync(file.path); } catch {}
          return res.status(400).json({ message: "Malformed CSV: file is empty" });
        }

        const lines = rawContent.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 1) {
          return res.status(400).json({ message: "Malformed CSV: file contains no data" });
        }

        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);
        if (headers.length === 0) {
          return res.status(400).json({ message: "Malformed CSV: unable to parse header row" });
        }

        if (lines.length < 2) {
          return res.status(400).json({ message: "Malformed CSV: file has a header row but no data rows" });
        }

        const parentDoc = await storage.createDocument({
          name: file.originalname,
          type: docType,
          size: file.size,
          status: "indexed",
          organizationId: req.user.organizationId,
          agentId: (req.body.agentId as string) || null,
          content: `CSV file with ${lines.length - 1} rows. Columns: ${headers.join(", ")}`,
          mimeType: file.mimetype,
        });

        const expectedColumns = headers.length;
        const createdChunks = [];
        let parseErrors = 0;
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = parseCSVLine(lines[i]);

            if (values.length !== expectedColumns) {
              parseErrors++;
              continue;
            }

            const hasUnbalancedQuotes = values.some((field) => {
              const unescaped = field.replace(/""/g, "");
              const quoteCount = (unescaped.match(/"/g) || []).length;
              return quoteCount % 2 !== 0;
            });
            if (hasUnbalancedQuotes) {
              parseErrors++;
              continue;
            }

            const rowObj: Record<string, string> = {};
            for (let j = 0; j < headers.length; j++) {
              rowObj[headers[j]] = values[j] || "";
            }
            const rowContent = Object.entries(rowObj)
              .filter(([_, v]) => v.trim().length > 0)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n");

            if (rowContent.trim().length === 0) continue;

            const chunk = await storage.createDocument({
              name: `${file.originalname} — Row ${i}`,
              type: "csv-row",
              size: rowContent.length,
              status: "indexed",
              organizationId: req.user.organizationId,
              agentId: (req.body.agentId as string) || null,
              content: rowContent,
              mimeType: "text/csv",
              sourceDocumentName: file.originalname,
            });
            createdChunks.push(chunk);
          } catch (rowErr) {
            parseErrors++;
          }
        }

        if (parseErrors > 0) {
          await storage.deleteDocument(parentDoc.id);
          for (const chunk of createdChunks) {
            await storage.deleteDocument(chunk.id);
          }
          const totalDataRows = lines.length - 1;
          return res.status(400).json({
            message: `CSV has ${parseErrors} malformed row${parseErrors > 1 ? 's' : ''} out of ${totalDataRows} total. Please fix the file and re-upload.`,
          });
        }

        storage.createActivityLog({
          userId: req.user!.id,
          organizationId: req.user!.organizationId,
          action: "document_uploaded",
          entityType: "document",
          entityId: parentDoc.id,
          metadata: {
            fileName: file.originalname,
            fileType: docType,
            fileSize: file.size,
            csvRows: createdChunks.length,
          },
        }).catch(() => {});

        return res.status(201).json({
          ...parentDoc,
          csvRowsCreated: createdChunks.length,
        });
      }

      let content: string | null = null;
      if (["txt", "html", "htm"].includes(ext)) {
        try {
          content = fs.readFileSync(file.path, "utf-8");
        } catch (encErr) {
          try { fs.unlinkSync(file.path); } catch {}
          return res.status(400).json({ message: "File encoding error: unable to read file as UTF-8 text" });
        }
        if (!content || content.trim().length === 0) {
          try { fs.unlinkSync(file.path); } catch {}
          return res.status(400).json({ message: "Malformed file: file is empty or contains no readable content" });
        }
      }

      const doc = await storage.createDocument({
        name: file.originalname,
        type: docType,
        size: file.size,
        status: "indexed",
        organizationId: req.user.organizationId,
        agentId: (req.body.agentId as string) || null,
        content,
        mimeType: file.mimetype,
      });

      storage.createActivityLog({
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
        action: "document_uploaded",
        entityType: "document",
        entityId: doc.id,
        metadata: { fileName: file.originalname, fileType: docType, fileSize: file.size },
      }).catch(() => {});

      return res.status(201).json(doc);
    } catch (err: any) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum upload size is 5MB." });
      }
      console.error("Document upload error:", err);
      return res.status(500).json({ message: "Failed to upload document" });
    } finally {
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
    }
  });

  app.delete("/api/documents/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const doc = await storage.getDocument(req.params.id as string);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      if (doc.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (doc.type !== "csv-row") {
        await storage.deleteDocumentsBySourceName(doc.name, doc.organizationId);
      }
      await storage.deleteDocument(req.params.id as string);
      return res.json({ message: "Document deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete document" });
    }
  });
}
