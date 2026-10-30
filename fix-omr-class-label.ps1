$ErrorActionPreference = "Stop"
$path = Join-Path $PSScriptRoot "src\OmrManager.tsx"

if (-not (Test-Path $path)) {
  throw "Could not find src\OmrManager.tsx. Put this script in the project root beside package.json, then run it again."
}

$content = Get-Content -Path $path -Raw
$old = @'
function classLabel(row: Record<string, unknown>) {
  const code = String(row.subject_code ?? row.code ?? row.name ?? row.subject_name ?? "Class")
  const section = String(row.section_name ?? row.section ?? row.class_section ?? "").trim()
  return section ? `${code} · ${section}` : code
}
'@
$new = @'
function classLabel(row: Record<string, unknown>) {
  const subject = String(
    row.subject ?? row.subject_name ?? row.name ?? "Untitled subject",
  ).trim()

  const section = String(
    row.code ?? row.section ?? row.section_name ?? "No section",
  ).trim()

  return `${subject} · ${section}`
}
'@

if (-not $content.Contains($old)) {
  throw "The expected classLabel code was not found. No changes were made."
}

$backup = "$path.backup"
Copy-Item -Path $path -Destination $backup -Force
$content = $content.Replace($old, $new)
Set-Content -Path $path -Value $content -Encoding utf8
Write-Host "Updated src\OmrManager.tsx successfully."
Write-Host "Backup created at src\OmrManager.tsx.backup"
