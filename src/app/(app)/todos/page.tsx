import { getAllPredictions } from "@/lib/predictions/all-predictions";
import { PreviewBoard } from "@/components/preview/preview-board";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const data = await getAllPredictions();

  if (!data) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Aún no hay pronósticos para mostrar.
      </p>
    );
  }

  return <PreviewBoard data={data} only="consensus" embedded />;
}
