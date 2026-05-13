-- Convert existing plain-text notes to Tiptap JSON format
-- Each non-empty line becomes a paragraph node; empty notes are left untouched
UPDATE config.notes
SET content = json_build_object(
  'type', 'doc',
  'content', (
    SELECT json_agg(
      json_build_object(
        'type', 'paragraph',
        'content', ARRAY[json_build_object('type', 'text', 'text', line)]
      )
    )
    FROM unnest(string_to_array(content, E'\n')) AS line
    WHERE line <> ''
  )
)::text
WHERE content IS NOT NULL
  AND content <> ''
  AND content NOT LIKE '{"type":"doc"%';
