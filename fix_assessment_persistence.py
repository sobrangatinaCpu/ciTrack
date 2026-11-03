from pathlib import Path

path = Path('src/App.tsx')
if not path.exists():
    path = Path('App.tsx')
if not path.exists():
    raise SystemExit('App.tsx was not found. Run this script from the project root.')

text = path.read_text(encoding='utf-8')

# Add a stable way to distinguish manually added columns from Supabase OMR UUID columns.
type_anchor = '''type RecordAssessmentColumn = {
  id: string
  label: string
  type: "Quiz" | "Hands On" | "Activities" | "Exam" | "Attendance" | "Recitation"
  term?: "Midterm" | "Final"
}
'''
helper = type_anchor + '''const isManualRecordAssessmentColumn = (column: RecordAssessmentColumn) =>
  /^(midterm|final)-(quiz|hands-on|recitation|attendance)-\\d+$/.test(column.id)
'''
if 'const isManualRecordAssessmentColumn' not in text:
    if type_anchor not in text:
        raise SystemExit('RecordAssessmentColumn type block was not found.')
    text = text.replace(type_anchor, helper, 1)

# Supabase remains authoritative for OMR Quiz/Exam columns, but it must not remove
# manually created gradebook columns whose IDs use the local timestamp format.
old_db_filter = '''          .filter((column) => column.type !== "Quiz" && column.type !== "Exam")
          .map((column) => ({ ...column }))'''
new_db_filter = '''          .filter((column) =>
            (column.type !== "Quiz" && column.type !== "Exam") ||
            isManualRecordAssessmentColumn(column),
          )
          .map((column) => ({ ...column }))'''
if old_db_filter not in text:
    raise SystemExit('Database assessment filter was not found.')
text = text.replace(old_db_filter, new_db_filter, 1)

# Restore manually added columns from localStorage after a refresh. UUID-backed OMR
# Quiz/Exam columns still come only from Supabase, preventing deleted OMR columns
# from being resurrected by stale browser data.
old_restore = '''      // Quiz and Exam columns come only from Supabase. This permanently clears
      // deleted Quiz 5/Quiz 6 columns left behind by older localStorage data.
      const preservedColumns: RecordAssessmentColumn[] = Array.isArray(parsed.columns)
        ? parsed.columns.filter((column: RecordAssessmentColumn) =>
            column.type !== "Quiz" && column.type !== "Exam",
          )
        : []'''
new_restore = '''      // Keep manually added gradebook columns after refresh. UUID-backed OMR
      // Quiz/Exam columns still come from Supabase so deleted OMR assessments do
      // not reappear from stale browser data.
      const preservedColumns: RecordAssessmentColumn[] = Array.isArray(parsed.columns)
        ? parsed.columns.filter((column: RecordAssessmentColumn) =>
            (column.type !== "Quiz" && column.type !== "Exam") ||
            isManualRecordAssessmentColumn(column),
          )
        : []'''
if old_restore not in text:
    raise SystemExit('Local gradebook restore filter was not found.')
text = text.replace(old_restore, new_restore, 1)

# Avoid duplicating a restored manual Quiz column when merging with live OMR columns.
old_merge = '''      setAssessmentColumns((current) => [
        ...preservedColumns,
        ...current.filter((column) => column.type === "Quiz" || column.type === "Exam"),
      ])'''
new_merge = '''      setAssessmentColumns((current) => {
        const preservedIds = new Set(preservedColumns.map((column) => column.id))
        return [
          ...preservedColumns,
          ...current.filter((column) =>
            (column.type === "Quiz" || column.type === "Exam") &&
            !preservedIds.has(column.id),
          ),
        ]
      })'''
if old_merge not in text:
    raise SystemExit('Assessment-column merge block was not found.')
text = text.replace(old_merge, new_merge, 1)

path.write_text(text, encoding='utf-8')
print(f'Updated {path}')
