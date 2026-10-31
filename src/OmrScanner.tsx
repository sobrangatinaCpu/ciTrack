import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "./lib/supabase"
import { jsPDF } from "jspdf"
import { saveStudentScore } from "./lib/teacher-grade-service"
import "./omr-manager.css"

type Choice = "A" | "B" | "C" | "D"
type DetectedChoice = Choice | "" | "MULTIPLE"
type FacultyClass = { id: string; label: string; subject: string; section: string }
type Assessment = {
  id: string
  class_id: string
  title: string
  item_count: number
  points_per_item: number
  test_id: string
  status: string
  assessment_type: "quiz" | "exam"
  academic_term: "midterm" | "final"
  gradebook_assessment_id: string | null
  answerKey: Choice[]
}
type ItemResult = {
  item: number
  detected: DetectedChoice
  correctAnswer: Choice
  result: "correct" | "wrong" | "missed" | "multiple"
  confidence: number
}
type ScanResult = {
  studentNumber: string
  studentName: string
  items: ItemResult[]
  correct: number
  wrong: number
  missed: number
  multiple: number
  score: number
  maxScore: number
  percentage: number
  confidence: number
}

const CHOICES: Choice[] = ["A", "B", "C", "D"]
const TEMPLATE = {
  // Exact normalized coordinates for CiTracker_OMR_Template_A4_v2.pdf.
  answerBlockX: [0.13810, 0.30810, 0.47810, 0.64810, 0.81810],
  answerStartY: 0.46465,
  answerRowGap: 0.04040,
  answerChoiceGap: 0.02476,
  bubbleRadius: 0.00905,
  studentStartX: 0.12857,
  studentColumnGap: 0.03476,
  studentStartY: 0.20875,
  studentRowGap: 0.01717,
}

function classDetails(row: Record<string, unknown>): FacultyClass {
  const subject = String(row.subject ?? row.subject_name ?? row.name ?? "Untitled subject").trim()
  const section = String(row.code ?? row.section ?? row.section_name ?? "No section").trim()
  return { id: String(row.id), subject, section, label: `${subject} - ${section}` }
}
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function csvEscape(value: unknown) { const text = String(value ?? ""); return `"${text.replace(/"/g, '""')}"` }

export default function OmrScanner({ onClose }: { onClose: () => void }) {
  const [facultyId, setFacultyId] = useState("")
  const [classes, setClasses] = useState<FacultyClass[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [classId, setClassId] = useState("")
  const [assessmentId, setAssessmentId] = useState("")
  const [scanFile, setScanFile] = useState<File | null>(null)
  const [scanPreview, setScanPreview] = useState("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [gradebookAssessmentId, setGradebookAssessmentId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [result, setResult] = useState<ScanResult | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const selectedClass = useMemo(() => classes.find((item) => item.id === classId) ?? null, [classes, classId])
  const selectedAssessment = useMemo(() => assessments.find((item) => item.id === assessmentId) ?? null, [assessments, assessmentId])
  const classAssessments = useMemo(() => assessments.filter((item) => item.class_id === classId), [assessments, classId])

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
        supabase.from("omr_assessments").select("id, class_id, title, item_count, points_per_item, test_id, status, assessment_type, academic_term, gradebook_assessment_id, omr_answer_keys(answers)").eq("faculty_id", userData.user.id).order("created_at", { ascending: false }),
      ])
      if (classError) throw classError
      if (assessmentError) throw assessmentError
      setClasses((classRows ?? []).map(classDetails))
      setAssessments((assessmentRows ?? []).map((row: any) => {
        const key = Array.isArray(row.omr_answer_keys) ? row.omr_answer_keys[0] : row.omr_answer_keys
        return { ...row, item_count: Number(row.item_count), points_per_item: Number(row.points_per_item), academic_term: row.academic_term === "final" ? "final" : "midterm", gradebook_assessment_id: row.gradebook_assessment_id ?? null, answerKey: Array.isArray(key?.answers) ? key.answers : [] }
      }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load OMR scanner.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadScannerData() }, [loadScannerData])
  useEffect(() => () => { if (scanPreview) URL.revokeObjectURL(scanPreview) }, [scanPreview])

  function clearScan() {
    if (scanPreview) URL.revokeObjectURL(scanPreview)
    setScanFile(null); setScanPreview(""); setResult(null); setMessage("")
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    if (uploadInputRef.current) uploadInputRef.current.value = ""
  }
  function chooseScan(file?: File) {
    setError(""); setMessage(""); setResult(null)
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPG, PNG, or WebP image.")
    if (file.size > 10 * 1024 * 1024) return setError("The OMR image must be 10 MB or smaller.")
    if (scanPreview) URL.revokeObjectURL(scanPreview)
    setScanFile(file); setScanPreview(URL.createObjectURL(file))
  }
  function openCamera() {
    if (!classId) return setError("Select a subject and section first.")
    if (!selectedAssessment) return setError("Select a saved assessment first.")
    if (selectedAssessment.answerKey.length < selectedAssessment.item_count) return setError("This assessment has no complete answer key. Edit it in Activities first.")
    setError(""); cameraInputRef.current?.click()
  }

  function findLargestRun(values: number[], minimum: number) {
    let bestStart = -1
    let bestEnd = -1
    let start = -1
    for (let index = 0; index <= values.length; index += 1) {
      const passes = index < values.length && values[index] >= minimum
      if (passes && start < 0) start = index
      if ((!passes || index === values.length) && start >= 0) {
        const end = index - 1
        if (bestStart < 0 || end - start > bestEnd - bestStart) {
          bestStart = start
          bestEnd = end
        }
        start = -1
      }
    }
    return bestStart >= 0 ? { start: bestStart, end: bestEnd } : null
  }

  function detectPaperBounds(image: HTMLImageElement) {
    // PDF-rendered pages and scanner exports are often already cropped to A4.
    // Accept those directly instead of requiring a darker photographed background.
    const originalAspect = image.naturalWidth / image.naturalHeight
    if (originalAspect >= 0.68 && originalAspect <= 0.74) {
      return {
        sx: 0,
        sy: 0,
        sw: image.naturalWidth,
        sh: image.naturalHeight,
      }
    }

    const sample = document.createElement("canvas")
    const maxSide = 900
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    sample.width = Math.max(1, Math.round(image.naturalWidth * scale))
    sample.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = sample.getContext("2d", { willReadFrequently: true })
    if (!context) return null
    context.drawImage(image, 0, 0, sample.width, sample.height)
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data
    const rows = Array(sample.height).fill(0)
    const columns = Array(sample.width).fill(0)

    for (let y = 0; y < sample.height; y += 2) {
      for (let x = 0; x < sample.width; x += 2) {
        const offset = (y * sample.width + x) * 4
        const r = pixels[offset]
        const g = pixels[offset + 1]
        const b = pixels[offset + 2]
        const brightness = (r + g + b) / 3
        const chroma = Math.max(r, g, b) - Math.min(r, g, b)
        if (brightness >= 195 && chroma <= 45) {
          rows[y] += 2
          columns[x] += 2
        }
      }
    }

    // White A4 paper should fill a substantial continuous area of the photograph.
    const rowRun = findLargestRun(rows, sample.width * 0.34)
    const columnRun = findLargestRun(columns, sample.height * 0.34)
    if (!rowRun || !columnRun) {
      // Some phone cameras expose the white paper as light gray. If the complete
      // image is still close to A4 portrait, normalize the full image.
      if (originalAspect >= 0.62 && originalAspect <= 0.80) {
        return { sx: 0, sy: 0, sw: image.naturalWidth, sh: image.naturalHeight }
      }
      return null
    }

    const paddingX = Math.round(sample.width * 0.008)
    const paddingY = Math.round(sample.height * 0.008)
    const left = clamp(columnRun.start - paddingX, 0, sample.width - 1)
    const right = clamp(columnRun.end + paddingX, left + 1, sample.width - 1)
    const top = clamp(rowRun.start - paddingY, 0, sample.height - 1)
    const bottom = clamp(rowRun.end + paddingY, top + 1, sample.height - 1)
    const cropWidth = right - left + 1
    const cropHeight = bottom - top + 1
    const aspect = cropWidth / cropHeight
    if (aspect < 0.58 || aspect > 0.83 || cropWidth < sample.width * 0.35 || cropHeight < sample.height * 0.45) return null

    return {
      sx: left / scale,
      sy: top / scale,
      sw: cropWidth / scale,
      sh: cropHeight / scale,
    }
  }

  function darkRatio(data: Uint8ClampedArray, width: number, height: number, cx: number, cy: number, radius: number) {
    let dark = 0; let total = 0
    const r2 = radius * radius
    for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(height - 1, Math.ceil(cy + radius)); y += 1) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(width - 1, Math.ceil(cx + radius)); x += 1) {
        const dx = x - cx; const dy = y - cy
        if (dx * dx + dy * dy > r2 * 0.62) continue // ignore printed bubble border
        const offset = (y * width + x) * 4
        const gray = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114
        if (gray < 145) dark += 1
        total += 1
      }
    }
    return total ? dark / total : 0
  }

  async function matchStudent(studentNumber: string) {
    if (!studentNumber) return ""
    const { data } = await supabase.from("class_students").select("*").eq("class_id", classId)
    const row = (data ?? []).find((item: any) => String(item.student_number ?? item.student_no ?? item.school_id ?? "") === studentNumber)
    return String(row?.student_name ?? row?.full_name ?? row?.name ?? "")
  }

  async function processSheet() {
    if (!scanPreview || !selectedAssessment) return setError("Capture or choose an OMR image first.")
    if (selectedAssessment.answerKey.length < selectedAssessment.item_count) return setError("Complete the answer key in Activities before scanning.")
    setProcessing(true); setError(""); setMessage("")
    try {
      const image = new Image()
      image.src = scanPreview
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to read the selected image.")) })
      const paper = detectPaperBounds(image)
      if (!paper) {
        throw new Error("The A4 sheet could not be aligned. Use the CiTracker A4 v2 template, keep all four corner squares visible, and capture the complete page straight-on.")
      }

      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 1697 // A4 ratio, matching the v2 template.
      const context = canvas.getContext("2d", { willReadFrequently: true })
      if (!context) throw new Error("Image processing is unavailable in this browser.")
      context.fillStyle = "#fff"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, paper.sx, paper.sy, paper.sw, paper.sh, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      const itemResults: ItemResult[] = []
      for (let index = 0; index < selectedAssessment.item_count; index += 1) {
        const block = Math.floor(index / 10)
        const row = index % 10
        const ratios = CHOICES.map((_, choiceIndex) => darkRatio(
          imageData.data, canvas.width, canvas.height,
          (TEMPLATE.answerBlockX[block] + choiceIndex * TEMPLATE.answerChoiceGap) * canvas.width,
          (TEMPLATE.answerStartY + row * TEMPLATE.answerRowGap) * canvas.height,
          TEMPLATE.bubbleRadius * canvas.width,
        ))
        const ranked = ratios.map((ratio, choiceIndex) => ({ ratio, choiceIndex })).sort((a, b) => b.ratio - a.ratio)
        const filled = ranked.filter((entry) => entry.ratio >= 0.36)
        let detected: DetectedChoice = ""
        if (filled.length > 1) detected = "MULTIPLE"
        else if (filled.length === 1 && ranked[0].ratio - ranked[1].ratio >= 0.08) detected = CHOICES[filled[0].choiceIndex]
        const correctAnswer = selectedAssessment.answerKey[index]
        const resultType = detected === "" ? "missed" : detected === "MULTIPLE" ? "multiple" : detected === correctAnswer ? "correct" : "wrong"
        itemResults.push({ item: index + 1, detected, correctAnswer, result: resultType, confidence: Math.round(clamp((ranked[0].ratio - ranked[1].ratio) * 300, 0, 100)) })
      }

      // Read the 10-column student-number bubble area when present.
      let studentNumber = ""
      for (let column = 0; column < 10; column += 1) {
        const digits = Array.from({ length: 10 }, (_, digit) => ({
          digit,
          ratio: darkRatio(imageData.data, canvas.width, canvas.height,
            (TEMPLATE.studentStartX + column * TEMPLATE.studentColumnGap) * canvas.width,
            (TEMPLATE.studentStartY + digit * TEMPLATE.studentRowGap) * canvas.height,
            TEMPLATE.bubbleRadius * canvas.width),
        })).sort((a, b) => b.ratio - a.ratio)
        if (digits[0].ratio >= 0.36 && digits[0].ratio - digits[1].ratio >= 0.08) studentNumber += String(digits[0].digit)
      }

      const correct = itemResults.filter((item) => item.result === "correct").length
      const wrong = itemResults.filter((item) => item.result === "wrong").length
      const missed = itemResults.filter((item) => item.result === "missed").length
      const multiple = itemResults.filter((item) => item.result === "multiple").length
      const score = correct * selectedAssessment.points_per_item
      const maxScore = selectedAssessment.item_count * selectedAssessment.points_per_item
      const confidence = Math.round(itemResults.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, itemResults.length))
      const detectedCount = itemResults.length - missed
      if (confidence < 28 && detectedCount === 0) {
        throw new Error("The answer bubbles could not be aligned reliably. Use the CiTracker A4 v2 template, print at 100%, and retake the full sheet straight-on.")
      }
      setResult({ studentNumber, studentName: await matchStudent(studentNumber), items: itemResults, correct, wrong, missed, multiple, score, maxScore, percentage: maxScore ? Math.round((score / maxScore) * 10000) / 100 : 0, confidence })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to process the OMR image.")
    } finally { setProcessing(false) }
  }

  function updateDetected(itemNumber: number, detected: DetectedChoice) {
    if (!result || !selectedAssessment) return
    const items = result.items.map((item) => item.item === itemNumber ? {
      ...item, detected, confidence: 100,
      result: detected === "" ? "missed" as const : detected === "MULTIPLE" ? "multiple" as const : detected === item.correctAnswer ? "correct" as const : "wrong" as const,
    } : item)
    const correct = items.filter((item) => item.result === "correct").length
    const wrong = items.filter((item) => item.result === "wrong").length
    const missed = items.filter((item) => item.result === "missed").length
    const multiple = items.filter((item) => item.result === "multiple").length
    const score = correct * selectedAssessment.points_per_item
    setResult({ ...result, items, correct, wrong, missed, multiple, score, percentage: result.maxScore ? Math.round((score / result.maxScore) * 10000) / 100 : 0 })
  }

  async function approveResult() {
    if (!result || !selectedAssessment || !scanFile || !facultyId) return
    if (!result.studentNumber.trim()) return setError("Enter or confirm the student number before approving.")
    setSaving(true); setError("")
    try {
      const extension = scanFile.name.split(".").pop()?.toLowerCase() || "jpg"
      const uniqueId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const imagePath = `${facultyId}/${selectedAssessment.id}/${uniqueId}.${extension}`
      const { error: uploadError } = await supabase.storage.from("omr-scans").upload(imagePath, scanFile, { contentType: scanFile.type, upsert: false })
      if (uploadError) throw uploadError
      const { error: saveError } = await supabase.from("omr_submissions").insert({
        assessment_id: selectedAssessment.id, faculty_id: facultyId, class_id: classId,
        detected_student_number: result.studentNumber, detected_test_id: selectedAssessment.test_id,
        detected_answers: result.items.map((item) => item.detected), reviewed_answers: result.items.map((item) => item.detected),
        correct_count: result.correct, blank_count: result.missed, multiple_count: result.multiple,
        proposed_score: result.score, final_score: result.score, confidence: result.confidence,
        image_path: imagePath, status: "approved", reviewed_by: facultyId, reviewed_at: new Date().toISOString(),
      })
      if (saveError) { await supabase.storage.from("omr-scans").remove([imagePath]); throw saveError }
      setMessage("Result approved and saved. Publish it to the gradebook from the review workflow.")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to approve the OMR result.") }
    finally { setSaving(false) }
  }

  async function exportPdf() {
    if (!result || !selectedAssessment || !selectedClass) return

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 16
      const contentWidth = pageWidth - margin * 2
      let y = 18

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(18)
      pdf.text("OMR Assessment Result", margin, y)
      y += 10

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      const summaryRows: Array<[string, string]> = [
        ["Student Number", result.studentNumber || "Not matched"],
        ["Name", result.studentName || "Not matched"],
        ["Section", selectedClass.section],
        ["Subject", selectedClass.subject],
        ["Assessment", selectedAssessment.title],
        ["Test ID", selectedAssessment.test_id],
        ["Score", `${result.score} / ${result.maxScore}`],
        ["Percentage", `${result.percentage}%`],
        ["Correct", String(result.correct)],
        ["Wrong", String(result.wrong)],
        ["Missed", String(result.missed)],
        ["Multiple marks", String(result.multiple)],
        ["Detection confidence", `${result.confidence}%`],
      ]

      summaryRows.forEach(([label, value]) => {
        pdf.setFont("helvetica", "bold")
        pdf.text(`${label}:`, margin, y)
        pdf.setFont("helvetica", "normal")
        pdf.text(value, margin + 42, y)
        y += 6
      })

      y += 3
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(12)
      pdf.text("Answer Sheet", margin, y)
      y += 5

      if (scanPreview) {
        const image = new Image()
        image.src = scanPreview
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () => reject(new Error("Unable to add the scanned paper to the PDF."))
        })
        const maxImageHeight = 105
        const ratio = Math.min(contentWidth / image.naturalWidth, maxImageHeight / image.naturalHeight)
        const imageWidth = image.naturalWidth * ratio
        const imageHeight = image.naturalHeight * ratio
        pdf.addImage(image, "JPEG", margin + (contentWidth - imageWidth) / 2, y, imageWidth, imageHeight, undefined, "FAST")
        y += imageHeight + 8
      }

      if (y > pageHeight - 35) {
        pdf.addPage()
        y = 18
      }

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(12)
      pdf.text("Item Results", margin, y)
      y += 7
      pdf.setFontSize(9)
      pdf.text("Item", margin, y)
      pdf.text("Detected", margin + 20, y)
      pdf.text("Correct", margin + 55, y)
      pdf.text("Result", margin + 90, y)
      pdf.text("Confidence", margin + 128, y)
      y += 5
      pdf.setDrawColor(190)
      pdf.line(margin, y, pageWidth - margin, y)
      y += 5

      pdf.setFont("helvetica", "normal")
      result.items.forEach((item) => {
        if (y > pageHeight - 14) {
          pdf.addPage()
          y = 18
        }
        pdf.text(String(item.item), margin, y)
        pdf.text(item.detected || "MISSED", margin + 20, y)
        pdf.text(item.correctAnswer, margin + 55, y)
        pdf.text(item.result.toUpperCase(), margin + 90, y)
        pdf.text(`${item.confidence}%`, margin + 128, y)
        y += 6
      })

      const safeAssessment = selectedAssessment.title.replace(/[^a-z0-9_-]+/gi, "-")
      const safeStudent = (result.studentNumber || "unmatched").replace(/[^a-z0-9_-]+/gi, "-")
      pdf.save(`${safeAssessment}-${safeStudent}-OMR-result.pdf`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to export the PDF report.")
    }
  }

  async function publishToGradebook() {
    if (!result || !selectedAssessment) return
    if (!result.studentNumber.trim()) {
      setError("Enter the student number before publishing to the gradebook.")
      return
    }

    setPublishing(true)
    setError("")
    try {
      const assessmentUuid = await saveStudentScore({
        classId,
        studentNumber: result.studentNumber,
        title: selectedAssessment.title,
        type: selectedAssessment.assessment_type,
        term: selectedAssessment.academic_term,
        maxScore: result.maxScore,
        score: result.score,
        status: "published",
        assessmentId: gradebookAssessmentId || selectedAssessment.gradebook_assessment_id || undefined,
      })

      if (!selectedAssessment.gradebook_assessment_id) {
        const { error: linkError } = await supabase
          .from("omr_assessments")
          .update({ gradebook_assessment_id: assessmentUuid })
          .eq("id", selectedAssessment.id)
          .eq("faculty_id", facultyId)
        if (linkError) throw linkError
      }

      setGradebookAssessmentId(assessmentUuid)
      setAssessments((current) => current.map((assessment) =>
        assessment.id === selectedAssessment.id
          ? { ...assessment, gradebook_assessment_id: assessmentUuid }
          : assessment,
      ))
      setMessage("Score published to the student gradebook.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to publish the score to the gradebook.")
    } finally {
      setPublishing(false)
    }
  }

  function exportCsv() {
    if (!result || !selectedAssessment || !selectedClass) return
    const summary = [
      ["Student Number", result.studentNumber], ["Name", result.studentName], ["Section", selectedClass.section], ["Subject", selectedClass.subject],
      ["Assessment", selectedAssessment.title], ["Score", result.score], ["Maximum Score", result.maxScore], ["Percentage", result.percentage],
      ["Correct", result.correct], ["Wrong", result.wrong], ["Missed", result.missed], ["Multiple", result.multiple], [],
      ["Item", "Detected", "Correct Answer", "Result", "Confidence"],
      ...result.items.map((item) => [item.item, item.detected || "MISSED", item.correctAnswer, item.result.toUpperCase(), `${item.confidence}%`]),
    ]
    const blob = new Blob([summary.map((row) => row.map(csvEscape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob); const link = document.createElement("a")
    link.href = url; link.download = `${selectedAssessment.title}-${result.studentNumber || "unmatched"}.csv`; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="omr-shell" role="dialog" aria-modal="true" aria-labelledby="omr-scanner-title">
      <div className="omr-panel omr-scanner-only-panel">
        <header className="omr-header"><div><p className="omr-eyebrow">Faculty OMR scanner</p><h2 id="omr-scanner-title">{result ? "OMR scan result" : "Scan answer sheet"}</h2><p>{result ? "Review every missed, wrong, or multiple-mark item before approval." : "Select the class and saved assessment, then capture or import the paper."}</p></div><button className="omr-icon-button" type="button" onClick={onClose}>X</button></header>
        {error && <div className="omr-alert omr-alert-error" role="alert">{error}</div>}{message && <div className="omr-alert omr-alert-success">{message}</div>}

        {!result ? <section className="omr-scanner-only-content">
          <div className="omr-card"><div className="omr-section-heading"><div><span>1</span><h3>Select assessment</h3></div></div><div className="omr-fields">
            <label>Subject and section<select value={classId} onChange={(e) => { setClassId(e.target.value); setAssessmentId(""); clearScan() }} disabled={loading}><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label>Assessment<select value={assessmentId} onChange={(e) => { const nextId = e.target.value; setAssessmentId(nextId); setGradebookAssessmentId(assessments.find((item) => item.id === nextId)?.gradebook_assessment_id ?? ""); clearScan() }} disabled={!classId || loading}><option value="">Select saved assessment</option>{classAssessments.map((item) => <option key={item.id} value={item.id}>{item.title} - {item.item_count} items</option>)}</select></label>
          </div>{classId && !loading && classAssessments.length === 0 && <p className="omr-scanner-note">No saved assessment for this class. Create one in Activities.</p>}</div>
          <div className="omr-card"><div className="omr-section-heading"><div><span>2</span><h3>Capture or import paper</h3></div>{selectedAssessment && <b>{selectedAssessment.item_count} items</b>}</div>
            <input ref={cameraInputRef} className="omr-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => chooseScan(e.target.files?.[0])}/><input ref={uploadInputRef} className="omr-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => chooseScan(e.target.files?.[0])}/>
            <div className="omr-capture-buttons"><button type="button" className="omr-primary" onClick={openCamera} disabled={!selectedAssessment || processing}>Open camera</button><button type="button" className="omr-secondary" onClick={() => uploadInputRef.current?.click()} disabled={!selectedAssessment || processing}>Import image</button></div>
            {scanPreview ? <div className="omr-scan-preview"><img src={scanPreview} alt="OMR paper preview"/><div><strong>{scanFile?.name}</strong><p>Use a straight, well-lit image with all four page markers visible.</p><div className="omr-preview-actions"><button type="button" className="omr-secondary" onClick={clearScan}>Retake</button><button type="button" className="omr-primary" onClick={() => void processSheet()} disabled={processing}>{processing ? "Checking answers..." : "Check OMR answers"}</button></div></div></div> : <div className="omr-scan-empty">Select an assessment, then capture or import the answer sheet.</div>}
          </div>
        </section> : <section className="omr-result-frame omr-print-report">
          <div className="omr-result-summary"><div><label>Student Number<input value={result.studentNumber} onChange={(e) => setResult({ ...result, studentNumber: e.target.value.replace(/\D/g, "") })}/></label><label>Name<input value={result.studentName} onChange={(e) => setResult({ ...result, studentName: e.target.value })}/></label><p><b>Section:</b> {selectedClass?.section}</p><p><b>Subject:</b> {selectedClass?.subject}</p><p><b>Assessment:</b> {selectedAssessment?.title}</p></div><div className="omr-score-card"><span>Score</span><strong>{result.score} / {result.maxScore}</strong><b>{result.percentage}%</b><small>Confidence {result.confidence}%</small></div></div>
          <div className="omr-result-counts"><div className="correct"><strong>{result.correct}</strong><span>Correct</span></div><div className="wrong"><strong>{result.wrong}</strong><span>Wrong</span></div><div className="missed"><strong>{result.missed}</strong><span>Missed</span></div><div className="multiple"><strong>{result.multiple}</strong><span>Multiple</span></div></div>
          <div className="omr-report-sheet"><h3>Answer Sheet</h3>{scanPreview && <img src={scanPreview} alt="Scanned answer sheet"/>}</div>
          <div className="omr-result-grid">{result.items.map((item) => <article key={item.item} className={`omr-result-item ${item.result}`}><header><strong>{item.item}</strong><span>{item.result}</span></header><small>Key: {item.correctAnswer}</small><select value={item.detected} onChange={(e) => updateDetected(item.item, e.target.value as DetectedChoice)}><option value="">Missed</option>{CHOICES.map((choice) => <option key={choice}>{choice}</option>)}<option value="MULTIPLE">Multiple</option></select></article>)}</div>
          <footer className="omr-result-actions"><button type="button" className="omr-secondary" onClick={() => setResult(null)}>Back to image</button><button type="button" className="omr-secondary" onClick={exportCsv}>Export CSV</button><button type="button" className="omr-secondary" onClick={() => void exportPdf()}>Export PDF</button><button type="button" className="omr-secondary" onClick={() => void publishToGradebook()} disabled={publishing || saving}>{publishing ? "Publishing..." : "Publish to gradebook"}</button><button type="button" className="omr-primary" onClick={() => void approveResult()} disabled={saving || publishing}>{saving ? "Saving..." : "Approve result"}</button></footer>
        </section>}
      </div>
    </div>
  )
}
