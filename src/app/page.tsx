import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Guitar Tab Generator</h1>
      <p className="text-xl mb-8">Upload audio files and generate guitar tabs with AI</p>
      <Link 
        href="/upload" 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Get Started
      </Link>
    </main>
  );
}