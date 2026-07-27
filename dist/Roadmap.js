"use strict";
/**
 * Roadmap — project backlog items surfaced in the admin "Roadmap" panel.
 *
 * Items were previously trapped in orchestrator memory files; this model moves
 * them into Firestore so the admin app can list, filter and comment on them.
 *
 * Firestore paths:
 *   roadmap/{itemId}
 *   roadmap/{itemId}/comments/{commentId}
 *   roadmap/{itemId}/attachments/{attachmentId}
 *
 * Every mutation funnels through super-admin-gated callables
 * (saveRoadmapItem / addRoadmapComment / listRoadmapItems) — the callable I/O
 * shapes below are the contract between the admin client and those functions.
 *
 * Admin app uses Firestore Timestamp for date fields; RN app converts to Date.
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=Roadmap.js.map