import { H5PTest } from '@/components/h5p/H5PTest';

export default function H5PTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">H5P System Test</h1>
      <div className="max-w-3xl mx-auto">
        <H5PTest />
      </div>
    </div>
  );
}
