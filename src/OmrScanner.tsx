import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "./lib/supabase"
import "./omr-manager.css"

type FacultyClass = { id: string; label: string }
type Assessment = {
  id: string
  class_id: string
  title: string
  item_count: number
  test_id: string
  status: string
}

function classLabel(row: Record<string, unknown>) {
  const subject = String(row.subject ?? row.subject_name ?? row.name ?? "Untitled subject").trim()
  const section = String(row.code ?? row.section ?? row.section_name ?? "No section").trim()
  return `${subject} - ${section}`
}

export default function OmrScanner({ onClose }: { onClose: () => void }) {
  const [facultyId, setFacultyId] = useState("")
  const [classes, setClasses] = useState<FacultyClass[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [classId, setClassId] = useState("")
  const [assessmentId, setAssessmentId] = useState("")
  const [scanFile, setScanFile] = useState<File | null>(null)
  const [scanPreview, setScanPreview] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const selectedAssessment = useMemo(
    () => assessments.find((assessment) => assessment.id === assessmentId) ?? null,
    [assessments, assessmentId],
  )
  const classAssessments = useMemo(
    () => assessments.filter((assessment) => assessment.class_id === classId),
    [assessments, classId],
  )

  const loadScannerData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) throw new Error("You must be signed in as faculty.")
      setFacultyId(userData.user.id)

      const [{ data: classRows, error: classError }, { data: assessmentRows, error: assessmentError }] = await Promise.all([
        supabase.from("classes").select("*").eq("faculty_id", userData.user.id).order("created_at", { ascending: false }),
        supabase.from("omr_assessments").select("id, class_id, title, item_count, test_id, status").eq("faculty_id", userData.user.id).order("created_at", { ascending: false }),
      ])
      if (classError) throw classError
      if (assessmentError) throw assessmentError

      setClasses((classRows ?? []).map((row: Record<string, unknown>) => ({ id: String(row.id), label: classLabel(row) })))
      setAssessments((assessmentRows ?? []) as Assessment[])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load OMR scanner.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadScannerData() }, [loadScannerData])
  useEffect(() => () => { if (scanPreview) URL.revokeObjectURL(scanPreview) }, [scanPreview])

  function clearScan() {
    if (scanPreview) URL.revokeObjectURL(scanPreview)
    setScanFile(null)
    setScanPreview("")
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    if (uploadInputRef.current) uploadInputRef.current.value = ""
  }

  function chooseScan(file?: File) {
    setError("")
    setMessage("")
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG, or WebP image.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("The OMR image must be 10 MB or smaller.")
      return
    }
    if (scanPreview) URL.revokeObjectURL(scanPreview)
    setScanFile(file)
    setScanPreview(URL.createObjectURL(file))
  }

  function openCamera() {
    if (!classId) return setError("Select a subject and section first.")
    if (!selectedAssessment) return setError("Select a saved assessment first.")
    setError("")
    cameraInputRef.current?.click()
  }

  async function saveScanDraft() {
    if (!facultyId || !classId || !selectedAssessment || !scanFile) {
      setError("Select a class and assessment, then capture an OMR sheet.")
      return
    }
    setUploading(true)
    setError("")
    setMessage("")
    try {
      const extension = scanFile.name.split(".").pop()?.toLowerCase() || "jpg"
      const uniqueId = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const imagePath = `${facultyId}/${selectedAssessment.id}/${uniqueId}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from("omr-scans")
        .upload(imagePath, scanFile, { contentType: scanFile.type, upsert: false })
      if (uploadError) throw uploadError

      const { error: draftError } = await supabase.from("omr_submissions").insert({
        assessment_id: selectedAssessment.id,
        faculty_id: facultyId,
        class_id: classId,
        detected_test_id: selectedAssessment.test_id,
        detected_answers: [],
        correct_count: 0,
        blank_count: selectedAssessment.item_count,
        multiple_count: 0,
        proposed_score: 0,
        confidence: 0,
        image_path: imagePath,
        status: "needs_review",
        review_notes: "Image uploaded. Bubble recognition has not been run yet.",
      })
      if (draftError) {
        await supabase.storage.from("omr-scans").remove([imagePath])
        throw draftError
      }

      clearScan()
      setMessage("OMR sheet saved as a review draft.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the OMR scan.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="omr-shell" role="dialog" aria-modal="true" aria-labelledby="omr-scanner-title">
      <div className="omr-panel omr-scanner-only-panel">
        <header className="omr-header">
          <div>
            <p className="omr-eyebrow">Faculty OMR scanner</p>
            <h2 id="omr-scanner-title">Scan answer sheet</h2>
            <p>Select the subject, section, and saved assessment, then open the camera.</p>
          </div>
          <button className="omr-icon-button" type="button" onClick={onClose} aria-label="Close OMR scanner">X</button>
        </header>

        {error && <div className="omr-alert omr-alert-error" role="alert">{error}</div>}
        {message && <div className="omr-alert omr-alert-success" role="status">{message}</div>}

        <section className="omr-scanner-only-content">
          <div className="omr-card">
            <div className="omr-section-heading"><div><span>1</span><h3>Select assessment</h3></div></div>
            <div className="omr-fields">
              <label>Subject and section
                <select value={classId} onChange={(event) => { setClassId(event.target.value); setAssessmentId(""); clearScan() }} disabled={loading || uploading}>
                  <option value="">Select class</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label>Assessment
                <select value={assessmentId} onChange={(event) => { setAssessmentId(event.target.value); clearScan() }} disabled={!classId || loading || uploading}>
                  <option value="">Select saved assessment</option>
                  {classAssessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.title} - {assessment.item_count} items</option>)}
                </select>
              </label>
            </div>
            {classId && !loading && classAssessments.length === 0 && <p className="omr-scanner-note">No Quiz or Exam is saved for this class. Create one from Activities using Add assessment.</p>}
          </div>

          <div className="omr-card">
            <div className="omr-section-heading"><div><span>2</span><h3>Camera</h3></div>{selectedAssessment && <b>{selectedAssessment.item_count} items</b>}</div>
            <input ref={cameraInputRef} className="omr-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => chooseScan(event.target.files?.[0])} />
            <input ref={uploadInputRef} className="omr-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseScan(event.target.files?.[0])} />
            <div className="omr-capture-buttons">
              <button type="button" className="omr-primary" onClick={openCamera} disabled={!selectedAssessment || uploading}>Open camera</button>
              <button type="button" className="omr-secondary" onClick={() => uploadInputRef.current?.click()} disabled={!selectedAssessment || uploading}>Choose image</button>
            </div>

            {scanPreview ? (
              <div className="omr-scan-preview">
                <img src={scanPreview} alt="Selected OMR answer sheet preview" />
                <div>
                  <strong>{scanFile?.name}</strong>
                  <span>{scanFile ? `${(scanFile.size / 1024 / 1024).toFixed(2)} MB` : ""}</span>
                  <p>Confirm the correct subject and assessment before saving.</p>
                  <div className="omr-preview-actions">
                    <button type="button" className="omr-secondary" onClick={clearScan} disabled={uploading}>Retake</button>
                    <button type="button" className="omr-primary" onClick={() => void saveScanDraft()} disabled={uploading}>{uploading ? "Uploading..." : "Save scan draft"}</button>
                  </div>
                </div>
              </div>
            ) : <div className="omr-scan-empty">Select an assessment, then open the camera.</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
