import DocumentScanner from '@/components/DocumentScanner';
import { Suspense } from 'react';
export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading scanner...</div>}>
      <DocumentScanner />
    </Suspense>
  );
}
