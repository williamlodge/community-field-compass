-- Apply deliberately to the selected FieldCompass database using a migration
-- account. The application account needs SELECT only. Never runs at startup.
CREATE TABLE IF NOT EXISTS fc_resources (
  id VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  publication_status ENUM('draft', 'published', 'withdrawn') NOT NULL DEFAULT 'draft',
  record_json JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX fc_resources_status (publication_status)
);
-- record_json follows src/domain/types.ts and is validated in src/data/schema.ts.
-- Preserve withdrawn rows as tombstones for saved-plan status checks.
-- Publish only after source permission, mappings and confidential fields review.
