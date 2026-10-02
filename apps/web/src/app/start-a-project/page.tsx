import { Shell } from '@zavlio/ui';
import { StartProjectForm } from '../../components/lead-intake-form';

export default function StartAProjectPage() {
  return (
    <Shell>
      <main className="zavlio-intake-page" aria-labelledby="start-project-title">
        <p>ZAVLIO · FUNCTIONAL INTAKE</p>
        <h1 id="start-project-title">Start a project</h1>
        <p>
          This temporary neutral form captures a project enquiry. The approved visual design can
          restyle it later without changing the intake workflow.
        </p>
        <StartProjectForm />
      </main>
    </Shell>
  );
}
