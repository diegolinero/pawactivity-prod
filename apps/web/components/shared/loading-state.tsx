export function LoadingState({ title = 'Cargando...' }: { title?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">Preparando la información de actividad.</p>
    </div>
  );
}
