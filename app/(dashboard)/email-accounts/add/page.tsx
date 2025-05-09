import { AddAccountForm } from '@/components/email-accounts/add-account-form';

export default function AddEmailAccountPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Adicionar Conta de Email</h1>
      <p className="text-slate-500">
        Adicione uma nova conta de email para gerenciar ou para o processo de aquecimento.
      </p>
      <AddAccountForm />
    </div>
  );
} 