'use client';
import New from '@/components/new';
import { AppProvider } from '@/providers/new-provider';

export default function HomePage() {
  return (
    <main className="container min-h-full mx-auto pb-32">
      <AppProvider>
        <New />
      </AppProvider>
    </main>
  );
}
