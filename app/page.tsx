import { redirect } from 'next/navigation';

// Redirecionamento da página inicial para a dashboard (agora chamada de overview)
export default function HomePage() {
  redirect('/overview');
} 