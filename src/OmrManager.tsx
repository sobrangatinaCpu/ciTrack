import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "./lib/supabase"
import "./omr-manager.css"

type Choice = "A" | "B" | "C" | "D"
type AssessmentType = "quiz" | "exam"
type AssessmentStatus = "draft" | "open" | "closed" | "archived"

type FacultyClass = {
  id: string
  label: string
}

type OmrAssessment = {
  id: string
  faculty_id: string
  class_id: string
  title: string
  assessment_type: AssessmentType
  test_id: string
  item_count: number
  points_per_item: number
  scheduled_date: string
  start_time: string
  end_time: string
  status: AssessmentStatus
  created_at: string
  omr_answer_keys?: { answers: Choice[]; verified_at: string | null } | null
}

const EMPTY_ANSWERS: (Choice | "")[] = Array.from({ length: 50 }, () => "")
const CHOICES: Choice[] = ["A", "B", "C", "D"]

function classLabel(row: Record<string, unknown>) {
  const subject = String(
    row.subject ?? row.subject_name ?? row.name ?? "Untitled subject",
  ).trim()

  const section = String(
    row.code ?? row.section ?? row.section_name ?? "No section",
  ).trim()

  return `${subject} - ${section}`
}

function randomTestId() {
  return String(Math.floor(100 + Math.random() * 900))
}

function localDateValue() {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

export default function OmrManager({ onClose }: { onClose?: () => void }) {
  const [facultyId, setFacultyId] = useState("")
  const [classes, setClasses] = useState<FacultyClass[]>([])
  const [assessments, setAssessments] = useState<OmrAssessment[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [classId, setClassId] = useState("")
  const [title, setTitle] = useState("")
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("quiz")
  const [testId, setTestId] = useState(randomTestId())
  const [pointsPerItem, setPointsPerItem] = useState(1)
  const [scheduledDate, setScheduledDate] = useState(localDateValue())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [answers, setAnswers] = useState<(Choice | "")[]>(EMPTY_ANSWERS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [scanFile, setScanFile] = useState<File | null>(null)
  const [scanPreview, setScanPreview] = useState("")
  const [uploadingScan, setUploadingScan] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const completed = useMemo(() => answers.filter(Boolean).length, [answers])
  const selectedAssessment = useMemo(
    () => assessments.find((item) => item.id === selectedId) ?? null,
    [assessments, selectedId],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) throw new Error("You must be signed in as faculty.")
      setFacultyId(userData.user.id)

      const [{ data: classRows, error: classError }, { data: assessmentRows, error: assessmentError }] =
        await Promise.all([
          supabase.from("classes").select("*").order("created_at", { ascending: false }),
          supabase
            .from("omr_assessments")
            .select("*, omr_answer_keys(answers, verified_at)")
            .eq("faculty_id", userData.user.id)
            .order("created_at", { ascending: false }),
        ])

      if (classError) throw classError
      if (assessmentError) throw assessmentError

      const normalizedClasses = (classRows ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        label: classLabel(row),
      }))
      setClasses(normalizedClasses)
      setClassId((current) => current || normalizedClasses[0]?.id || "")
      setAssessments((assessmentRows ?? []) as OmrAssessment[])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load OMR setup.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    return () => {
      if (scanPreview) URL.revokeObjectURL(scanPreview)
    }
  }, [scanPreview])

  function startNew() {
    setSelectedId("")
    setTitle("")
    setAssessmentType("quiz")
    setTestId(randomTestId())
    setPointsPerItem(1)
    setScheduledDate(localDateValue())
    setStartTime("09:00")
    setEndTime("10:00")
    setAnswers([...EMPTY_ANSWERS])
    clearScan()
    setMessage("")
    setError("")
  }

  function selectAssessment(id: string) {
    setSelectedId(id)
    const item = assessments.find((assessment) => assessment.id === id)
    if (!item) return
    setClassId(item.class_id)
    setTitle(item.title)
    setAssessmentType(item.assessment_type)
    setTestId(item.test_id)
    setPointsPerItem(Number(item.points_per_item))
    setScheduledDate(item.scheduled_date || localDateValue())
    setStartTime(String(item.start_time || "09:00").slice(0, 5))
    setEndTime(String(item.end_time || "10:00").slice(0, 5))
    const key = Array.isArray(item.omr_answer_keys)
      ? item.omr_answer_keys[0]
      : item.omr_answer_keys
    const saved = key?.answers ?? []
    setAnswers(Array.from({ length: 50 }, (_, index) => saved[index] ?? ""))
    setMessage("")
    setError("")
  }

  function setAnswer(index: number, choice: Choice) {
    setAnswers((current) => current.map((answer, i) => (i === index ? choice : answer)))
  }

  async function saveAssessment(event: FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!facultyId) return setError("Faculty session is unavailable. Sign in again.")
    if (!classId) return setError("Select a class.")
    if (!title.trim()) return setError("Enter an assessment title.")
    if (!/^\d{3}$/.test(testId)) return setError("Test ID must contain exactly three digits.")
    if (!scheduledDate || !startTime || !endTime) return setError("Complete the activity date and time.")
    if (endTime <= startTime) return setError("End time must be later than start time.")
    if (completed !== 50) return setError(`Complete all 50 answers. ${50 - completed} remaining.`)

    setSaving(true)
    try {
      let assessmentId = selectedId
      const assessmentPayload = {
        faculty_id: facultyId,
        class_id: classId,
        title: title.trim(),
        assessment_type: assessmentType,
        test_id: testId,
        item_count: 50,
        points_per_item: pointsPerItem,
        scheduled_date: scheduledDate,
        start_time: startTime,
        end_time: endTime,
        status: selectedAssessment?.status ?? "draft",
      }

      if (assessmentId) {
        const { error: updateError } = await supabase
          .from("omr_assessments")
          .update(assessmentPayload)
          .eq("id", assessmentId)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from("omr_assessments")
          .insert(assessmentPayload)
          .select("id")
          .single()
        if (insertError) throw insertError
        assessmentId = data.id
      }

      const { error: keyError } = await supabase.from("omr_answer_keys").upsert(
        {
          assessment_id: assessmentId,
          faculty_id: facultyId,
          answers,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "assessment_id" },
      )
      if (keyError) throw keyError

      const reminderPayload = {
        faculty_id: facultyId,
        class_id: classId,
        reminder_date: scheduledDate,
        title: title.trim(),
        activity_type: assessmentType === "exam" ? "Exam" : "Quiz",
        start_time: startTime,
        end_time: endTime,
        participation: "Individual",
        groups: [],
        omr_assessment_id: assessmentId,
        updated_at: new Date().toISOString(),
      }
      const { error: reminderError } = await supabase
        .from("faculty_reminders")
        .upsert(reminderPayload, { onConflict: "omr_assessment_id" })
      if (reminderError) throw new Error(`Answer key was saved, but the activity could not be synchronized: ${reminderError.message}`)

      setSelectedId(assessmentId)
      setMessage("Assessment, answer key, and Activities reminder saved.")
      await loadData()
      setSelectedId(assessmentId)
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : "Unable to save the assessment."
      setError(text.includes("omr_assessments_faculty_id_test_id_key") ? "That Test ID is already in use." : text)
    } finally {
      setSaving(false)
    }
  }

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

  async function saveScanDraft() {
    if (!selectedAssessment || selectedAssessment.status !== "open") {
      setError("Select an open assessment before uploading an OMR sheet.")
      return
    }
    if (!scanFile || !facultyId) {
      setError("Capture or upload an OMR sheet first.")
      return
    }

    setUploadingScan(true)
    setError("")
    setMessage("")
    try {
      const extension = scanFile.name.split(".").pop()?.toLowerCase() || "jpg"
      const imagePath = `${facultyId}/${selectedAssessment.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from("omr-scans")
        .upload(imagePath, scanFile, { contentType: scanFile.type, upsert: false })
      if (uploadError) throw uploadError

      const { error: draftError } = await supabase.from("omr_submissions").insert({
        assessment_id: selectedAssessment.id,
        faculty_id: facultyId,
        class_id: selectedAssessment.class_id,
        detected_test_id: selectedAssessment.test_id,
        detected_answers: [],
        correct_count: 0,
        blank_count: 50,
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
      setMessage("OMR image saved privately as a review draft. The next stage will detect the bubbles.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the OMR image.")
    } finally {
      setUploadingScan(false)
    }
  }

  async function setStatus(status: "open" | "closed") {
    if (!selectedId || completed !== 50) return
    setSaving(true)
    setError("")
    try {
      const { error: statusError } = await supabase
        .from("omr_assessments")
        .update({ status })
        .eq("id", selectedId)
      if (statusError) throw statusError
      setMessage(status === "open" ? "Assessment opened for scanning." : "Assessment closed.")
      await loadData()
      setSelectedId(selectedId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to change assessment status.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="omr-shell" role="dialog" aria-modal="true" aria-labelledby="omr-title">
      <div className="omr-panel">
        <header className="omr-header">
          <div>
            <p className="omr-eyebrow">Faculty OMR</p>
            <h2 id="omr-title">Assessment and answer key</h2>
            <p>Create the test first. Camera scanning is enabled after all 50 answers are verified.</p>
          </div>
          {onClose && <button className="omr-icon-button" type="button" onClick={onClose} aria-label="Close OMR">X</button>}
        </header>

        {error && <div className="omr-alert omr-alert-error" role="alert">{error}</div>}
        {message && <div className="omr-alert omr-alert-success" role="status">{message}</div>}

        <div className="omr-layout">
          <aside className="omr-sidebar">
            <button className="omr-primary" type="button" onClick={startNew}>New assessment</button>
            <h3>Saved assessments</h3>
            {loading ? <p>Loading...</p> : assessments.length === 0 ? <p>No OMR assessments yet.</p> : (
              <div className="omr-assessment-list">
                {assessments.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={selectedId === item.id ? "omr-assessment active" : "omr-assessment"}
                    onClick={() => selectAssessment(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.assessment_type.toUpperCase()} - Test {item.test_id}</span>
                    <small>{item.status.replace("_", " ")}</small>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <form className="omr-form" onSubmit={saveAssessment}>
            <section className="omr-card">
              <div className="omr-section-heading">
                <div><span>1</span><h3>Assessment details</h3></div>
                <b>{selectedAssessment?.status ?? "new"}</b>
              </div>
              <div className="omr-fields">
                <label>Class
                  <select value={classId} onChange={(event) => setClassId(event.target.value)} disabled={loading || saving}>
                    <option value="">Select class</option>
                    {classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label>Type
                  <select value={assessmentType} onChange={(event) => setAssessmentType(event.target.value as AssessmentType)} disabled={saving}>
                    <option value="quiz">Quiz</option><option value="exam">Exam</option>
                  </select>
                </label>
                <label className="omr-wide">Title
                  <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Midterm Examination" disabled={saving} />
                </label>
                <label>Date
                  <input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} disabled={saving} required />
                </label>
                <label>Start time
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={saving} required />
                </label>
                <label>End time
                  <input type="time" min={startTime} value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={saving} required />
                </label>
                <label>Test ID
                  <div className="omr-inline-input">
                    <input inputMode="numeric" maxLength={3} value={testId} onChange={(event) => setTestId(event.target.value.replace(/\D/g, "").slice(0, 3))} disabled={saving} />
                    <button type="button" onClick={() => setTestId(randomTestId())} disabled={saving}>Generate</button>
                  </div>
                </label>
                <label>Points per item
                  <input type="number" min="0.01" step="0.01" value={pointsPerItem} onChange={(event) => setPointsPerItem(Math.max(0.01, Number(event.target.value) || 1))} disabled={saving} />
                </label>
              </div>
            </section>

            <section className="omr-card">
              <div className="omr-section-heading">
                <div><span>2</span><h3>50-item answer key</h3></div>
                <b>{completed}/50 complete</b>
              </div>
              <div className="omr-progress"><i style={{ width: `${completed * 2}%` }} /></div>
              <div className="omr-answer-grid">
                {answers.map((answer, index) => (
                  <fieldset key={index} className={answer ? "omr-question complete" : "omr-question"}>
                    <legend>{index + 1}</legend>
                    {CHOICES.map((choice) => (
                      <label key={choice} title={`Question ${index + 1}: ${choice}`}>
                        <input type="radio" name={`q-${index}`} value={choice} checked={answer === choice} onChange={() => setAnswer(index, choice)} disabled={saving} />
                        <span>{choice}</span>
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
            </section>

            {selectedAssessment?.status === "open" && (
              <section className="omr-card omr-scan-card">
                <div className="omr-section-heading">
                  <div><span>3</span><h3>Capture OMR sheet</h3></div>
                  <b>Test {selectedAssessment.test_id}</b>
                </div>
                <p className="omr-scan-help">
                  Place the complete paper on a flat surface. Keep all four corner markers visible and avoid shadows or glare.
                </p>
                <div className="omr-capture-buttons">
                  <input ref={cameraInputRef} className="omr-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => chooseScan(event.target.files?.[0])} />
                  <input ref={uploadInputRef} className="omr-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseScan(event.target.files?.[0])} />
                  <button type="button" className="omr-primary" onClick={() => cameraInputRef.current?.click()} disabled={uploadingScan}>Start camera</button>
                  <button type="button" className="omr-secondary" onClick={() => uploadInputRef.current?.click()} disabled={uploadingScan}>Upload image</button>
                </div>
                {scanPreview ? (
                  <div className="omr-scan-preview">
                    <img src={scanPreview} alt="Selected OMR answer sheet preview" />
                    <div>
                      <strong>{scanFile?.name}</strong>
                      <span>{scanFile ? `${(scanFile.size / 1024 / 1024).toFixed(2)} MB` : ""}</span>
                      <p>Confirm that the full sheet and all four alignment markers are visible.</p>
                      <div className="omr-preview-actions">
                        <button type="button" className="omr-secondary" onClick={clearScan} disabled={uploadingScan}>Remove</button>
                        <button type="button" className="omr-primary" onClick={() => void saveScanDraft()} disabled={uploadingScan}>{uploadingScan ? "Uploading..." : "Save scan draft"}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="omr-scan-empty">No sheet selected yet. JPG, PNG, or WebP, maximum 10 MB.</div>
                )}
              </section>
            )}

            <footer className="omr-actions">
              <button type="button" className="omr-secondary" onClick={startNew} disabled={saving}>Clear</button>
              {selectedId && selectedAssessment?.status !== "open" && (
                <button type="button" className="omr-secondary" onClick={() => void setStatus("open")} disabled={saving || completed !== 50}>Open scanner</button>
              )}
              {selectedId && selectedAssessment?.status === "open" && (
                <button type="button" className="omr-secondary" onClick={() => void setStatus("closed")} disabled={saving}>Close assessment</button>
              )}
              <button type="submit" className="omr-primary" disabled={saving || loading}>{saving ? "Saving..." : selectedId ? "Update answer key" : "Save answer key"}</button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  )
}

