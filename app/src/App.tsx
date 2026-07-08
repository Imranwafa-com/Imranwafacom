import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Specimen from './specimen/Specimen';
import { ResumeLoader } from './resume/ResumeLoader';

// 404 in the specimen's voice — an unknown URL is a missing folio.
function NotFound() {
  return (
    <div className="notfound shell">
      <div className="notfound-num mono">404</div>
      <h1 className="notfound-title serif">Folio <em>not found.</em></h1>
      <p className="notfound-sub mono">THIS PAGE ISN'T IN THE SPECIMEN · CHECK THE URL OR HEAD BACK</p>
      <Link className="idx-link" to="/">Back to the sheet ↖</Link>
    </div>
  );
}

// The resume reader pulls in react-pdf + pdfjs + framer-motion (~1.9 MB);
// load all of it only when someone actually visits /resume so the homepage
// ships none of it. The route fade below is plain CSS for the same reason.
const Resume = lazy(() => import('./resume/Resume'));

function Fade({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-fade" style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Fade>
        <Routes>
          <Route path="/" element={<Specimen />} />
          <Route
            path="/resume"
            element={
              <Suspense fallback={<div className="route-skeleton"><ResumeLoader /></div>}>
                <Resume />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Fade>
    </BrowserRouter>
  );
}

export default App;
