// Branded loader — a sheet "developing" under a scan line, in the site's
// type-specimen voice. Dependency-free (styles live in specimen.css, which is
// already global) so it can be imported eagerly as the /resume chunk's
// Suspense fallback without pulling in react-pdf.
export function ResumeLoader() {
  return (
    <div className="resume-loader" role="status" aria-live="polite">
      <div className="resume-loader-sheet" aria-hidden="true">
        <span className="resume-loader-scan" />
        <span className="resume-loader-line" style={{ width: '82%' }} />
        <span className="resume-loader-line" style={{ width: '64%' }} />
        <span className="resume-loader-line" style={{ width: '90%' }} />
        <span className="resume-loader-line" style={{ width: '48%' }} />
      </div>
      <div className="resume-loader-label mono">
        developing the sheet<span className="resume-loader-dots" aria-hidden="true" />
      </div>
    </div>
  );
}
